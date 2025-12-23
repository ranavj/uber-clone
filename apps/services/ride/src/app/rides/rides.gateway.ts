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
// ✅ Import Shared Constants
import { SOCKET_EVENTS } from '@uber-clone/interfaces';

@WebSocketGateway({
  cors: {
    origin: '*', // Production mein ise restrict karein
  },
})
export class RidesGateway implements OnGatewayConnection, OnGatewayDisconnect {

  @WebSocketServer()
  public server: Server;

  private logger = new Logger('RidesGateway');

  // Connection Logs
  handleConnection(client: Socket) {
    this.logger.log(`Client Connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client Disconnected: ${client.id}`);
  }

  // 1. Notify Drivers (Jab Rider request kare)
  notifyDrivers(ride: any) {
    this.server.emit(SOCKET_EVENTS.NEW_RIDE_AVAILABLE, ride);
    this.logger.log(`📢 Broadcasting New Ride: ${ride.id}`);
  }

  // 2. Notify Rider (Jab Driver accept kare / pahunch jaye)
  notifyRideStatus(ride: any) {
    
    // ✅ NEW: Constant Helper Use Kiya
    const eventName = SOCKET_EVENTS.RIDE_STATUS_UPDATE(ride.id);
    this.server.emit(eventName, ride);
    
    this.logger.log(`🔔 Sending Status Update to Rider (${eventName}): ${ride.status}`);
  }

  // 3. Driver Location Relay (Driver -> Server -> Rider)
  @SubscribeMessage(SOCKET_EVENTS.UPDATE_DRIVER_LOCATION)
  handleDriverLocation(@MessageBody() data: { rideId: string, lat: number, lng: number, heading: number }) {
    // Rider ke liye unique event name banao
    const eventName = SOCKET_EVENTS.DRIVER_LOCATION_UPDATE(data.rideId);
    
    // Server Rider ko forward karega
    this.server.emit(eventName, data);
  }

  // Test Ping
  @SubscribeMessage('ping')
  handlePing(@MessageBody() data: any) {
    return { event: 'pong', data: 'Hello from Server!' };
  }
}