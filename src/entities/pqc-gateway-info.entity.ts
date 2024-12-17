import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { DispatchResult } from '../common/enums/pqc-gateway-dispatch.enum';
import { Transform } from 'class-transformer';
import { formatInTimeZone } from 'date-fns-tz';

@Entity('pqc_gateway_info')
@Index(['deviceId'])
export class PqcGatewayInfo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  deviceId: string;

  @Column({
    type: 'enum',
    enum: DispatchResult,
    default: DispatchResult.NONE,
  })
  dispatchResult: DispatchResult;

  @Column({ type: 'text', default: '0' })
  dispatchDate: string;

  @CreateDateColumn({ type: 'timestamptz' })
  @Transform(({ value }) => (value ? formatInTimeZone(value, 'Asia/Taipei', 'yyyy-MM-dd HH:mm:ssXXX') : null))
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  @Transform(({ value }) => (value ? formatInTimeZone(value, 'Asia/Taipei', 'yyyy-MM-dd HH:mm:ssXXX') : null))
  updatedAt: Date;
}
