import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  getUserReservations,
  getReservationById,
  createReservation,
  updateReservation,
  cancelReservation,
  confirmReservation,
  startChargingSession,
  completeChargingSession,
  getStationReservations
} from '../controllers/reservationController';
import { authenticateToken } from '../middleware/auth';

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
  body('notes').optional().isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters')
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

// All routes require authentication
router.use(authenticateToken);

// User reservation routes
router.get('/', queryValidation, getUserReservations);
router.post('/', reservationValidation, createReservation);
router.get('/:id', param('id').isMongoId().withMessage('Invalid reservation ID'), getReservationById);
router.put('/:id', param('id').isMongoId().withMessage('Invalid reservation ID'), updateReservationValidation, updateReservation);
router.delete('/:id', param('id').isMongoId().withMessage('Invalid reservation ID'), cancelReservation);

// Reservation management routes
router.patch('/:id/confirm', param('id').isMongoId().withMessage('Invalid reservation ID'), confirmReservation);
router.patch('/:id/start', param('id').isMongoId().withMessage('Invalid reservation ID'), startChargingSession);
router.patch('/:id/complete', param('id').isMongoId().withMessage('Invalid reservation ID'), completeSessionValidation, completeChargingSession);

// Station reservation routes (for station operators)
router.get('/station/:stationId', param('stationId').isMongoId().withMessage('Invalid station ID'), queryValidation, getStationReservations);

export default router; 