import mongoose, { Schema, Model } from 'mongoose';
import { IReview } from '../types';

// Extend the model interface to include static methods
interface IReviewModel extends Model<IReview> {
  calculateAverageRating(stationId: string): Promise<{ averageRating: number; totalReviews: number }>;
  getRecentByStation(stationId: string, limit?: number): any;
}

const ReviewSchema: Schema = new Schema({
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
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    validate: {
      validator: function(rating: number) {
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

// Compound indexes for common queries
ReviewSchema.index({ stationId: 1, rating: -1 });
ReviewSchema.index({ userId: 1, createdAt: -1 });
ReviewSchema.index({ stationId: 1, createdAt: -1 });

// Unique constraint to prevent multiple reviews from same user for same station
ReviewSchema.index({ userId: 1, stationId: 1 }, { unique: true });

// Static method to calculate average rating for a station
ReviewSchema.statics.calculateAverageRating = async function(stationId: string) {
  const result = await this.aggregate([
    { $match: { stationId: new mongoose.Types.ObjectId(stationId) } },
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

// Static method to get recent reviews for a station
ReviewSchema.statics.getRecentByStation = function(stationId: string, limit: number = 10) {
  return this.find({ stationId })
    .populate('userId', 'name picture')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Post-save middleware to update station rating
ReviewSchema.post('save', async function(this: IReview) {
  const ChargingStation = mongoose.model('ChargingStation');
  const Review = mongoose.model('Review') as IReviewModel;
  
  const { averageRating } = await Review.calculateAverageRating(this.stationId.toString());
  await ChargingStation.findByIdAndUpdate(this.stationId, { rating: averageRating });
});

// Post-remove middleware to update station rating
ReviewSchema.post('findOneAndDelete', async function(doc: IReview | null) {
  if (doc) {
    const ChargingStation = mongoose.model('ChargingStation');
    const Review = mongoose.model('Review') as IReviewModel;
    
    const { averageRating } = await Review.calculateAverageRating(doc.stationId.toString());
    await ChargingStation.findByIdAndUpdate(doc.stationId, { rating: averageRating });
  }
});

export default mongoose.model<IReview, IReviewModel>('Review', ReviewSchema); 