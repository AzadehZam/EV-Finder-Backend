import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
export declare const getCurrentUser: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const updateUserProfile: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const addFavoriteStation: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const removeFavoriteStation: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getFavoriteStations: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getUserDashboard: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const createOrUpdateUserFromAuth0: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const updateUserPreferences: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const deleteUserAccount: (req: AuthenticatedRequest, res: Response) => Promise<void>;
//# sourceMappingURL=userController.d.ts.map