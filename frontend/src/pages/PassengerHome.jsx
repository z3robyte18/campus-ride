import { useState, useEffect, useCallback } from 'react';
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
  const { socket, connected } = useSocket();

  const refreshDrivers = useCallback(() => {
    driverAPI.getOnlineDrivers()
      .then(res => setOnlineDrivers(res.data))
      .catch(() => {});
  }, []);

  const refreshActiveRide = useCallback(() => {
    rideAPI.getActiveRide()
      .then(res => setActiveRide(res.data || null))
      .catch(() => {});
  }, []);

  // Initial load
  useEffect(() => {
    refreshActiveRide();
    refreshDrivers();
  }, []);

  // Poll every 10 seconds as fallback when socket events might be missed
  useEffect(() => {
    const interval = setInterval(() => {
      refreshActiveRide();
      refreshDrivers();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Socket listeners — re-register whenever socket connects
  useEffect(() => {
    if (!socket) return;

    const handleRideAccepted = (ride) => {
      setActiveRide(ride);
      toast.success('Driver accepted your ride! 🎉');
      refreshDrivers();
    };

    const handleStatusUpdate = ({ ride }) => {
      if (!ride) return;
      setActiveRide(ride);
      if (ride.status === 'completed') {
        toast.success('Ride completed! Please rate your driver. ⭐');
        refreshDrivers();
      }
      if (ride.status === 'cancelled') {
        toast.error('Ride was cancelled.');
        refreshDrivers();
      }
    };

    const handleDriverLocation = ({ lat, lng }) => {
      setDriverLocation({ lat, lng });
    };

    const handleDriverStatusUpdate = () => {
      refreshDrivers();
    };

    socket.on('ride:accepted', handleRideAccepted);
    socket.on('ride:status_update', handleStatusUpdate);
    socket.on('driver:location', handleDriverLocation);
    socket.on('driver:status_update', handleDriverStatusUpdate);

    return () => {
      socket.off('ride:accepted', handleRideAccepted);
      socket.off('ride:status_update', handleStatusUpdate);
      socket.off('driver:location', handleDriverLocation);
      socket.off('driver:status_update', handleDriverStatusUpdate);
    };
  }, [socket, connected]); // re-run when socket or connected changes

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
          <span className="avail-pill orange">🟡 {busyCount} on a ride</span>
          <span className="avail-pill gray">Total: {onlineDrivers.length} online</span>
          {connected
            ? <span className="avail-pill green">● Live</span>
            : <span className="avail-pill gray">● Reconnecting...</span>
          }
        </div>
      </div>

      <div className="tabs">
        <button className={tab === 'book' ? 'tab active' : 'tab'} onClick={() => setTab('book')}>
          🛺 Book
        </button>
        <button className={tab === 'history' ? 'tab active' : 'tab'} onClick={() => setTab('history')}>
          📋 History
        </button>
        <button className={tab === 'payments' ? 'tab active' : 'tab'} onClick={() => setTab('payments')}>
          💳 Payments
        </button>
        <button className={tab === 'map' ? 'tab active' : 'tab'} onClick={() => setTab('map')}>
          🗺️ Map
        </button>
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
          <LiveMap
            drivers={onlineDrivers}
            activeRide={activeRide}
            driverLocation={driverLocation}
          />
        </div>
      )}
      {tab === 'history' && <RideHistory />}
      {tab === 'payments' && <PaymentHistory />}
      {tab === 'map' && (
        <LiveMap
          drivers={onlineDrivers}
          activeRide={activeRide}
          driverLocation={driverLocation}
        />
      )}
    </div>
  );
};

export default PassengerHome;
