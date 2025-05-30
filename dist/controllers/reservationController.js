"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllReservations = exports.getReservationAnalytics = exports.getActiveReservations = exports.checkAvailability = exports.getStationReservations = exports.completeChargingSession = exports.startChargingSession = exports.confirmReservation = exports.cancelReservation = exports.updateReservation = exports.createReservation = exports.getReservationById = exports.getUserReservations = void 0;
const express_validator_1 = require("express-validator");
const Reservation_1 = __importDefault(require("../models/Reservation"));
const ChargingStation_1 = __importDefault(require("../models/ChargingStation"));
const response_1 = require("../utils/response");
const getUserReservations = async (req, res) => {
    try {
        const { userId } = req.user;
        const { status, page = 1, limit = 10 } = req.query;
        const query = { userId };
        if (status) {
            query.status = status;
        }
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const [reservations, total] = await Promise.all([
            Reservation_1.default.find(query)
                .populate('stationId', 'name address location connectorTypes')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum),
            Reservation_1.default.countDocuments(query)
        ]);
        const pagination = (0, response_1.calculatePagination)(pageNum, limitNum, total);
        (0, response_1.sendSuccess)(res, 'Reservations retrieved successfully', reservations, 200, pagination);
    }
    catch (error) {
        console.error('Error fetching user reservations:', error);
        (0, response_1.sendError)(res, 'Failed to fetch reservations');
    }
};
exports.getUserReservations = getUserReservations;
const getReservationById = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.user;
        const reservation = await Reservation_1.default.findOne({ _id: id, userId })
            .populate('stationId', 'name address location connectorTypes pricing operatingHours');
        if (!reservation) {
            (0, response_1.sendNotFound)(res, 'Reservation');
            return;
        }
        (0, response_1.sendSuccess)(res, 'Reservation retrieved successfully', reservation);
    }
    catch (error) {
        console.error('Error fetching reservation:', error);
        (0, response_1.sendError)(res, 'Failed to fetch reservation');
    }
};
exports.getReservationById = getReservationById;
const createReservation = async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            (0, response_1.sendValidationError)(res, errors.array());
            return;
        }
        const { userId } = req.user;
        const { stationId, connectorType, startTime, endTime, vehicleInfo, notes } = req.body;
        const station = await ChargingStation_1.default.findById(stationId);
        if (!station || station.status !== 'active') {
            (0, response_1.sendError)(res, 'Charging station not available', 404);
            return;
        }
        const connector = station.connectorTypes.find(c => c.type === connectorType);
        if (!connector) {
            (0, response_1.sendError)(res, 'Connector type not available at this station', 400);
            return;
        }
        const overlappingReservations = await Reservation_1.default.findOverlapping(stationId, connectorType, new Date(startTime), new Date(endTime));
        if (overlappingReservations.length >= connector.count) {
            (0, response_1.sendError)(res, 'No available connectors for the selected time slot', 409);
            return;
        }
        const durationHours = (new Date(endTime).getTime() - new Date(startTime).getTime()) / (1000 * 60 * 60);
        let estimatedCost = 0;
        if (station.pricing.perKwh && vehicleInfo?.batteryCapacity) {
            const estimatedKwh = vehicleInfo.batteryCapacity * 0.8;
            estimatedCost = estimatedKwh * station.pricing.perKwh;
        }
        else if (station.pricing.perMinute) {
            estimatedCost = (durationHours * 60) * station.pricing.perMinute;
        }
        if (station.pricing.sessionFee) {
            estimatedCost += station.pricing.sessionFee;
        }
        const reservation = new Reservation_1.default({
            userId,
            stationId,
            connectorType,
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            estimatedCost,
            vehicleInfo,
            notes,
            status: 'pending'
        });
        await reservation.save();
        await reservation.populate('stationId', 'name address location');
        (0, response_1.sendSuccess)(res, 'Reservation created successfully', reservation, 201);
    }
    catch (error) {
        console.error('Error creating reservation:', error);
        (0, response_1.sendError)(res, 'Failed to create reservation');
    }
};
exports.createReservation = createReservation;
const updateReservation = async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            (0, response_1.sendValidationError)(res, errors.array());
            return;
        }
        const { id } = req.params;
        const { userId } = req.user;
        const updateData = req.body;
        const reservation = await Reservation_1.default.findOne({ _id: id, userId });
        if (!reservation) {
            (0, response_1.sendNotFound)(res, 'Reservation');
            return;
        }
        if (reservation.status === 'completed' || reservation.status === 'cancelled') {
            (0, response_1.sendError)(res, 'Cannot update completed or cancelled reservation', 400);
            return;
        }
        if (updateData.startTime || updateData.endTime) {
            const newStartTime = updateData.startTime ? new Date(updateData.startTime) : reservation.startTime;
            const newEndTime = updateData.endTime ? new Date(updateData.endTime) : reservation.endTime;
            const overlappingReservations = await Reservation_1.default.findOverlapping(reservation.stationId, reservation.connectorType, newStartTime, newEndTime, reservation._id);
            const station = await ChargingStation_1.default.findById(reservation.stationId);
            const connector = station?.connectorTypes.find(c => c.type === reservation.connectorType);
            if (overlappingReservations.length >= (connector?.count || 0)) {
                (0, response_1.sendError)(res, 'No available connectors for the updated time slot', 409);
                return;
            }
            if (station && (updateData.startTime || updateData.endTime)) {
                const durationHours = (newEndTime.getTime() - newStartTime.getTime()) / (1000 * 60 * 60);
                let estimatedCost = 0;
                if (station.pricing.perKwh && reservation.vehicleInfo?.batteryCapacity) {
                    const estimatedKwh = reservation.vehicleInfo.batteryCapacity * 0.8;
                    estimatedCost = estimatedKwh * station.pricing.perKwh;
                }
                else if (station.pricing.perMinute) {
                    estimatedCost = (durationHours * 60) * station.pricing.perMinute;
                }
                if (station.pricing.sessionFee) {
                    estimatedCost += station.pricing.sessionFee;
                }
                updateData.estimatedCost = estimatedCost;
            }
        }
        const updatedReservation = await Reservation_1.default.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).populate('stationId', 'name address location');
        (0, response_1.sendSuccess)(res, 'Reservation updated successfully', updatedReservation);
    }
    catch (error) {
        console.error('Error updating reservation:', error);
        (0, response_1.sendError)(res, 'Failed to update reservation');
    }
};
exports.updateReservation = updateReservation;
const cancelReservation = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.user;
        const reservation = await Reservation_1.default.findOne({ _id: id, userId });
        if (!reservation) {
            (0, response_1.sendNotFound)(res, 'Reservation');
            return;
        }
        if (reservation.status === 'completed' || reservation.status === 'cancelled') {
            (0, response_1.sendError)(res, 'Reservation is already completed or cancelled', 400);
            return;
        }
        reservation.status = 'cancelled';
        await reservation.save();
        (0, response_1.sendSuccess)(res, 'Reservation cancelled successfully', reservation);
    }
    catch (error) {
        console.error('Error cancelling reservation:', error);
        (0, response_1.sendError)(res, 'Failed to cancel reservation');
    }
};
exports.cancelReservation = cancelReservation;
const confirmReservation = async (req, res) => {
    try {
        const { id } = req.params;
        const reservation = await Reservation_1.default.findById(id);
        if (!reservation) {
            (0, response_1.sendNotFound)(res, 'Reservation');
            return;
        }
        if (reservation.status !== 'pending') {
            (0, response_1.sendError)(res, 'Only pending reservations can be confirmed', 400);
            return;
        }
        reservation.status = 'confirmed';
        await reservation.save();
        await reservation.populate('stationId', 'name address');
        (0, response_1.sendSuccess)(res, 'Reservation confirmed successfully', reservation);
    }
    catch (error) {
        console.error('Error confirming reservation:', error);
        (0, response_1.sendError)(res, 'Failed to confirm reservation');
    }
};
exports.confirmReservation = confirmReservation;
const startChargingSession = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.user;
        const reservation = await Reservation_1.default.findOne({ _id: id, userId });
        if (!reservation) {
            (0, response_1.sendNotFound)(res, 'Reservation');
            return;
        }
        if (reservation.status !== 'confirmed') {
            (0, response_1.sendError)(res, 'Only confirmed reservations can be activated', 400);
            return;
        }
        const now = new Date();
        if (now < reservation.startTime) {
            (0, response_1.sendError)(res, 'Reservation start time has not arrived yet', 400);
            return;
        }
        if (now > reservation.endTime) {
            (0, response_1.sendError)(res, 'Reservation has expired', 400);
            return;
        }
        reservation.status = 'active';
        await reservation.save();
        (0, response_1.sendSuccess)(res, 'Charging session started successfully', reservation);
    }
    catch (error) {
        console.error('Error starting charging session:', error);
        (0, response_1.sendError)(res, 'Failed to start charging session');
    }
};
exports.startChargingSession = startChargingSession;
const completeChargingSession = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.user;
        const { actualCost, paymentInfo } = req.body;
        const reservation = await Reservation_1.default.findOne({ _id: id, userId });
        if (!reservation) {
            (0, response_1.sendNotFound)(res, 'Reservation');
            return;
        }
        if (reservation.status !== 'active') {
            (0, response_1.sendError)(res, 'Only active reservations can be completed', 400);
            return;
        }
        reservation.status = 'completed';
        if (actualCost !== undefined) {
            reservation.estimatedCost = actualCost;
        }
        if (paymentInfo) {
            reservation.paymentInfo = paymentInfo;
        }
        await reservation.save();
        (0, response_1.sendSuccess)(res, 'Charging session completed successfully', reservation);
    }
    catch (error) {
        console.error('Error completing charging session:', error);
        (0, response_1.sendError)(res, 'Failed to complete charging session');
    }
};
exports.completeChargingSession = completeChargingSession;
const getStationReservations = async (req, res) => {
    try {
        const { stationId } = req.params;
        const { status, date, page = 1, limit = 20 } = req.query;
        const query = { stationId };
        if (status) {
            query.status = status;
        }
        if (date) {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);
            query.$or = [
                { startTime: { $gte: startOfDay, $lte: endOfDay } },
                { endTime: { $gte: startOfDay, $lte: endOfDay } },
                { startTime: { $lte: startOfDay }, endTime: { $gte: endOfDay } }
            ];
        }
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const [reservations, total] = await Promise.all([
            Reservation_1.default.find(query)
                .populate('userId', 'name email')
                .sort({ startTime: 1 })
                .skip(skip)
                .limit(limitNum),
            Reservation_1.default.countDocuments(query)
        ]);
        const pagination = (0, response_1.calculatePagination)(pageNum, limitNum, total);
        (0, response_1.sendSuccess)(res, 'Station reservations retrieved successfully', reservations, 200, pagination);
    }
    catch (error) {
        console.error('Error fetching station reservations:', error);
        (0, response_1.sendError)(res, 'Failed to fetch station reservations');
    }
};
exports.getStationReservations = getStationReservations;
const checkAvailability = async (req, res) => {
    try {
        const { stationId, connectorType, startTime, endTime } = req.query;
        if (!stationId || !connectorType || !startTime || !endTime) {
            (0, response_1.sendError)(res, 'Missing required parameters: stationId, connectorType, startTime, endTime', 400);
            return;
        }
        const station = await ChargingStation_1.default.findById(stationId);
        if (!station || station.status !== 'active') {
            (0, response_1.sendError)(res, 'Charging station not available', 404);
            return;
        }
        const connector = station.connectorTypes.find(c => c.type === connectorType);
        if (!connector) {
            (0, response_1.sendError)(res, 'Connector type not available at this station', 400);
            return;
        }
        const overlappingReservations = await Reservation_1.default.findOverlapping(stationId, connectorType, new Date(startTime), new Date(endTime));
        const availableConnectors = connector.count - overlappingReservations.length;
        const isAvailable = availableConnectors > 0;
        const availabilityData = {
            isAvailable,
            totalConnectors: connector.count,
            availableConnectors,
            reservedConnectors: overlappingReservations.length,
            conflictingReservations: overlappingReservations.map((r) => ({
                id: r._id,
                startTime: r.startTime,
                endTime: r.endTime,
                status: r.status
            }))
        };
        (0, response_1.sendSuccess)(res, 'Availability checked successfully', availabilityData);
    }
    catch (error) {
        console.error('Error checking availability:', error);
        (0, response_1.sendError)(res, 'Failed to check availability');
    }
};
exports.checkAvailability = checkAvailability;
const getActiveReservations = async (req, res) => {
    try {
        const { userId } = req.user;
        const now = new Date();
        const [activeReservations, upcomingReservations] = await Promise.all([
            Reservation_1.default.find({
                userId,
                status: 'active',
                startTime: { $lte: now },
                endTime: { $gte: now }
            }).populate('stationId', 'name address location connectorTypes'),
            Reservation_1.default.find({
                userId,
                status: { $in: ['confirmed', 'pending'] },
                startTime: { $gt: now }
            }).populate('stationId', 'name address location connectorTypes')
                .sort({ startTime: 1 })
                .limit(5)
        ]);
        const responseData = {
            active: activeReservations,
            upcoming: upcomingReservations,
            counts: {
                active: activeReservations.length,
                upcoming: upcomingReservations.length
            }
        };
        (0, response_1.sendSuccess)(res, 'Active reservations retrieved successfully', responseData);
    }
    catch (error) {
        console.error('Error fetching active reservations:', error);
        (0, response_1.sendError)(res, 'Failed to fetch active reservations');
    }
};
exports.getActiveReservations = getActiveReservations;
const getReservationAnalytics = async (req, res) => {
    try {
        const { userId } = req.user;
        const { period = '30' } = req.query;
        const periodDays = parseInt(period);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - periodDays);
        const [totalReservations, completedReservations, cancelledReservations, totalSpent, reservationsByStatus, reservationsByConnectorType, recentActivity] = await Promise.all([
            Reservation_1.default.countDocuments({
                userId,
                createdAt: { $gte: startDate }
            }),
            Reservation_1.default.countDocuments({
                userId,
                status: 'completed',
                createdAt: { $gte: startDate }
            }),
            Reservation_1.default.countDocuments({
                userId,
                status: 'cancelled',
                createdAt: { $gte: startDate }
            }),
            Reservation_1.default.aggregate([
                {
                    $match: {
                        userId: userId,
                        status: 'completed',
                        createdAt: { $gte: startDate }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$estimatedCost' }
                    }
                }
            ]),
            Reservation_1.default.aggregate([
                {
                    $match: {
                        userId: userId,
                        createdAt: { $gte: startDate }
                    }
                },
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 }
                    }
                }
            ]),
            Reservation_1.default.aggregate([
                {
                    $match: {
                        userId: userId,
                        createdAt: { $gte: startDate }
                    }
                },
                {
                    $group: {
                        _id: '$connectorType',
                        count: { $sum: 1 }
                    }
                }
            ]),
            Reservation_1.default.find({
                userId,
                createdAt: { $gte: startDate }
            })
                .populate('stationId', 'name address')
                .sort({ createdAt: -1 })
                .limit(10)
        ]);
        const analytics = {
            period: `${periodDays} days`,
            summary: {
                totalReservations,
                completedReservations,
                cancelledReservations,
                completionRate: totalReservations > 0 ? (completedReservations / totalReservations * 100).toFixed(1) : 0,
                totalSpent: totalSpent[0]?.total || 0,
                averageSpent: completedReservations > 0 ? ((totalSpent[0]?.total || 0) / completedReservations).toFixed(2) : 0
            },
            breakdown: {
                byStatus: reservationsByStatus.reduce((acc, item) => {
                    acc[item._id] = item.count;
                    return acc;
                }, {}),
                byConnectorType: reservationsByConnectorType.reduce((acc, item) => {
                    acc[item._id] = item.count;
                    return acc;
                }, {})
            },
            recentActivity
        };
        (0, response_1.sendSuccess)(res, 'Reservation analytics retrieved successfully', analytics);
    }
    catch (error) {
        console.error('Error fetching reservation analytics:', error);
        (0, response_1.sendError)(res, 'Failed to fetch reservation analytics');
    }
};
exports.getReservationAnalytics = getReservationAnalytics;
const getAllReservations = async (req, res) => {
    try {
        const { status, stationId, userId: filterUserId, connectorType, startDate, endDate, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
        const query = {};
        if (status)
            query.status = status;
        if (stationId)
            query.stationId = stationId;
        if (filterUserId)
            query.userId = filterUserId;
        if (connectorType)
            query.connectorType = connectorType;
        if (startDate || endDate) {
            query.startTime = {};
            if (startDate)
                query.startTime.$gte = new Date(startDate);
            if (endDate)
                query.startTime.$lte = new Date(endDate);
        }
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
        const [reservations, total] = await Promise.all([
            Reservation_1.default.find(query)
                .populate('userId', 'name email')
                .populate('stationId', 'name address location')
                .sort(sort)
                .skip(skip)
                .limit(limitNum),
            Reservation_1.default.countDocuments(query)
        ]);
        const pagination = (0, response_1.calculatePagination)(pageNum, limitNum, total);
        (0, response_1.sendSuccess)(res, 'All reservations retrieved successfully', reservations, 200, pagination);
    }
    catch (error) {
        console.error('Error fetching all reservations:', error);
        (0, response_1.sendError)(res, 'Failed to fetch reservations');
    }
};
exports.getAllReservations = getAllReservations;
//# sourceMappingURL=reservationController.js.map