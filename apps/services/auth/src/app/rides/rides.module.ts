import { Module } from '@nestjs/common';
import { RidesService } from './rides.service';
import { RidesController } from './rides.controller';
import { PrismaService } from '../prisma/prisma.service'; // 👈 Zaroori hai
import { RidesGateway } from './rides.gateway';

@Module({
  controllers: [RidesController],
  providers: [RidesService, PrismaService, RidesGateway], 
  exports: [RidesGateway]
})
export class RidesModule {}