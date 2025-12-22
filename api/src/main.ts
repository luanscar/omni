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

  app.enableCors({
    origin: true, // Permite todas as origens (em desenvolvimento)
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

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

  // Swagger UI tradicional em /docs
  SwaggerModule.setup('docs', app, document);

  // Servir o JSON do OpenAPI
  app.getHttpAdapter().get('/openapi.json', (req, res) => {
    res.header('Content-Type', 'application/json');
    res.send(document);
  });

  // Interface Scalar moderna em /reference
  app.use(
    '/reference',
    apiReference({
      url: '/openapi.json',
      theme: 'purple',
      spec: {
        content: document,
      },
      withFastify: true,
    }),
  );

  app.useGlobalPipes(new ValidationPipe());
  app.enableShutdownHooks();
  await app.listen(8000, '0.0.0.0');
  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log(`Swagger UI: ${await app.getUrl()}/docs`);
  console.log(`Scalar UI: ${await app.getUrl()}/reference`);
  console.log(`OpenAPI JSON: ${await app.getUrl()}/openapi.json`);
}
bootstrap();
