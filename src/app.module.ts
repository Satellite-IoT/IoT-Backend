import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DevicesModule } from './devices/devices.module';
import { EventsModule } from './events/events.module';
import { PqcGatewayModule } from './pqc-gateway/pqc-gateway.module';
import { AuthModule } from './auth/auth.module';
import { LoggerModule } from './logger/logger.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST'),
        port: configService.get<number>('DATABASE_PORT'),
        username: configService.get('DATABASE_USERNAME'),
        password: configService.get('DATABASE_PASSWORD'),
        database: configService.get('DATABASE_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get<boolean>('DATABASE_SYNCHRONIZE'),

        poolSize: 12,
        keepConnectionAlive: true,

        maxQueryExecutionTime: 1000,
        logging: ['error', 'warn', 'schema'],

        extra: {
          max: 12,
          min: 2,
          idleTimeoutMillis: 10000,
          statement_timeout: 2000,
          query_timeout: 2000,
        },

        cache: {
          duration: 60000,
          type: 'database',
          options: {
            max: 200,
          },
        },

        retryAttempts: 3,
        retryDelay: 3000,

        autoLoadEntities: true,
      }),
      inject: [ConfigService],
    }),
    DevicesModule,
    PqcGatewayModule,
    EventsModule,
    AuthModule,
    LoggerModule,
    UsersModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
