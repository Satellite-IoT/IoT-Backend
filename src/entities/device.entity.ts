import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { FlowControlLevel } from 'src/common/enums';
import { Transform } from 'class-transformer';
import { formatInTimeZone } from 'date-fns-tz';

@Entity()
export class Device {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  deviceId: string;

  @Column({ nullable: true })
  publicKey: string;

  @Column({ nullable: true })
  deviceType: string;

  @Column({ nullable: true })
  deviceName: string;

  @Column({
    type: 'enum',
    enum: FlowControlLevel,
    default: FlowControlLevel.MEDIUM,
  })
  flowControlLevel: FlowControlLevel;

  @Column({ nullable: true })
  ipAddr: string;

  @Column({ nullable: true })
  host: string;

  @Column({ nullable: true })
  loginUser: string;

  @Column({ default: 'unknown' })
  status: string;

  @Column({ default: false })
  isRegistered: boolean;

  @Column({ default: false })
  isAuthenticated: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  @Transform(({ value }) => (value ? formatInTimeZone(value, 'Asia/Taipei', 'yyyy-MM-dd HH:mm:ssXXX') : null))
  lastAuthenticated: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  @Transform(({ value }) => (value ? formatInTimeZone(value, 'Asia/Taipei', 'yyyy-MM-dd HH:mm:ssXXX') : null))
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  @Transform(({ value }) => (value ? formatInTimeZone(value, 'Asia/Taipei', 'yyyy-MM-dd HH:mm:ssXXX') : null))
  updatedAt: Date;
}
