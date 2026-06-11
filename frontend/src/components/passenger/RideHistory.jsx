import { useEffect, useState } from 'react';
import { rideAPI } from '../../services/api';

const RideHistory = () => {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    rideAPI.getMyRides().then(res => {
      setRides(res.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="card"><div className="spinner" /></div>;

  return (
    <div className="card">
      <h3>Ride History</h3>
      {rides.length === 0 ? (
        <div className="empty-state">
          <p>🛺</p>
          <p>No rides yet. Book your first ride!</p>
        </div>
      ) : (
        <div className="ride-list">
          {rides.map(ride => (
            <div key={ride._id} className="ride-history-item">
              <div className="rh-top">
                <span className={`status-badge ${ride.status}`}>{ride.status.replace('_', ' ')}</span>
                <span className="rh-fare">₹{ride.fare}</span>
              </div>
              <p className="rh-route">{ride.pickupLocation.name} → {ride.destination.name}</p>
              {ride.driver && <p className="rh-driver">Driver: {ride.driver.name}</p>}
              <p className="rh-date">{new Date(ride.createdAt).toLocaleString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
              })}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RideHistory;
