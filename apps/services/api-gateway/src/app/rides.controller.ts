import { Body, Controller, Get, Param, Patch, Post, Request, UseGuards, Ip, Inject, HttpException, HttpStatus } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { AuthGuard } from '@nestjs/passport';

@Controller('rides')
export class RidesController {
  constructor(
    @Inject('RIDE_SERVICE') private readonly rideClient: ClientProxy
  ) {}

  // ==========================================
  // 🔓 PUBLIC ROUTES (No Token Needed)
  // ==========================================

  // 1. Dev Token (Testing ke liye) - ✅ Public Sahi hai
  @Get('dev/token/:id')
  getDevToken(@Param('id') id: string) {
    return this.rideClient.send('ride.dev_token', id);
  }

  // 2. Ride Types (Moto/Auto) - ✅ Public Sahi hai (Login se pehle dikhana hota hai)
  @Get('types')
  getRideTypes() {
    return this.rideClient.send('ride.get_types', {});
  }

  // 3. Location (IP Based) - ✅ Public Sahi hai
  @Get('location')
  getGeoLocation(@Ip() ip: string) {
    return this.rideClient.send('ride.get_location', ip);
  }

  // ==========================================
  // 🔐 PROTECTED ROUTES (Token Required)
  // ==========================================

  // 4. Check Active Ride

  @UseGuards(AuthGuard('jwt'))
  @Get('current-active')
  getActiveRide(@Request() req) {
    // 🛠️ FIX: req.user.id use karein (Interface match)
    const userId = req.user.id; 

    console.log('🔍 Gateway: User ID from Token:', userId);

    if (!userId) {
       throw new HttpException('User ID missing', HttpStatus.UNAUTHORIZED);
    }

    return this.rideClient.send('ride.get_active', userId);
  }
  // 5. Ride History
  @UseGuards(AuthGuard('jwt'))
  @Get('history')
  getHistory(@Request() req) {
    return this.rideClient.send('ride.history', req.user.id);
  }

  // 6. Request/Book Ride
  @UseGuards(AuthGuard('jwt'))
  @Post('request')
  create(@Body() createRideDto: any, @Request() req) {
    return this.rideClient.send('ride.create', { 
      dto: createRideDto, 
      userId: req.user.id 
    });
  }

  // 7. Find All (Admin/Dev) - 🛡️ Added Guard (Security)
  @UseGuards(AuthGuard('jwt')) 
  @Get()
  findAll() {
    return this.rideClient.send('ride.find_all', {});
  }

  // 8. Find One Ride - 🛡️ Added Guard
  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rideClient.send('ride.find_one', id);
  }

  // 9. Accept Ride (Driver Only) - 🛡️ Added Guard & Secure Driver ID
  @UseGuards(AuthGuard('jwt'))
  @Patch(':id/accept')
  acceptRide(@Param('id') id: string, @Request() req) {
    // 💡 IMPROVEMENT: Body se driverId lene ki jagah, Token se lo.
    // Isse koi dusra driver kisi aur ki ride accept nahi kar payega.
    return this.rideClient.send('ride.accept', { 
      id, 
      driverId: req.user.id // ✅ Token wala user hi Driver banega
    });
  }

  // 10. Update Status (Arrived/Start/End) - 🛡️ Added Guard
  @UseGuards(AuthGuard('jwt'))
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.rideClient.send('ride.update_status', { id, status: body.status });
  }

  // 11. Cancel Ride
  @UseGuards(AuthGuard('jwt'))
  @Patch(':id/cancel')
  cancelRide(@Param('id') id: string) {
    return this.rideClient.send('ride.cancel', id);
  }
}