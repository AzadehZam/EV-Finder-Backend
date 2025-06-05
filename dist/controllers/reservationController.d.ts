import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
export declare const getUserReservations: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getReservationById: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const createReservation: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const updateReservation: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const cancelReservation: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const deleteReservation: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const confirmReservation: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const startChargingSession: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const completeChargingSession: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getStationReservations: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const checkAvailability: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getActiveReservations: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getReservationAnalytics: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getAllReservations: (req: AuthenticatedRequest, res: Response) => Promise<void>;
//# sourceMappingURL=reservationController.d.ts.map