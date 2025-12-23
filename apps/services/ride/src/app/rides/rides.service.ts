import { Injectable } from '@nestjs/common';
import { RidesGateway } from './rides.gateway';
import { PrismaService } from '@uber-clone/db';

@Injectable()
export class RidesService {
  constructor(
    private prisma: PrismaService,
    private ridesGateway: RidesGateway
  ) { }

  // 1. Ride Create Karo (Asli Database mein)
  async create(createRideDto: any, userId: string) {
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
        rider: {
          connect: { id: userId }
        }
      },
    });
    this.ridesGateway.notifyDrivers(newRide);

    return newRide;
  }

  async updateStatus(rideId: string, status: string, driverId?: string) {
    const updatedRide = await this.prisma.ride.update({
      where: { id: rideId },
      data: { status, driverId }
    });

    // Rider ko batao ki Driver mil gaya!
    this.ridesGateway.notifyRideStatus(updatedRide);

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