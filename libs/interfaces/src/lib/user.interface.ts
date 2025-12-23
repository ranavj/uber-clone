export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  rating?: number;
}

export interface Driver {
  id: string;
  name: string; // Combined name
  email: string;
  phone: string;
  
  // Car Details
  carModel: string;
  carNumber: string;
  carType: 'moto' | 'uber_go' | 'premier';
  
  rating: number;
  isOnline: boolean;
  image?: string;
  // Live Location
  currentLat?: number;
  currentLng?: number;
}