import { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { rideAPI, driverAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import RequestRide from '../components/passenger/RequestRide';
import RideStatus from '../components/passenger/RideStatus';
import RideHistory from '../components/passenger/RideHistory';
import LiveMap from '../components/map/LiveMap';
import PaymentHistory from './PaymentHistory';
import toast from 'react-hot-toast';

const PassengerHome = () => {
  const { user } = useAuth();
  const [activeRide, setActiveRide] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [onlineDrivers, setOnlineDrivers] = useState([]);
  const [tab, setTab] = useState('book');
  const { on, off } = useSocket();

  const refreshDrivers = () => {
    driverAPI.getOnlineDrivers().then(res => setOnlineDrivers(res.data)).catch(() => {});
  };

  useEffect(() => {
    rideAPI.getActiveRide().then(res => { if (res.data) setActiveRide(res.data); });
    refreshDrivers();

    on('ride:accepted', (ride) => {
      setActiveRide(ride);
      toast.success('Driver accepted your ride! 🎉');
      refreshDrivers();
    });
    on('ride:status_update', ({ ride }) => {
      setActiveRide(ride);
      if (ride.status === 'completed') {
        toast.success('Ride completed! Please rate your driver.');
        refreshDrivers();
      }
      if (ride.status === 'cancelled') {
        toast.error('Ride was cancelled.');
        refreshDrivers();
      }
    });
    on('driver:location', ({ lat, lng }) => setDriverLocation({ lat, lng }));
    on('driver:status_update', refreshDrivers);

    return () => {
      off('ride:accepted'); off('ride:status_update');
      off('driver:location'); off('driver:status_update');
    };
  }, []);

  const activeStatuses = ['requested', 'accepted', 'in_progress'];
  const hasActiveRide = activeRide && activeStatuses.includes(activeRide.status);

  const availableCount = onlineDrivers.filter(d => !d.isBusy).length;
  const busyCount = onlineDrivers.filter(d => d.isBusy).length;

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Welcome, {user?.name} 👋</h2>
        <div className="driver-availability-bar">
          <span className="avail-pill green">🟢 {availableCount} available</span>
          <span className="avail-pill orange">🟡 {busyCount} busy</span>
          <span className="avail-pill gray">Total online: {onlineDrivers.length}</span>
        </div>
      </div>

      <div className="tabs">
        <button className={tab === 'book' ? 'tab active' : 'tab'} onClick={() => setTab('book')}>🛺 Book</button>
        <button className={tab === 'history' ? 'tab active' : 'tab'} onClick={() => setTab('history')}>📋 History</button>
        <button className={tab === 'payments' ? 'tab active' : 'tab'} onClick={() => setTab('payments')}>💳 Payments</button>
        <button className={tab === 'map' ? 'tab active' : 'tab'} onClick={() => setTab('map')}>🗺️ Map</button>
      </div>

      {tab === 'book' && (
        <div className="two-col">
          <div>
            {hasActiveRide
              ? <RideStatus ride={activeRide} onRideUpdate={setActiveRide} />
              : <RequestRide onRideRequested={setActiveRide} />
            }
            {activeRide && !hasActiveRide && (
              <RideStatus ride={activeRide} onRideUpdate={setActiveRide} />
            )}
          </div>
          <LiveMap drivers={onlineDrivers} activeRide={activeRide} driverLocation={driverLocation} />
        </div>
      )}
      {tab === 'history' && <RideHistory />}
      {tab === 'payments' && <PaymentHistory />}
      {tab === 'map' && (
        <LiveMap drivers={onlineDrivers} activeRide={activeRide} driverLocation={driverLocation} />
      )}
    </div>
  );
};

export default PassengerHome;
