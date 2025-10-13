// src/components/HappyClientsSection.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import { getReviews, submitReview, deleteReview } from '../api/reviewApi';
import '../styles/HappyClientsSection.css';

// Sample client photos for carousel
const clientPhotos = [
  '/client-photos/client1.jpg',
  '/client-photos/client2.jpg', 
  '/client-photos/client3.jpg',
  '/client-photos/client4.jpg',
  '/client-photos/client5.jpg'
];

// Sample reviews (will be replaced with API data)
const sampleReviews = [
  {
    id: 1,
    name: 'Rajesh Kumar',
    review: 'Excellent treatment and very caring doctor. Dr. Madhusudhana explained everything clearly.',
    rating: 5,
    date: '2024-01-15'
  },
  {
    id: 2,
    name: 'Priya Sharma',
    review: 'Best family doctor in the area. Very patient and thorough examination.',
    rating: 5,
    date: '2024-01-10'
  },
  {
    id: 3,
    name: 'Suresh Reddy',
    review: 'Good experience overall. The clinic is clean and staff is friendly.',
    rating: 4,
    date: '2024-01-08'
  }
];

const StarRating = ({ rating, onRatingChange, readonly = false }) => {
  const [hoveredRating, setHoveredRating] = useState(0);

  const handleStarClick = (starIndex) => {
    if (!readonly && onRatingChange) {
      onRatingChange(starIndex + 1);
    }
  };

  const handleStarHover = (starIndex) => {
    if (!readonly) {
      setHoveredRating(starIndex + 1);
    }
  };

  const handleStarLeave = () => {
    if (!readonly) {
      setHoveredRating(0);
    }
  };

  return (
    <div className="star-rating">
      {[...Array(5)].map((_, index) => {
        const starValue = index + 1;
        const isActive = readonly 
          ? starValue <= rating 
          : starValue <= (hoveredRating || rating);
        
        return (
          <span
            key={index}
            className={`star ${isActive ? 'active' : ''} ${readonly ? 'readonly' : ''}`}
            onClick={() => handleStarClick(index)}
            onMouseEnter={() => handleStarHover(index)}
            onMouseLeave={handleStarLeave}
          >
            ★
          </span>
        );
      })}
    </div>
  );
};

const ReviewCard = ({ review, onDelete, isAdmin }) => {
  return (
    <motion.div 
      className="review-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="review-header">
        <h4>{review.name}</h4>
        <div className="review-rating">
          <StarRating rating={review.rating} readonly />
          <span className="rating-text">({review.rating}/5)</span>
        </div>
        {isAdmin && (
          <button 
            className="delete-review-btn"
            onClick={() => onDelete(review.id)}
            title="Delete Review"
          >
            ×
          </button>
        )}
      </div>
      <p className="review-text">{review.review}</p>
      <span className="review-date">
        {review.createdAt ? new Date(review.createdAt.seconds * 1000).toLocaleDateString() : new Date(review.date).toLocaleDateString()}
      </span>
    </motion.div>
  );
};

const HappyClientsSection = ({ isAdmin = false }) => {
  const [ref, controls] = useScrollAnimation(0.2);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({
    name: '',
    review: '',
    rating: 0
  });

  // Fetch reviews on component mount
  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const fetchedReviews = await getReviews();
      setReviews(fetchedReviews);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      // Keep sample reviews as fallback
      setReviews(sampleReviews);
    } finally {
      setLoading(false);
    }
  };

  // Auto-change photos every 5 seconds with smooth transition
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPhotoIndex((prev) => (prev + 1) % clientPhotos.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const sectionVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    if (!newReview.name.trim() || !newReview.review.trim() || newReview.rating === 0) {
      alert('Please fill in all fields and provide a rating');
      return;
    }

    try {
      const response = await submitReview(newReview);
      
      if (response.saved) {
        // Review was saved (rating >= 3.5)
        await fetchReviews(); // Refresh the reviews list
        alert('Thank you for your review!');
      } else {
        // Review was not saved (rating < 3.5)
        alert(response.message);
      }
      
      setNewReview({ name: '', review: '', rating: 0 });
      setShowReviewForm(false);
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review. Please try again.');
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!isAdmin) return;
    
    if (window.confirm('Are you sure you want to delete this review?')) {
      try {
        const adminKey = prompt('Enter admin key:');
        if (!adminKey) return;
        
        await deleteReview(reviewId, adminKey);
        await fetchReviews(); // Refresh the reviews list
        alert('Review deleted successfully');
      } catch (error) {
        console.error('Error deleting review:', error);
        alert('Failed to delete review. Please check your admin key and try again.');
      }
    }
  };

  return (
    <motion.section
      className="happy-clients-section"
      id="happy-clients"
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={sectionVariants}
    >
      <div className="happy-clients-container">
        <motion.div className="section-header" variants={sectionVariants}>
          <h2 className="section-title">Happy Clients</h2>
          <p className="section-subtitle">
            Read what our satisfied patients have to say about their experience
          </p>
        </motion.div>

        <div className="happy-clients-content">
          {/* Left side - Photo carousel (35%) */}
          <div className="photo-carousel">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPhotoIndex}
                className="photo-container"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                transition={{ duration: 0.8 }}
              >
                <img 
                  src={clientPhotos[currentPhotoIndex]} 
                  alt={`Happy client ${currentPhotoIndex + 1}`}
                  onError={(e) => {
                    e.target.src = '/doctor-photo.jpg'; // Fallback image
                  }}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right side - Reviews (65%) */}
          <div className="reviews-section">
            <div className="reviews-header">
              <h3>Client Reviews</h3>
              <button 
                className="your-review-btn"
                onClick={() => setShowReviewForm(!showReviewForm)}
              >
                {showReviewForm ? 'Cancel' : 'Your Review'}
              </button>
            </div>

            {/* Review submission form */}
            {showReviewForm && (
              <motion.form 
                className="review-form"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleSubmitReview}
              >
                <div className="form-group">
                  <input
                    type="text"
                    placeholder="Your Name"
                    value={newReview.name}
                    onChange={(e) => setNewReview(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <textarea
                    placeholder="Share your experience..."
                    value={newReview.review}
                    onChange={(e) => setNewReview(prev => ({ ...prev, review: e.target.value }))}
                    required
                    rows="4"
                  />
                </div>
                <div className="form-group">
                  <label>Rating:</label>
                  <StarRating 
                    rating={newReview.rating}
                    onRatingChange={(rating) => setNewReview(prev => ({ ...prev, rating }))}
                  />
                </div>
                <button type="submit" className="submit-review-btn">
                  Submit Review
                </button>
              </motion.form>
            )}

            {/* Reviews display */}
            <div className="reviews-list">
              {loading ? (
                <p className="loading-reviews">Loading reviews...</p>
              ) : reviews.length > 0 ? (
                reviews.map((review) => (
                  <ReviewCard 
                    key={review.id} 
                    review={review} 
                    onDelete={handleDeleteReview}
                    isAdmin={isAdmin}
                  />
                ))
              ) : (
                <p className="no-reviews">No reviews yet. Be the first to share your experience!</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export default HappyClientsSection;