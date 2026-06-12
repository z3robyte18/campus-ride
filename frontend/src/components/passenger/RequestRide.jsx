import { useState, useEffect } from 'react';
import { rideAPI, driverAPI } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import toast from 'react-hot-toast';
import { FaMapMarkerAlt, FaFlag, FaMoneyBill } from 'react-icons/fa';

const CAMPUS_LOCATIONS = [
  // Main Gates & Entry Points
  { name: 'Main Gate (Haridwar Road)', lat: 29.8644, lng: 77.8937, category: 'Gate' },
  { name: 'Civil Lines Gate', lat: 29.8680, lng: 77.8910, category: 'Gate' },
  { name: 'Kheri Gate', lat: 29.8720, lng: 77.8950, category: 'Gate' },
  { name: 'Back Gate (Stadium Road)', lat: 29.8660, lng: 77.9020, category: 'Gate' },
  { name: 'Hospital Gate', lat: 29.8700, lng: 77.8975, category: 'Gate' },
  // Hostels
  { name: 'Cautley Bhawan', lat: 29.8665, lng: 77.8950, category: 'Hostel' },
  { name: 'Rajendra Bhawan', lat: 29.8685, lng: 77.8945, category: 'Hostel' },
  { name: 'Ganga Bhawan', lat: 29.8670, lng: 77.8930, category: 'Hostel' },
  { name: 'Alaknanda Bhawan', lat: 29.8675, lng: 77.8925, category: 'Hostel' },
  { name: 'Yamuna Bhawan', lat: 29.8660, lng: 77.8940, category: 'Hostel' },
  { name: 'Saraswati Bhawan', lat: 29.8655, lng: 77.8955, category: 'Hostel' },
  { name: 'Jahnavi Bhawan', lat: 29.8650, lng: 77.8960, category: 'Hostel' },
  { name: 'Kasturba Bhawan', lat: 29.8645, lng: 77.8970, category: 'Hostel' },
  { name: 'Radha Krishnan Bhawan', lat: 29.8690, lng: 77.8960, category: 'Hostel' },
  { name: 'Ravindra Bhawan', lat: 29.8695, lng: 77.8955, category: 'Hostel' },
  { name: 'Bhagirathi Bhawan', lat: 29.8640, lng: 77.8965, category: 'Hostel' },
  { name: 'Mandakini Bhawan', lat: 29.8635, lng: 77.8958, category: 'Hostel' },
  // Academic Buildings
  { name: 'Main Building (Admin Block)', lat: 29.8674, lng: 77.8960, category: 'Academic' },
  { name: 'James Thomason Building', lat: 29.8680, lng: 77.8940, category: 'Academic' },
  { name: 'Convocation Hall', lat: 29.8671, lng: 77.8956, category: 'Academic' },
  { name: 'Civil Engineering Dept', lat: 29.8662, lng: 77.8948, category: 'Academic' },
  { name: 'Mechanical Engineering Dept', lat: 29.8667, lng: 77.8952, category: 'Academic' },
  { name: 'Electronics Dept (ECED)', lat: 29.8658, lng: 77.8944, category: 'Academic' },
  { name: 'Computer Science Dept (CSE)', lat: 29.8670, lng: 77.8942, category: 'Academic' },
  { name: 'Architecture Dept', lat: 29.8676, lng: 77.8966, category: 'Academic' },
  { name: 'Chemistry Dept', lat: 29.8669, lng: 77.8935, category: 'Academic' },
  { name: 'Physics Dept', lat: 29.8664, lng: 77.8932, category: 'Academic' },
  { name: 'Mathematics Dept', lat: 29.8672, lng: 77.8938, category: 'Academic' },
  // Facilities
  { name: 'IIT Hospital (AHEC)', lat: 29.8700, lng: 77.8970, category: 'Facility' },
  { name: 'Central Library', lat: 29.8668, lng: 77.8958, category: 'Facility' },
  { name: 'Sports Ground / Stadium', lat: 29.8656, lng: 77.9005, category: 'Facility' },
  { name: 'Swimming Pool', lat: 29.8652, lng: 77.9000, category: 'Facility' },
  { name: 'SAC (Student Activity Centre)', lat: 29.8663, lng: 77.8968, category: 'Facility' },
  { name: 'Mtec / PhD Quarters', lat: 29.8710, lng: 77.8962, category: 'Facility' },
  { name: 'IITR Post Office', lat: 29.8673, lng: 77.8954, category: 'Facility' },
  { name: 'Canteen (Main)', lat: 29.8666, lng: 77.8946, category: 'Facility' },
  { name: 'Nescafe / Juice Corner', lat: 29.8660, lng: 77.8962, category: 'Facility' },
];

