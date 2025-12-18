import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

// Yeh 'User' class database mein 'users' naam ki table banegi
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid') // Unique ID (e.g., 'a1b2-c3d4...')
  id: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ unique: true }) // Email duplicate nahi ho sakti
  email: string;

  @Column({ select: false }) // Security: Jab user data mangenge, password return nahi hoga
  password: string;

  @Column({ 
    type: 'enum', 
    enum: ['rider', 'driver', 'admin'], 
    default: 'rider' 
  })
  role: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}