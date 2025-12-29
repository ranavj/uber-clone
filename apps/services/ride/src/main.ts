import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  // 1. Pehle Normal HTTP App banayein (Socket ke liye)
  const app = await NestFactory.create(AppModule);

  // 2. Phir TCP Microservice connect karein (Gateway ke liye)
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: '127.0.0.1',
      port: 3003,
    },
  });

  // Validation Pipe
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // CORS Enable karein (Socket handshake ke liye zaroori hai)
  app.enableCors({
    origin: ['http://localhost:4200', 'http://localhost:3000'], // Ya specific frontend URL
    methods: 'GET,POST',
    credentials: true,
  });

  // 3. Dono Start karein
  await app.startAllMicroservices(); // TCP Start
  await app.listen(3013);            // HTTP/Socket Start
  
  Logger.log('🚖 Ride Service is listening on HTTP:3003 (Socket) & TCP:3003 (Gateway)');
}

bootstrap();