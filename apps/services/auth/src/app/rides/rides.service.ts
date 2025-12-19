import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RidesGateway } from './rides.gateway';

@Injectable()
export class RidesService {
  constructor(
    private prisma: PrismaService,
    private ridesGateway: RidesGateway
  ) { }

  // 1. Ride Create Karo (Asli Database mein)
  async create(createRideDto: any) {
    const newRide = await this.prisma.ride.create({
      data: {
        pickupLat: createRideDto.pickupLat,
        pickupLng: createRideDto.pickupLng,
        dropLat: createRideDto.dropLat,
        dropLng: createRideDto.dropLng,
        pickupAddr: createRideDto.pickupAddr,
        dropAddr: createRideDto.dropAddr,
        price: createRideDto.price,
        status: 'SEARCHING',
        riderId: createRideDto.riderId, // User ID (Jo request bhej raha hai)
      },
    });
    this.ridesGateway.server.emit('new-ride-available', newRide);

    return newRide;
  }

  async updateStatus(rideId: string, status: string, driverId?: string) {
    const updatedRide = await this.prisma.ride.update({
      where: { id: rideId },
      data: { status, driverId }
    });

    // Rider ko batao ki Driver mil gaya!
    this.ridesGateway.server.emit(`ride-status-${rideId}`, updatedRide);

    return updatedRide;
  }

  // 2. Saari Rides dikhao
  findAll() {
    return this.prisma.ride.findMany({
      include: { rider: true, driver: true }
    });
  }

  // 3. Ek specific Ride dikhao
  findOne(id: string) {
    return this.prisma.ride.findUnique({
      where: { id },
      include: { rider: true, driver: true }
    });
  }
}