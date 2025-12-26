import { Body, Controller, Inject, Post, Get, UseGuards, Request, HttpException, HttpStatus } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { AuthGuard } from '@nestjs/passport'; // 👈 Guard yahan chalega
import { catchError, throwError } from 'rxjs';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy
  ) {}

  @Post('login')
  async login(@Body() data: any) {
    console.log('🚀 Gateway: Forwarding Login...');
    return this.authClient.send('auth.login', data).pipe(
      catchError(error => throwError(() => new HttpException(error.message, HttpStatus.UNAUTHORIZED)))
    );
  }
  
  @Post('signup')
  async signup(@Body() data: any) {
    return this.authClient.send('auth.signup', data).pipe(
      catchError(error => throwError(() => new HttpException(error.message, HttpStatus.BAD_REQUEST)))
    );
  }

  // ✅ PROFILE ENDPOINT (Restored Here)
  @UseGuards(AuthGuard('jwt')) // 🔒 Token Check Gateway karega
  @Get('profile')
  async getProfile(@Request() req) {
    // Gateway ke paas Token se User ID aa gayi hai (req.user.userId)
    // Ab hum Auth Service se fresh data mangenge
    return this.authClient.send('auth.get_profile', req.user.id).pipe(
      catchError(error => throwError(() => new HttpException('User not found', HttpStatus.NOT_FOUND)))
    );
  }
}