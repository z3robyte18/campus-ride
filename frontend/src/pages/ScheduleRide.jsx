import { useState, useEffect } from 'react';
import { rideAPI } from '../services/api';
import toast from 'react-hot-toast';

const LOCATIONS = {
  'Main Gate': { lat: 29.8644, lng: 77.8937 },
  'Convocation Hall': { lat: 29.8671, lng: 77.8956 },
  'IIT Roorkee Main Building': { lat: 29.8674, lng: 77.8960 },
  'James Thomason Building': { lat: 29.8680, lng: 77.8940 },
  'Stadium': { lat: 29.8660, lng: 77.9010 },
  'Hospital': { lat: 29.8690, lng: 77.8970 },
  'Rajendra Bhawan': { lat: 29.8685, lng: 77.8945 },
  'Cautley Bhawan': { lat: 29.8665, lng: 77.8950 },
  'Old FRI Area': { lat: 29.8650, lng: 77.8930 },
  'Saharanpur Campus Gate': { lat: 29.8700, lng: 77.9000 },
};

const ScheduleRide = () => {
  const [form, setForm] = useState({ pickup: '', destination: '', date: '', time: '', note: '' });
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    rideAPI.getMyRides().then(res => setSchedules(res.data.filter(r => r.isScheduled)));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.pickup === form.destination) return toast.error('Pickup and destination cannot be same');
    const scheduledTime = new Date(`${form.date}T${form.time}`);
    if (scheduledTime <= new Date()) return toast.error('Please select a future date and time');
    setLoading(true);
    try {
      const res = await rideAPI.requestRide({
        pickupLocation: { name: form.pickup, ...LOCATIONS[form.pickup] },
        destination: { name: form.destination, ...LOCATIONS[form.destination] },
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
  const locationNames = Object.keys(LOCATIONS);

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Schedule a Ride 📅</h2>
        <p>Book your ride in advance for classes, events, or early mornings</p>
      </div>
      <div className="two-col">
        <div className="card">
          <h3>New Scheduled Ride</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Pickup Location</label>
              <select required value={form.pickup} onChange={e => setForm({ ...form, pickup: e.target.value })}>
                <option value="">Select pickup</option>
                {locationNames.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Destination</label>
              <select required value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })}>
                <option value="">Select destination</option>
                {locationNames.map(l => <option key={l} value={l}>{l}</option>)}
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
              {loading ? 'Scheduling...' : 'Schedule Ride'}
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
                  <span className="schedule-arrow"> → </span>
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
