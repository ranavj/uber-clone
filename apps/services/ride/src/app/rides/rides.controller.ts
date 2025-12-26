import { Controller } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { RidesService } from './rides.service';
import { JwtService } from '@nestjs/jwt';

@Controller()
export class RidesController {
  constructor(
    private readonly ridesService: RidesService,
    private readonly jwtService: JwtService
  ) {}

  // 🛠️ DEV TOKEN
  @MessagePattern('ride.dev_token')
  getDevToken(@Payload() id: string) {
    return { token: this.jwtService.sign({ sub: id, role: 'driver' }) };
  }

  // 🚕 RIDE TYPES
  @MessagePattern('ride.get_types')
  getRideTypes() {
    return [
      { id: 'moto', name: 'Uber Moto', image: 'https://cdn-icons-png.flaticon.com/512/3721/3721619.png', basePrice: 20, pricePerKm: 10 },
      { id: 'uber_go', name: 'Uber Go', image: 'https://cdn-icons-png.flaticon.com/512/11104/11104431.png', basePrice: 40, pricePerKm: 15 },
      { id: 'premier', name: 'Uber Premier', image: 'https://cdn-icons-png.flaticon.com/512/5035/5035162.png', basePrice: 60, pricePerKm: 22 }
    ];
  }

  // 📍 LOCATION
  @MessagePattern('ride.get_location')
  getGeoLocation(@Payload() ip: string) {
    console.log('📍 Ride Service: Getting Location for IP:', ip);
    try {
      const defaultLocation = { lat: 28.6139, lng: 77.2090, city: 'Delhi (Default)' };
      
      // Localhost check
      if (ip === '::1' || ip === '127.0.0.1') {
        return { lat: 19.0760, lng: 72.8777, city: 'Mumbai (IP Detected)' };
      }
      return defaultLocation;
    } catch (error) {
      console.error('❌ Location Error:', error);
      return { lat: 28.6139, lng: 77.2090, city: 'Error Fallback' };
    }
  }

  @MessagePattern('ride.get_active')
  async getActiveRide(@Payload() userId: string) {
    console.log('🔄 Checking Active Ride for:', userId);
    try {
      const ride = await this.ridesService.findActiveRideForUser(userId);
      
      // 🛡️ SAFETY CHECK: Agar ride undefined hai, toh null bhejo
      if (!ride) {
        return null; 
      }
      return ride;

    } catch (error) {
      console.error('❌ Active Ride Error:', error);
      return null; // Error aaye toh bhi null bhejo taaki Gateway crash na ho
    }
  }

  // 📜 HISTORY
  @MessagePattern('ride.history')
  async getHistory(@Payload() userId: string) {
    console.log('📜 History Request for:', userId);
    try {
      return await this.ridesService.getMyRides(userId);
    } catch (e) {
      throw new RpcException(e.message);
    }
  }

  // 🆕 CREATE RIDE
  @MessagePattern('ride.create')
  async create(@Payload() data: { dto: any; userId: string }) {
    console.log('🚕 Creating Ride for:', data.userId);
    try {
      return await this.ridesService.create(data.dto, data.userId);
    } catch (error) {
      throw new RpcException(error.message);
    }
  }

  @MessagePattern('ride.find_all')
  findAll() { return this.ridesService.findAll(); }

  @MessagePattern('ride.find_one')
  findOne(@Payload() id: string) { return this.ridesService.findOne(id); }

  @MessagePattern('ride.accept')
  async acceptRide(@Payload() data: { id: string; driverId: string }) {
    try {
        return await this.ridesService.updateStatus(data.id, 'ACCEPTED', data.driverId);
    } catch (e) { throw new RpcException(e.message); }
  }

  @MessagePattern('ride.update_status')
  async updateStatus(@Payload() data: { id: string; status: any }) {
    try {
        return await this.ridesService.updateStatus(data.id, data.status);
    } catch (e) { throw new RpcException(e.message); }
  }

  @MessagePattern('ride.cancel')
  async cancelRide(@Payload() id: string) {
    try {
        return await this.ridesService.cancelRide(id);
    } catch (e) { throw new RpcException(e.message); }
  }
}