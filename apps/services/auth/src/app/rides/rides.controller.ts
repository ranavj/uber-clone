import { Controller, Get, Post, Body, Param, Patch , Request, UseGuards} from '@nestjs/common';
import { RidesService } from './rides.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('rides')
export class RidesController {
  constructor(private readonly ridesService: RidesService) { }

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