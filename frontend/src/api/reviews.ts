import { apiRequest } from './client';

export interface ReviewReply {
  id: string;
  review_id: string;
  author_id: string;
  author_name?: string;
  reply_text: string;
  created_at: string;
}

export interface Review {
  id: string;
  booking_id: string;
  tourist_id: string;
  tourist_name?: string;
  tourist_avatar?: string;
  listing_id: string;
  listing_title?: string;
  rating: number;
  title?: string;
  comment?: string;
  status: string;
  created_at: string;
  reply?: ReviewReply;
}

export interface ListingReviewsSummary {
  listing_id: string;
  average_rating: number;
  total_reviews: number;
  rating_breakdown: Record<number, number>;
  reviews: Review[];
}

export interface CreateReviewPayload {
  booking_id: string;
  rating: number;
  title?: string;
  comment?: string;
}

export async function createReview(payload: CreateReviewPayload): Promise<Review> {
  return apiRequest<Review>('/reviews', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getListingReviews(listingId: string): Promise<ListingReviewsSummary> {
  return apiRequest<ListingReviewsSummary>(`/reviews/listing/${listingId}`);
}

export async function fetchBusinessReviews(): Promise<Review[]> {
  return apiRequest<Review[]>('/reviews/business-reviews');
}

export async function replyToReview(reviewId: string, replyText: string): Promise<Review> {
  return apiRequest<Review>(`/reviews/${reviewId}/reply`, {
    method: 'POST',
    body: JSON.stringify({ reply_text: replyText }),
  });
}
