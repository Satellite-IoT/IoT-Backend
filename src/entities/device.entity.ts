import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { FlowControlLevel } from 'src/common/enums';

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

  @Column({ type: 'timestamp', nullable: true })
  lastAuthenticated: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
