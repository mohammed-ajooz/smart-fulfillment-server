import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });

  // DTO Validation
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
app.enableCors({
  origin: '*', // يسمح لجميع المصادر بالاتصال
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
});

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Smart Fulfillment API')
    .setDescription('API docs for the fulfillment backend')
    .setVersion('0.1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || 5000;
  await app.listen(port as number);
  console.log(`Server running on http://localhost:${port}`);
  console.log(`Swagger docs   on http://localhost:${port}/docs`);
}

bootstrap();
