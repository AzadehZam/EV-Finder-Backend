import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types';
export declare const getStations: (req: Request, res: Response) => Promise<void>;
export declare const getStationById: (req: Request, res: Response) => Promise<void>;
export declare const createStation: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const updateStation: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const deleteStation: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const updateStationAvailability: (req: Request, res: Response) => Promise<void>;
export declare const getNearbyStations: (req: Request, res: Response) => Promise<void>;
export declare const getAllStations: (req: Request, res: Response) => Promise<void>;
export declare const searchNearbyStations: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=stationController.d.ts.map