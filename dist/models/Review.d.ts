import { Model } from 'mongoose';
import { IReview } from '../types';
interface IReviewModel extends Model<IReview> {
    calculateAverageRating(stationId: string): Promise<{
        averageRating: number;
        totalReviews: number;
    }>;
    getRecentByStation(stationId: string, limit?: number): any;
}
declare const _default: IReviewModel;
export default _default;
//# sourceMappingURL=Review.d.ts.map