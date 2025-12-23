import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DbModule } from '@uber-clone/db';
import { RidesModule } from './rides/rides.module';

// ✅ Import Shared Auth Module
import { CommonAuthModule } from '@uber-clone/common-auth';

@Module({
  imports: [
    // 1. Config Module (.env file load karega)
    // Note: Yeh zaroori hai taaki Shared Library ko 'JWT_SECRET' mil sake
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env', 
    }),

    // 2. Database
    DbModule,

    // 3. Rides Logic
    RidesModule,

    // 👇 4. SHARED AUTH (Magic Line) 🎩
    // Yeh akela module 'Passport' aur 'JwtStrategy' dono le aayega.
    // Ab Ride Service ko pata hai ki Token kaise check karna hai.
    CommonAuthModule, 
  ],
  controllers: [],
  providers: [], // ❌ Local 'JwtStrategy' ki ab zaroorat nahi
})
export class AppModule {}