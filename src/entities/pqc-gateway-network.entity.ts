import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('pqc_gateway_network')
@Index(['deviceId'])
export class PqcGatewayNetwork {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  deviceId: string;

  @Column({ type: 'jsonb' })
  networkInfo: {
    networkRoute: string;
    uploadTraffic: string;
    downloadTraffic: string;
    networkInfo: Array<{
      Interface: string;
      host: string;
      ipAddr: string;
    }>;
  };

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
