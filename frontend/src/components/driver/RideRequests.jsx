import { useState, useEffect } from 'react';
import { rideAPI } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import toast from 'react-hot-toast';
import { FaMapMarkerAlt, FaFlag, FaCar, FaCheck } from 'react-icons/fa';

const RideRequests = ({ onAccept, isOnline }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const { on, off } = useSocket();

  const fetchRequests = () => {
    rideAPI.getAvailable().then(res => setRequests(res.data)).catch(() => setRequests([])).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRequests();
    on('ride:new_request', (ride) => {
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
          {requests.map(ride => (
            <div key={ride._id} className="request-card">
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
              <button onClick={() => handleAccept(ride._id)} className="btn-success full">
                <FaCheck /> Accept Ride
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RideRequests;
