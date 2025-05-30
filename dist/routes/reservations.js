"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const reservationController_1 = require("../controllers/reservationController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const reservationValidation = [
    (0, express_validator_1.body)('stationId').isMongoId().withMessage('Invalid station ID'),
    (0, express_validator_1.body)('connectorType').isIn(['CCS', 'CHAdeMO', 'Type2', 'Tesla', 'J1772']).withMessage('Invalid connector type'),
    (0, express_validator_1.body)('startTime').isISO8601().withMessage('Invalid start time format'),
    (0, express_validator_1.body)('endTime').isISO8601().withMessage('Invalid end time format'),
    (0, express_validator_1.body)('vehicleInfo.make').optional().notEmpty().withMessage('Vehicle make cannot be empty'),
    (0, express_validator_1.body)('vehicleInfo.model').optional().notEmpty().withMessage('Vehicle model cannot be empty'),
    (0, express_validator_1.body)('vehicleInfo.batteryCapacity').optional().isFloat({ min: 0 }).withMessage('Battery capacity must be positive'),
    (0, express_validator_1.body)('vehicleInfo.currentCharge').optional().isFloat({ min: 0, max: 100 }).withMessage('Current charge must be between 0 and 100'),
    (0, express_validator_1.body)('notes').optional().isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters')
];
const updateReservationValidation = [
    (0, express_validator_1.body)('startTime').optional().isISO8601().withMessage('Invalid start time format'),
    (0, express_validator_1.body)('endTime').optional().isISO8601().withMessage('Invalid end time format'),
    (0, express_validator_1.body)('vehicleInfo.make').optional().notEmpty().withMessage('Vehicle make cannot be empty'),
    (0, express_validator_1.body)('vehicleInfo.model').optional().notEmpty().withMessage('Vehicle model cannot be empty'),
    (0, express_validator_1.body)('vehicleInfo.batteryCapacity').optional().isFloat({ min: 0 }).withMessage('Battery capacity must be positive'),
    (0, express_validator_1.body)('vehicleInfo.currentCharge').optional().isFloat({ min: 0, max: 100 }).withMessage('Current charge must be between 0 and 100'),
    (0, express_validator_1.body)('notes').optional().isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters')
];
const completeSessionValidation = [
    (0, express_validator_1.body)('actualCost').optional().isFloat({ min: 0 }).withMessage('Actual cost must be positive'),
    (0, express_validator_1.body)('paymentInfo.method').optional().isIn(['credit_card', 'paypal', 'apple_pay', 'google_pay']).withMessage('Invalid payment method'),
    (0, express_validator_1.body)('paymentInfo.transactionId').optional().notEmpty().withMessage('Transaction ID cannot be empty')
];
const queryValidation = [
    (0, express_validator_1.query)('status').optional().isIn(['pending', 'confirmed', 'active', 'completed', 'cancelled']).withMessage('Invalid status'),
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).withMessage('Page must be at least 1'),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    (0, express_validator_1.query)('date').optional().isISO8601().withMessage('Invalid date format')
];
router.use(auth_1.authenticateToken);
router.get('/', queryValidation, reservationController_1.getUserReservations);
router.post('/', reservationValidation, reservationController_1.createReservation);
router.get('/:id', (0, express_validator_1.param)('id').isMongoId().withMessage('Invalid reservation ID'), reservationController_1.getReservationById);
router.put('/:id', (0, express_validator_1.param)('id').isMongoId().withMessage('Invalid reservation ID'), updateReservationValidation, reservationController_1.updateReservation);
router.delete('/:id', (0, express_validator_1.param)('id').isMongoId().withMessage('Invalid reservation ID'), reservationController_1.cancelReservation);
router.patch('/:id/confirm', (0, express_validator_1.param)('id').isMongoId().withMessage('Invalid reservation ID'), reservationController_1.confirmReservation);
router.patch('/:id/start', (0, express_validator_1.param)('id').isMongoId().withMessage('Invalid reservation ID'), reservationController_1.startChargingSession);
router.patch('/:id/complete', (0, express_validator_1.param)('id').isMongoId().withMessage('Invalid reservation ID'), completeSessionValidation, reservationController_1.completeChargingSession);
router.get('/station/:stationId', (0, express_validator_1.param)('stationId').isMongoId().withMessage('Invalid station ID'), queryValidation, reservationController_1.getStationReservations);
exports.default = router;
//# sourceMappingURL=reservations.js.map