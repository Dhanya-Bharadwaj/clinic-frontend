// Frontend API for reviews
export const REVIEWS_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://clinic-backend-flame.vercel.app/api/reviews'
  : 'http://localhost:5001/api/reviews';

/**
 * Fetches all approved reviews with rating >= 3.5
 * @returns {Promise<Array>} Array of review objects
 */
export const getReviews = async () => {
  try {
    const response = await fetch(REVIEWS_BASE_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch reviews: ${response.status}`);
    }
    const data = await response.json();
    return data.reviews || [];
  } catch (error) {
    console.error('Error fetching reviews:', error);
    throw error;
  }
};

/**
 * Submits a new review
 * @param {Object} reviewData - {name, review, rating}
 * @returns {Promise<Object>} Response object with success status
 */
export const submitReview = async (reviewData) => {
  try {
    const response = await fetch(REVIEWS_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reviewData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to submit review');
    }

    return data;
  } catch (error) {
    console.error('Error submitting review:', error);
    throw error;
  }
};

/**
 * Deletes a review (admin only)
 * @param {string} reviewId - ID of review to delete
 * @param {string} adminKey - Admin authentication key
 * @returns {Promise<Object>} Response object
 */
export const deleteReview = async (reviewId, adminKey) => {
  try {
    const response = await fetch(`${REVIEWS_BASE_URL}/${reviewId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': adminKey,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete review');
    }

    return data;
  } catch (error) {
    console.error('Error deleting review:', error);
    throw error;
  }
};

/**
 * Gets review statistics
 * @returns {Promise<Object>} Stats object with total, average, distribution
 */
export const getReviewStats = async () => {
  try {
    const response = await fetch(`${REVIEWS_BASE_URL}/stats`);
    if (!response.ok) {
      throw new Error(`Failed to fetch review stats: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching review stats:', error);
    throw error;
  }
};