"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = __importDefault(require("./config/database"));
const stations_1 = __importDefault(require("./routes/stations"));
const reservations_1 = __importDefault(require("./routes/reservations"));
const users_1 = __importDefault(require("./routes/users"));
dotenv_1.default.config();
const app = (0, express_1.default)();
(0, database_1.default)();
app.use((0, helmet_1.default)());
const corsOptions = {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
    optionsSuccessStatus: 200
};
app.use((0, cors_1.default)(corsOptions));
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'EV Finder API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});
const limiter = (0, express_rate_limit_1.default)({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.'
    }
});
app.use(limiter);
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
if (process.env.NODE_ENV !== 'production') {
    app.use((0, morgan_1.default)('dev'));
}
else {
    app.use((0, morgan_1.default)('combined'));
}
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'EV Finder Backend API',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
    });
});
app.get('/test', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Backend is running',
        port: process.env.PORT || 'not set',
        environment: process.env.NODE_ENV || 'development',
        mongodb_uri_configured: !!process.env.MONGODB_URI,
        timestamp: new Date().toISOString()
    });
});
app.get('/db-test', (req, res) => {
    try {
        res.status(200).json({
            success: true,
            message: 'Database endpoint reached',
            mongodb_uri: process.env.MONGODB_URI ? 'configured' : 'missing',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Database test failed',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
app.use('/api/stations', stations_1.default);
app.use('/api/reservations', reservations_1.default);
app.use('/api/users', users_1.default);
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});
app.use((err, req, res, next) => {
    console.error('Error:', err);
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map((e) => e.message);
        res.status(400).json({
            success: false,
            message: 'Validation Error',
            error: errors.join(', ')
        });
        return;
    }
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        res.status(400).json({
            success: false,
            message: `${field} already exists`
        });
        return;
    }
    if (err.name === 'JsonWebTokenError') {
        res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
        return;
    }
    if (err.name === 'TokenExpiredError') {
        res.status(401).json({
            success: false,
            message: 'Token expired'
        });
        return;
    }
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});
const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = '0.0.0.0';
app.listen(PORT, HOST, () => {
    console.log(`🚀 EV Finder API server running on port ${PORT}`);
    console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    console.log(`🌐 Network access: http://192.168.1.91:${PORT}/health`);
});
exports.default = app;
//# sourceMappingURL=index.js.map