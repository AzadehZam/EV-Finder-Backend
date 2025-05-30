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
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const ReservationSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    stationId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'ChargingStation',
        required: true,
        index: true
    },
    connectorType: {
        type: String,
        enum: ['CCS', 'CHAdeMO', 'Type2', 'Tesla', 'J1772'],
        required: true
    },
    startTime: {
        type: Date,
        required: true,
        index: true
    },
    endTime: {
        type: Date,
        required: true,
        validate: {
            validator: function (endTime) {
                return endTime > this.startTime;
            },
            message: 'End time must be after start time'
        }
    },
    estimatedCost: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'active', 'completed', 'cancelled'],
        default: 'pending',
        index: true
    },
    vehicleInfo: {
        make: {
            type: String,
            trim: true
        },
        model: {
            type: String,
            trim: true
        },
        batteryCapacity: {
            type: Number,
            min: 0
        },
        currentCharge: {
            type: Number,
            min: 0,
            max: 100
        }
    },
    paymentInfo: {
        method: {
            type: String,
            enum: ['credit_card', 'paypal', 'apple_pay', 'google_pay']
        },
        transactionId: {
            type: String,
            trim: true
        }
    },
    notes: {
        type: String,
        trim: true,
        maxlength: 500
    }
}, {
    timestamps: true
});
ReservationSchema.index({ userId: 1, status: 1 });
ReservationSchema.index({ stationId: 1, startTime: 1 });
ReservationSchema.index({ startTime: 1, endTime: 1 });
ReservationSchema.index({ status: 1, startTime: 1 });
ReservationSchema.virtual('durationMinutes').get(function () {
    return Math.round((this.endTime.getTime() - this.startTime.getTime()) / (1000 * 60));
});
ReservationSchema.virtual('isCurrent').get(function () {
    const now = new Date();
    return this.startTime <= now && this.endTime >= now && this.status === 'active';
});
ReservationSchema.virtual('isUpcoming').get(function () {
    const now = new Date();
    return this.startTime > now && (this.status === 'confirmed' || this.status === 'pending');
});
ReservationSchema.pre('save', function (next) {
    if (this.endTime <= this.startTime) {
        next(new Error('End time must be after start time'));
        return;
    }
    if (this.isNew && this.startTime < new Date()) {
        next(new Error('Cannot create reservation in the past'));
        return;
    }
    next();
});
ReservationSchema.statics.findOverlapping = function (stationId, connectorType, startTime, endTime, excludeReservationId) {
    const query = {
        stationId,
        connectorType,
        status: { $in: ['confirmed', 'active'] },
        $or: [
            {
                startTime: { $lt: endTime },
                endTime: { $gt: startTime }
            }
        ]
    };
    if (excludeReservationId) {
        query._id = { $ne: excludeReservationId };
    }
    return this.find(query);
};
ReservationSchema.statics.findActiveByUser = function (userId) {
    return this.find({
        userId,
        status: { $in: ['confirmed', 'active'] },
        endTime: { $gte: new Date() }
    }).populate('stationId');
};
ReservationSchema.statics.findUpcomingByStation = function (stationId, hours = 24) {
    const now = new Date();
    const futureTime = new Date(now.getTime() + (hours * 60 * 60 * 1000));
    return this.find({
        stationId,
        status: { $in: ['confirmed', 'active'] },
        startTime: { $gte: now, $lte: futureTime }
    }).populate('userId', 'name email');
};
ReservationSchema.set('toJSON', { virtuals: true });
ReservationSchema.set('toObject', { virtuals: true });
exports.default = mongoose_1.default.model('Reservation', ReservationSchema);
//# sourceMappingURL=Reservation.js.map