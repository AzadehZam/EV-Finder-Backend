import mongoose, { Schema } from 'mongoose';
import { IReservation } from '../types';

const ReservationSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  stationId: {
    type: Schema.Types.ObjectId,
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
      validator: function(this: IReservation, endTime: Date) {
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

// Compound indexes for common queries
ReservationSchema.index({ userId: 1, status: 1 });
ReservationSchema.index({ stationId: 1, startTime: 1 });
ReservationSchema.index({ startTime: 1, endTime: 1 });
ReservationSchema.index({ status: 1, startTime: 1 });

// Virtual for duration in minutes
ReservationSchema.virtual('durationMinutes').get(function(this: IReservation) {
  return Math.round((this.endTime.getTime() - this.startTime.getTime()) / (1000 * 60));
});

// Virtual for checking if reservation is current
ReservationSchema.virtual('isCurrent').get(function(this: IReservation) {
  const now = new Date();
  return this.startTime <= now && this.endTime >= now && this.status === 'active';
});

// Virtual for checking if reservation is upcoming
ReservationSchema.virtual('isUpcoming').get(function(this: IReservation) {
  const now = new Date();
  return this.startTime > now && (this.status === 'confirmed' || this.status === 'pending');
});

// Pre-save middleware for validation
ReservationSchema.pre('save', function(this: IReservation, next) {
  // Ensure end time is after start time
  if (this.endTime <= this.startTime) {
    next(new Error('End time must be after start time'));
    return;
  }
  
  // Ensure reservation is not in the past (for new reservations)
  if (this.isNew && this.startTime < new Date()) {
    next(new Error('Cannot create reservation in the past'));
    return;
  }
  
  next();
});

// Static method to find overlapping reservations
ReservationSchema.statics.findOverlapping = function(
  stationId: string,
  connectorType: string,
  startTime: Date,
  endTime: Date,
  excludeReservationId?: string
) {
  const query: any = {
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

// Static method to get user's active reservations
ReservationSchema.statics.findActiveByUser = function(userId: string) {
  return this.find({
    userId,
    status: { $in: ['confirmed', 'active'] },
    endTime: { $gte: new Date() }
  }).populate('stationId');
};

// Static method to get upcoming reservations for a station
ReservationSchema.statics.findUpcomingByStation = function(stationId: string, hours: number = 24) {
  const now = new Date();
  const futureTime = new Date(now.getTime() + (hours * 60 * 60 * 1000));
  
  return this.find({
    stationId,
    status: { $in: ['confirmed', 'active'] },
    startTime: { $gte: now, $lte: futureTime }
  }).populate('userId', 'name email');
};

// Ensure virtual fields are serialized
ReservationSchema.set('toJSON', { virtuals: true });
ReservationSchema.set('toObject', { virtuals: true });

export default mongoose.model<IReservation>('Reservation', ReservationSchema); 