import { useState, useEffect } from 'react';
import { rideAPI } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import PaymentModal from '../payment/PaymentModal';
import toast from 'react-hot-toast';
import { FaClock } from 'react-icons/fa';

const ActiveRide = ({ ride, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [now, setNow] = useState(new Date());
  const { emit } = useSocket();
  const { user } = useAuth();

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(timer);
  }, []);

  const canStartRide = () => {
    if (!ride.isScheduled || !ride.scheduledTime) return true;
    const scheduled = new Date(ride.scheduledTime);
    const diffMin = (scheduled - now) / 60000;
    return diffMin <= 5; // allow start 5 min before scheduled time
  };

  const minsUntilStart = () => {
    if (!ride.scheduledTime) return 0;
    return Math.max(0, Math.round((new Date(ride.scheduledTime) - now) / 60000));
  };

  const updateStatus = async (status) => {
    setLoading(true);
    try {
      const res = await rideAPI.updateStatus(ride._id, { status });
      emit('ride:status_update', { rideId: ride._id, status });
      toast.success(`Ride ${status.replace('_', ' ')}`);
      onUpdate(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot perform this action yet');
    } finally {
      setLoading(false);
    }
  };

  const simulateLocation = () => {
    const jitter = () => (Math.random() - 0.5) * 0.002;
    emit('driver:location', {
      driverId: user._id,
      lat: ride.pickupLocation.lat + jitter(),
      lng: ride.pickupLocation.lng + jitter(),
      rideId: ride._id,
    });
    toast.success('📍 Location updated');
  };

  const startBlocked = ride.isScheduled && !canStartRide();

  return (
    <div className="card active-ride-card">
      <div className="active-ride-header">
        <h3>🚗 Active Ride</h3>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {ride.isScheduled && (
            <span className="scheduled-tag">📅 Scheduled</span>
          )}
          <span className={`status-badge ${ride.status}`}>{ride.status.replace('_', ' ')}</span>
        </div>
      </div>

      {ride.isScheduled && ride.scheduledTime && (
        <div className={`schedule-info-bar ${canStartRide() ? 'ready' : 'waiting'}`}>
          <FaClock size={13} />
          {canStartRide()
            ? '✅ Scheduled time reached — you can start the ride'
            : `⏳ Scheduled for ${new Date(ride.scheduledTime).toLocaleString('en-IN', {
                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
              })} — ride starts in ${minsUntilStart()} min`
          }
        </div>
      )}

      <div className="detail-grid">
        <div className="detail-item"><span className="detail-label">Passenger</span><strong>{ride.passenger?.name}</strong></div>
        <div className="detail-item">
          <span className="detail-label">Phone</span>
          <a href={`tel:${ride.passenger?.phone}`} className="phone-link">{ride.passenger?.phone || 'N/A'}</a>
        </div>
        <div className="detail-item"><span className="detail-label">Pickup</span><strong>{ride.pickupLocation.name}</strong></div>
        <div className="detail-item"><span className="detail-label">Drop</span><strong>{ride.destination.name}</strong></div>
        <div className="detail-item"><span className="detail-label">Distance</span><strong>{ride.distance} km</strong></div>
        <div className="detail-item"><span className="detail-label">Fare</span><strong className="fare-highlight">₹{ride.fare}</strong></div>
        <div className="detail-item"><span className="detail-label">Payment</span><strong>{ride.paymentMethod === 'upi' ? '📱 UPI' : '💵 Cash'}</strong></div>
        {ride.isScheduled && ride.scheduledTime && (
          <div className="detail-item">
            <span className="detail-label">Scheduled At</span>
            <strong>{new Date(ride.scheduledTime).toLocaleString('en-IN', {
              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
            })}</strong>
          </div>
        )}
      </div>

      <div className="action-row">
        {ride.status === 'accepted' && (
          <>
            <button onClick={simulateLocation} className="btn-secondary">📍 Update Location</button>
            <button
              onClick={() => updateStatus('in_progress')}
              className="btn-success"
              disabled={loading || startBlocked}
              title={startBlocked ? `Can only start 5 min before scheduled time (${minsUntilStart()} min remaining)` : ''}
            >
              {startBlocked ? `⏳ Start in ${minsUntilStart()} min` : '🚀 Start Ride'}
            </button>
            <button onClick={() => updateStatus('cancelled')} className="btn-danger" disabled={loading}>
              Cancel
            </button>
          </>
        )}
        {ride.status === 'in_progress' && (
          <>
            <button onClick={simulateLocation} className="btn-secondary">📍 Update Location</button>
            <button onClick={() => setShowPayment(true)} className="btn-primary full" disabled={loading}>
              💳 Complete & Collect Payment
            </button>
          </>
        )}
      </div>

      {showPayment && (
        <PaymentModal
          ride={ride}
          onClose={() => setShowPayment(false)}
          onPaid={() => {
            setShowPayment(false);
            emit('ride:status_update', { rideId: ride._id, status: 'completed' });
            onUpdate({ ...ride, status: 'completed' });
          }}
        />
      )}
    </div>
  );
};

export default ActiveRide;
