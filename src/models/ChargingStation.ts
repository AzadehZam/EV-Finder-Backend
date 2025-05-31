import mongoose, { Schema } from 'mongoose';
import { IChargingStation } from '../types';

const ConnectorTypeSchema = new Schema({
  type: {
    type: String,
    enum: ['CCS', 'CHAdeMO', 'Type2', 'Tesla', 'J1772'],
    required: true
  },
  power: {
    type: Number,
    required: true,
    min: 0
  },
  count: {
    type: Number,
    required: true,
    min: 0
  },
  available: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

const ChargingStationSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  address: {
    street: {
      type: String,
      required: true,
      trim: true
    },
    city: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    state: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    zipCode: {
      type: String,
      required: true,
      trim: true
    },
    country: {
      type: String,
      required: true,
      trim: true,
      default: 'USA'
    }
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: function(coordinates: number[]) {
          return coordinates.length === 2 && 
                 coordinates[0] >= -180 && coordinates[0] <= 180 && // longitude
                 coordinates[1] >= -90 && coordinates[1] <= 90;     // latitude
        },
        message: 'Invalid coordinates format'
      }
    }
  },
  connectorTypes: {
    type: [ConnectorTypeSchema],
    required: true,
    validate: {
      validator: function(connectors: any[]) {
        return connectors.length > 0;
      },
      message: 'At least one connector type is required'
    }
  },
  amenities: [{
    type: String,
    trim: true
  }],
  pricing: {
    perKwh: {
      type: Number,
      min: 0
    },
    perMinute: {
      type: Number,
      min: 0
    },
    sessionFee: {
      type: Number,
      min: 0
    },
    currency: {
      type: String,
      required: true,
      default: 'USD',
      uppercase: true
    }
  },
  operatingHours: {
    type: Map,
    of: {
      open: {
        type: String,
        required: true
      },
      close: {
        type: String,
        required: true
      },
      is24Hours: {
        type: Boolean,
        default: false
      }
    },
    default: {
      monday: { open: '00:00', close: '23:59', is24Hours: true },
      tuesday: { open: '00:00', close: '23:59', is24Hours: true },
      wednesday: { open: '00:00', close: '23:59', is24Hours: true },
      thursday: { open: '00:00', close: '23:59', is24Hours: true },
      friday: { open: '00:00', close: '23:59', is24Hours: true },
      saturday: { open: '00:00', close: '23:59', is24Hours: true },
      sunday: { open: '00:00', close: '23:59', is24Hours: true }
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance'],
    default: 'active',
    index: true
  },
  totalPorts: {
    type: Number,
    required: true,
    min: 1
  },
  availablePorts: {
    type: Number,
    required: true,
    min: 0
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviews: [{
    type: Schema.Types.ObjectId,
    ref: 'Review'
  }],
  images: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Geospatial index for location-based queries
ChargingStationSchema.index({ location: '2dsphere' });

// Compound indexes for common queries
ChargingStationSchema.index({ status: 1, 'address.city': 1 });
ChargingStationSchema.index({ 'connectorTypes.type': 1, status: 1 });
ChargingStationSchema.index({ rating: -1 });

// Virtual for calculating average rating
ChargingStationSchema.virtual('averageRating').get(function() {
  return this.rating;
});

// Virtual for total available power
ChargingStationSchema.virtual('totalAvailablePower').get(function(this: IChargingStation) {
  if (!this.connectorTypes || !Array.isArray(this.connectorTypes)) {
    return 0;
  }
  return this.connectorTypes.reduce((total: number, connector) => {
    return total + (connector.power * connector.available);
  }, 0);
});

// Pre-save middleware to update availablePorts
ChargingStationSchema.pre('save', function(this: IChargingStation, next) {
  if (!this.connectorTypes || !Array.isArray(this.connectorTypes)) {
    this.availablePorts = 0;
  } else {
    this.availablePorts = this.connectorTypes.reduce((total: number, connector) => {
      return total + connector.available;
    }, 0);
  }
  next();
});

// Ensure virtual fields are serialized
ChargingStationSchema.set('toJSON', { virtuals: true });
ChargingStationSchema.set('toObject', { virtuals: true });

export default mongoose.model<IChargingStation>('ChargingStation', ChargingStationSchema); 