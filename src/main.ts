import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const apiVersion = configService.get<string>('API_VERSION') || 'v1';

  app.setGlobalPrefix(`api/${apiVersion}`);

  app.enableCors();
  await app.listen(configService.get<number>('PORT') || 3002);
}
bootstrap();
