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
const ReviewSchema = new mongoose_1.Schema({
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
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
        validate: {
            validator: function (rating) {
                return Number.isInteger(rating);
            },
            message: 'Rating must be an integer between 1 and 5'
        }
    },
    comment: {
        type: String,
        trim: true,
        maxlength: 1000
    },
    images: [{
            type: String,
            trim: true
        }],
    helpful: {
        type: Number,
        default: 0,
        min: 0
    }
}, {
    timestamps: true
});
ReviewSchema.index({ stationId: 1, rating: -1 });
ReviewSchema.index({ userId: 1, createdAt: -1 });
ReviewSchema.index({ stationId: 1, createdAt: -1 });
ReviewSchema.index({ userId: 1, stationId: 1 }, { unique: true });
ReviewSchema.statics.calculateAverageRating = async function (stationId) {
    const result = await this.aggregate([
        { $match: { stationId: new mongoose_1.default.Types.ObjectId(stationId) } },
        {
            $group: {
                _id: null,
                averageRating: { $avg: '$rating' },
                totalReviews: { $sum: 1 }
            }
        }
    ]);
    return result.length > 0 ? {
        averageRating: Math.round(result[0].averageRating * 10) / 10,
        totalReviews: result[0].totalReviews
    } : { averageRating: 0, totalReviews: 0 };
};
ReviewSchema.statics.getRecentByStation = function (stationId, limit = 10) {
    return this.find({ stationId })
        .populate('userId', 'name picture')
        .sort({ createdAt: -1 })
        .limit(limit);
};
ReviewSchema.post('save', async function () {
    const ChargingStation = mongoose_1.default.model('ChargingStation');
    const Review = mongoose_1.default.model('Review');
    const { averageRating } = await Review.calculateAverageRating(this.stationId.toString());
    await ChargingStation.findByIdAndUpdate(this.stationId, { rating: averageRating });
});
ReviewSchema.post('findOneAndDelete', async function (doc) {
    if (doc) {
        const ChargingStation = mongoose_1.default.model('ChargingStation');
        const Review = mongoose_1.default.model('Review');
        const { averageRating } = await Review.calculateAverageRating(doc.stationId.toString());
        await ChargingStation.findByIdAndUpdate(doc.stationId, { rating: averageRating });
    }
});
exports.default = mongoose_1.default.model('Review', ReviewSchema);
//# sourceMappingURL=Review.js.map