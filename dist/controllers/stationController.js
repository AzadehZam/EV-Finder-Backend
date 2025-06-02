"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchNearbyStations = exports.getAllStations = exports.getNearbyStations = exports.updateStationAvailability = exports.deleteStation = exports.updateStation = exports.createStation = exports.getStationById = exports.getStations = void 0;
const express_validator_1 = require("express-validator");
const ChargingStation_1 = __importDefault(require("../models/ChargingStation"));
const response_1 = require("../utils/response");
const getStations = async (req, res) => {
    try {
        const { lat, lng, radius = 10, connectorType, minPower, maxPrice, amenities, availability, page = 1, limit = 20 } = req.query;
        const query = { status: 'active' };
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        if (lat && lng) {
            const radiusInMeters = parseFloat(radius) * 1000;
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
        if (connectorType) {
            query['connectorTypes.type'] = connectorType;
        }
        if (minPower) {
            query['connectorTypes.power'] = { $gte: parseInt(minPower) };
        }
        if (maxPrice) {
            query['pricing.perKwh'] = { $lte: parseFloat(maxPrice) };
        }
        if (amenities) {
            const amenityList = Array.isArray(amenities) ? amenities : [amenities];
            query.amenities = { $in: amenityList };
        }
        if (availability === 'true') {
            query.availablePorts = { $gt: 0 };
        }
        const [stations, total] = await Promise.all([
            ChargingStation_1.default.find(query)
                .select('-reviews')
                .skip(skip)
                .limit(limitNum)
                .sort({ rating: -1, createdAt: -1 }),
            ChargingStation_1.default.countDocuments(query)
        ]);
        const pagination = (0, response_1.calculatePagination)(pageNum, limitNum, total);
        (0, response_1.sendSuccess)(res, 'Charging stations retrieved successfully', stations, 200, pagination);
    }
    catch (error) {
        console.error('Error fetching stations:', error);
        (0, response_1.sendError)(res, 'Failed to fetch charging stations');
    }
};
exports.getStations = getStations;
const getStationById = async (req, res) => {
    try {
        const { id } = req.params;
        const station = await ChargingStation_1.default.findById(id)
            .populate('reviews', 'rating comment createdAt')
            .populate({
            path: 'reviews',
            populate: {
                path: 'userId',
                select: 'name picture'
            }
        });
        if (!station) {
            (0, response_1.sendNotFound)(res, 'Charging station');
            return;
        }
        (0, response_1.sendSuccess)(res, 'Charging station retrieved successfully', station);
    }
    catch (error) {
        console.error('Error fetching station:', error);
        (0, response_1.sendError)(res, 'Failed to fetch charging station');
    }
};
exports.getStationById = getStationById;
const createStation = async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            (0, response_1.sendValidationError)(res, errors.array());
            return;
        }
        const stationData = req.body;
        const totalPorts = stationData.connectorTypes.reduce((sum, connector) => sum + connector.count, 0);
        const availablePorts = stationData.connectorTypes.reduce((sum, connector) => sum + connector.available, 0);
        const station = new ChargingStation_1.default({
            ...stationData,
            totalPorts,
            availablePorts
        });
        await station.save();
        (0, response_1.sendSuccess)(res, 'Charging station created successfully', station, 201);
    }
    catch (error) {
        console.error('Error creating station:', error);
        (0, response_1.sendError)(res, 'Failed to create charging station');
    }
};
exports.createStation = createStation;
const updateStation = async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            (0, response_1.sendValidationError)(res, errors.array());
            return;
        }
        const { id } = req.params;
        const updateData = req.body;
        if (updateData.connectorTypes) {
            updateData.totalPorts = updateData.connectorTypes.reduce((sum, connector) => sum + connector.count, 0);
            updateData.availablePorts = updateData.connectorTypes.reduce((sum, connector) => sum + connector.available, 0);
        }
        const station = await ChargingStation_1.default.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
        if (!station) {
            (0, response_1.sendNotFound)(res, 'Charging station');
            return;
        }
        (0, response_1.sendSuccess)(res, 'Charging station updated successfully', station);
    }
    catch (error) {
        console.error('Error updating station:', error);
        (0, response_1.sendError)(res, 'Failed to update charging station');
    }
};
exports.updateStation = updateStation;
const deleteStation = async (req, res) => {
    try {
        const { id } = req.params;
        const station = await ChargingStation_1.default.findByIdAndDelete(id);
        if (!station) {
            (0, response_1.sendNotFound)(res, 'Charging station');
            return;
        }
        (0, response_1.sendSuccess)(res, 'Charging station deleted successfully');
    }
    catch (error) {
        console.error('Error deleting station:', error);
        (0, response_1.sendError)(res, 'Failed to delete charging station');
    }
};
exports.deleteStation = deleteStation;
const updateStationAvailability = async (req, res) => {
    try {
        const { id } = req.params;
        const { connectorType, available } = req.body;
        const station = await ChargingStation_1.default.findById(id);
        if (!station) {
            (0, response_1.sendNotFound)(res, 'Charging station');
            return;
        }
        const connector = station.connectorTypes.find(c => c.type === connectorType);
        if (!connector) {
            (0, response_1.sendError)(res, 'Connector type not found', 404);
            return;
        }
        connector.available = available;
        station.availablePorts = station.connectorTypes.reduce((sum, c) => sum + c.available, 0);
        await station.save();
        (0, response_1.sendSuccess)(res, 'Station availability updated successfully', {
            stationId: station._id,
            connectorType,
            available,
            totalAvailable: station.availablePorts
        });
    }
    catch (error) {
        console.error('Error updating availability:', error);
        (0, response_1.sendError)(res, 'Failed to update station availability');
    }
};
exports.updateStationAvailability = updateStationAvailability;
const getNearbyStations = async (req, res) => {
    try {
        const { lat, lng, radius = 5, limit = 10 } = req.query;
        if (!lat || !lng) {
            (0, response_1.sendError)(res, 'Latitude and longitude are required', 400);
            return;
        }
        const radiusInMeters = parseFloat(radius) * 1000;
        const stations = await ChargingStation_1.default.find({
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
        (0, response_1.sendSuccess)(res, 'Nearby stations retrieved successfully', stations);
    }
    catch (error) {
        console.error('Error fetching nearby stations:', error);
        (0, response_1.sendError)(res, 'Failed to fetch nearby stations');
    }
};
exports.getNearbyStations = getNearbyStations;
const getAllStations = async (req, res) => {
    try {
        const { page = 1, limit = 10, city, state, connectorType, status = 'active' } = req.query;
        const query = { status };
        if (city) {
            query['address.city'] = new RegExp(city, 'i');
        }
        if (state) {
            query['address.state'] = new RegExp(state, 'i');
        }
        if (connectorType) {
            query['connectorTypes.type'] = connectorType;
        }
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [stations, total] = await Promise.all([
            ChargingStation_1.default.find(query)
                .select('name address location connectorTypes totalPorts availablePorts pricing amenities rating status')
                .sort({ rating: -1, name: 1 })
                .skip(skip)
                .limit(parseInt(limit)),
            ChargingStation_1.default.countDocuments(query)
        ]);
        const pagination = {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            totalItems: total,
            itemsPerPage: parseInt(limit),
            hasNext: skip + stations.length < total,
            hasPrev: parseInt(page) > 1
        };
        (0, response_1.sendSuccess)(res, 'Charging stations retrieved successfully', {
            stations,
            pagination
        });
    }
    catch (error) {
        console.error('Error fetching charging stations:', error);
        (0, response_1.sendError)(res, 'Failed to fetch charging stations');
    }
};
exports.getAllStations = getAllStations;
const searchNearbyStations = async (req, res) => {
    try {
        const { latitude, longitude, radius = 10000, limit = 20 } = req.query;
        if (!latitude || !longitude) {
            (0, response_1.sendError)(res, 'Latitude and longitude are required', 400);
            return;
        }
        const stations = await ChargingStation_1.default.find({
            status: 'active',
            location: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(longitude), parseFloat(latitude)]
                    },
                    $maxDistance: parseInt(radius)
                }
            }
        })
            .select('name address location connectorTypes totalPorts availablePorts pricing amenities rating')
            .limit(parseInt(limit));
        (0, response_1.sendSuccess)(res, 'Nearby stations retrieved successfully', stations);
    }
    catch (error) {
        console.error('Error searching nearby stations:', error);
        (0, response_1.sendError)(res, 'Failed to search nearby stations');
    }
};
exports.searchNearbyStations = searchNearbyStations;
//# sourceMappingURL=stationController.js.map