import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JwtStrategy } from './jwt.strategy';
import { PrismaService } from './prisma/prisma.service';
import { RidesModule } from './rides/rides.module';

@Module({
  imports: [
    // 1. Config Module: Yeh .env file padhega
    ConfigModule.forRoot({
      isGlobal: true, // Saare modules mein available rahega
      envFilePath: '.env', // Root folder wali file
    }),



    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'secretKey'), // .env se secret lega
        signOptions: { expiresIn: '1d' }, // Token 1 din mein expire hoga
      }),
    }),
    RidesModule
  ],
  controllers: [AppController],
  providers: [AppService, JwtStrategy, PrismaService],
})
export class AppModule { }