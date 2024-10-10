import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';
import { AlarmType, AlarmStatus } from 'src/common/enums';
import { Transform } from 'class-transformer';
import { formatInTimeZone } from 'date-fns-tz';

@Entity('alarms')
@Index(['id', 'alarmType', 'alarmStatus'])
export class Alarm {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: AlarmType,
  })
  @Index()
  alarmType: AlarmType;

  @Column('text')
  alarmDescription: string;

  @Column({
    type: 'enum',
    enum: AlarmStatus,
    default: AlarmStatus.ACTIVE,
  })
  @Index()
  alarmStatus: AlarmStatus;

  @Column('text')
  deviceId: string;

  @Column('text')
  deviceName: string;

  @Column('text', { nullable: true })
  notes?: string;

  @Column({ type: 'timestamptz', nullable: true })
  @Transform(({ value }) => (value ? formatInTimeZone(value, 'Asia/Taipei', 'yyyy-MM-dd HH:mm:ssXXX') : null))
  archivedAt?: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  @Index()
  @Transform(({ value }) => (value ? formatInTimeZone(value, 'Asia/Taipei', 'yyyy-MM-dd HH:mm:ssXXX') : null))
  createdAt: Date;
}
