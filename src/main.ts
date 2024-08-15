import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const apiVersion = configService.get<string>('API_VERSION') || 'v1';

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('IOT-Server')
    .setVersion(apiVersion)
    .addServer(`/api/${apiVersion}`, `API ${apiVersion}`)
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  app.setGlobalPrefix(`api/${apiVersion}`);

  app.enableCors();
  await app.listen(configService.get<number>('PORT') || 3002);
}
bootstrap();
