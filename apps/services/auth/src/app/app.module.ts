import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommonAuthModule } from '@uber-clone/common-auth';
import { DbModule } from '@uber-clone/db';
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
        secret: configService.get<string>('JWT_SECRET', 'super-secret-key'), // .env se secret lega
        signOptions: { expiresIn: '1d' }, // Token 1 din mein expire hoga
      }),
    }),
    DbModule,
    CommonAuthModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }