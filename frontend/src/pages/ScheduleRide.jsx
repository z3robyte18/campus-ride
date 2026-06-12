import { useState, useEffect } from 'react';
import { rideAPI } from '../services/api';
import toast from 'react-hot-toast';

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

const ScheduleRide = () => {
  const [form, setForm] = useState({ pickup: '', destination: '', date: '', time: '', note: '' });
  const [pickupFilter, setPickupFilter] = useState('All');
  const [destFilter, setDestFilter] = useState('All');
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    rideAPI.getMyRides()
      .then(res => setSchedules(res.data.filter(r => r.isScheduled)))
      .catch(() => {});
  }, []);

  const filtered = (cat) =>
    cat === 'All' ? CAMPUS_LOCATIONS : CAMPUS_LOCATIONS.filter(l => l.category === cat);

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
      toast.success('Ride scheduled! 📅');
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
                    onClick={() => setPickupFilter(c)}>{c}
                  </button>
                ))}
              </div>
              <select required value={form.pickup} onChange={e => setForm({ ...form, pickup: e.target.value })}>
                <option value="">Select pickup</option>
                {filtered(pickupFilter).map(l => (
                  <option key={l.name} value={l.name}>{l.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Destination</label>
              <div className="filter-chips">
                {CATEGORIES.map(c => (
                  <button key={c} type="button"
                    className={`filter-chip ${destFilter === c ? 'active' : ''}`}
                    onClick={() => setDestFilter(c)}>{c}
                  </button>
                ))}
              </div>
              <select required value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })}>
                <option value="">Select destination</option>
                {filtered(destFilter).map(l => (
                  <option key={l.name} value={l.name}>{l.name}</option>
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
                  <p className="schedule-time">
                    {new Date(ride.scheduledTime).toLocaleString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
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
