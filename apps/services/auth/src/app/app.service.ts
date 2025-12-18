import { ConflictException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt'; 
import { User } from './user.entity';
import { CreateUserDto } from './create-user.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService
  ) {}

  async createUser(data: CreateUserDto): Promise<User> {
    // 1. Password ko Hash karein (Salt rounds: 10 standard hai)
    const saltOrRounds = 10;
    const hashedPassword = await bcrypt.hash(data.password, saltOrRounds);

    // 2. Original password ko hashed password se replace karein
    const newUser = this.userRepository.create({
      ...data,
      password: hashedPassword,
    });
    
    // 3. Save karein
    try {
      // Koshish karo save karne ki
      return await this.userRepository.save(newUser);
    } catch (error) {
      // Agar error code '23505' hai (Postgres ka code for Unique Violation)
      if (error.code === '23505') {
        throw new ConflictException('Email already exists'); // 409 Conflict
      } else {
        throw new InternalServerErrorException(); // 500 For other errors
      }
    }
  }

  async login(email: string, pass: string) {
    // 1. User dhoondho (Password field select karna padega kyunki entity mein {select: false} tha)
    const user = await this.userRepository.findOne({
      where: { email },
      select: ['id', 'email', 'password', 'role', 'firstName'], 
    });

    if (!user) {
      throw new UnauthorizedException('User nahi mila');
    }

    // 2. Password Match karo
    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Password galat hai');
    }

    // 3. Token Generate karo
    const payload = { sub: user.id, email: user.email, role: user.role };
    
    return {
      access_token: this.jwtService.sign(payload), // Yeh hai wo Digital ID Card
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName
      }
    };
  }
  getData(): { message: string } {
    return { message: 'Auth Service is Up!' };
  }
}