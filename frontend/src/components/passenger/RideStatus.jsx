import { useState } from 'react';
import { rideAPI, ratingAPI } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import toast from 'react-hot-toast';
import { FaCar, FaStar, FaMapMarkerAlt, FaFlag, FaPhone } from 'react-icons/fa';

const STATUS_LABELS = {
  requested: '🔍 Looking for driver...',
  accepted: '🚗 Driver is on the way',
  in_progress: '🛺 Ride in progress',
  completed: '✅ Ride completed',
  cancelled: '❌ Ride cancelled',
};

const STATUS_COLORS = {
  requested: '#f59e0b',
  accepted: '#3b82f6',
  in_progress: '#10b981',
  completed: '#6b7280',
  cancelled: '#ef4444',
};

const RideStatus = ({ ride, onRideUpdate }) => {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [showRating, setShowRating] = useState(false);
  const [rated, setRated] = useState(false);
  const { emit } = useSocket();

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

  const handleRating = async () => {
    if (!rating) return toast.error('Please select a rating');
    try {
      await ratingAPI.submit({ rideId: ride._id, rating, feedback });
      toast.success('Rating submitted! Thank you.');
      setRated(true);
      setShowRating(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit rating');
    }
  };

  return (
    <div className="card ride-status-card" style={{ borderLeftColor: STATUS_COLORS[ride.status] }}>
      <div className="status-header">
        <h3>{STATUS_LABELS[ride.status]}</h3>
        <span className="fare-badge">₹{ride.fare}</span>
      </div>
      <div className="ride-route">
        <div className="route-point pickup">
          <FaMapMarkerAlt color="#3b82f6" />
          <div>
            <span className="route-label">From</span>
            <span className="route-name">{ride.pickupLocation.name}</span>
          </div>
        </div>
        <div className="route-line" />
        <div className="route-point dest">
          <FaFlag color="#ef4444" />
          <div>
            <span className="route-label">To</span>
            <span className="route-name">{ride.destination.name}</span>
          </div>
        </div>
      </div>
      <div className="ride-meta">
        <span><FaCar /> {ride.distance} km</span>
        <span>💳 {ride.paymentMethod?.toUpperCase()}</span>
      </div>
      {ride.driver && (
        <div className="driver-info-box">
          <div className="driver-info-header">
            <div className="driver-avatar">{ride.driver.name?.[0]}</div>
            <div>
              <strong>{ride.driver.name}</strong>
              <p>{ride.driver.vehicleType} — {ride.driver.vehicleNumber}</p>
            </div>
            <div className="driver-rating">⭐ {ride.driver.averageRating || 'New'}</div>
          </div>
          {ride.driver.phone && (
            <a href={`tel:${ride.driver.phone}`} className="call-btn">
              <FaPhone /> Call Driver
            </a>
          )}
        </div>
      )}
      {ride.status === 'requested' && (
        <button onClick={handleCancel} className="btn-danger full">Cancel Ride</button>
      )}
      {ride.status === 'completed' && !rated && !showRating && (
        <button onClick={() => setShowRating(true)} className="btn-primary full">⭐ Rate This Ride</button>
      )}
      {showRating && (
        <div className="rating-form">
          <h4>Rate your driver</h4>
          <div className="stars-row">
            {[1, 2, 3, 4, 5].map(s => (
              <FaStar key={s} size={32} color={s <= rating ? '#f59e0b' : '#d1d5db'}
                style={{ cursor: 'pointer' }} onClick={() => setRating(s)} />
            ))}
          </div>
          <textarea placeholder="Optional feedback..." value={feedback}
            onChange={e => setFeedback(e.target.value)} rows={3} className="feedback-input" />
          <button onClick={handleRating} className="btn-primary full">Submit Rating</button>
        </div>
      )}
      {rated && <p className="success-msg">Thanks for your feedback! 🎉</p>}
    </div>
  );
};

export default RideStatus;
