import { IsString, IsNumber, IsNotEmpty, Min, IsUUID, IsOptional } from 'class-validator';

export class CreateRideDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(-90)
  pickupLat!: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(-180)
  pickupLng!: number;

  @IsNotEmpty()
  @IsNumber()
  dropLat!: number;

  @IsNotEmpty()
  @IsNumber()
  dropLng!: number;

  @IsNotEmpty()
  @IsString()
  pickupAddr!: string;

  @IsNotEmpty()
  @IsString()
  dropAddr!: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0) // Price negative nahi ho sakti
  price!: number;

  @IsNotEmpty()
  @IsUUID() // Check karega ki valid User ID hai
  riderId!: string;

  // Optional fields
  @IsOptional()
  @IsString()
  type?: string; // e.g. 'moto', 'auto'
}