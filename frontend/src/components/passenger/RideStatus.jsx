import { useState, useEffect } from 'react';
import { rideAPI, ratingAPI } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import toast from 'react-hot-toast';
import { FaCar, FaStar, FaMapMarkerAlt, FaFlag, FaPhone, FaCheckCircle } from 'react-icons/fa';

const STATUS_CONFIG = {
  requested:   { label: '🔍 Looking for a driver...', color: '#f59e0b', bg: '#fffbeb' },
  accepted:    { label: '🚗 Driver is on the way',    color: '#3b82f6', bg: '#eff6ff' },
  in_progress: { label: '🛺 Ride in progress',        color: '#10b981', bg: '#f0fdf4' },
  completed:   { label: '✅ Ride completed',           color: '#6b7280', bg: '#f8fafc' },
  cancelled:   { label: '❌ Ride cancelled',           color: '#ef4444', bg: '#fef2f2' },
};

const RideStatus = ({ ride, onRideUpdate }) => {
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [alreadyRated, setAlreadyRated] = useState(false);
  const [ratingDone, setRatingDone] = useState(false);
  const [checkingRating, setCheckingRating] = useState(false);
  const { emit } = useSocket();

  const config = STATUS_CONFIG[ride.status] || STATUS_CONFIG.requested;

  // When ride is completed, check if already rated
  useEffect(() => {
    if (ride.status === 'completed' && ride._id) {
      setCheckingRating(true);
      ratingAPI.checkRating(ride._id)
        .then(res => {
          if (res.data.rated) {
            setAlreadyRated(true);
            setRatingDone(true);
          }
        })
        .catch(() => {})
        .finally(() => setCheckingRating(false));
    }
  }, [ride._id, ride.status]);

  const handleCancel = async () => {
    try {
      await rideAPI.cancelRide(ride._id, { reason: 'Cancelled by passenger' });
      emit('ride:cancelled', { rideId: ride._id, cancelledBy: 'passenger' });
      toast.success('Ride cancelled');
      onRideUpdate({ ...ride, status: 'cancelled' });
    } catch {
      toast.error('Failed to cancel ride');
    }
  };

  const handleRatingSubmit = async () => {
    if (rating === 0) return toast.error('Please select a star rating');
    setSubmitLoading(true);
    try {
      await ratingAPI.submit({
        rideId: ride._id,
        rating,
        feedback: feedback.trim(),
      });
      toast.success('Thanks for your rating! ⭐');
      setRatingDone(true);
      setAlreadyRated(true);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit rating';
      if (msg.includes('already rated')) {
        setAlreadyRated(true);
        setRatingDone(true);
        toast('You have already rated this ride');
      } else {
        toast.error(msg);
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="ride-status-card" style={{ borderLeftColor: config.color }}>

      {/* Status banner */}
      <div className="status-banner" style={{ background: config.bg, borderColor: config.color }}>
        <span className="status-banner-text" style={{ color: config.color }}>
          {config.label}
        </span>
        <span className="fare-chip">₹{ride.fare}</span>
      </div>

      {/* Route */}
      <div className="route-block">
        <div className="route-row-item">
          <FaMapMarkerAlt color="#3b82f6" size={14} />
          <div>
            <span className="route-tag">From</span>
            <span className="route-place">{ride.pickupLocation?.name}</span>
          </div>
        </div>
        <div className="route-divider" />
        <div className="route-row-item">
          <FaFlag color="#ef4444" size={14} />
          <div>
            <span className="route-tag">To</span>
            <span className="route-place">{ride.destination?.name}</span>
          </div>
        </div>
      </div>

      {/* Ride meta */}
      <div className="ride-meta-row">
        <span><FaCar size={12} /> {ride.distance} km</span>
        <span>{ride.paymentMethod === 'upi' ? '📱 UPI' : '💵 Cash'}</span>
        <span className={`status-pill ${ride.status}`}>{ride.status.replace('_', ' ')}</span>
      </div>

      {/* Driver info — shown when accepted or in progress or completed */}
      {ride.driver && ['accepted', 'in_progress', 'completed'].includes(ride.status) && (
        <div className="driver-card">
          <div className="driver-card-left">
            <div className="driver-avatar-circle">
              {ride.driver.name?.[0]?.toUpperCase() || 'D'}
            </div>
            <div className="driver-card-info">
              <strong>{ride.driver.name}</strong>
              <span>{ride.driver.vehicleType} · {ride.driver.vehicleNumber || 'N/A'}</span>
              <span>⭐ {ride.driver.averageRating > 0 ? ride.driver.averageRating : 'New driver'}</span>
            </div>
          </div>
          {ride.driver.phone && (
            <a href={`tel:${ride.driver.phone}`} className="call-driver-btn">
              <FaPhone size={13} /> Call
            </a>
          )}
        </div>
      )}

      {/* Cancel button — only when requested */}
      {ride.status === 'requested' && (
        <button onClick={handleCancel} className="btn-danger full" style={{ marginTop: 12 }}>
          Cancel Ride
        </button>
      )}

      {/* ---- RATING SECTION ---- */}
      {ride.status === 'completed' && (
        <div className="rating-section">
          <div className="rating-section-divider" />

          {checkingRating && (
            <div style={{ textAlign: 'center', padding: 12 }}>
              <div className="spinner" style={{ margin: '0 auto' }} />
            </div>
          )}

          {!checkingRating && ratingDone && (
            <div className="rating-done-box">
              <FaCheckCircle color="#10b981" size={28} />
              <div>
                <strong>Rating submitted!</strong>
                <p>Thank you for your feedback 🙏</p>
                {rating > 0 && (
                  <div className="submitted-stars">
                    {[1,2,3,4,5].map(s => (
                      <FaStar key={s} size={18} color={s <= rating ? '#f59e0b' : '#d1d5db'} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {!checkingRating && !ratingDone && (
            <div className="rating-form-box">
              <h4>Rate your ride</h4>
              <p className="rating-subtitle">How was your experience with {ride.driver?.name || 'the driver'}?</p>

              {/* Stars */}
              <div className="star-rating-row">
                {[1, 2, 3, 4, 5].map(s => (
                  <button
                    key={s}
                    type="button"
                    className="star-btn"
                    onMouseEnter={() => setHoveredStar(s)}
                    onMouseLeave={() => setHoveredStar(0)}
                    onClick={() => setRating(s)}
                  >
                    <FaStar
                      size={36}
                      color={s <= (hoveredStar || rating) ? '#f59e0b' : '#e5e7eb'}
                      style={{ transition: 'color 0.1s' }}
                    />
                  </button>
                ))}
              </div>

              {/* Rating label */}
              {(hoveredStar || rating) > 0 && (
                <p className="star-label">
                  {['', 'Poor 😞', 'Fair 😐', 'Good 🙂', 'Very Good 😊', 'Excellent! 🤩'][hoveredStar || rating]}
                </p>
              )}

              {/* Feedback */}
              <textarea
                className="feedback-textarea"
                placeholder="Share your experience (optional)..."
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                rows={3}
                maxLength={300}
              />
              <span className="char-count">{feedback.length}/300</span>

              {/* Submit */}
              <button
                onClick={handleRatingSubmit}
                disabled={submitLoading || rating === 0}
                className="btn-primary full"
                style={{ marginTop: 8 }}
              >
                {submitLoading
                  ? 'Submitting...'
                  : rating === 0
                    ? 'Select a rating to submit'
                    : `Submit ${rating}★ Rating`}
              </button>

              <button
                onClick={() => { setRatingDone(true); }}
                className="skip-rating-btn"
              >
                Skip for now
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RideStatus;
