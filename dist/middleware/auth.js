"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.verifyAuth0Token = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            res.status(401).json({
                success: false,
                message: 'Access token required'
            });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const user = await User_1.default.findOne({ auth0Id: decoded.auth0Id });
        if (!user) {
            res.status(401).json({
                success: false,
                message: 'User not found'
            });
            return;
        }
        req.user = {
            userId: user._id.toString(),
            auth0Id: user.auth0Id,
            email: user.email
        };
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
        else if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            res.status(401).json({
                success: false,
                message: 'Token expired'
            });
        }
        else {
            console.error('Authentication error:', error);
            res.status(500).json({
                success: false,
                message: 'Authentication failed'
            });
        }
    }
};
exports.authenticateToken = authenticateToken;
const verifyAuth0Token = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            res.status(401).json({
                success: false,
                message: 'Access token required'
            });
            return;
        }
        const decoded = jsonwebtoken_1.default.decode(token);
        if (!decoded || !decoded.sub) {
            res.status(401).json({
                success: false,
                message: 'Invalid token format'
            });
            return;
        }
        let user = await User_1.default.findOne({ auth0Id: decoded.sub });
        if (!user && decoded.email) {
            user = new User_1.default({
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
            userId: user._id.toString(),
            auth0Id: user.auth0Id,
            email: user.email
        };
        next();
    }
    catch (error) {
        console.error('Auth0 token verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Authentication failed'
        });
    }
};
exports.verifyAuth0Token = verifyAuth0Token;
const optionalAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        next();
        return;
    }
    await (0, exports.authenticateToken)(req, res, next);
};
exports.optionalAuth = optionalAuth;
//# sourceMappingURL=auth.js.map