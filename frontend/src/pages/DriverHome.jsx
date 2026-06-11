import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { driverAPI, rideAPI } from '../services/api';
import RideRequests from '../components/driver/RideRequests';
import ActiveRide from '../components/driver/ActiveRide';
import DriverStats from '../components/driver/DriverStats';
import LiveMap from '../components/map/LiveMap';
import PaymentHistory from './PaymentHistory';
import toast from 'react-hot-toast';

const DriverHome = () => {
  const { user, updateUser } = useAuth();
  const [isOnline, setIsOnline] = useState(user?.isOnline || false);
  const [isBusy, setIsBusy] = useState(false);
  const [activeRide, setActiveRide] = useState(null);
  const [tab, setTab] = useState('requests');
  const { emit, on, off } = useSocket();

  useEffect(() => {
    rideAPI.getActiveRide().then(res => {
      if (res.data) {
        setActiveRide(res.data);
        setIsBusy(['accepted', 'in_progress'].includes(res.data.status));
      }
    });
    on('ride:status_update', ({ ride }) => {
      setActiveRide(ride);
      setIsBusy(['accepted', 'in_progress'].includes(ride.status));
    });
    on('ride:cancelled', () => {
      setActiveRide(null);
      setIsBusy(false);
      toast.error('Ride was cancelled by passenger');
    });
    return () => { off('ride:status_update'); off('ride:cancelled'); };
  }, []);

  const toggleOnline = async () => {
    if (isBusy) return toast.error('Complete your current ride first');
    try {
      const res = await driverAPI.toggleOnline();
      setIsOnline(res.data.isOnline);
      updateUser({ isOnline: res.data.isOnline });
      emit('driver:toggle', { driverId: user._id, isOnline: res.data.isOnline });
      toast.success(res.data.isOnline ? '🟢 You are now online!' : '🔴 You are now offline');
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleAccept = (ride) => {
    setActiveRide(ride);
    setIsBusy(true);
    emit('ride:accepted', { rideId: ride._id, driverId: user._id });
    setTab('active');
  };

  const handleUpdate = (ride) => {
    setActiveRide(ride);
    if (['completed', 'cancelled'].includes(ride.status)) {
      setIsBusy(false);
      setTimeout(() => { setActiveRide(null); setTab('requests'); }, 2500);
    }
  };

  const statusLabel = !isOnline ? 'Offline' : isBusy ? 'Busy' : 'Available';
  const statusColor = !isOnline ? '#6b7280' : isBusy ? '#f59e0b' : '#10b981';

  return (
    <div className="page-container">
      <div className="driver-topbar">
        <div>
          <h2>Driver Dashboard</h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
            {user?.vehicleType} · {user?.vehicleNumber || 'N/A'}
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <button
            onClick={toggleOnline}
            disabled={isBusy}
            className={`online-toggle ${isOnline ? 'online' : 'offline'}`}
            title={isBusy ? 'Complete current ride to go offline' : ''}
          >
            {isOnline ? '🟢 Online' : '🔴 Offline'}
          </button>
          <span className="status-chip" style={{ background: statusColor + '22', color: statusColor }}>
            ● {statusLabel}
          </span>
        </div>
      </div>

      <div className="tabs">
        <button className={tab === 'requests' ? 'tab active' : 'tab'} onClick={() => setTab('requests')}>
          📥 Requests
        </button>
        {activeRide && (
          <button className={tab === 'active' ? 'tab active' : 'tab'} onClick={() => setTab('active')}>
            🚗 Active {isBusy ? '🟡' : ''}
          </button>
        )}
        <button className={tab === 'stats' ? 'tab active' : 'tab'} onClick={() => setTab('stats')}>
          📊 Stats
        </button>
        <button className={tab === 'payments' ? 'tab active' : 'tab'} onClick={() => setTab('payments')}>
          💳 Payments
        </button>
        <button className={tab === 'map' ? 'tab active' : 'tab'} onClick={() => setTab('map')}>
          🗺️ Map
        </button>
      </div>

      {tab === 'requests' && !activeRide && (
        <RideRequests onAccept={handleAccept} isOnline={isOnline} />
      )}
      {tab === 'requests' && activeRide && (
        <div className="card">
          <p>You have an active ride. Complete it before accepting new requests.</p>
          <button className="btn-primary" style={{ marginTop: 12 }} onClick={() => setTab('active')}>
            View Active Ride →
          </button>
        </div>
      )}
      {tab === 'active' && activeRide && (
        <ActiveRide ride={activeRide} onUpdate={handleUpdate} />
      )}
      {tab === 'stats' && <DriverStats />}
      {tab === 'payments' && <PaymentHistory />}
      {tab === 'map' && <LiveMap drivers={[]} activeRide={activeRide} />}
    </div>
  );
};

export default DriverHome;
