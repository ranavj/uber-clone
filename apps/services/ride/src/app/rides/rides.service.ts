import { Injectable } from '@nestjs/common';
import { RidesGateway } from './rides.gateway';
import { PrismaService } from '@uber-clone/db';
import { CreateRideDto } from '@uber-clone/dtos';

@Injectable()
export class RidesService {
  constructor(
    private prisma: PrismaService,
    private ridesGateway: RidesGateway
  ) { }

  // 1. Ride Create Karo (Asli Database mein)
  async create(createRideDto: CreateRideDto, userId: string) {
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

  // 📜 GET HISTORY: User ki saari rides layega
  async getMyRides(userId: string) {
    return this.prisma.ride.findMany({
      where: { 
        riderId: userId // Sirf is user ki rides
      },
      include: {
        driver: true, // Driver ki details bhi chahiye history dikhane ke liye
      },
      orderBy: {
        createdAt: 'desc', // Sabse nayi ride sabse upar (Latest First)
      },
    });
  }

  // 🚫 CANCEL RIDE
  async cancelRide(rideId: string) {
    // 1. Pehle Ride dhundo
    const ride = await this.prisma.ride.findUnique({ where: { id: rideId } });

    // 2. Validation: Agar ride khatam ho chuki hai, toh cancel mat karo
    if (ride.status === 'COMPLETED') {
      throw new Error('Cannot cancel a completed ride');
    }

    // 3. Status Update karo
    const updatedRide = await this.prisma.ride.update({
      where: { id: rideId },
      data: { status: 'CANCELLED' },
      include: { driver: true, rider: true } // Notification ke liye details chahiye
    });

    // 4. Driver (aur Rider) ko Notify karo
    // Hum wahi 'notifyRideStatus' use kar rahe hain jo humne Gateway mein banaya tha
    this.ridesGateway.notifyRideStatus(updatedRide);

    return updatedRide;
  }
}