import { Module } from '@nestjs/common';
import { RidesService } from './rides.service';
import { RidesController } from './rides.controller';
import { RidesGateway } from './rides.gateway';
import { DbModule, PrismaService } from '@uber-clone/db';

@Module({
  imports: [DbModule],
  controllers: [RidesController],
  providers: [RidesService, RidesGateway], 
  exports: [RidesGateway]
})
export class RidesModule {}