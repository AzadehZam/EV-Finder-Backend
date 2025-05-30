import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest, JWTPayload } from '../types';
import User from '../models/User';

// Middleware to verify JWT token
export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization as string | undefined;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access token required'
      });
      return;
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    
    // Find user in database
    const user = await User.findOne({ auth0Id: decoded.auth0Id });
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Add user info to request
    req.user = {
      userId: (user._id as any).toString(),
      auth0Id: user.auth0Id,
      email: user.email
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    } else if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    } else {
      console.error('Authentication error:', error);
      res.status(500).json({
        success: false,
        message: 'Authentication failed'
      });
    }
  }
};

// Middleware to verify Auth0 token (alternative approach)
export const verifyAuth0Token = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization as string | undefined;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access token required'
      });
      return;
    }

    // For Auth0 tokens, you would typically verify against Auth0's public key
    // This is a simplified version - in production, use Auth0's SDK
    const decoded = jwt.decode(token) as any;
    
    if (!decoded || !decoded.sub) {
      res.status(401).json({
        success: false,
        message: 'Invalid token format'
      });
      return;
    }

    // Find or create user based on Auth0 ID
    let user = await User.findOne({ auth0Id: decoded.sub });
    
    if (!user && decoded.email) {
      // Create user if doesn't exist (first time login)
      user = new User({
        auth0Id: decoded.sub,
        email: decoded.email,
        name: decoded.name || decoded.email.split('@')[0],
        picture: decoded.picture
      });
      await user.save();
    }

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    req.user = {
      userId: (user._id as any).toString(),
      auth0Id: user.auth0Id,
      email: user.email
    };

    next();
  } catch (error) {
    console.error('Auth0 token verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

// Optional middleware - only authenticate if token is provided
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization as string | undefined;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // No token provided, continue without authentication
    next();
    return;
  }

  // Token provided, try to authenticate
  await authenticateToken(req, res, next);
}; 