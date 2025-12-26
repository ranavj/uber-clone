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

  // ... (Login/Signup same rahega) ...

  @MessagePattern('auth.get_profile')
  async getProfile(@Payload() userId: string) {
    console.log(`👤 Fetching Profile for: ${userId}`);
    try {
      const user = await this.appService.getUserById(userId);
      // 🛡️ SAFETY CHECK
      if (!user) {
        throw new RpcException('User not found'); // Explicit Error better than undefined
      }
      return user;
    } catch (error) {
      throw new RpcException('User fetch failed');
    }
  }
}