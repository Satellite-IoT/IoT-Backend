import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';
import { AlarmType, AlarmStatus } from 'src/common/enums';
import { EventContext } from 'src/events/types/event-context.interface';

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

  @Column('text', { nullable: true })
  notes?: string;

  @Column({ nullable: true })
  archivedAt?: Date;

  @CreateDateColumn()
  @Index()
  createdAt: Date;
}
