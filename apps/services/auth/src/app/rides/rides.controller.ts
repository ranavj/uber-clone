import { Controller, Get, Post, Body, Param, Patch } from '@nestjs/common';
import { RidesService } from './rides.service';

@Controller('rides')
export class RidesController {
  constructor(private readonly ridesService: RidesService) {}

  @Post()
  create(@Body() createRideDto: any) {
    return this.ridesService.create(createRideDto);
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
}