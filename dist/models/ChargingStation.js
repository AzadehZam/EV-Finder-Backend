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
const ConnectorTypeSchema = new mongoose_1.Schema({
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
const ChargingStationSchema = new mongoose_1.Schema({
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
                validator: function (coordinates) {
                    return coordinates.length === 2 &&
                        coordinates[0] >= -180 && coordinates[0] <= 180 &&
                        coordinates[1] >= -90 && coordinates[1] <= 90;
                },
                message: 'Invalid coordinates format'
            }
        }
    },
    connectorTypes: {
        type: [ConnectorTypeSchema],
        required: true,
        validate: {
            validator: function (connectors) {
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
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Review'
        }],
    images: [{
            type: String,
            trim: true
        }]
}, {
    timestamps: true
});
ChargingStationSchema.index({ location: '2dsphere' });
ChargingStationSchema.index({ status: 1, 'address.city': 1 });
ChargingStationSchema.index({ 'connectorTypes.type': 1, status: 1 });
ChargingStationSchema.index({ rating: -1 });
ChargingStationSchema.virtual('averageRating').get(function () {
    return this.rating;
});
ChargingStationSchema.virtual('totalAvailablePower').get(function () {
    return this.connectorTypes.reduce((total, connector) => {
        return total + (connector.power * connector.available);
    }, 0);
});
ChargingStationSchema.pre('save', function (next) {
    this.availablePorts = this.connectorTypes.reduce((total, connector) => {
        return total + connector.available;
    }, 0);
    next();
});
ChargingStationSchema.set('toJSON', { virtuals: true });
ChargingStationSchema.set('toObject', { virtuals: true });
exports.default = mongoose_1.default.model('ChargingStation', ChargingStationSchema);
//# sourceMappingURL=ChargingStation.js.map