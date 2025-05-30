"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const userController_1 = require("../controllers/userController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const updateProfileValidation = [
    (0, express_validator_1.body)('name').optional().notEmpty().withMessage('Name cannot be empty'),
    (0, express_validator_1.body)('picture').optional().isURL().withMessage('Picture must be a valid URL'),
    (0, express_validator_1.body)('preferences.notifications').optional().isBoolean().withMessage('Notifications must be boolean'),
    (0, express_validator_1.body)('preferences.units').optional().isIn(['metric', 'imperial']).withMessage('Units must be metric or imperial')
];
const favoriteStationValidation = [
    (0, express_validator_1.body)('stationId').isMongoId().withMessage('Invalid station ID')
];
const auth0UserValidation = [
    (0, express_validator_1.body)('auth0Id').notEmpty().withMessage('Auth0 ID is required'),
    (0, express_validator_1.body)('email').isEmail().withMessage('Valid email is required'),
    (0, express_validator_1.body)('name').optional().notEmpty().withMessage('Name cannot be empty'),
    (0, express_validator_1.body)('picture').optional().isURL().withMessage('Picture must be a valid URL')
];
const preferencesValidation = [
    (0, express_validator_1.body)('notifications').optional().isBoolean().withMessage('Notifications must be boolean'),
    (0, express_validator_1.body)('units').optional().isIn(['metric', 'imperial']).withMessage('Units must be metric or imperial')
];
router.post('/auth0', auth0UserValidation, userController_1.createOrUpdateUserFromAuth0);
router.use(auth_1.authenticateToken);
router.get('/profile', userController_1.getCurrentUser);
router.put('/profile', updateProfileValidation, userController_1.updateUserProfile);
router.delete('/profile', userController_1.deleteUserAccount);
router.get('/dashboard', userController_1.getUserDashboard);
router.put('/preferences', preferencesValidation, userController_1.updateUserPreferences);
router.get('/favorites', userController_1.getFavoriteStations);
router.post('/favorites', favoriteStationValidation, userController_1.addFavoriteStation);
router.delete('/favorites/:stationId', (0, express_validator_1.param)('stationId').isMongoId().withMessage('Invalid station ID'), userController_1.removeFavoriteStation);
exports.default = router;
//# sourceMappingURL=users.js.map