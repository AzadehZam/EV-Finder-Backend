import { Response } from 'express';
import { validationResult } from 'express-validator';
import Reservation from '../models/Reservation';
import ChargingStation from '../models/ChargingStation';
import { AuthenticatedRequest } from '../types';
import { sendSuccess, sendError, sendNotFound, sendValidationError, calculatePagination } from '../utils/response';
import mongoose from 'mongoose';

// Get user's reservations
export const getUserReservations = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.user!;
    const { status, page = 1, limit = 10 } = req.query as any;

    const query: any = { userId };
    if (status) {
      query.status = status;
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [reservations, total] = await Promise.all([
      Reservation.find(query)
        .populate('stationId', 'name address location connectorTypes')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Reservation.countDocuments(query)
    ]);

    const pagination = calculatePagination(pageNum, limitNum, total);

    sendSuccess(res, 'Reservations retrieved successfully', reservations, 200, pagination);
  } catch (error) {
    console.error('Error fetching user reservations:', error);
    sendError(res, 'Failed to fetch reservations');
  }
};

// Get reservation by ID
export const getReservationById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { userId } = req.user!;

    const reservation = await Reservation.findOne({ _id: id, userId })
      .populate('stationId', 'name address location connectorTypes pricing operatingHours');

    if (!reservation) {
      sendNotFound(res, 'Reservation');
      return;
    }

    sendSuccess(res, 'Reservation retrieved successfully', reservation);
  } catch (error) {
    console.error('Error fetching reservation:', error);
    sendError(res, 'Failed to fetch reservation');
  }
};

// Create new reservation
export const createReservation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      sendValidationError(res, errors.array());
      return;
    }

    const { userId } = req.user!;
    const {
      stationId,
      connectorType,
      startTime,
      endTime,
      vehicleInfo,
      notes
    } = req.body;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(stationId)) {
      sendError(res, 'Invalid station ID format. Please provide a valid station ID.', 400);
      return;
    }

    // Validate required fields
    if (!stationId || !connectorType || !startTime || !endTime) {
      sendError(res, 'Missing required fields: stationId, connectorType, startTime, endTime', 400);
      return;
    }

    // Validate station exists and is active
    const station = await ChargingStation.findById(stationId);
    if (!station || station.status !== 'active') {
      sendError(res, 'Charging station not available', 404);
      return;
    }

    // Validate connector type exists at station
    const connector = station.connectorTypes.find(c => c.type === connectorType);
    if (!connector) {
      sendError(res, 'Connector type not available at this station', 400);
      return;
    }

    // Check for overlapping reservations
    const overlappingReservations = await (Reservation as any).findOverlapping(
      stationId,
      connectorType,
      new Date(startTime),
      new Date(endTime)
    );

    if (overlappingReservations.length >= connector.count) {
      sendError(res, 'No available connectors for the selected time slot', 409);
      return;
    }

    // Calculate estimated cost
    const durationHours = (new Date(endTime).getTime() - new Date(startTime).getTime()) / (1000 * 60 * 60);
    let estimatedCost = 0;

    if (station.pricing.perKwh && vehicleInfo?.batteryCapacity) {
      // Estimate based on battery capacity and charging efficiency
      const estimatedKwh = vehicleInfo.batteryCapacity * 0.8; // Assume 80% charge
      estimatedCost = estimatedKwh * station.pricing.perKwh;
    } else if (station.pricing.perMinute) {
      estimatedCost = (durationHours * 60) * station.pricing.perMinute;
    }

    if (station.pricing.sessionFee) {
      estimatedCost += station.pricing.sessionFee;
    }

    // Create reservation
    const reservation = new Reservation({
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

    // Populate station info for response
    await reservation.populate('stationId', 'name address location');

    sendSuccess(res, 'Reservation created successfully', reservation, 201);
  } catch (error) {
    console.error('Error creating reservation:', error);
    sendError(res, 'Failed to create reservation');
  }
};

// Update reservation
export const updateReservation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      sendValidationError(res, errors.array());
      return;
    }

    const { id } = req.params as any;
    const { userId } = req.user!;
    const updateData = req.body as any;

    // Find reservation
    const reservation = await Reservation.findOne({ _id: id, userId });
    if (!reservation) {
      sendNotFound(res, 'Reservation');
      return;
    }

    // Check if reservation can be updated
    if (reservation.status === 'completed' || reservation.status === 'cancelled') {
      sendError(res, 'Cannot update completed or cancelled reservation', 400);
      return;
    }

    // If updating time, check for conflicts
    if (updateData.startTime || updateData.endTime) {
      const newStartTime = updateData.startTime ? new Date(updateData.startTime) : reservation.startTime;
      const newEndTime = updateData.endTime ? new Date(updateData.endTime) : reservation.endTime;

      const overlappingReservations = await (Reservation as any).findOverlapping(
        reservation.stationId,
        reservation.connectorType,
        newStartTime,
        newEndTime,
        reservation._id
      );

      const station = await ChargingStation.findById(reservation.stationId);
      const connector = station?.connectorTypes.find(c => c.type === reservation.connectorType);

      if (overlappingReservations.length >= (connector?.count || 0)) {
        sendError(res, 'No available connectors for the updated time slot', 409);
        return;
      }

      // Recalculate estimated cost if time changed
      if (station && (updateData.startTime || updateData.endTime)) {
        const durationHours = (newEndTime.getTime() - newStartTime.getTime()) / (1000 * 60 * 60);
        let estimatedCost = 0;

        if (station.pricing.perKwh && reservation.vehicleInfo?.batteryCapacity) {
          const estimatedKwh = reservation.vehicleInfo.batteryCapacity * 0.8;
          estimatedCost = estimatedKwh * station.pricing.perKwh;
        } else if (station.pricing.perMinute) {
          estimatedCost = (durationHours * 60) * station.pricing.perMinute;
        }

        if (station.pricing.sessionFee) {
          estimatedCost += station.pricing.sessionFee;
        }

        updateData.estimatedCost = estimatedCost;
      }
    }

    // Update reservation
    const updatedReservation = await Reservation.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('stationId', 'name address location');

    sendSuccess(res, 'Reservation updated successfully', updatedReservation);
  } catch (error) {
    console.error('Error updating reservation:', error);
    sendError(res, 'Failed to update reservation');
  }
};

