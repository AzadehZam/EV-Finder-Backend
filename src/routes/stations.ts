import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  getStations,
  getStationById,
  createStation,
  updateStation,
  deleteStation,
  updateStationAvailability,
  getNearbyStations
} from '../controllers/stationController';
import { authenticateToken, optionalAuth } from '../middleware/auth';

const router = Router();

// Validation rules
const stationValidation = [
  body('name').notEmpty().withMessage('Station name is required'),
  body('address.street').notEmpty().withMessage('Street address is required'),
  body('address.city').notEmpty().withMessage('City is required'),
  body('address.state').notEmpty().withMessage('State is required'),
  body('address.zipCode').notEmpty().withMessage('Zip code is required'),
  body('location.coordinates').isArray({ min: 2, max: 2 }).withMessage('Coordinates must be [longitude, latitude]'),
  body('location.coordinates.*').isFloat().withMessage('Coordinates must be valid numbers'),
  body('connectorTypes').isArray({ min: 1 }).withMessage('At least one connector type is required'),
  body('connectorTypes.*.type').isIn(['CCS', 'CHAdeMO', 'Type2', 'Tesla', 'J1772']).withMessage('Invalid connector type'),
  body('connectorTypes.*.power').isFloat({ min: 0 }).withMessage('Power must be a positive number'),
  body('connectorTypes.*.count').isInt({ min: 1 }).withMessage('Count must be at least 1'),
  body('connectorTypes.*.available').isInt({ min: 0 }).withMessage('Available must be non-negative'),
  body('pricing.currency').optional().isLength({ min: 3, max: 3 }).withMessage('Currency must be 3 characters')
];

const updateStationValidation = [
  body('name').optional().notEmpty().withMessage('Station name cannot be empty'),
  body('address.street').optional().notEmpty().withMessage('Street address cannot be empty'),
  body('address.city').optional().notEmpty().withMessage('City cannot be empty'),
  body('address.state').optional().notEmpty().withMessage('State cannot be empty'),
  body('address.zipCode').optional().notEmpty().withMessage('Zip code cannot be empty'),
  body('location.coordinates').optional().isArray({ min: 2, max: 2 }).withMessage('Coordinates must be [longitude, latitude]'),
  body('location.coordinates.*').optional().isFloat().withMessage('Coordinates must be valid numbers'),
  body('connectorTypes').optional().isArray({ min: 1 }).withMessage('At least one connector type is required'),
  body('connectorTypes.*.type').optional().isIn(['CCS', 'CHAdeMO', 'Type2', 'Tesla', 'J1772']).withMessage('Invalid connector type'),
  body('connectorTypes.*.power').optional().isFloat({ min: 0 }).withMessage('Power must be a positive number'),
  body('connectorTypes.*.count').optional().isInt({ min: 1 }).withMessage('Count must be at least 1'),
  body('connectorTypes.*.available').optional().isInt({ min: 0 }).withMessage('Available must be non-negative'),
  body('status').optional().isIn(['active', 'inactive', 'maintenance']).withMessage('Invalid status')
];

const availabilityValidation = [
  body('connectorType').isIn(['CCS', 'CHAdeMO', 'Type2', 'Tesla', 'J1772']).withMessage('Invalid connector type'),
  body('available').isInt({ min: 0 }).withMessage('Available must be non-negative')
];

const queryValidation = [
  query('lat').optional().isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  query('lng').optional().isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
  query('radius').optional().isFloat({ min: 0 }).withMessage('Radius must be positive'),
  query('minPower').optional().isFloat({ min: 0 }).withMessage('Minimum power must be positive'),
  query('maxPrice').optional().isFloat({ min: 0 }).withMessage('Maximum price must be positive'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be at least 1'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
];

// Public routes
router.get('/', queryValidation, optionalAuth, getStations);
router.get('/nearby', queryValidation, getNearbyStations);
router.get('/:id', param('id').isMongoId().withMessage('Invalid station ID'), getStationById);

// Protected routes (require authentication)
router.post('/', authenticateToken, stationValidation, createStation);
router.put('/:id', authenticateToken, param('id').isMongoId().withMessage('Invalid station ID'), updateStationValidation, updateStation);
router.delete('/:id', authenticateToken, param('id').isMongoId().withMessage('Invalid station ID'), deleteStation);
router.patch('/:id/availability', param('id').isMongoId().withMessage('Invalid station ID'), availabilityValidation, updateStationAvailability);

export default router; 