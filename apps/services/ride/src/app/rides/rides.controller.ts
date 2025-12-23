import { Controller, Get, Post, Body, Param, Patch , Request, UseGuards, Ip} from '@nestjs/common';
import { RidesService } from './rides.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('rides')
export class RidesController {
  constructor(private readonly ridesService: RidesService) { }

   @Get('types')
  getRideTypes() {
    return [
      {
        id: 'moto',
        name: 'Uber Moto',
        image: 'https://cdn-icons-png.flaticon.com/512/3721/3721619.png',
        basePrice: 20, // Starting Price
        pricePerKm: 10 // Har KM ka rate
      },
      {
        id: 'uber_go',
        name: 'Uber Go',
        image: 'https://cdn-icons-png.flaticon.com/512/11104/11104431.png',
        basePrice: 40,
        pricePerKm: 15
      },
      {
        id: 'premier',
        name: 'Uber Premier',
        image: 'https://cdn-icons-png.flaticon.com/512/5035/5035162.png',
        basePrice: 60,
        pricePerKm: 22
      }
    ];
  }
  
  // URL: GET http://localhost:3000/api/rides/location
  @Get('location')
  getGeoLocation(@Ip() ip: string) {
    console.log('📍 Backend Location Hit. User IP:', ip);

    // Default Object (Jo hum hamesha return karenge agar kuch match na ho)
    const defaultLocation = {
      lat: 28.6139,
      lng: 77.2090,
      city: 'Delhi (Default)'
    };

    // Case 1: Localhost Check
    if (ip === '::1' || ip === '127.0.0.1') {
      console.log('✅ Returning Mumbai (Localhost)');
      return {
        lat: 19.0760,
        lng: 72.8777,
        city: 'Mumbai (IP Detected)'
      };
    }

    // Case 2: Agar IP kuch aur hai (Real World simulation)
    console.log('✅ Returning Delhi (Default)');
    return defaultLocation; 
  }
  
  @UseGuards(AuthGuard('jwt'))
  @Post('request')
  create(@Body() createRideDto: any, @Request() req) {

    const userId = req.user.id;

    return this.ridesService.create(createRideDto, userId);
  }

  @Get()
  findAll() {
    return this.ridesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ridesService.findOne(id);
  }

  // URL: POST http://localhost:3000/api/rides/:id/accept
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

 

}