// Cancel reservation
export const cancelReservation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params as any;
    const { userId } = req.user!;

    const reservation = await Reservation.findOne({ _id: id, userId });
    if (!reservation) {
      sendNotFound(res, 'Reservation');
      return;
    }

    if (reservation.status === 'completed' || reservation.status === 'cancelled') {
      sendError(res, 'Reservation is already completed or cancelled', 400);
      return;
    }

    reservation.status = 'cancelled';
    await reservation.save();

    sendSuccess(res, 'Reservation cancelled successfully', reservation);
  } catch (error) {
    console.error('Error cancelling reservation:', error);
    sendError(res, 'Failed to cancel reservation');
  }
};

// Permanently delete reservation (only for completed or cancelled reservations)
export const deleteReservation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params as any;
    const { userId } = req.user!;

    const reservation = await Reservation.findOne({ _id: id, userId });
    if (!reservation) {
      sendNotFound(res, 'Reservation');
      return;
    }

    // Only allow deletion of completed or cancelled reservations
    if (!['completed', 'cancelled'].includes(reservation.status)) {
      sendError(res, 'Only completed or cancelled reservations can be deleted', 400);
      return;
    }

    // Permanently delete the reservation from database
    await Reservation.findByIdAndDelete(id);

    sendSuccess(res, 'Reservation deleted successfully', { deletedId: id });
  } catch (error) {
    console.error('Error deleting reservation:', error);
    sendError(res, 'Failed to delete reservation');
  }
};

// Confirm reservation (admin or system)
export const confirmReservation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params as any;

    const reservation = await Reservation.findById(id);
    if (!reservation) {
      sendNotFound(res, 'Reservation');
      return;
    }

    if (reservation.status !== 'pending') {
      sendError(res, 'Only pending reservations can be confirmed', 400);
      return;
    }

    reservation.status = 'confirmed';
    await reservation.save();

    await reservation.populate('stationId', 'name address');

    sendSuccess(res, 'Reservation confirmed successfully', reservation);
  } catch (error) {
    console.error('Error confirming reservation:', error);
    sendError(res, 'Failed to confirm reservation');
  }
};

// Start charging session (activate reservation)
export const startChargingSession = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params as any;
    const { userId } = req.user!;

    const reservation = await Reservation.findOne({ _id: id, userId });
    if (!reservation) {
      sendNotFound(res, 'Reservation');
      return;
    }

    if (reservation.status !== 'confirmed') {
      sendError(res, 'Only confirmed reservations can be activated', 400);
      return;
    }

    const now = new Date();
    if (now < reservation.startTime) {
      sendError(res, 'Reservation start time has not arrived yet', 400);
      return;
    }

    if (now > reservation.endTime) {
      sendError(res, 'Reservation has expired', 400);
      return;
    }

    reservation.status = 'active';
    await reservation.save();

    sendSuccess(res, 'Charging session started successfully', reservation);
  } catch (error) {
    console.error('Error starting charging session:', error);
    sendError(res, 'Failed to start charging session');
  }
};

// Complete charging session
export const completeChargingSession = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params as any;
    const { userId } = req.user!;
    const { actualCost, paymentInfo } = req.body as any;

    const reservation = await Reservation.findOne({ _id: id, userId });
    if (!reservation) {
      sendNotFound(res, 'Reservation');
      return;
    }

    if (reservation.status !== 'active') {
      sendError(res, 'Only active reservations can be completed', 400);
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

    sendSuccess(res, 'Charging session completed successfully', reservation);
  } catch (error) {
    console.error('Error completing charging session:', error);
    sendError(res, 'Failed to complete charging session');
  }
};

