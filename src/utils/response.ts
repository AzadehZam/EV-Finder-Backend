import { Response } from 'express';
import { ApiResponse } from '../types';

export const sendSuccess = <T>(
  res: Response,
  message: string,
  data?: T,
  statusCode: number = 200,
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  }
): void => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
    pagination
  };
  res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  message: string,
  statusCode: number = 500,
  error?: string
): void => {
  const response: ApiResponse = {
    success: false,
    message,
    error
  };
  res.status(statusCode).json(response);
};

export const sendValidationError = (
  res: Response,
  errors: any[]
): void => {
  const response: ApiResponse = {
    success: false,
    message: 'Validation failed',
    error: errors.map(err => err.msg).join(', ')
  };
  res.status(400).json(response);
};

export const sendNotFound = (
  res: Response,
  resource: string = 'Resource'
): void => {
  sendError(res, `${resource} not found`, 404);
};

export const sendUnauthorized = (
  res: Response,
  message: string = 'Unauthorized'
): void => {
  sendError(res, message, 401);
};

export const sendForbidden = (
  res: Response,
  message: string = 'Forbidden'
): void => {
  sendError(res, message, 403);
};

export const calculatePagination = (
  page: number,
  limit: number,
  total: number
) => {
  const pages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    pages,
    hasNext: page < pages,
    hasPrev: page > 1
  };
}; 