import { useState, useEffect } from 'react';
import { rideAPI, driverAPI } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import toast from 'react-hot-toast';
import { FaMapMarkerAlt, FaFlag, FaMoneyBill } from 'react-icons/fa';

const CAMPUS_LOCATIONS = [
  { name: 'Main Gate', lat: 29.8644, lng: 77.8937 },
  { name: 'Convocation Hall', lat: 29.8671, lng: 77.8956 },
  { name: 'IIT Roorkee Main Building', lat: 29.8674, lng: 77.8960 },
  { name: 'James Thomason Building', lat: 29.8680, lng: 77.8940 },
  { name: 'Saharanpur Campus Gate', lat: 29.8700, lng: 77.9000 },
  { name: 'Old FRI Area', lat: 29.8650, lng: 77.8930 },
  { name: 'Stadium', lat: 29.8660, lng: 77.9010 },
  { name: 'Hospital', lat: 29.8690, lng: 77.8970 },
  { name: 'Rajendra Bhawan', lat: 29.8685, lng: 77.8945 },
  { name: 'Cautley Bhawan', lat: 29.8665, lng: 77.8950 },
];

const calcDistance = (loc1, loc2) => {
  const R = 6371;
  const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
  const dLng = (loc2.lng - loc1.lng) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(loc1.lat * Math.PI / 180) *
    Math.cos(loc2.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const RequestRide = ({ onRideRequested }) => {
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [loading, setLoading] = useState(false);
  const [onlineDrivers, setOnlineDrivers] = useState([]);
  const [estimatedFare, setEstimatedFare] = useState(null);
  const { emit } = useSocket();

  useEffect(() => {
    driverAPI.getOnlineDrivers().then(res => setOnlineDrivers(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (pickup && destination && pickup !== destination) {
      const p = CAMPUS_LOCATIONS.find(l => l.name === pickup);
      const d = CAMPUS_LOCATIONS.find(l => l.name === destination);
      if (p && d) {
        const dist = calcDistance(p, d);
        setEstimatedFare(Math.max(10, Math.round(dist * 5)));
      }
    } else {
      setEstimatedFare(null);
    }
  }, [pickup, destination]);

  const handleRequest = async (e) => {
    e.preventDefault();
    if (pickup === destination) return toast.error('Pickup and destination cannot be same');
    const pickupObj = CAMPUS_LOCATIONS.find(l => l.name === pickup);
    const destObj = CAMPUS_LOCATIONS.find(l => l.name === destination);
    if (!pickupObj || !destObj) return toast.error('Please select valid locations');
    const distance = calcDistance(pickupObj, destObj);
    setLoading(true);
    try {
      const res = await rideAPI.requestRide({
        pickupLocation: pickupObj,
        destination: destObj,
        distance: Math.round(distance * 100) / 100,
        paymentMethod,
      });
      emit('ride:new_request', res.data);
      toast.success('Ride requested! Looking for drivers...');
      onRideRequested(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to request ride');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3>Book a Ride</h3>
        <div className={`driver-pill ${onlineDrivers.length > 0 ? 'available' : 'unavailable'}`}>
          <span className="dot" />
          {onlineDrivers.length} driver{onlineDrivers.length !== 1 ? 's' : ''} online
        </div>
      </div>
      <form onSubmit={handleRequest}>
        <div className="form-group">
          <label><FaMapMarkerAlt color="#3b82f6" /> Pickup Location</label>
          <select required value={pickup} onChange={e => setPickup(e.target.value)}>
            <option value="">Select pickup point</option>
            {CAMPUS_LOCATIONS.map(l => <option key={l.name} value={l.name}>{l.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label><FaFlag color="#ef4444" /> Destination</label>
          <select required value={destination} onChange={e => setDestination(e.target.value)}>
            <option value="">Select destination</option>
            {CAMPUS_LOCATIONS.map(l => <option key={l.name} value={l.name}>{l.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label><FaMoneyBill color="#10b981" /> Payment Method</label>
          <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
          </select>
        </div>
        {estimatedFare && (
          <div className="fare-estimate">
            Estimated fare: <strong>₹{estimatedFare}</strong>
          </div>
        )}
        <button type="submit" className="btn-primary full" disabled={loading || onlineDrivers.length === 0}>
          {loading ? 'Finding driver...' : onlineDrivers.length === 0 ? 'No drivers available' : 'Request Ride 🛺'}
        </button>
      </form>
    </div>
  );
};

export default RequestRide;
