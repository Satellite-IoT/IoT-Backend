import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';


@Entity('device_users')
@Index(['deviceId'])
@Index(['loginUser'])
export class DeviceUser {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  deviceId: string;

  @Column()
  loginUser: string;

  @CreateDateColumn({ type: 'timestamptz' })
  lastSeenAt: Date;
}
