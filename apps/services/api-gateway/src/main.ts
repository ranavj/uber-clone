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
    // bodyParser: false, // 👈 Isse abhi ke liye comment kar sakte hain agar issue aaye
  });

  /* // PURANA PROXY LOGIC (Commented)
  const server = app.getHttpAdapter().getInstance();
  server.use(
    '/socket.io',
    createProxyMiddleware({
      target: 'http://127.0.0.1:3013',
      ws: true,
      changeOrigin: true,
    })
  );
  */

  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix, {
    exclude: ['socket.io'], 
  });

  app.use(json({
    verify: (req: any, res, buf) => {
      req.rawBody = buf; 
    },
  }));

  app.enableCors({
    origin: 'http://localhost:4200',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  const port = 3000;
  await app.listen(port);
  Logger.log(`🚀 Gateway: http://localhost:${port}/${globalPrefix}`);
}
bootstrap();
