import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';

export enum DocType {
  BUSINESS_LICENSE = 'business_license',
  BANK_STATEMENT = 'bank_statement',
  CREDIT_REPORT = 'credit_report',
  TAX_INVOICE = 'tax_invoice',
  PROPERTY_CERT = 'property_cert',
  ID_CARD = 'id_card',
  FINANCIAL_STATEMENT = 'financial_statement',
  OTHER = 'other',
}

export enum AiParseStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  DONE = 'done',
  FAILED = 'failed',
}

@Entity('customer_documents')
export class CustomerDocument {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Index('idx_customer_docs_customer')
  @Column({ name: 'customer_id', type: 'bigint' })
  customerId: number;

  @Column({ name: 'uploader_id', type: 'bigint', nullable: true })
  uploaderId: number;

  @Column({
    name: 'uploader_type',
    type: 'enum',
    enum: ['customer', 'advisor'],
    default: 'customer',
  })
  uploaderType: string;

  @Index('idx_customer_docs_type')
  @Column({
    name: 'doc_type',
    type: 'enum',
    enum: DocType,
    default: DocType.OTHER,
  })
  docType: DocType;

  @Column({ name: 'file_name', length: 255 })
  fileName: string;

  @Column({ name: 'file_url', length: 500 })
  fileUrl: string;

  @Column({ name: 'file_size', type: 'int', nullable: true })
  fileSize: number;

  @Column({ name: 'mime_type', length: 50, nullable: true })
  mimeType: string;

  @Column({
    name: 'ai_parse_status',
    type: 'enum',
    enum: AiParseStatus,
    default: AiParseStatus.PENDING,
  })
  aiParseStatus: AiParseStatus;

  @Column({ name: 'ai_parsed_at', type: 'timestamp', nullable: true })
  aiParsedAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;
}
