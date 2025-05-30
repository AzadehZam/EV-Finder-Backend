import { Document } from 'mongoose';
import { Request } from 'express';

// User Types
export interface IUser extends Document {
  auth0Id: string;
  email: string;
  name: string;
  picture?: string;
  preferences?: {
    favoriteStations: string[];
    notifications: boolean;
    units: 'metric' | 'imperial';
  };
  createdAt: Date;
  updatedAt: Date;
}

// Charging Station Types
export interface IChargingStation extends Document {
  name: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  connectorTypes: ConnectorType[];
  amenities: string[];
  pricing: {
    perKwh?: number;
    perMinute?: number;
    sessionFee?: number;
    currency: string;
  };
  operatingHours: {
    [key: string]: {
      open: string;
      close: string;
      is24Hours: boolean;
    };
  };
  status: 'active' | 'inactive' | 'maintenance';
  totalPorts: number;
  availablePorts: number;
  rating: number;
  reviews: string[];
  images: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Connector Types
export interface ConnectorType {
  type: 'CCS' | 'CHAdeMO' | 'Type2' | 'Tesla' | 'J1772';
  power: number; // in kW
  count: number;
  available: number;
}

// Reservation Types
export interface IReservation extends Document {
  userId: string;
  stationId: string;
  connectorType: string;
  startTime: Date;
  endTime: Date;
  estimatedCost: number;
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  vehicleInfo?: {
    make: string;
    model: string;
    batteryCapacity: number;
    currentCharge: number;
  };
  paymentInfo?: {
    method: 'credit_card' | 'paypal' | 'apple_pay' | 'google_pay';
    transactionId?: string;
  };
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Review Types
export interface IReview extends Document {
  userId: string;
  stationId: string;
  rating: number; // 1-5
  comment?: string;
  images?: string[];
  helpful: number;
  createdAt: Date;
  updatedAt: Date;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Query Types
export interface StationQuery {
  lat?: number;
  lng?: number;
  radius?: number; // in kilometers
  connectorType?: string;
  minPower?: number;
  maxPrice?: number;
  amenities?: string[];
  availability?: boolean;
  page?: number;
  limit?: number;
}

export interface ReservationQuery {
  userId?: string;
  stationId?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

// JWT Payload
export interface JWTPayload {
  userId: string;
  auth0Id: string;
  email: string;
  iat: number;
  exp: number;
}

// Express Request with User
export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    auth0Id: string;
    email: string;
  };
} 