import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  getCurrentUser,
  updateUserProfile,
  addFavoriteStation,
  removeFavoriteStation,
  getFavoriteStations,
  getUserDashboard,
  createOrUpdateUserFromAuth0,
  updateUserPreferences,
  deleteUserAccount
} from '../controllers/userController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Validation rules
const updateProfileValidation = [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('picture').optional().isURL().withMessage('Picture must be a valid URL'),
  body('preferences.notifications').optional().isBoolean().withMessage('Notifications must be boolean'),
  body('preferences.units').optional().isIn(['metric', 'imperial']).withMessage('Units must be metric or imperial')
];

const favoriteStationValidation = [
  body('stationId').isMongoId().withMessage('Invalid station ID')
];

const auth0UserValidation = [
  body('auth0Id').notEmpty().withMessage('Auth0 ID is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('picture').optional().isURL().withMessage('Picture must be a valid URL')
];

const preferencesValidation = [
  body('notifications').optional().isBoolean().withMessage('Notifications must be boolean'),
  body('units').optional().isIn(['metric', 'imperial']).withMessage('Units must be metric or imperial')
];

// Public routes (for Auth0 integration)
router.post('/auth0', auth0UserValidation, createOrUpdateUserFromAuth0);

// Protected routes (require authentication)
router.use(authenticateToken);

// User profile routes
router.get('/profile', getCurrentUser);
router.put('/profile', updateProfileValidation, updateUserProfile);
router.delete('/profile', deleteUserAccount);

// Dashboard route
router.get('/dashboard', getUserDashboard);

// Preferences routes
router.put('/preferences', preferencesValidation, updateUserPreferences);

// Favorite stations routes
router.get('/favorites', getFavoriteStations);
router.post('/favorites', favoriteStationValidation, addFavoriteStation);
router.delete('/favorites/:stationId', param('stationId').isMongoId().withMessage('Invalid station ID'), removeFavoriteStation);

export default router; 