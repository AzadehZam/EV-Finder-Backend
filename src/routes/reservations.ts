import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  getUserReservations,
  getReservationById,
  createReservation,
  updateReservation,
  cancelReservation,
  deleteReservation,
  confirmReservation,
  startChargingSession,
  completeChargingSession,
  getStationReservations,
  checkAvailability,
  getActiveReservations,
  getReservationAnalytics,
  getAllReservations
} from '../controllers/reservationController';
import { authenticateToken } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';
import { Response, NextFunction } from 'express';

const router = Router();

// Validation rules
const reservationValidation = [
  body('stationId').isMongoId().withMessage('Invalid station ID'),
  body('connectorType').isIn(['CCS', 'CHAdeMO', 'Type2', 'Tesla', 'J1772']).withMessage('Invalid connector type'),
  body('startTime').isISO8601().withMessage('Invalid start time format'),
  body('endTime').isISO8601().withMessage('Invalid end time format'),
  body('vehicleInfo.make').optional().notEmpty().withMessage('Vehicle make cannot be empty'),
  body('vehicleInfo.model').optional().notEmpty().withMessage('Vehicle model cannot be empty'),
  body('vehicleInfo.batteryCapacity').optional().isFloat({ min: 0 }).withMessage('Battery capacity must be positive'),
  body('vehicleInfo.currentCharge').optional().isFloat({ min: 0, max: 100 }).withMessage('Current charge must be between 0 and 100'),
  body('notes').optional().isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters')
];

const updateReservationValidation = [
  body('startTime').optional().isISO8601().withMessage('Invalid start time format'),
  body('endTime').optional().isISO8601().withMessage('Invalid end time format'),
  body('vehicleInfo.make').optional().notEmpty().withMessage('Vehicle make cannot be empty'),
  body('vehicleInfo.model').optional().notEmpty().withMessage('Vehicle model cannot be empty'),
  body('vehicleInfo.batteryCapacity').optional().isFloat({ min: 0 }).withMessage('Battery capacity must be positive'),
  body('vehicleInfo.currentCharge').optional().isFloat({ min: 0, max: 100 }).withMessage('Current charge must be between 0 and 100'),
  body('notes').optional().isLength({ max: 500 }).withMessage('Notes cannot be empty')
];

const completeSessionValidation = [
  body('actualCost').optional().isFloat({ min: 0 }).withMessage('Actual cost must be positive'),
  body('paymentInfo.method').optional().isIn(['credit_card', 'paypal', 'apple_pay', 'google_pay']).withMessage('Invalid payment method'),
  body('paymentInfo.transactionId').optional().notEmpty().withMessage('Transaction ID cannot be empty')
];

const queryValidation = [
  query('status').optional().isIn(['pending', 'confirmed', 'active', 'completed', 'cancelled']).withMessage('Invalid status'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be at least 1'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('date').optional().isISO8601().withMessage('Invalid date format')
];

const availabilityValidation = [
  query('stationId').isMongoId().withMessage('Invalid station ID'),
  query('connectorType').isIn(['CCS', 'CHAdeMO', 'Type2', 'Tesla', 'J1772']).withMessage('Invalid connector type'),
  query('startTime').isISO8601().withMessage('Invalid start time format'),
  query('endTime').isISO8601().withMessage('Invalid end time format')
];

const analyticsValidation = [
  query('period').optional().isInt({ min: 1, max: 365 }).withMessage('Period must be between 1 and 365 days')
];

const adminQueryValidation = [
  query('status').optional().isIn(['pending', 'confirmed', 'active', 'completed', 'cancelled']).withMessage('Invalid status'),
  query('stationId').optional().isMongoId().withMessage('Invalid station ID'),
  query('userId').optional().isMongoId().withMessage('Invalid user ID'),
  query('connectorType').optional().isIn(['CCS', 'CHAdeMO', 'Type2', 'Tesla', 'J1772']).withMessage('Invalid connector type'),
  query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date format'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be at least 1'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('sortBy').optional().isIn(['createdAt', 'startTime', 'endTime', 'status', 'estimatedCost']).withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc')
];

// Temporary test middleware to inject a mock user for development
const testAuthMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === 'development') {
    // Inject a test user for development
    req.user = {
      userId: '674ebf9e3e2a123456789abc', // Mock user ID
      auth0Id: 'test-user-123',
      email: 'test@example.com'
    };
    console.log('Development mode: Injecting test user');
  }
  next();
};

// All routes require authentication (commented out for testing)
// router.use(authenticateToken);

// Use test auth middleware in development, real auth in production
if (process.env.NODE_ENV === 'development') {
  router.use(testAuthMiddleware);
} else {
  router.use(authenticateToken);
}

// Utility routes
router.get('/availability', availabilityValidation, checkAvailability);
router.get('/active', getActiveReservations);
router.get('/analytics', analyticsValidation, getReservationAnalytics);

// Admin routes (should be protected with admin middleware in production)
router.get('/admin/all', adminQueryValidation, getAllReservations);

// User reservation routes
router.get('/', queryValidation, getUserReservations);
router.post('/', reservationValidation, createReservation);
router.get('/:id', param('id').isMongoId().withMessage('Invalid reservation ID'), getReservationById);
router.put('/:id', param('id').isMongoId().withMessage('Invalid reservation ID'), updateReservationValidation, updateReservation);
router.delete('/:id', param('id').isMongoId().withMessage('Invalid reservation ID'), cancelReservation);
router.delete('/:id/delete', param('id').isMongoId().withMessage('Invalid reservation ID'), deleteReservation);

// Reservation management routes
router.patch('/:id/confirm', param('id').isMongoId().withMessage('Invalid reservation ID'), confirmReservation);
router.patch('/:id/start', param('id').isMongoId().withMessage('Invalid reservation ID'), startChargingSession);
router.patch('/:id/complete', param('id').isMongoId().withMessage('Invalid reservation ID'), completeSessionValidation, completeChargingSession);

// Station reservation routes (for station operators)
router.get('/station/:stationId', param('stationId').isMongoId().withMessage('Invalid station ID'), queryValidation, getStationReservations);

// Test route for development - bypasses authentication completely
if (process.env.NODE_ENV === 'development') {
  const testRouter = Router();
  
  // Test middleware that injects a mock user
  testRouter.use((req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    req.user = {
      userId: '674ebf9e3e2a123456789abc',
      auth0Id: 'test-user-123',
      email: 'test@example.com'
    };
    next();
  });
  
  // Test reservation creation route
  testRouter.post('/test', reservationValidation, createReservation);
  
  // Mount the test router
  router.use(testRouter);
}

export default router; 