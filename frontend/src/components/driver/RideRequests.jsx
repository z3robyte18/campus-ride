import { useState, useEffect } from 'react';
import { rideAPI } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import toast from 'react-hot-toast';
import { FaMapMarkerAlt, FaFlag, FaCar, FaCheck, FaClock } from 'react-icons/fa';

const RideRequests = ({ onAccept, isOnline }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());
  const { on, off } = useSocket();

  // Tick every 30 seconds to update countdowns
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const fetchRequests = () => {
    rideAPI.getAvailable()
      .then(res => setRequests(res.data))
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRequests();
    on('ride:new_request', (ride) => {
      // Only show scheduled ride if within 15 min window
      if (ride.isScheduled && ride.scheduledTime) {
        const diff = (new Date(ride.scheduledTime) - new Date()) / 60000;
        if (diff > 15) return; // don't add to list yet
      }
      setRequests(prev => [ride, ...prev.filter(r => r._id !== ride._id)]);
      toast('New ride request! 🛺', { icon: '🔔' });
    });
    on('ride:taken', ({ rideId }) => {
      setRequests(prev => prev.filter(r => r._id !== rideId));
    });
    return () => { off('ride:new_request'); off('ride:taken'); };
  }, []);

  const handleAccept = async (rideId) => {
    try {
      const res = await rideAPI.acceptRide(rideId);
      toast.success('Ride accepted!');
      setRequests(prev => prev.filter(r => r._id !== rideId));
      onAccept(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept ride');
      fetchRequests();
    }
  };

  const getScheduledInfo = (ride) => {
    if (!ride.isScheduled || !ride.scheduledTime) return null;
    const scheduled = new Date(ride.scheduledTime);
    const diffMs = scheduled - now;
    const diffMin = Math.round(diffMs / 60000);
    if (diffMin > 15) return { canAccept: false, label: `Scheduled — ${Math.floor(diffMin / 60)}h ${diffMin % 60}m away` };
    if (diffMin > 0) return { canAccept: true, label: `Starts in ${diffMin} min` };
    return { canAccept: true, label: 'Scheduled time reached' };
  };

  if (!isOnline) return (
    <div className="card offline-card">
      <div className="offline-icon">🔴</div>
      <h3>You are offline</h3>
      <p>Toggle online to start receiving ride requests</p>
    </div>
  );

  if (loading) return <div className="card"><div className="spinner" /></div>;

  return (
    <div className="card">
      <div className="card-header">
        <h3>Ride Requests</h3>
        {requests.length > 0 && <span className="badge-count">{requests.length}</span>}
      </div>
      {requests.length === 0 ? (
        <div className="empty-state">
          <p>👀</p>
          <p>Waiting for ride requests...</p>
        </div>
      ) : (
        <div className="ride-list">
          {requests.map(ride => {
            const schedInfo = getScheduledInfo(ride);
            return (
              <div key={ride._id} className={`request-card ${ride.isScheduled ? 'scheduled-card' : ''}`}>
                {ride.isScheduled && (
                  <div className={`scheduled-banner ${schedInfo?.canAccept ? 'ready' : 'waiting'}`}>
                    <FaClock size={12} />
                    <span>{schedInfo?.label}</span>
                    {!schedInfo?.canAccept && (
                      <span className="scheduled-note">Available to accept 15 min before</span>
                    )}
                  </div>
                )}
                <div className="request-top">
                  <span className="passenger-name">👤 {ride.passenger?.name}</span>
                  <span className="payment-tag">{ride.paymentMethod}</span>
                </div>
                <div className="request-route">
                  <div className="route-row"><FaMapMarkerAlt color="#3b82f6" size={12} /> {ride.pickupLocation.name}</div>
                  <div className="route-row"><FaFlag color="#ef4444" size={12} /> {ride.destination.name}</div>
                </div>
                <div className="request-meta">
                  <span><FaCar size={12} /> {ride.distance} km</span>
                  <span className="request-fare">₹{ride.fare}</span>
                </div>
                {ride.isScheduled && (
                  <div className="scheduled-time-row">
                    <FaClock size={12} color="#f59e0b" />
                    <span>Scheduled: {new Date(ride.scheduledTime).toLocaleString('en-IN', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                    })}</span>
                  </div>
                )}
                <button
                  onClick={() => handleAccept(ride._id)}
                  className="btn-success full"
                  disabled={ride.isScheduled && schedInfo && !schedInfo.canAccept}
                >
                  {ride.isScheduled && schedInfo && !schedInfo.canAccept
                    ? `⏳ Accept opens 15 min before`
                    : <><FaCheck /> Accept Ride</>
                  }
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RideRequests;
