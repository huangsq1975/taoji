import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import axios from 'axios';
import { User } from '../users/user.entity';
import { Customer } from '../customers/customer.entity';
import { LoginDto } from './dto/login.dto';
import { WxLoginDto } from './dto/wx-login.dto';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Customer)
    private customerRepo: Repository<Customer>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(phone: string, password: string): Promise<User | null> {
    const user = await this.userRepo.findOne({ where: { phone, status: 1 } });
    if (!user) return null;

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return null;

    return user;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.phone, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid phone or password');
    }

    // Update last login time
    await this.userRepo.update(user.id, { lastLoginAt: new Date() });

    return this.signToken(user);
  }

  async wxLogin(wxLoginDto: WxLoginDto) {
    const { code } = wxLoginDto;

    // Call WeChat jscode2session API
    const appId = this.configService.get<string>('WX_APP_ID', '');
    const appSecret = this.configService.get<string>('WX_APP_SECRET', '');

    let openid: string;

    try {
      if (appId && appSecret) {
        const wxRes = await axios.get(
          `https://api.weixin.qq.com/sns/jscode2session`,
          {
            params: {
              appid: appId,
              secret: appSecret,
              js_code: code,
              grant_type: 'authorization_code',
            },
            timeout: 5000,
          },
        );

        if (wxRes.data.errcode) {
          throw new BadRequestException(`WeChat error: ${wxRes.data.errmsg}`);
        }

        openid = wxRes.data.openid;
      } else {
        // Dev/test mode: use code as mock openid
        this.logger.warn('WX_APP_SECRET not configured, using mock openid for dev');
        openid = `mock_openid_${code}`;
      }
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException('Failed to connect to WeChat API');
    }

    // Find user by openid
    let user = await this.userRepo.findOne({ where: { wxOpenid: openid } });

    if (!user) {
      // Check if a customer with this openid exists, create auto-binding
      const customer = await this.customerRepo.findOne({ where: { wxOpenid: openid } });
      if (customer) {
        // Return customer token (limited)
        return {
          accessToken: this.jwtService.sign({
            sub: 0,
            institutionId: customer.institutionId,
            role: 'customer',
            customerId: customer.id,
            openid,
          }),
          userType: 'customer',
          customer: { id: customer.id, name: customer.name },
        };
      }

      // Unbound openid - return openid for frontend to handle binding
      return {
        openid,
        bound: false,
        message: 'WeChat account not bound to any advisor account',
      };
    }

    if (user.status !== 1) {
      throw new UnauthorizedException('Account is disabled');
    }

    await this.userRepo.update(user.id, { lastLoginAt: new Date() });

    return {
      ...this.signToken(user),
      userType: 'advisor',
    };
  }

  async bindWxOpenid(userId: number, openid: string) {
    await this.userRepo.update(userId, { wxOpenid: openid });
    return { success: true };
  }

  signToken(user: User) {
    const payload: JwtPayload = {
      sub: user.id,
      institutionId: user.institutionId,
      role: user.role,
      phone: user.phone,
      dataScope: user.dataScope,
    };

    const expiresIn = this.configService.get<string>('JWT_EXPIRES', '7d');

    return {
      accessToken: this.jwtService.sign(payload, { expiresIn }),
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        dataScope: user.dataScope,
        institutionId: user.institutionId,
      },
    };
  }

  async refresh(userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId, status: 1 } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return this.signToken(user);
  }
}
