import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import multipart from '@fastify/multipart';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: false,
    }),
  );

  app.enableCors();

  await app.register(multipart, {
    limits: {
      fileSize: 5 * 1024 * 1024,
    },
  });

  const config = new DocumentBuilder()
    .setTitle('Omni SaaS API')
    .setDescription('Documentação da API do Omni SaaS')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  app.use(
    '/reference',
    apiReference({
      url: '/openapi.json',
      theme: 'purple', // Tema visual (opcional: 'purple', 'moon', 'solar', etc)
      spec: {
        content: document,
      },
      withFastify: true,
    }),
  );

  app.useGlobalPipes(new ValidationPipe());
  app.enableShutdownHooks();
  await app.listen(3000, '0.0.0.0');
  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log(`Docs available on: ${await app.getUrl()}/reference`);
}
bootstrap();
