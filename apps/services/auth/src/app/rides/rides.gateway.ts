import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*', // Security ke liye production mein ise specific URL karein
  },
})
export class RidesGateway implements OnGatewayConnection, OnGatewayDisconnect {

  @WebSocketServer()
  public server: Server;

  private logger = new Logger('RidesGateway');

  // Jab koi App connect karega
  handleConnection(client: Socket) {
    this.logger.log(`Client Connected: ${client.id}`);
  }

  // Jab koi App disconnect karega (App band kiya)
  handleDisconnect(client: Socket) {
    this.logger.log(`Client Disconnected: ${client.id}`);
  }

  // Test Event: Frontend se 'ping' aayega, hum 'pong' bhejenge
  @SubscribeMessage('ping')
  handlePing(@MessageBody() data: any) {
    this.logger.log(`Got message: ${data}`);
    return { event: 'pong', data: 'Hello from Server!' };
  }
}