const CATEGORIES = ['All', 'Gate', 'Hostel', 'Academic', 'Facility'];

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
  const [pickupFilter, setPickupFilter] = useState('All');
  const [destFilter, setDestFilter] = useState('All');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [loading, setLoading] = useState(false);
  const [onlineDrivers, setOnlineDrivers] = useState([]);
  const [estimatedFare, setEstimatedFare] = useState(null);
  const [estimatedDist, setEstimatedDist] = useState(null);
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
        setEstimatedDist(Math.round(dist * 100) / 100);
        setEstimatedFare(Math.max(10, Math.round(dist * 500)));
      }
    } else {
      setEstimatedFare(null);
      setEstimatedDist(null);
    }
  }, [pickup, destination]);

  const filtered = (cat) => cat === 'All' ? CAMPUS_LOCATIONS : CAMPUS_LOCATIONS.filter(l => l.category === cat);

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
        pickupLocation: { name: pickupObj.name, lat: pickupObj.lat, lng: pickupObj.lng },
        destination: { name: destObj.name, lat: destObj.lat, lng: destObj.lng },
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
        {/* Pickup */}
        <div className="form-group">
          <label><FaMapMarkerAlt color="#3b82f6" /> Pickup Location</label>
          <div className="filter-chips">
            {CATEGORIES.map(c => (
              <button key={c} type="button"
                className={`filter-chip ${pickupFilter === c ? 'active' : ''}`}
                onClick={() => setPickupFilter(c)}>{c}</button>
            ))}
          </div>
          <select required value={pickup} onChange={e => setPickup(e.target.value)}>
            <option value="">Select pickup point</option>
            {filtered(pickupFilter).map(l => (
              <option key={l.name} value={l.name}>[{l.category}] {l.name}</option>
            ))}
          </select>
        </div>

        {/* Destination */}
        <div className="form-group">
          <label><FaFlag color="#ef4444" /> Destination</label>
          <div className="filter-chips">
            {CATEGORIES.map(c => (
              <button key={c} type="button"
                className={`filter-chip ${destFilter === c ? 'active' : ''}`}
                onClick={() => setDestFilter(c)}>{c}</button>
            ))}
          </div>
          <select required value={destination} onChange={e => setDestination(e.target.value)}>
            <option value="">Select destination</option>
            {filtered(destFilter).map(l => (
              <option key={l.name} value={l.name}>[{l.category}] {l.name}</option>
            ))}
          </select>
        </div>

        {/* Fare estimate */}
        {estimatedFare && (
          <div className="fare-estimate">
            <span>📍 {estimatedDist} km</span>
            <span>Estimated fare: <strong>₹{estimatedFare}</strong></span>
          </div>
        )}

        {/* Payment */}
        <div className="form-group">
          <label><FaMoneyBill color="#10b981" /> Payment Method</label>
          <div className="payment-method-toggle">
            <button type="button"
              className={`method-toggle-btn ${paymentMethod === 'cash' ? 'active' : ''}`}
              onClick={() => setPaymentMethod('cash')}>
              💵 Cash
            </button>
            <button type="button"
              className={`method-toggle-btn ${paymentMethod === 'upi' ? 'active' : ''}`}
              onClick={() => setPaymentMethod('upi')}>
              📱 UPI
            </button>
          </div>
        </div>

        <button type="submit" className="btn-primary full"
          disabled={loading || availableCount === 0}>
          {loading ? 'Finding driver...' : availableCount === 0 ? 'No drivers available' : 'Request Ride 🛺'}
        </button>
      </form>
    </div>
  );
};

export default RequestRide;
