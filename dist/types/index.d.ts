import { Document } from 'mongoose';
import { Request } from 'express';
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
        coordinates: [number, number];
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
export interface ConnectorType {
    type: 'CCS' | 'CHAdeMO' | 'Type2' | 'Tesla' | 'J1772';
    power: number;
    count: number;
    available: number;
}
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
export interface IReview extends Document {
    userId: string;
    stationId: string;
    rating: number;
    comment?: string;
    images?: string[];
    helpful: number;
    createdAt: Date;
    updatedAt: Date;
}
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
export interface StationQuery {
    lat?: number;
    lng?: number;
    radius?: number;
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
export interface JWTPayload {
    userId: string;
    auth0Id: string;
    email: string;
    iat: number;
    exp: number;
}
export interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
        auth0Id: string;
        email: string;
    };
}
//# sourceMappingURL=index.d.ts.map