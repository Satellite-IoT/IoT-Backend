import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';
import { EventLevel, EventType } from 'src/common/enums';
import { EventContext } from 'src/events/types/event-context.interface';

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  @Index()
  timestamp: Date;

  @Column({
    type: 'enum',
    enum: EventType,
  })
  @Index()
  type: EventType;

  @Column({
    type: 'enum',
    enum: EventLevel,
  })
  @Index()
  level: EventLevel;

  @Column('text')
  message: string;

  @Column('text', { nullable: true })
  details?: string;

  @Column('jsonb', { nullable: true })
  context?: EventContext;
}
