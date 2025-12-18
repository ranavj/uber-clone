import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards, Request } from '@nestjs/common';
import { AppService } from './app.service';
import { CreateUserDto } from './create-user.dto';
import { LoginDto } from './login.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getData() {
    return this.appService.getData();
  }

  @Post('register')
  async register(@Body() body: CreateUserDto) {
    return this.appService.createUser(body);
  }

  @HttpCode(HttpStatus.OK) // 200 OK return karega (Default POST 201 hota hai)
  @Post('login')
  async login(@Body() body: LoginDto) {
    return this.appService.login(body.email, body.password);
  }

  @UseGuards(AuthGuard('jwt')) // Yeh Guard Token check karega
  @Get('profile')
  getProfile(@Request() req) {
    // Agar token sahi tha, toh req.user mein data hoga
    return req.user;
  }
}