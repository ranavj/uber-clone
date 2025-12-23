import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config'; // 👈 .env padhne ke liye
import { JwtModule } from '@nestjs/jwt'; // 👈 Token ke liye
import { PassportModule } from '@nestjs/passport'; // 👈 Strategy ke liye
import { DbModule } from '@uber-clone/db'; // 👈 Database
import { RidesModule } from './rides/rides.module';
import { JwtStrategy } from './auth/jwt.strategy';

@Module({
  imports: [
    // 1. Config Module (.env file load karega root se)
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env', 
    }),

    // 2. Database
    DbModule,

    // 3. Rides Logic
    RidesModule,

    // 4. Passport (Zaroori hai Guard ke liye)
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // 5. JWT Module (Auth jaisa same config)
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        // 🔐 IMPORTANT: Secret wahi hona chahiye jo Auth service mein hai
        secret: configService.get<string>('JWT_SECRET', 'secretKey'), 
        signOptions: { expiresIn: '1d' },
      }),
    }),
  ],
  controllers: [],
  
  // 6. Provider mein Strategy daalna mat bhoolna!
  providers: [JwtStrategy], 
})
export class AppModule {}