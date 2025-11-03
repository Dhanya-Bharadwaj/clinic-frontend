import React, { useEffect, useMemo, useState } from 'react';
import { getAllReviews, deleteReview } from '../api/reviewApi';
import '../styles/DoctorDashboard.css';

const Star = ({ filled }) => (
  <span style={{ color: filled ? '#f59e0b' : '#d1d5db', marginRight: 2 }}>★</span>
);

const formatDate = (createdAt, fallback) => {
  if (createdAt && typeof createdAt.toMillis === 'function') return new Date(createdAt.toMillis()).toLocaleString();
  if (createdAt && typeof createdAt.seconds === 'number') return new Date(createdAt.seconds * 1000).toLocaleString();
  const d = createdAt ? new Date(createdAt) : (fallback ? new Date(fallback) : null);
  return d && !isNaN(d.getTime()) ? d.toLocaleString() : '';
};

const DoctorReviewSection = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [minRating, setMinRating] = useState(0); // keep as number
  const [sortBy, setSortBy] = useState('dateDesc');

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const allReviews = await getAllReviews();
      setReviews(Array.isArray(allReviews) ? allReviews : []);
    } catch (e) {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filterRating = parseFloat(minRating) || 0;
    
    const list = reviews.filter(r => {
      // Search match
      const nameMatch = !q || r.name?.toLowerCase().includes(q) || r.review?.toLowerCase().includes(q) || String(r.rating ?? '').includes(q);
      
      // Rating match - ensure proper number comparison
      const reviewRating = parseFloat(r.rating) || 0;
      const ratingMatch = reviewRating >= filterRating;
      
      return nameMatch && ratingMatch;
    });
    
    const getTs = (r) => {
      const c = r.createdAt;
      if (!c) return 0;
      if (typeof c.toMillis === 'function') return c.toMillis();
      if (typeof c.seconds === 'number') return c.seconds * 1000;
      const d = new Date(c);
      return isNaN(d.getTime()) ? 0 : d.getTime();
    };
    return list.sort((a, b) => {
      if (sortBy === 'dateDesc') return getTs(b) - getTs(a);
      if (sortBy === 'dateAsc') return getTs(a) - getTs(b);
      if (sortBy === 'ratingDesc') return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'ratingAsc') return (a.rating || 0) - (b.rating || 0);
      return 0;
    });
  }, [reviews, query, minRating, sortBy]);

  const handleDelete = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review? This action cannot be undone.')) return;
    const adminKey = prompt('Enter admin key:');
    if (!adminKey) return;
    try {
      await deleteReview(reviewId, adminKey);
      fetchReviews();
    } catch (e) {
      alert('Failed to delete review.');
    }
  };

  return (
    <div className="doctor-review-section">
      <div className="reviews-toolbar">
        <h3>All Reviews <span className="muted">({filtered.length})</span></h3>
        <div className="toolbar-actions">
          <input
            className="review-search"
            type="text"
            placeholder="Search by name or text..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select className="review-filter" value={minRating} onChange={(e) => setMinRating(Number(e.target.value))}>
            <option value={0}>All ratings</option>
            <option value={5}>5 stars</option>
            <option value={4}>4+ stars</option>
            <option value={3}>3+ stars</option>
            <option value={2}>2+ stars</option>
          </select>
          <select className="review-sort" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="dateDesc">Newest</option>
            <option value="dateAsc">Oldest</option>
            <option value="ratingDesc">Rating: high to low</option>
            <option value="ratingAsc">Rating: low to high</option>
          </select>
          <button className="confirm-btn" onClick={fetchReviews}>Refresh</button>
        </div>
      </div>

      {loading ? (
        <p className="loading-reviews">Loading reviews...</p>
      ) : filtered.length === 0 ? (
        <p className="no-reviews">No reviews found.</p>
      ) : (
        <div className="reviews-grid">
          {filtered.map(r => (
            <div key={r.id} className="review-card admin">
              <div className="review-card-header">
                <div className="review-author">
                  <strong>{r.name || 'Anonymous'}</strong>
                  <span className="review-date">{formatDate(r.createdAt, r.date)}</span>
                </div>
                <div className="review-stars">
                  {[...Array(5)].map((_, i) => <Star key={i} filled={i < Math.round(r.rating || 0)} />)}
                  <span className="rating-text">{Number(r.rating || 0).toFixed(1)}/5</span>
                </div>
              </div>
              <p className="review-text">{r.review}</p>
              <div className="review-actions">
                <button
                  className="delete-review-btn icon"
                  aria-label="Delete review"
                  title="Delete review"
                  onClick={() => handleDelete(r.id)}
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DoctorReviewSection;
