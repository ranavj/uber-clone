import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { CreateUserDto } from './create-user.dto';
import { PrismaService } from '@uber-clone/db';
// 👇 IMPORT CHANGE: HTTP Exceptions hata kar RpcException laye hain
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class AppService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) { }

  async createUser(data: CreateUserDto) {
    const saltOrRounds = 10;
    const hashedPassword = await bcrypt.hash(data.password, saltOrRounds);

    try {
      const user = await this.prisma.user.create({
        data: {
          ...data,
          password: hashedPassword,
        },
      });

      const { password, ...result } = user;
      return result;

    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
        // ❌ ConflictException (HTTP) -> ✅ RpcException (TCP)
        throw new RpcException('Email already exists');
      }
      throw new RpcException('Internal Server Error');
    }
  }

  async login(email: string, pass: string) {
    console.log(`🔐 Auth Logic: Checking user ${email}`);

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log('❌ User not found');
      // ❌ UnauthorizedException -> ✅ RpcException
      throw new RpcException('Invalid credentials'); 
    }

    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) {
      console.log('❌ Password Incorrect');
      // ❌ UnauthorizedException -> ✅ RpcException
      throw new RpcException('Invalid credentials');
    }

    console.log('✅ Login Success, Generating Token...');
    const payload = { sub: user.id, email: user.email, role: user.role };

    // Return object Gateway ke paas jayega
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        role: user.role
      }
    };
  }

  getData(): { message: string } {
    return { message: 'Auth Service is Up (with Prisma)!' };
  }
  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new RpcException('User not found');
    }

    // Password hata kar bhejenge
    const { password, ...result } = user;
    return result;
  }
}