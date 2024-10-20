import { NestFactory, Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';

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
      transform: true,
    }),
  );
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.enableCors();
  console.log('Using Port:', configService.get<number>('PORT'));
  await app.listen(configService.get<number>('PORT') || 3002);
}
bootstrap();
