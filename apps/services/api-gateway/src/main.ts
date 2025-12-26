/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { json } from 'express';
import { AppModule } from './app/app.module';
import { createProxyMiddleware } from 'http-proxy-middleware';
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false, //  Default JSON parser disable karo
  });

     app.use(
    '/socket.io',
    createProxyMiddleware({
      target: 'http://127.0.0.1:3013', // Ride Service URL
      ws: true, // WebSocket support ON
      changeOrigin: true,
    })
  );
  // Custom Parser: Raw Body preserve karne ke liye
  app.use(json({
    verify: (req: any, res, buf) => {
      req.rawBody = buf; // Buffer save kar liya verification ke liye
    },
  }));
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  app.enableCors({
    origin: 'http://localhost:4200', // Frontend URL
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
 
  const port = process.env.PORT || 3000;
  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`
  );
}

bootstrap();
