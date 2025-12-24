import { Body, Controller, Get, Param, Patch, Post, Request, UseGuards, Ip } from '@nestjs/common';
import { RidesService } from './rides.service';
import { AuthGuard } from '@nestjs/passport';
import { CreateRideDto } from '@uber-clone/dtos';
import { JwtService } from '@nestjs/jwt'; // ✅ 1. Import Added

@Controller('rides')
export class RidesController {

  // ✅ 2. Inject JwtService (Token generate karne ke liye)
  constructor(
    private readonly ridesService: RidesService,
    private readonly jwtService: JwtService
  ) { }

  // ==========================================
  // 1. STATIC & DEV ROUTES (Sabse Pehle)
  // ==========================================

  // 🛠️ DEV ROUTE: Driver App ke liye Auto-Login Token
  // URL: GET /api/rides/dev/token/:id
  @Get('dev/token/:id')
  getDevToken(@Param('id') id: string) {
    // Fake Payload banaya (Driver Role ke saath)
    const payload = { sub: id, role: 'driver' };

    // Token Sign kiya
    const token = this.jwtService.sign(payload);

    console.log(`🔑 Generated Dev Token for Driver ID: ${id}`);
    return { token };
  }

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

  // ✅ Refresh Logic ke liye
  @UseGuards(AuthGuard('jwt'))
  @Get('current-active')
  async getActiveRide(@Request() req) {
    console.log('🔄 Checking active ride for User ID:', req.user.id);
    return this.ridesService.findActiveRideForUser(req.user.id);
  }

  // ✅ History Route
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

  // ==========================================
  // 2. DYNAMIC ROUTES (Sabse Last mein) ⚠️
  // ==========================================

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