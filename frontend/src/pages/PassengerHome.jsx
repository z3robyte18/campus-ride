import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { rideAPI, driverAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import RequestRide from '../components/passenger/RequestRide';
import RideStatus from '../components/passenger/RideStatus';
import RideHistory from '../components/passenger/RideHistory';
import LiveMap from '../components/map/LiveMap';
import PaymentHistory from './PaymentHistory';
import toast from 'react-hot-toast';

const ACTIVE_STATUSES = ['requested', 'accepted', 'in_progress'];
const SHOW_STATUSES = [
  'requested',
  'accepted',
  'in_progress',
  'completed',
  'cancelled'
];

const PassengerHome = () => {
  const { user } = useAuth();
  const [activeRide, setActiveRide] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [onlineDrivers, setOnlineDrivers] = useState([]);
  const [tab, setTab] = useState('book');
  const { socket, connected } = useSocket();
  const pollRef = useRef(null);

  const refreshDrivers = useCallback(() => {
    driverAPI.getOnlineDrivers()
      .then(res => setOnlineDrivers(res.data))
      .catch(() => {});
  }, []);

  const refreshActiveRide = useCallback(() => {
    rideAPI.getActiveRide()
      .then(res => {
        if (res.data) {
          setActiveRide(prev => {
            // Don't overwrite if user already dismissed rating
            if (prev?._id === res.data._id && prev?.status === 'completed' && res.data.status === 'completed') {
              return prev;
            }
            return res.data;
          });
        } else {
          // Only clear if there's no ride in display state
          setActiveRide(prev => {
            if (prev && ACTIVE_STATUSES.includes(prev.status)) return null;
            return prev;
          });
        }
      })
      .catch(() => {});
  }, []);

  // Initial load
  useEffect(() => {
    refreshActiveRide();
    refreshDrivers();
  }, []);

  // Polling fallback every 8 seconds
  useEffect(() => {
    pollRef.current = setInterval(() => {
      refreshActiveRide();
      refreshDrivers();
    }, 8000);
    return () => clearInterval(pollRef.current);
  }, [refreshActiveRide, refreshDrivers]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const onRideAccepted = (ride) => {
      setActiveRide(ride);
      toast.success('🎉 Driver accepted your ride!');
      refreshDrivers();
    };

    const onStatusUpdate = (payload) => {
  const ride = payload?.ride || payload;
  if (!ride || !ride._id) return;

  if (ride.status === 'completed') {
    toast.success('✅ Ride completed! Please rate your driver.');
    refreshDrivers();

    setActiveRide(ride); // keep completed ride visible
    return;
  }

  if (ride.status === 'cancelled') {
    toast.error('Ride was cancelled.');
    refreshDrivers();

    setActiveRide(ride); // keep cancelled ride visible
    return;
  }

  if (ride.status === 'in_progress') {
    toast('🛺 Your ride has started!', { icon: '🚀' });
  }

  setActiveRide(ride);
};

    const onDriverLocation = ({ lat, lng }) => {
      setDriverLocation({ lat, lng });
    };

    const onDriverStatusUpdate = () => {
      refreshDrivers();
    };

    const onRideCancelled = ({ rideId }) => {
      setActiveRide(prev => {
        if (prev?._id === rideId) return { ...prev, status: 'cancelled' };
        return prev;
      });
      toast.error('Your ride was cancelled by the driver.');
      refreshDrivers();
    };

    socket.on('ride:accepted', onRideAccepted);
    socket.on('ride:status_update', onStatusUpdate);
    socket.on('driver:location', onDriverLocation);
    socket.on('driver:status_update', onDriverStatusUpdate);
    socket.on('ride:cancelled', onRideCancelled);

    return () => {
      socket.off('ride:accepted', onRideAccepted);
      socket.off('ride:status_update', onStatusUpdate);
      socket.off('driver:location', onDriverLocation);
      socket.off('driver:status_update', onDriverStatusUpdate);
      socket.off('ride:cancelled', onRideCancelled);
    };
  }, [socket, connected]);

  // Dismiss completed/cancelled ride — go back to booking
  const handleDismissRide = () => {
    setActiveRide(null);
    setDriverLocation(null);
  };

  const showRideStatus = activeRide && SHOW_STATUSES.includes(activeRide.status);
  const isActiveRide = activeRide && ACTIVE_STATUSES.includes(activeRide.status);
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
          <span className={`avail-pill ${connected ? 'green' : 'gray'}`}>
            {connected ? '● Live' : '● Reconnecting...'}
          </span>
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
            {showRideStatus ? (
              <>
                <RideStatus
                  ride={activeRide}
                  onRideUpdate={(updatedRide) => setActiveRide(updatedRide)}
                />
                {/* Show New Ride button after completed/cancelled */}
                {!isActiveRide && (
                  <button
                    className="btn-primary full"
                    style={{ marginTop: 12 }}
                    onClick={handleDismissRide}
                  >
                    + Book Another Ride
                  </button>
                )}
              </>
            ) : (
              <RequestRide onRideRequested={(ride) => setActiveRide(ride)} />
            )}
          </div>
          <LiveMap
            drivers={onlineDrivers}
            activeRide={isActiveRide ? activeRide : null}
            driverLocation={driverLocation}
          />
        </div>
      )}

      {tab === 'history' && <RideHistory />}
      {tab === 'payments' && <PaymentHistory />}
      {tab === 'map' && (
        <LiveMap
          drivers={onlineDrivers}
          activeRide={isActiveRide ? activeRide : null}
          driverLocation={driverLocation}
        />
      )}
    </div>
  );
};

export default PassengerHome;
