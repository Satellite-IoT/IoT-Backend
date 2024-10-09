import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

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
  app.useGlobalPipes(
    new ValidationPipe({
      disableErrorMessages: true,
    }),
  );
  app.enableCors();

  const port = configService.get<number>('PORT') || 3002;
  await app.listen(port, '0.0.0.0');

  console.log('Using Port:', configService.get<number>('PORT'));
  await app.listen(configService.get<number>('PORT') || 3002);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
