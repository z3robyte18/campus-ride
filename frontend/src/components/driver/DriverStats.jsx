import { useEffect, useState } from 'react';
import { driverAPI, rideAPI } from '../../services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const DriverStats = () => {
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([driverAPI.getStats(), rideAPI.getAnalytics()])
      .then(([s, a]) => { setStats(s.data); setAnalytics(a.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="card"><div className="spinner" /></div>;
  if (!stats) return <div className="card"><p>Could not load stats.</p></div>;

  const hourData = analytics?.hourCounts?.map((count, h) => ({ hour: `${h}h`, rides: count })) || [];
  const earningsData = [
    { name: 'This Month', value: stats.monthlyEarnings || 0 },
    { name: 'Previous', value: Math.max(0, (stats.totalEarnings || 0) - (stats.monthlyEarnings || 0)) },
  ];

  return (
    <div className="stats-page">
      <div className="stats-grid">
        <div className="stat-card blue"><div className="stat-val">{stats.totalRides}</div><div className="stat-lbl">Total Rides</div></div>
        <div className="stat-card green"><div className="stat-val">₹{stats.totalEarnings}</div><div className="stat-lbl">Total Earnings</div></div>
        <div className="stat-card purple"><div className="stat-val">{stats.monthlyRides}</div><div className="stat-lbl">This Month</div></div>
        <div className="stat-card yellow"><div className="stat-val">⭐ {stats.averageRating || '—'}</div><div className="stat-lbl">Avg Rating</div></div>
      </div>

      <div className="card chart-card">
        <h3>Hourly Ride Demand</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={hourData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hour" tick={{ fontSize: 11 }} interval={3} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="rides" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card chart-card">
        <h3>Earnings Breakdown</h3>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={earningsData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ₹${value}`}>
              {earningsData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
            </Pie>
            <Tooltip formatter={v => `₹${v}`} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {analytics?.popularLocations?.length > 0 && (
        <div className="card">
          <h3>🔥 Popular Pickup Spots</h3>
          {analytics.popularLocations.map((loc, i) => (
            <div key={i} className="loc-row">
              <span className="loc-rank">#{i + 1}</span>
              <span className="loc-name">{loc.name}</span>
              <span className="loc-count">{loc.count} rides</span>
            </div>
          ))}
        </div>
      )}

      {stats.ratings?.length > 0 && (
        <div className="card">
          <h3>Recent Ratings</h3>
          {stats.ratings.map((r, i) => (
            <div key={i} className="rating-item">
              <span>{'⭐'.repeat(r.rating)}</span>
              <span className="rating-feedback">{r.feedback || 'No comment'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DriverStats;
