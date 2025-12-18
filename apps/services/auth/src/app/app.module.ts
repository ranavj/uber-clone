import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { User } from './user.entity';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    // 1. Config Module: Yeh .env file padhega
    ConfigModule.forRoot({
      isGlobal: true, // Saare modules mein available rahega
      envFilePath: '.env', // Root folder wali file
    }),

    // 2. TypeORM: Postgres se connection banayega
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('POSTGRES_HOST', 'localhost'),
        port: config.get<number>('POSTGRES_PORT', 5432),
        username: config.get<string>('POSTGRES_USER'),
        password: config.get<string>('POSTGRES_PASSWORD'),
        database: config.get<string>('POSTGRES_DB'),
        
        // Auto-Load Entities: Jo tables hum banayenge wo apne aap load hongi
        autoLoadEntities: true,
        
        // Synchronize: DEV mode mein True rakhein. 
        // (Yeh automatically database table bana dega bina SQL likhe)
        synchronize: true, 
      }),
    }),
    TypeOrmModule.forFeature([User]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'secretKey'), // .env se secret lega
        signOptions: { expiresIn: '1d' }, // Token 1 din mein expire hoga
      }),
    }),
  ],
  controllers: [AppController],
  providers: [AppService, JwtStrategy],
})
export class AppModule {}