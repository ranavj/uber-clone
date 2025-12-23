import { Body, Controller, Get, Param, Patch, Post, Request, UseGuards, Ip } from '@nestjs/common';
import { RidesService } from './rides.service';
import { AuthGuard } from '@nestjs/passport';
import { CreateRideDto } from '@uber-clone/dtos';

@Controller('rides')
export class RidesController {
  constructor(private readonly ridesService: RidesService) { }

  // 1. STATIC ROUTES (Sabse Pehle)
  @Get('types')
  getRideTypes() {
    return [
      { id: 'moto', name: 'Uber Moto', image: 'https://cdn-icons-png.flaticon.com/512/3721/3721619.png', basePrice: 20, pricePerKm: 10 },
      { id: 'uber_go', name: 'Uber Go', image: 'https://cdn-icons-png.flaticon.com/512/11104/11104431.png', basePrice: 40, pricePerKm: 15 },
      { id: 'premier', name: 'Uber Premier', image: 'https://cdn-icons-png.flaticon.com/512/5035/5035162.png', basePrice: 60, pricePerKm: 22 }
    ];
  }

  @Get('location')
  getGeoLocation(@Ip() ip: string) {
    console.log('📍 Backend Location Hit. User IP:', ip);
    const defaultLocation = { lat: 28.6139, lng: 77.2090, city: 'Delhi (Default)' };
    if (ip === '::1' || ip === '127.0.0.1') {
      return { lat: 19.0760, lng: 72.8777, city: 'Mumbai (IP Detected)' };
    }
    return defaultLocation;
  }

  // ✅ MOVED UP: History ko ':id' se pehle aana zaroori hai
  @UseGuards(AuthGuard('jwt'))
  @Get('history') 
  getHistory(@Request() req) {
    console.log('📜 Fetching history for:', req.user.id);
    return this.ridesService.getMyRides(req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('request')
  create(@Body() createRideDto: CreateRideDto, @Request() req) {
    return this.ridesService.create(createRideDto, req.user.id);
  }

  @Get()
  findAll() {
    return this.ridesService.findAll();
  }

  // 2. DYNAMIC ROUTES (Sabse Last mein) ⚠️
  // Agar 'history' iske neeche hoti, toh yeh route usse kha jata
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ridesService.findOne(id);
  }

  @Patch(':id/accept')
  acceptRide(@Param('id') id: string, @Body() body: { driverId: string }) {
    return this.ridesService.updateStatus(id, 'ACCEPTED', body.driverId);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: 'ARRIVED' | 'IN_PROGRESS' | 'COMPLETED' }
  ) {
    console.log(`Updating Ride ${id} to ${body.status}`);
    return this.ridesService.updateStatus(id, body.status);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id/cancel')
  cancelRide(@Param('id') id: string) {
    console.log(`🚫 Cancelling Ride: ${id}`);
    return this.ridesService.cancelRide(id);
  }
}