import { useEffect, useState } from 'react';
import { rideAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const PaymentHistory = () => {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    rideAPI.getMyRides().then(res => {
      setRides(res.data.filter(r => r.status === 'completed'));
    }).finally(() => setLoading(false));
  }, []);

  const totalEarnings = rides.reduce((s, r) => s + (r.fare || 0), 0);
  const upiRides = rides.filter(r => r.paymentMethod === 'upi');
  const cashRides = rides.filter(r => r.paymentMethod === 'cash');

  if (loading) return <div className="page-container"><div className="spinner" /></div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>💳 Payment History</h2>
        <p>All completed ride payments</p>
      </div>

      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card green">
          <div className="stat-val">₹{totalEarnings}</div>
          <div className="stat-lbl">Total {user.role === 'driver' ? 'Earned' : 'Spent'}</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-val">{rides.length}</div>
          <div className="stat-lbl">Total Rides</div>
        </div>
        <div className="stat-card purple">
          <div className="stat-val">{upiRides.length}</div>
          <div className="stat-lbl">UPI Payments</div>
        </div>
        <div className="stat-card yellow">
          <div className="stat-val">{cashRides.length}</div>
          <div className="stat-lbl">Cash Payments</div>
        </div>
      </div>

      <div className="card">
        <h3>Transaction History</h3>
        {rides.length === 0 ? (
          <div className="empty-state"><p>💳</p><p>No completed payments yet</p></div>
        ) : (
          <div className="payment-list">
            {rides.map(ride => (
              <div key={ride._id} className="payment-item">
                <div className="payment-left">
                  <div className="payment-icon">
                    {ride.paymentMethod === 'upi' ? '📱' : '💵'}
                  </div>
                  <div>
                    <p className="payment-route">
                      {ride.pickupLocation.name} → {ride.destination.name}
                    </p>
                    <p className="payment-meta">
                      {ride.paymentMethod.toUpperCase()} · {ride.distance} km · {new Date(ride.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                <div className="payment-right">
                  <span className="payment-amount">₹{ride.fare}</span>
                  <span className="payment-status paid">Paid</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentHistory;
