import { Controller } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { AppService } from './app.service';
import { LoginDto } from './login.dto';
import { CreateUserDto } from './create-user.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @MessagePattern('auth.signup')
  async register(@Payload() data: CreateUserDto) {
    try {
      return await this.appService.createUser(data);
    } catch (error) {
      throw new RpcException(error.message);
    }
  }

  @MessagePattern('auth.login')
  async login(@Payload() data: LoginDto) {
    console.log(`🔐 Controller: Login Request for ${data.email}`);
    try {
      // 1. Service Call
      const result = await this.appService.login(data.email, data.password);
      
      // 2. Debug Log (Yeh dekhna zaroori hai)
      console.log('✅ Controller: Data received from Service. Returning to Gateway...');
      
      return result;
    } catch (error) {
      console.error('❌ Controller Error:', error);
      // Error ko sahi format mein Gateway bhejo
      throw new RpcException(error.message || 'Login Failed');
    }
  }

  @MessagePattern('auth.get_profile')
  async getProfile(@Payload() userId: string) {
    console.log(`👤 Auth Service: Fetching Profile for: ${userId}`);
    try {
      const user = await this.appService.getUserById(userId);
      if (!user) {
        return { error: 'User not found' }; // RpcException ki jagah object bhejna safer hai TCP mein
      }
      return user; 
    } catch (error) {
      console.error('❌ Auth TCP Error:', error.message);
      return { error: 'Fetch failed', message: error.message };
    }
  }
}