import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
  Index,
} from 'typeorm';
import { AccountRole, FlowControlLevel } from 'src/common/enums';
import { Exclude, Transform } from 'class-transformer';
import { formatInTimeZone } from 'date-fns-tz';
import * as bcrypt from 'bcrypt';

@Entity('users')
@Index(['id'])
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: false })
  @Exclude({ toPlainOnly: true })
  password: string;

  @Column({ unique: true })
  email: string;

  @Column({
    type: 'enum',
    enum: AccountRole,
    default: AccountRole.USER,
  })
  role: AccountRole;

  @Column({
    type: 'enum',
    enum: FlowControlLevel,
    default: FlowControlLevel.LOW,
  })
  flowControlLevel: FlowControlLevel;

  @CreateDateColumn({ type: 'timestamptz' })
  @Transform(({ value }) => (value ? formatInTimeZone(value, 'Asia/Taipei', 'yyyy-MM-dd HH:mm:ssXXX') : null))
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  @Transform(({ value }) => (value ? formatInTimeZone(value, 'Asia/Taipei', 'yyyy-MM-dd HH:mm:ssXXX') : null))
  updatedAt: Date;

  async hashPassword() {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }

  @BeforeInsert()
  async beforeInsert() {
    await this.hashPassword();
  }

  @BeforeUpdate()
  async beforeUpdate() {
    if (this.password) {
      await this.hashPassword();
    }
  }
}
