import { User, Driver } from './user.interface';

// Fixed Statuses (Spelling mistakes se bachne ke liye)
export enum RideStatus {
  SEARCHING = 'SEARCHING',
  ACCEPTED = 'ACCEPTED',
  ARRIVED = 'ARRIVED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface Ride {
  id: string;
  riderId: string;
  driverId?: string | null;
  
  // Locations
  pickupLat: number;
  pickupLng: number;
  dropLat: number;
  dropLng: number;
  pickupAddr: string;
  dropAddr: string;

  price: number;
  status: RideStatus;
  
  // Dates
  createdAt: Date;
  updatedAt?: Date;

  // Relations
  rider?: User;
  driver?: Driver;
}