import { ConflictException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'; // Error handling ke liye
import { CreateUserDto } from './create-user.dto';
import { PrismaService } from '@uber-clone/db';

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
      // ✅ Prisma Create Query
      const user = await this.prisma.user.create({
        data: {
          ...data,
          password: hashedPassword,
        },
      });

      // Password hata kar return karo
      const { password, ...result } = user;
      return result;

    } catch (error) {
      // ✅ Prisma Error Code 'P2002' (Unique Constraint Violation)
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Email already exists');
      }
      throw new InternalServerErrorException();
    }
  }

  async login(email: string, pass: string) {
    // ✅ Prisma Find Unique Query
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('User nahi mila');
    }

    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Password galat hai');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName
      }
    };
  }

  getData(): { message: string } {
    return { message: 'Auth Service is Up (with Prisma)!' };
  }
}