import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Inject, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RidesService } from './rides.service';

// Shared Constants
import { SOCKET_EVENTS } from '@uber-clone/interfaces';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class RidesGateway implements OnGatewayConnection, OnGatewayDisconnect {

  @WebSocketServer()
  public server: Server;

  private logger = new Logger('RidesGateway');

  //  Constructor mein JWT aur RideService Inject kiya
  constructor(
    private jwtService: JwtService,
    // forwardRef isliye agar circular dependency ho (optional but safe)
    @Inject(forwardRef(() => RidesService))
    private rideService: RidesService
  ) { }

  // 1. Connection Handle Karna (Refresh Fix Logic)
  async handleConnection(client: Socket) {
    try {
      // A. Token Nikalo
      const token = client.handshake.auth?.token;

      if (!token) {
        this.logger.warn(`Client connected without token: ${client.id}`);
        return;
      }

      // B. Verify Token
      const payload = this.jwtService.verify(token);
      const userId = payload.sub; // User ID mil gayi

      this.logger.log(`✅ Client Authenticated: ${userId} (Socket: ${client.id})`);

      // C. Active Ride Check Karo (State Recovery)
      // Humein check karna hai ki kya is user ki koi ride chal rahi hai?
      const activeRide = await this.rideService.findActiveRideForUser(userId);

      if (activeRide) {
        this.logger.log(`♻️ Recovering State for Ride: ${activeRide.id}`);

        // D. Client ko Latest Data Bhejo (SYNC UI)
        // Frontend is event ka wait kar raha hota hai refresh ke baad
        const eventName = SOCKET_EVENTS.RIDE_STATUS_UPDATE(activeRide.id);
        client.emit(eventName, activeRide);

        // Agar Driver hai, toh usse 'NEW_RIDE' room mein bhi join kara sakte hain
        // client.join(`ride_${activeRide.id}`);
      }

    } catch (error) {
      this.logger.error(`❌ Connection Error: ${error.message}`);
      // client.disconnect(); // Optional: Agar invalid token ho toh bhaga do
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client Disconnected: ${client.id}`);
  }

  // 2. Notify Drivers (Jab Rider request kare)
  notifyDrivers(ride: any) {
    this.server.emit(SOCKET_EVENTS.NEW_RIDE_AVAILABLE, ride);
    this.logger.log(`📢 Broadcasting New Ride: ${ride.id}`);
  }

  // 3. Notify Rider (Status Updates)
  notifyRideStatus(ride: any) {
    const eventName = SOCKET_EVENTS.RIDE_STATUS_UPDATE(ride.id);
    this.server.emit(eventName, ride);
    this.logger.log(`🔔 Status Update (${ride.status}): ${ride.id}`);
  }

  // 4. Driver Location Relay
  @SubscribeMessage(SOCKET_EVENTS.UPDATE_DRIVER_LOCATION)
  handleDriverLocation(@MessageBody() data: { rideId: string, lat: number, lng: number, heading: number }) {
    const eventName = SOCKET_EVENTS.DRIVER_LOCATION_UPDATE(data.rideId);
    this.server.emit(eventName, data);
  }

  @SubscribeMessage('ping')
  handlePing() {
    return { event: 'pong', data: 'Server is Alive!' };
  }
}