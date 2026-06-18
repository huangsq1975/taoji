import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly localUploadDir: string;

  constructor(private configService: ConfigService) {
    this.localUploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(this.localUploadDir)) {
      fs.mkdirSync(this.localUploadDir, { recursive: true });
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'documents',
  ): Promise<{ url: string; key: string }> {
    const cosSecretId = this.configService.get<string>('COS_SECRET_ID');
    const cosSecretKey = this.configService.get<string>('COS_SECRET_KEY');
    const cosBucket = this.configService.get<string>('COS_BUCKET');
    const cosRegion = this.configService.get<string>('COS_REGION', 'ap-guangzhou');

    if (cosSecretId && cosSecretKey && cosBucket) {
      return this.uploadToCOS(file, folder, cosSecretId, cosSecretKey, cosBucket, cosRegion);
    }

    // Fallback to local storage
    return this.saveLocally(file, folder);
  }

  private async uploadToCOS(
    file: Express.Multer.File,
    folder: string,
    secretId: string,
    secretKey: string,
    bucket: string,
    region: string,
  ): Promise<{ url: string; key: string }> {
    // COS SDK integration stub
    // In production, install cos-nodejs-sdk-v5 and implement:
    // const COS = require('cos-nodejs-sdk-v5');
    // const cos = new COS({ SecretId: secretId, SecretKey: secretKey });
    // cos.putObject({ Bucket: bucket, Region: region, Key: key, Body: file.buffer }, callback);

    this.logger.log(`[COS STUB] Would upload ${file.originalname} to ${bucket}/${folder}/`);
    const key = `${folder}/${Date.now()}_${file.originalname}`;
    const url = `https://${bucket}.cos.${region}.myqcloud.com/${key}`;
    return { url, key };
  }

  private async saveLocally(
    file: Express.Multer.File,
    folder: string,
  ): Promise<{ url: string; key: string }> {
    const folderPath = path.join(this.localUploadDir, folder);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    const fileName = `${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const filePath = path.join(folderPath, fileName);

    fs.writeFileSync(filePath, file.buffer);

    const key = `${folder}/${fileName}`;
    const appPort = this.configService.get<number>('APP_PORT', 3000);
    const url = `http://localhost:${appPort}/uploads/${key}`;

    this.logger.log(`Saved file locally: ${filePath}`);
    return { url, key };
  }

  async deleteFile(key: string): Promise<void> {
    const cosSecretId = this.configService.get<string>('COS_SECRET_ID');

    if (cosSecretId) {
      this.logger.log(`[COS STUB] Would delete: ${key}`);
      return;
    }

    const filePath = path.join(this.localUploadDir, key);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}
