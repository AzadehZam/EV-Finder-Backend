import { Response } from 'express';
import { validationResult } from 'express-validator';
import * as jwt from 'jsonwebtoken';
import User from '../models/User';
import Reservation from '../models/Reservation';
import { AuthenticatedRequest, JWTPayload } from '../types';
import { sendSuccess, sendError, sendNotFound, sendValidationError } from '../utils/response';

// Get current user profile
export const getCurrentUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.user!;

    const user = await User.findById(userId)
      .populate('preferences.favoriteStations', 'name address location rating');

    if (!user) {
      sendNotFound(res, 'User');
      return;
    }

    sendSuccess(res, 'User profile retrieved successfully', user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    sendError(res, 'Failed to fetch user profile');
  }
};

// Update user profile
export const updateUserProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      sendValidationError(res, errors.array());
      return;
    }

    const { userId } = req.user!;
    const { name, picture, preferences } = req.body as any;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (picture) updateData.picture = picture;
    if (preferences) updateData.preferences = preferences;

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).populate('preferences.favoriteStations', 'name address location rating');

    if (!user) {
      sendNotFound(res, 'User');
      return;
    }

    sendSuccess(res, 'User profile updated successfully', user);
  } catch (error) {
    console.error('Error updating user profile:', error);
    sendError(res, 'Failed to update user profile');
  }
};

// Add station to favorites
export const addFavoriteStation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.user!;
    const { stationId } = req.body as any;

    const user = await User.findById(userId);
    if (!user) {
      sendNotFound(res, 'User');
      return;
    }

    // Check if station is already in favorites
    if (user.preferences?.favoriteStations.includes(stationId)) {
      sendError(res, 'Station is already in favorites', 400);
      return;
    }

    // Initialize preferences if not exists
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

    sendSuccess(res, 'Station added to favorites successfully', user.preferences.favoriteStations);
  } catch (error) {
    console.error('Error adding favorite station:', error);
    sendError(res, 'Failed to add station to favorites');
  }
};

// Remove station from favorites
export const removeFavoriteStation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.user!;
    const { stationId } = req.params as any;

    const user = await User.findById(userId);
    if (!user) {
      sendNotFound(res, 'User');
      return;
    }

    if (!user.preferences?.favoriteStations) {
      sendError(res, 'No favorite stations found', 404);
      return;
    }

    // Remove station from favorites
    user.preferences.favoriteStations = user.preferences.favoriteStations.filter(
      id => id.toString() !== stationId
    );

    await user.save();
    await user.populate('preferences.favoriteStations', 'name address location rating');

    sendSuccess(res, 'Station removed from favorites successfully', user.preferences.favoriteStations);
  } catch (error) {
    console.error('Error removing favorite station:', error);
    sendError(res, 'Failed to remove station from favorites');
  }
};

// Get user's favorite stations
export const getFavoriteStations = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.user!;

    const user = await User.findById(userId)
      .populate('preferences.favoriteStations', 'name address location connectorTypes rating availablePorts');

    if (!user) {
      sendNotFound(res, 'User');
      return;
    }

    const favoriteStations = user.preferences?.favoriteStations || [];

    sendSuccess(res, 'Favorite stations retrieved successfully', favoriteStations);
  } catch (error) {
    console.error('Error fetching favorite stations:', error);
    sendError(res, 'Failed to fetch favorite stations');
  }
};

// Get user dashboard data
export const getUserDashboard = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.user!;

    // Get user with favorite stations
    const user = await User.findById(userId)
      .populate('preferences.favoriteStations', 'name address location rating');

    if (!user) {
      sendNotFound(res, 'User');
      return;
    }

    // Get user's reservation statistics
    const [
      totalReservations,
      activeReservations,
      completedReservations,
      recentReservations
    ] = await Promise.all([
      Reservation.countDocuments({ userId }),
      Reservation.countDocuments({ userId, status: { $in: ['confirmed', 'active'] } }),
      Reservation.countDocuments({ userId, status: 'completed' }),
      Reservation.find({ userId })
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

    sendSuccess(res, 'Dashboard data retrieved successfully', dashboardData);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    sendError(res, 'Failed to fetch dashboard data');
  }
};

// Create or update user from Auth0 token
export const createOrUpdateUserFromAuth0 = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { auth0Id, email, name, picture } = req.body as any;

    let user = await User.findOne({ auth0Id });

    if (user) {
      // Update existing user
      user.name = name || user.name;
      user.picture = picture || user.picture;
      await user.save();
    } else {
      // Create new user
      user = new User({
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

    // Generate JWT token
    const payload = {
      userId: (user._id as any).toString(),
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

    sendSuccess(res, 'User authenticated successfully', {
      user,
      token
    });
  } catch (error) {
    console.error('Error creating/updating user from Auth0:', error);
    sendError(res, 'Failed to authenticate user');
  }
};

// Update user preferences
export const updateUserPreferences = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      sendValidationError(res, errors.array());
      return;
    }

    const { userId } = req.user!;
    const { notifications, units } = req.body as any;

    const user = await User.findById(userId);
    if (!user) {
      sendNotFound(res, 'User');
      return;
    }

    // Initialize preferences if not exists
    if (!user.preferences) {
      user.preferences = {
        favoriteStations: [],
        notifications: true,
        units: 'metric'
      };
    }

    // Update preferences
    if (notifications !== undefined) {
      user.preferences.notifications = notifications;
    }
    if (units) {
      user.preferences.units = units;
    }

    await user.save();

    sendSuccess(res, 'User preferences updated successfully', user.preferences);
  } catch (error) {
    console.error('Error updating user preferences:', error);
    sendError(res, 'Failed to update user preferences');
  }
};

// Delete user account
export const deleteUserAccount = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.user!;

    // Cancel all active reservations
    await Reservation.updateMany(
      { userId, status: { $in: ['pending', 'confirmed'] } },
      { status: 'cancelled' }
    );

    // Delete user
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      sendNotFound(res, 'User');
      return;
    }

    sendSuccess(res, 'User account deleted successfully');
  } catch (error) {
    console.error('Error deleting user account:', error);
    sendError(res, 'Failed to delete user account');
  }
}; 