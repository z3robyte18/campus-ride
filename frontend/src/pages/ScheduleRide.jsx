import { useState, useEffect } from 'react';
import { rideAPI } from '../services/api';
import toast from 'react-hot-toast';

const CAMPUS_LOCATIONS = [
  { name: 'Main Gate (Haridwar Road)', lat: 29.8644, lng: 77.8937, category: 'Gate' },
  { name: 'Civil Lines Gate', lat: 29.8680, lng: 77.8910, category: 'Gate' },
  { name: 'Kheri Gate', lat: 29.8720, lng: 77.8950, category: 'Gate' },
  { name: 'Back Gate (Stadium Road)', lat: 29.8660, lng: 77.9020, category: 'Gate' },
  { name: 'Hospital Gate', lat: 29.8700, lng: 77.8975, category: 'Gate' },
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
  { name: 'Main Building (Admin Block)', lat: 29.8674, lng: 77.8960, category: 'Academic' },
  { name: 'James Thomason Building', lat: 29.8680, lng: 77.8940, category: 'Academic' },
  { name: 'Convocation Hall', lat: 29.8671, lng: 77.8956, category: 'Academic' },
  { name: 'Civil Engineering Dept', lat: 29.8662, lng: 77.8948, category: 'Academic' },
  { name: 'Mechanical Engineering Dept', lat: 29.8667, lng: 77.8952, category: 'Academic' },
  { name: 'Electronics Dept (ECED)', lat: 29.8658, lng: 77.8944, category: 'Academic' },
  { name: 'Computer Science Dept (CSE)', lat: 29.8670, lng: 77.8942, category: 'Academic' },
  { name: 'Central Library', lat: 29.8668, lng: 77.8958, category: 'Facility' },
  { name: 'IIT Hospital (AHEC)', lat: 29.8700, lng: 77.8970, category: 'Facility' },
  { name: 'Sports Ground / Stadium', lat: 29.8656, lng: 77.9005, category: 'Facility' },
  { name: 'SAC (Student Activity Centre)', lat: 29.8663, lng: 77.8968, category: 'Facility' },
  { name: 'Canteen (Main)', lat: 29.8666, lng: 77.8946, category: 'Facility' },
  { name: 'Mtec / PhD Quarters', lat: 29.8710, lng: 77.8962, category: 'Facility' },
];

const CATEGORIES = ['All', 'Gate', 'Hostel', 'Academic', 'Facility'];

const ScheduleRide = () => {
  const [form, setForm] = useState({ pickup: '', destination: '', date: '', time: '', note: '' });
  const [pickupFilter, setPickupFilter] = useState('All');
  const [destFilter, setDestFilter] = useState('All');
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    rideAPI.getMyRides().then(res => setSchedules(res.data.filter(r => r.isScheduled)));
  }, []);

  const filtered = (cat) => cat === 'All' ? CAMPUS_LOCATIONS : CAMPUS_LOCATIONS.filter(l => l.category === cat);

  const getCoords = (name) => {
    const loc = CAMPUS_LOCATIONS.find(l => l.name === name);
    return loc ? { lat: loc.lat, lng: loc.lng } : { lat: 29.8674, lng: 77.8960 };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.pickup === form.destination) return toast.error('Pickup and destination cannot be the same');
    const scheduledTime = new Date(`${form.date}T${form.time}`);
    if (scheduledTime <= new Date()) return toast.error('Please select a future date and time');
    setLoading(true);
    try {
      const res = await rideAPI.requestRide({
        pickupLocation: { name: form.pickup, ...getCoords(form.pickup) },
        destination: { name: form.destination, ...getCoords(form.destination) },
        distance: 1,
        isScheduled: true,
        scheduledTime,
      });
      toast.success('Ride scheduled successfully! 📅');
      setSchedules(prev => [res.data, ...prev]);
      setForm({ pickup: '', destination: '', date: '', time: '', note: '' });
    } catch {
      toast.error('Failed to schedule ride');
    } finally {
      setLoading(false);
    }
  };

  const minDate = new Date().toISOString().split('T')[0];

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Schedule a Ride 📅</h2>
        <p>Book in advance for classes, events or early mornings</p>
      </div>
      <div className="two-col">
        <div className="card">
          <h3>New Scheduled Ride</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Pickup Location</label>
              <div className="filter-chips">
                {CATEGORIES.map(c => (
                  <button key={c} type="button"
                    className={`filter-chip ${pickupFilter === c ? 'active' : ''}`}
                    onClick={() => setPickupFilter(c)}>{c}</button>
                ))}
              </div>
              <select required value={form.pickup} onChange={e => setForm({ ...form, pickup: e.target.value })}>
                <option value="">Select pickup</option>
                {filtered(pickupFilter).map(l => (
                  <option key={l.name} value={l.name}>[{l.category}] {l.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Destination</label>
              <div className="filter-chips">
                {CATEGORIES.map(c => (
                  <button key={c} type="button"
                    className={`filter-chip ${destFilter === c ? 'active' : ''}`}
                    onClick={() => setDestFilter(c)}>{c}</button>
                ))}
              </div>
              <select required value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })}>
                <option value="">Select destination</option>
                {filtered(destFilter).map(l => (
                  <option key={l.name} value={l.name}>[{l.category}] {l.name}</option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Date</label>
                <input type="date" required min={minDate}
                  value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Time</label>
                <input type="time" required
                  value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label>Note (optional)</label>
              <input placeholder="e.g. Early morning class at 7 AM"
                value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
            </div>
            <button type="submit" className="btn-primary full" disabled={loading}>
              {loading ? 'Scheduling...' : '📅 Schedule Ride'}
            </button>
          </form>
        </div>

        <div className="card">
          <h3>Your Scheduled Rides</h3>
          {schedules.length === 0 ? (
            <div className="empty-state"><p>📅</p><p>No scheduled rides yet</p></div>
          ) : (
            schedules.map(ride => (
              <div key={ride._id} className="schedule-item">
                <div>
                  <strong>{ride.pickupLocation.name}</strong>
                  <span style={{ color: 'var(--muted)' }}> → </span>
                  <strong>{ride.destination.name}</strong>
                  <p className="schedule-time">{new Date(ride.scheduledTime).toLocaleString('en-IN')}</p>
                </div>
                <span className={`status-badge ${ride.status}`}>{ride.status}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ScheduleRide;
