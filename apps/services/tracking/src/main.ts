import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  // 📍 CHANGE: HTTP hata kar TCP Microservice bana rahe hain
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
      options: {
        host: '0.0.0.0', // Docker compatible
        port: 3004,      // 📍 Tracking Service Port (Gateway mein yahi config hai)
      },
    }
  );

  await app.listen();
  Logger.log('📍 Tracking Microservice is listening on TCP Port 3004');
}

bootstrap();