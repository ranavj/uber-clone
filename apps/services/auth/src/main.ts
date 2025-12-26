import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  // CHANGE: CreateMicroservice use karein instead of create()
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
      options: {
        host: '127.0.0.1', // Docker/Localhost sabke liye
        port: 3002,      // 🔐 Auth Service ka naya Port (3001 Payment ka tha)
      },
    }
  );

  await app.listen();
  Logger.log('🔐 Auth Microservice is listening on TCP Port 3002');
}

bootstrap();