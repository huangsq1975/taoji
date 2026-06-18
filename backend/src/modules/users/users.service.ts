import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { UserPermission } from './user-permission.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdatePermissionsDto } from './dto/update-permissions.dto';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(UserPermission)
    private permissionRepo: Repository<UserPermission>,
  ) {}

  async findMembers(institutionId: number, pagination: PaginationDto) {
    const { page = 1, pageSize = 20 } = pagination;
    const [items, total] = await this.userRepo.findAndCount({
      where: { institutionId },
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { createdAt: 'DESC' },
    });

    // Attach permissions
    const userIds = items.map((u) => u.id);
    const allPerms = userIds.length
      ? await this.permissionRepo.createQueryBuilder('up')
          .where('up.user_id IN (:...ids)', { ids: userIds })
          .getMany()
      : [];

    const permMap: Record<number, string[]> = {};
    for (const p of allPerms) {
      if (!permMap[p.userId]) permMap[p.userId] = [];
      permMap[p.userId].push(p.permission);
    }

    const result = items.map((u) => {
      const { passwordHash, ...safe } = u;
      return { ...safe, permissions: permMap[u.id] || [] };
    });

    return paginate(result, total, page, pageSize);
  }

  async createMember(institutionId: number, dto: CreateUserDto) {
    const existing = await this.userRepo.findOne({ where: { phone: dto.phone } });
    if (existing) {
      throw new ConflictException('Phone number already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = this.userRepo.create({
      institutionId,
      name: dto.name,
      phone: dto.phone,
      passwordHash,
      role: dto.role,
      dataScope: dto.dataScope,
      status: 1,
    });

    const saved = await this.userRepo.save(user);
    const { passwordHash: _, ...safe } = saved;
    return safe;
  }

  async updatePermissions(institutionId: number, userId: number, dto: UpdatePermissionsDto) {
    const user = await this.userRepo.findOne({ where: { id: userId, institutionId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Delete existing permissions and re-insert
    await this.permissionRepo.delete({ userId });

    if (dto.permissions.length > 0) {
      const perms = dto.permissions.map((p) =>
        this.permissionRepo.create({ userId, permission: p }),
      );
      await this.permissionRepo.save(perms);
    }

    if (dto.dataScope) {
      await this.userRepo.update(userId, { dataScope: dto.dataScope });
    }

    return { success: true, permissions: dto.permissions };
  }

  async updateStatus(institutionId: number, userId: number, status: number) {
    const user = await this.userRepo.findOne({ where: { id: userId, institutionId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.userRepo.update(userId, { status });
    return { success: true };
  }

  async findById(userId: number): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
