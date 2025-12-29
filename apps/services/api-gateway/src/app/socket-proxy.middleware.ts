import { Injectable, NestMiddleware } from '@nestjs/common';
import { createProxyMiddleware } from 'http-proxy-middleware';

@Injectable()
export class SocketProxyMiddleware implements NestMiddleware {
  private proxy = createProxyMiddleware({
    target: 'http://127.0.0.1:3013',
    ws: true,
    changeOrigin: true,
  });

  use(req: any, res: any, next: () => void) {
    this.proxy(req, res, next);
  }
}