import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    ConfigModule
  ],
  providers: [JwtStrategy],
  exports: [PassportModule, JwtStrategy], // 👈 Export zaroori hai
})
export class CommonAuthModule {}