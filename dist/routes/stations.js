"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const stationController_1 = require("../controllers/stationController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const stationValidation = [
    (0, express_validator_1.body)('name').notEmpty().withMessage('Station name is required'),
    (0, express_validator_1.body)('address.street').notEmpty().withMessage('Street address is required'),
    (0, express_validator_1.body)('address.city').notEmpty().withMessage('City is required'),
    (0, express_validator_1.body)('address.state').notEmpty().withMessage('State is required'),
    (0, express_validator_1.body)('address.zipCode').notEmpty().withMessage('Zip code is required'),
    (0, express_validator_1.body)('location.coordinates').isArray({ min: 2, max: 2 }).withMessage('Coordinates must be [longitude, latitude]'),
    (0, express_validator_1.body)('location.coordinates.*').isFloat().withMessage('Coordinates must be valid numbers'),
    (0, express_validator_1.body)('connectorTypes').isArray({ min: 1 }).withMessage('At least one connector type is required'),
    (0, express_validator_1.body)('connectorTypes.*.type').isIn(['CCS', 'CHAdeMO', 'Type2', 'Tesla', 'J1772']).withMessage('Invalid connector type'),
    (0, express_validator_1.body)('connectorTypes.*.power').isFloat({ min: 0 }).withMessage('Power must be a positive number'),
    (0, express_validator_1.body)('connectorTypes.*.count').isInt({ min: 1 }).withMessage('Count must be at least 1'),
    (0, express_validator_1.body)('connectorTypes.*.available').isInt({ min: 0 }).withMessage('Available must be non-negative'),
    (0, express_validator_1.body)('pricing.currency').optional().isLength({ min: 3, max: 3 }).withMessage('Currency must be 3 characters')
];
const updateStationValidation = [
    (0, express_validator_1.body)('name').optional().notEmpty().withMessage('Station name cannot be empty'),
    (0, express_validator_1.body)('address.street').optional().notEmpty().withMessage('Street address cannot be empty'),
    (0, express_validator_1.body)('address.city').optional().notEmpty().withMessage('City cannot be empty'),
    (0, express_validator_1.body)('address.state').optional().notEmpty().withMessage('State cannot be empty'),
    (0, express_validator_1.body)('address.zipCode').optional().notEmpty().withMessage('Zip code cannot be empty'),
    (0, express_validator_1.body)('location.coordinates').optional().isArray({ min: 2, max: 2 }).withMessage('Coordinates must be [longitude, latitude]'),
    (0, express_validator_1.body)('location.coordinates.*').optional().isFloat().withMessage('Coordinates must be valid numbers'),
    (0, express_validator_1.body)('connectorTypes').optional().isArray({ min: 1 }).withMessage('At least one connector type is required'),
    (0, express_validator_1.body)('connectorTypes.*.type').optional().isIn(['CCS', 'CHAdeMO', 'Type2', 'Tesla', 'J1772']).withMessage('Invalid connector type'),
    (0, express_validator_1.body)('connectorTypes.*.power').optional().isFloat({ min: 0 }).withMessage('Power must be a positive number'),
    (0, express_validator_1.body)('connectorTypes.*.count').optional().isInt({ min: 1 }).withMessage('Count must be at least 1'),
    (0, express_validator_1.body)('connectorTypes.*.available').optional().isInt({ min: 0 }).withMessage('Available must be non-negative'),
    (0, express_validator_1.body)('status').optional().isIn(['active', 'inactive', 'maintenance']).withMessage('Invalid status')
];
const availabilityValidation = [
    (0, express_validator_1.body)('connectorType').isIn(['CCS', 'CHAdeMO', 'Type2', 'Tesla', 'J1772']).withMessage('Invalid connector type'),
    (0, express_validator_1.body)('available').isInt({ min: 0 }).withMessage('Available must be non-negative')
];
const queryValidation = [
    (0, express_validator_1.query)('lat').optional().isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
    (0, express_validator_1.query)('lng').optional().isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
    (0, express_validator_1.query)('radius').optional().isFloat({ min: 0 }).withMessage('Radius must be positive'),
    (0, express_validator_1.query)('minPower').optional().isFloat({ min: 0 }).withMessage('Minimum power must be positive'),
    (0, express_validator_1.query)('maxPrice').optional().isFloat({ min: 0 }).withMessage('Maximum price must be positive'),
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).withMessage('Page must be at least 1'),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
];
router.get('/', queryValidation, auth_1.optionalAuth, stationController_1.getStations);
router.get('/nearby', queryValidation, stationController_1.getNearbyStations);
router.get('/:id', (0, express_validator_1.param)('id').isMongoId().withMessage('Invalid station ID'), stationController_1.getStationById);
router.post('/', auth_1.authenticateToken, stationValidation, stationController_1.createStation);
router.put('/:id', auth_1.authenticateToken, (0, express_validator_1.param)('id').isMongoId().withMessage('Invalid station ID'), updateStationValidation, stationController_1.updateStation);
router.delete('/:id', auth_1.authenticateToken, (0, express_validator_1.param)('id').isMongoId().withMessage('Invalid station ID'), stationController_1.deleteStation);
router.patch('/:id/availability', (0, express_validator_1.param)('id').isMongoId().withMessage('Invalid station ID'), availabilityValidation, stationController_1.updateStationAvailability);
exports.default = router;
//# sourceMappingURL=stations.js.map