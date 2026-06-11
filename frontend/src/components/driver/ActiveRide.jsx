import { useState } from 'react';
import { rideAPI } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import PaymentModal from '../payment/PaymentModal';
import toast from 'react-hot-toast';

const ActiveRide = ({ ride, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const { emit } = useSocket();
  const { user } = useAuth();

  const updateStatus = async (status) => {
    setLoading(true);
    try {
      const res = await rideAPI.updateStatus(ride._id, { status });
      emit('ride:status_update', { rideId: ride._id, status });
      toast.success(`Ride ${status.replace('_', ' ')}`);
      onUpdate(res.data);
    } catch {
      toast.error('Failed to update ride status');
    } finally {
      setLoading(false);
    }
  };

  const simulateLocation = () => {
    const jitter = () => (Math.random() - 0.5) * 0.002;
    const newLat = ride.pickupLocation.lat + jitter();
    const newLng = ride.pickupLocation.lng + jitter();
    emit('driver:location', {
      driverId: user._id,
      lat: newLat, lng: newLng,
      rideId: ride._id,
    });
    toast.success('📍 Location updated');
  };

  const handleCompleteClick = () => {
    setShowPayment(true);
  };

  const handlePaymentDone = () => {
    setShowPayment(false);
    emit('ride:status_update', { rideId: ride._id, status: 'completed' });
    onUpdate({ ...ride, status: 'completed' });
  };

  return (
    <div className="card active-ride-card">
      <div className="active-ride-header">
        <h3>🚗 Active Ride</h3>
        <span className={`status-badge ${ride.status}`}>{ride.status.replace('_', ' ')}</span>
      </div>

      <div className="detail-grid">
        <div className="detail-item">
          <span className="detail-label">Passenger</span>
          <strong>{ride.passenger?.name}</strong>
        </div>
        <div className="detail-item">
          <span className="detail-label">Phone</span>
          <a href={`tel:${ride.passenger?.phone}`} className="phone-link">
            {ride.passenger?.phone || 'N/A'}
          </a>
        </div>
        <div className="detail-item">
          <span className="detail-label">Pickup</span>
          <strong>{ride.pickupLocation.name}</strong>
        </div>
        <div className="detail-item">
          <span className="detail-label">Drop</span>
          <strong>{ride.destination.name}</strong>
        </div>
        <div className="detail-item">
          <span className="detail-label">Distance</span>
          <strong>{ride.distance} km</strong>
        </div>
        <div className="detail-item">
          <span className="detail-label">Fare</span>
          <strong className="fare-highlight">₹{ride.fare}</strong>
        </div>
        <div className="detail-item">
          <span className="detail-label">Payment</span>
          <strong>{ride.paymentMethod === 'upi' ? '📱 UPI' : '💵 Cash'}</strong>
        </div>
      </div>

      <div className="action-row">
        {ride.status === 'accepted' && (
          <>
            <button onClick={simulateLocation} className="btn-secondary">
              📍 Update Location
            </button>
            <button onClick={() => updateStatus('in_progress')} className="btn-success" disabled={loading}>
              🚀 Start Ride
            </button>
            <button onClick={() => updateStatus('cancelled')} className="btn-danger" disabled={loading}>
              Cancel
            </button>
          </>
        )}
        {ride.status === 'in_progress' && (
          <>
            <button onClick={simulateLocation} className="btn-secondary">
              📍 Update Location
            </button>
            <button onClick={handleCompleteClick} className="btn-primary full" disabled={loading}>
              💳 Complete & Collect Payment
            </button>
          </>
        )}
      </div>

      {showPayment && (
        <PaymentModal
          ride={ride}
          onClose={() => setShowPayment(false)}
          onPaid={handlePaymentDone}
        />
      )}
    </div>
  );
};

export default ActiveRide;
