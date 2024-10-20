import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { AccountRole } from 'src/common/enums';
import { Transform } from 'class-transformer';
import { formatInTimeZone } from 'date-fns-tz';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: false })
  password: string;

  @Column({ nullable: true, default: '' })
  name: string;

  @Column({
    type: 'enum',
    enum: AccountRole,
    default: AccountRole.USER,
  })
  role: AccountRole;

  @CreateDateColumn({ type: 'timestamptz' })
  @Transform(({ value }) => (value ? formatInTimeZone(value, 'Asia/Taipei', 'yyyy-MM-dd HH:mm:ssXXX') : null))
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  @Transform(({ value }) => (value ? formatInTimeZone(value, 'Asia/Taipei', 'yyyy-MM-dd HH:mm:ssXXX') : null))
  updatedAt: Date;
}
