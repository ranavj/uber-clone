import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      // 1. Token kahan dhoondhna hai? -> Header mein "Authorization: Bearer <token>"
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      
      // 2. Token expire toh nahi hua? -> Yeh apne aap check karega
      ignoreExpiration: false,
      
      // 3. Secret Key wahi honi chahiye jo sign karte waqt use ki thi (.env)
      secretOrKey: configService.get<string>('JWT_SECRET', 'secretKey'),
    });
  }

  // Agar token valid hai, toh yeh function chalega
  async validate(payload: any) {
    // Yeh return value automatic 'req.user' mein attach ho jayegi
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}