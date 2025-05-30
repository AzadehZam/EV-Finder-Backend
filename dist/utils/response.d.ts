import { Response } from 'express';
export declare const sendSuccess: <T>(res: Response, message: string, data?: T, statusCode?: number, pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
}) => void;
export declare const sendError: (res: Response, message: string, statusCode?: number, error?: string) => void;
export declare const sendValidationError: (res: Response, errors: any[]) => void;
export declare const sendNotFound: (res: Response, resource?: string) => void;
export declare const sendUnauthorized: (res: Response, message?: string) => void;
export declare const sendForbidden: (res: Response, message?: string) => void;
export declare const calculatePagination: (page: number, limit: number, total: number) => {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
};
//# sourceMappingURL=response.d.ts.map