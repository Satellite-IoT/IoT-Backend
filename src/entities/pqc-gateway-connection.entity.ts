import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('pqc_gateway_connection')
@Index(['gatewayDeviceId'])
@Index(['connectedDeviceId'])
export class PqcGatewayConnection {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  gatewayDeviceId: string;

  @Column()
  connectedDeviceId: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
