import { useState, useEffect } from 'react';
import { rideAPI, driverAPI } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import toast from 'react-hot-toast';
import { FaMapMarkerAlt, FaFlag, FaMoneyBill } from 'react-icons/fa';

// Exact IITR campus locations only
const CAMPUS_LOCATIONS = [
  { name: 'Main Gate', lat: 29.8644, lng: 77.8937, category: 'Gate' },
  { name: 'Century Gate', lat: 29.8710, lng: 77.8920, category: 'Gate' },
  { name: 'Cautley Bhawan', lat: 29.8665, lng: 77.8950, category: 'Hostel' },
  { name: 'Kasturba Bhawan', lat: 29.8645, lng: 77.8970, category: 'Hostel' },
  { name: 'Sarojini Bhawan', lat: 29.8650, lng: 77.8945, category: 'Hostel' },
  { name: 'Himalaya Bhawan', lat: 29.8690, lng: 77.8935, category: 'Hostel' },
  { name: 'Vigyan Kunj', lat: 29.8658, lng: 77.8962, category: 'Hostel' },
  { name: 'Mahatma Gandhi Central Library', lat: 29.8668, lng: 77.8958, category: 'Academic' },
];

const CATEGORIES = ['All', 'Gate', 'Hostel', 'Academic'];

const calcDistance = (loc1, loc2) => {
  const R = 6371;
  const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
  const dLng = (loc2.lng - loc1.lng) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const getFare = (distance) => {
  if (distance <= 0.5) return 10;
  if (distance <= 1.0) return 20;
  if (distance <= 1.5) return 30;
  return 40;
};

const RequestRide = ({ onRideRequested }) => {
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [pickupFilter, setPickupFilter] = useState('All');
  const [destFilter, setDestFilter] = useState('All');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [loading, setLoading] = useState(false);
  const [onlineDrivers, setOnlineDrivers] = useState([]);
  const [estimatedFare, setEstimatedFare] = useState(null);
  const [estimatedDist, setEstimatedDist] = useState(null);
  const [scheduleDate, setScheduleDate] = useState('');
const [scheduleTime, setScheduleTime] = useState('');
const [isScheduled, setIsScheduled] = useState(false);
  const { emit } = useSocket();

  useEffect(() => {
    driverAPI.getOnlineDrivers()
      .then(res => setOnlineDrivers(res.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (pickup && destination && pickup !== destination) {
      const p = CAMPUS_LOCATIONS.find(l => l.name === pickup);
      const d = CAMPUS_LOCATIONS.find(l => l.name === destination);
      if (p && d) {
        const dist = calcDistance(p, d);
        const rounded = Math.round(dist * 100) / 100;
        setEstimatedDist(rounded);
        setEstimatedFare(getFare(rounded));
      }
    } else {
      setEstimatedFare(null);
      setEstimatedDist(null);
    }
  }, [pickup, destination]);

  const filtered = (cat) =>
    cat === 'All' ? CAMPUS_LOCATIONS : CAMPUS_LOCATIONS.filter(l => l.category === cat);

  const handleRequest = async (e) => {
    e.preventDefault();
    if (pickup === destination) return toast.error('Pickup and destination cannot be the same');
    const pickupObj = CAMPUS_LOCATIONS.find(l => l.name === pickup);
    const destObj = CAMPUS_LOCATIONS.find(l => l.name === destination);
    if (!pickupObj || !destObj) return toast.error('Please select valid locations');
    const distance = calcDistance(pickupObj, destObj);
    setLoading(true);
    try {
      const res = await rideAPI.requestRide({
  pickupLocation: {
    name: pickupObj.name,
    lat: pickupObj.lat,
    lng: pickupObj.lng
  },
  destination: {
    name: destObj.name,
    lat: destObj.lat,
    lng: destObj.lng
  },
  distance: Math.round(distance * 100) / 100,
  paymentMethod,

  scheduledRide: isScheduled,
  scheduledDate: scheduleDate,
  scheduledTime: scheduleTime
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
  const timeSlots = [
  '06:00 AM',
  '07:00 AM',
  '08:00 AM',
  '09:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '01:00 PM',
  '02:00 PM',
  '03:00 PM',
  '04:00 PM',
  '05:00 PM',
  '06:00 PM',
  '07:00 PM',
  '08:00 PM',
  '09:00 PM',
  '10:00 PM'
];
  const availableCount = onlineDrivers.filter(d => !d.isBusy).length;

  return (
    <div className="card">
      <div className="card-header">
        <h3>Book a Ride 🛺</h3>
        <div className={`driver-pill ${availableCount > 0 ? 'available' : 'unavailable'}`}>
          <span className="dot" />
          {availableCount} available
        </div>
      </div>

      <form onSubmit={handleRequest}>
        <div className="form-group">
          <label><FaMapMarkerAlt color="#3b82f6" /> Pickup Location</label>
          <div className="filter-chips">
            {CATEGORIES.map(c => (
              <button key={c} type="button"
                className={`filter-chip ${pickupFilter === c ? 'active' : ''}`}
                onClick={() => setPickupFilter(c)}>{c}
              </button>
            ))}
          </div>
          <select required value={pickup} onChange={e => setPickup(e.target.value)}>
            <option value="">Select pickup point</option>
            {filtered(pickupFilter).map(l => (
              <option key={l.name} value={l.name}>{l.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label><FaFlag color="#ef4444" /> Destination</label>
          <div className="filter-chips">
            {CATEGORIES.map(c => (
              <button key={c} type="button"
                className={`filter-chip ${destFilter === c ? 'active' : ''}`}
                onClick={() => setDestFilter(c)}>{c}
              </button>
            ))}
          </div>
          <select required value={destination} onChange={e => setDestination(e.target.value)}>
            <option value="">Select destination</option>
            {filtered(destFilter).map(l => (
              <option key={l.name} value={l.name}>{l.name}</option>
            ))}
          </select>
        </div>

        {estimatedFare && (
          <div className="fare-estimate">
            <span>📍 {estimatedDist} km</span>
            <span>Fare: <strong>₹{estimatedFare}</strong></span>
          </div>
        )}

        <div className="form-group">
          <label><FaMoneyBill color="#10b981" /> Payment Method</label>
          <div className="payment-method-toggle">
            <button type="button"
              className={`method-toggle-btn ${paymentMethod === 'cash' ? 'active' : ''}`}
              onClick={() => setPaymentMethod('cash')}>💵 Cash
            </button>
            <button type="button"
              className={`method-toggle-btn ${paymentMethod === 'upi' ? 'active' : ''}`}
              onClick={() => setPaymentMethod('upi')}>📱 UPI
            </button>
          </div>
        </div>

        <button type="submit" className="btn-primary full"
          disabled={loading || availableCount === 0}>
          {loading
            ? 'Finding driver...'
            : availableCount === 0
              ? 'No drivers available'
              :'Request Ride 🛺'}
        </button>
      </form>
    </div>
  );
};

export default RequestRide;
