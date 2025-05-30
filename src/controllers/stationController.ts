import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import ChargingStation from '../models/ChargingStation';
import { AuthenticatedRequest, StationQuery } from '../types';
import { sendSuccess, sendError, sendNotFound, sendValidationError, calculatePagination } from '../utils/response';

// Get all charging stations with filtering and pagination
export const getStations = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      lat,
      lng,
      radius = 10, // default 10km radius
      connectorType,
      minPower,
      maxPrice,
      amenities,
      availability,
      page = 1,
      limit = 20
    } = req.query as any;

    const query: any = { status: 'active' };
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Location-based search
    if (lat && lng) {
      const radiusInMeters = parseFloat(radius) * 1000; // Convert km to meters
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: radiusInMeters
        }
      };
    }

    // Filter by connector type
    if (connectorType) {
      query['connectorTypes.type'] = connectorType;
    }

    // Filter by minimum power
    if (minPower) {
      query['connectorTypes.power'] = { $gte: parseInt(minPower) };
    }

    // Filter by maximum price
    if (maxPrice) {
      query['pricing.perKwh'] = { $lte: parseFloat(maxPrice) };
    }

    // Filter by amenities
    if (amenities) {
      const amenityList = Array.isArray(amenities) ? amenities : [amenities];
      query.amenities = { $in: amenityList };
    }

    // Filter by availability
    if (availability === 'true') {
      query.availablePorts = { $gt: 0 };
    }

    const [stations, total] = await Promise.all([
      ChargingStation.find(query)
        .select('-reviews') // Exclude reviews array for performance
        .skip(skip)
        .limit(limitNum)
        .sort({ rating: -1, createdAt: -1 }),
      ChargingStation.countDocuments(query)
    ]);

    const pagination = calculatePagination(pageNum, limitNum, total);

    sendSuccess(res, 'Charging stations retrieved successfully', stations, 200, pagination);
  } catch (error) {
    console.error('Error fetching stations:', error);
    sendError(res, 'Failed to fetch charging stations');
  }
};

// Get single charging station by ID
export const getStationById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const station = await ChargingStation.findById(id)
      .populate('reviews', 'rating comment createdAt')
      .populate({
        path: 'reviews',
        populate: {
          path: 'userId',
          select: 'name picture'
        }
      });

    if (!station) {
      sendNotFound(res, 'Charging station');
      return;
    }

    sendSuccess(res, 'Charging station retrieved successfully', station);
  } catch (error) {
    console.error('Error fetching station:', error);
    sendError(res, 'Failed to fetch charging station');
  }
};

// Create new charging station (admin only)
export const createStation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      sendValidationError(res, errors.array());
      return;
    }

    const stationData = req.body as any;
    
    // Calculate total and available ports from connector types
    const totalPorts = stationData.connectorTypes.reduce((sum: number, connector: any) => sum + connector.count, 0);
    const availablePorts = stationData.connectorTypes.reduce((sum: number, connector: any) => sum + connector.available, 0);

    const station = new ChargingStation({
      ...stationData,
      totalPorts,
      availablePorts
    });

    await station.save();

    sendSuccess(res, 'Charging station created successfully', station, 201);
  } catch (error) {
    console.error('Error creating station:', error);
    sendError(res, 'Failed to create charging station');
  }
};

// Update charging station
export const updateStation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      sendValidationError(res, errors.array());
      return;
    }

    const { id } = req.params as any;
    const updateData = req.body as any;

    // If connector types are being updated, recalculate ports
    if (updateData.connectorTypes) {
      updateData.totalPorts = updateData.connectorTypes.reduce((sum: number, connector: any) => sum + connector.count, 0);
      updateData.availablePorts = updateData.connectorTypes.reduce((sum: number, connector: any) => sum + connector.available, 0);
    }

    const station = await ChargingStation.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!station) {
      sendNotFound(res, 'Charging station');
      return;
    }

    sendSuccess(res, 'Charging station updated successfully', station);
  } catch (error) {
    console.error('Error updating station:', error);
    sendError(res, 'Failed to update charging station');
  }
};

// Delete charging station
export const deleteStation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params as any;

    const station = await ChargingStation.findByIdAndDelete(id);

    if (!station) {
      sendNotFound(res, 'Charging station');
      return;
    }

    sendSuccess(res, 'Charging station deleted successfully');
  } catch (error) {
    console.error('Error deleting station:', error);
    sendError(res, 'Failed to delete charging station');
  }
};

// Update station availability (for real-time updates)
export const updateStationAvailability = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { connectorType, available } = req.body;

    const station = await ChargingStation.findById(id);
    if (!station) {
      sendNotFound(res, 'Charging station');
      return;
    }

    // Update specific connector availability
    const connector = station.connectorTypes.find(c => c.type === connectorType);
    if (!connector) {
      sendError(res, 'Connector type not found', 404);
      return;
    }

    connector.available = available;
    
    // Recalculate total available ports
    station.availablePorts = station.connectorTypes.reduce((sum, c) => sum + c.available, 0);
    
    await station.save();

    sendSuccess(res, 'Station availability updated successfully', {
      stationId: station._id,
      connectorType,
      available,
      totalAvailable: station.availablePorts
    });
  } catch (error) {
    console.error('Error updating availability:', error);
    sendError(res, 'Failed to update station availability');
  }
};

// Get nearby stations
export const getNearbyStations = async (req: Request, res: Response): Promise<void> => {
  try {
    const { lat, lng, radius = 5, limit = 10 } = req.query as any;

    if (!lat || !lng) {
      sendError(res, 'Latitude and longitude are required', 400);
      return;
    }

    const radiusInMeters = parseFloat(radius) * 1000;

    const stations = await ChargingStation.find({
      status: 'active',
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: radiusInMeters
        }
      }
    })
    .select('name address location connectorTypes availablePorts rating')
    .limit(parseInt(limit));

    sendSuccess(res, 'Nearby stations retrieved successfully', stations);
  } catch (error) {
    console.error('Error fetching nearby stations:', error);
    sendError(res, 'Failed to fetch nearby stations');
  }
}; 