import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  // 🚀 Change: HTTP Server hata kar TCP Microservice bana rahe hain
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
      options: {
        host: '127.0.0.1', // Sab jagah access ke liye (Docker/Localhost)
        port: 4001,
        socketOptions: {
          keepAlive: true,
        },
      },
    }
  );

  // Note: ValidationPipe yahan bhi laga sakte hain agar zaroorat ho, 
  // par usually Gateway par validate karke data bheja jata hai.

  await app.listen();
  Logger.log('💰 Payment Microservice is listening on TCP Port 4001');
}

bootstrap();