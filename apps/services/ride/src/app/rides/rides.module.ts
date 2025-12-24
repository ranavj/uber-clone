import { Module } from '@nestjs/common';
import { RidesService } from './rides.service';
import { RidesController } from './rides.controller';
import { RidesGateway } from './rides.gateway';
import { DbModule } from '@uber-clone/db';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    DbModule, 
    // 👇 Fixed Syntax & Added Fallback Secret
    JwtModule.register({ 
      secret: process.env.JWT_SECRET || 'super-secret', 
      signOptions: { expiresIn: '1d' }
    })
  ], 
  controllers: [RidesController],
  providers: [RidesService, RidesGateway], 
  exports: [RidesService] // Service export karein (Gateway ki zaroorat kam padti hai bahar)
})
export class RidesModule {}