// Get station reservations (for station operators)
export const getStationReservations = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { stationId } = req.params as any;
    const { status, date, page = 1, limit = 20 } = req.query as any;

    const query: any = { stationId };
    
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
      Reservation.find(query)
        .populate('userId', 'name email')
        .sort({ startTime: 1 })
        .skip(skip)
        .limit(limitNum),
      Reservation.countDocuments(query)
    ]);

    const pagination = calculatePagination(pageNum, limitNum, total);

    sendSuccess(res, 'Station reservations retrieved successfully', reservations, 200, pagination);
  } catch (error) {
    console.error('Error fetching station reservations:', error);
    sendError(res, 'Failed to fetch station reservations');
  }
};

// Check availability for a time slot
export const checkAvailability = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { stationId, connectorType, startTime, endTime } = req.query as any;

    if (!stationId || !connectorType || !startTime || !endTime) {
      sendError(res, 'Missing required parameters: stationId, connectorType, startTime, endTime', 400);
      return;
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(stationId)) {
      sendError(res, 'Invalid station ID format. Please provide a valid station ID.', 400);
      return;
    }

    // Validate station exists
    const station = await ChargingStation.findById(stationId);
    if (!station || station.status !== 'active') {
      sendError(res, 'Charging station not found or not available', 404);
      return;
    }

    // Validate connector type
    const connector = station.connectorTypes.find(c => c.type === connectorType);
    if (!connector) {
      sendError(res, 'Connector type not available at this station', 400);
      return;
    }

    // Check for overlapping reservations
    const overlappingReservations = await (Reservation as any).findOverlapping(
      stationId,
      connectorType,
      new Date(startTime),
      new Date(endTime)
    );

    const availableConnectors = connector.count - overlappingReservations.length;
    const isAvailable = availableConnectors > 0;

    const availabilityData = {
      isAvailable,
      totalConnectors: connector.count,
      availableConnectors,
      reservedConnectors: overlappingReservations.length,
      conflictingReservations: overlappingReservations.map((r: any) => ({
        id: r._id,
        startTime: r.startTime,
        endTime: r.endTime,
        status: r.status
      }))
    };

    sendSuccess(res, 'Availability checked successfully', availabilityData);
  } catch (error) {
    console.error('Error checking availability:', error);
    
    // Handle specific MongoDB cast errors
    if (error instanceof mongoose.Error.CastError) {
      sendError(res, 'Invalid station ID format. Please provide a valid station ID.', 400);
      return;
    }
    
    sendError(res, 'Failed to check availability');
  }
};

// Get user's active and upcoming reservations
export const getActiveReservations = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.user!;
    const now = new Date();

    const [activeReservations, upcomingReservations] = await Promise.all([
      Reservation.find({
        userId,
        status: 'active',
        startTime: { $lte: now },
        endTime: { $gte: now }
      }).populate('stationId', 'name address location connectorTypes'),
      
      Reservation.find({
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

    sendSuccess(res, 'Active reservations retrieved successfully', responseData);
  } catch (error) {
    console.error('Error fetching active reservations:', error);
    sendError(res, 'Failed to fetch active reservations');
  }
};

// Get reservation analytics for user
export const getReservationAnalytics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.user!;
    const { period = '30' } = req.query as any; // days

    const periodDays = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    const [
      totalReservations,
      completedReservations,
      cancelledReservations,
      totalSpent,
      reservationsByStatus,
      reservationsByConnectorType,
      recentActivity
    ] = await Promise.all([
      // Total reservations in period
      Reservation.countDocuments({
        userId,
        createdAt: { $gte: startDate }
      }),
      
      // Completed reservations
      Reservation.countDocuments({
        userId,
        status: 'completed',
        createdAt: { $gte: startDate }
      }),
      
      // Cancelled reservations
      Reservation.countDocuments({
        userId,
        status: 'cancelled',
        createdAt: { $gte: startDate }
      }),
      
      // Total amount spent
      Reservation.aggregate([
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
      
      // Reservations by status
      Reservation.aggregate([
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
      
      // Reservations by connector type
      Reservation.aggregate([
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
      
      // Recent activity
      Reservation.find({
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

    sendSuccess(res, 'Reservation analytics retrieved successfully', analytics);
  } catch (error) {
    console.error('Error fetching reservation analytics:', error);
    sendError(res, 'Failed to fetch reservation analytics');
  }
};

// Get all reservations with advanced filtering (admin function)
export const getAllReservations = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      status,
      stationId,
      userId: filterUserId,
      connectorType,
      startDate,
      endDate,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query as any;

    const query: any = {};

    // Apply filters
    if (status) query.status = status;
    if (stationId) query.stationId = stationId;
    if (filterUserId) query.userId = filterUserId;
    if (connectorType) query.connectorType = connectorType;

    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) query.startTime.$gte = new Date(startDate);
      if (endDate) query.startTime.$lte = new Date(endDate);
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [reservations, total] = await Promise.all([
      Reservation.find(query)
        .populate('userId', 'name email')
        .populate('stationId', 'name address location')
        .sort(sort)
        .skip(skip)
        .limit(limitNum),
      Reservation.countDocuments(query)
    ]);

    const pagination = calculatePagination(pageNum, limitNum, total);

    sendSuccess(res, 'All reservations retrieved successfully', reservations, 200, pagination);
  } catch (error) {
    console.error('Error fetching all reservations:', error);
    sendError(res, 'Failed to fetch reservations');
  }
}; 