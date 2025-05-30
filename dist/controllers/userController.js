"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUserAccount = exports.updateUserPreferences = exports.createOrUpdateUserFromAuth0 = exports.getUserDashboard = exports.getFavoriteStations = exports.removeFavoriteStation = exports.addFavoriteStation = exports.updateUserProfile = exports.getCurrentUser = void 0;
const express_validator_1 = require("express-validator");
const jwt = __importStar(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const Reservation_1 = __importDefault(require("../models/Reservation"));
const response_1 = require("../utils/response");
const getCurrentUser = async (req, res) => {
    try {
        const { userId } = req.user;
        const user = await User_1.default.findById(userId)
            .populate('preferences.favoriteStations', 'name address location rating');
        if (!user) {
            (0, response_1.sendNotFound)(res, 'User');
            return;
        }
        (0, response_1.sendSuccess)(res, 'User profile retrieved successfully', user);
    }
    catch (error) {
        console.error('Error fetching user profile:', error);
        (0, response_1.sendError)(res, 'Failed to fetch user profile');
    }
};
exports.getCurrentUser = getCurrentUser;
const updateUserProfile = async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            (0, response_1.sendValidationError)(res, errors.array());
            return;
        }
        const { userId } = req.user;
        const { name, picture, preferences } = req.body;
        const updateData = {};
        if (name)
            updateData.name = name;
        if (picture)
            updateData.picture = picture;
        if (preferences)
            updateData.preferences = preferences;
        const user = await User_1.default.findByIdAndUpdate(userId, updateData, { new: true, runValidators: true }).populate('preferences.favoriteStations', 'name address location rating');
        if (!user) {
            (0, response_1.sendNotFound)(res, 'User');
            return;
        }
        (0, response_1.sendSuccess)(res, 'User profile updated successfully', user);
    }
    catch (error) {
        console.error('Error updating user profile:', error);
        (0, response_1.sendError)(res, 'Failed to update user profile');
    }
};
exports.updateUserProfile = updateUserProfile;
const addFavoriteStation = async (req, res) => {
    try {
        const { userId } = req.user;
        const { stationId } = req.body;
        const user = await User_1.default.findById(userId);
        if (!user) {
            (0, response_1.sendNotFound)(res, 'User');
            return;
        }
        if (user.preferences?.favoriteStations.includes(stationId)) {
            (0, response_1.sendError)(res, 'Station is already in favorites', 400);
            return;
        }
        if (!user.preferences) {
            user.preferences = {
                favoriteStations: [],
                notifications: true,
                units: 'metric'
            };
        }
        user.preferences.favoriteStations.push(stationId);
        await user.save();
        await user.populate('preferences.favoriteStations', 'name address location rating');
        (0, response_1.sendSuccess)(res, 'Station added to favorites successfully', user.preferences.favoriteStations);
    }
    catch (error) {
        console.error('Error adding favorite station:', error);
        (0, response_1.sendError)(res, 'Failed to add station to favorites');
    }
};
exports.addFavoriteStation = addFavoriteStation;
const removeFavoriteStation = async (req, res) => {
    try {
        const { userId } = req.user;
        const { stationId } = req.params;
        const user = await User_1.default.findById(userId);
        if (!user) {
            (0, response_1.sendNotFound)(res, 'User');
            return;
        }
        if (!user.preferences?.favoriteStations) {
            (0, response_1.sendError)(res, 'No favorite stations found', 404);
            return;
        }
        user.preferences.favoriteStations = user.preferences.favoriteStations.filter(id => id.toString() !== stationId);
        await user.save();
        await user.populate('preferences.favoriteStations', 'name address location rating');
        (0, response_1.sendSuccess)(res, 'Station removed from favorites successfully', user.preferences.favoriteStations);
    }
    catch (error) {
        console.error('Error removing favorite station:', error);
        (0, response_1.sendError)(res, 'Failed to remove station from favorites');
    }
};
exports.removeFavoriteStation = removeFavoriteStation;
const getFavoriteStations = async (req, res) => {
    try {
        const { userId } = req.user;
        const user = await User_1.default.findById(userId)
            .populate('preferences.favoriteStations', 'name address location connectorTypes rating availablePorts');
        if (!user) {
            (0, response_1.sendNotFound)(res, 'User');
            return;
        }
        const favoriteStations = user.preferences?.favoriteStations || [];
        (0, response_1.sendSuccess)(res, 'Favorite stations retrieved successfully', favoriteStations);
    }
    catch (error) {
        console.error('Error fetching favorite stations:', error);
        (0, response_1.sendError)(res, 'Failed to fetch favorite stations');
    }
};
exports.getFavoriteStations = getFavoriteStations;
const getUserDashboard = async (req, res) => {
    try {
        const { userId } = req.user;
        const user = await User_1.default.findById(userId)
            .populate('preferences.favoriteStations', 'name address location rating');
        if (!user) {
            (0, response_1.sendNotFound)(res, 'User');
            return;
        }
        const [totalReservations, activeReservations, completedReservations, recentReservations] = await Promise.all([
            Reservation_1.default.countDocuments({ userId }),
            Reservation_1.default.countDocuments({ userId, status: { $in: ['confirmed', 'active'] } }),
            Reservation_1.default.countDocuments({ userId, status: 'completed' }),
            Reservation_1.default.find({ userId })
                .populate('stationId', 'name address location')
                .sort({ createdAt: -1 })
                .limit(5)
        ]);
        const dashboardData = {
            user: {
                name: user.name,
                email: user.email,
                picture: user.picture
            },
            statistics: {
                totalReservations,
                activeReservations,
                completedReservations,
                favoriteStations: user.preferences?.favoriteStations.length || 0
            },
            recentReservations,
            favoriteStations: user.preferences?.favoriteStations || []
        };
        (0, response_1.sendSuccess)(res, 'Dashboard data retrieved successfully', dashboardData);
    }
    catch (error) {
        console.error('Error fetching dashboard data:', error);
        (0, response_1.sendError)(res, 'Failed to fetch dashboard data');
    }
};
exports.getUserDashboard = getUserDashboard;
const createOrUpdateUserFromAuth0 = async (req, res) => {
    try {
        const { auth0Id, email, name, picture } = req.body;
        let user = await User_1.default.findOne({ auth0Id });
        if (user) {
            user.name = name || user.name;
            user.picture = picture || user.picture;
            await user.save();
        }
        else {
            user = new User_1.default({
                auth0Id,
                email,
                name: name || email.split('@')[0],
                picture,
                preferences: {
                    favoriteStations: [],
                    notifications: true,
                    units: 'metric'
                }
            });
            await user.save();
        }
        const payload = {
            userId: user._id.toString(),
            auth0Id: user.auth0Id,
            email: user.email
        };
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error('JWT_SECRET is not defined');
        }
        const token = jwt.sign(payload, secret, {
            expiresIn: '7d'
        });
        (0, response_1.sendSuccess)(res, 'User authenticated successfully', {
            user,
            token
        });
    }
    catch (error) {
        console.error('Error creating/updating user from Auth0:', error);
        (0, response_1.sendError)(res, 'Failed to authenticate user');
    }
};
exports.createOrUpdateUserFromAuth0 = createOrUpdateUserFromAuth0;
const updateUserPreferences = async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            (0, response_1.sendValidationError)(res, errors.array());
            return;
        }
        const { userId } = req.user;
        const { notifications, units } = req.body;
        const user = await User_1.default.findById(userId);
        if (!user) {
            (0, response_1.sendNotFound)(res, 'User');
            return;
        }
        if (!user.preferences) {
            user.preferences = {
                favoriteStations: [],
                notifications: true,
                units: 'metric'
            };
        }
        if (notifications !== undefined) {
            user.preferences.notifications = notifications;
        }
        if (units) {
            user.preferences.units = units;
        }
        await user.save();
        (0, response_1.sendSuccess)(res, 'User preferences updated successfully', user.preferences);
    }
    catch (error) {
        console.error('Error updating user preferences:', error);
        (0, response_1.sendError)(res, 'Failed to update user preferences');
    }
};
exports.updateUserPreferences = updateUserPreferences;
const deleteUserAccount = async (req, res) => {
    try {
        const { userId } = req.user;
        await Reservation_1.default.updateMany({ userId, status: { $in: ['pending', 'confirmed'] } }, { status: 'cancelled' });
        const user = await User_1.default.findByIdAndDelete(userId);
        if (!user) {
            (0, response_1.sendNotFound)(res, 'User');
            return;
        }
        (0, response_1.sendSuccess)(res, 'User account deleted successfully');
    }
    catch (error) {
        console.error('Error deleting user account:', error);
        (0, response_1.sendError)(res, 'Failed to delete user account');
    }
};
exports.deleteUserAccount = deleteUserAccount;
//# sourceMappingURL=userController.js.map