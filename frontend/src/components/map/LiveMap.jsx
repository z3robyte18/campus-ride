import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const makeIcon = (color) => new L.Icon({
  iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

const CAMPUS_CENTER = [29.8674, 77.8960];

const Recenter = ({ center }) => {
  const map = useMap();
  useEffect(() => { map.setView(center, 15); }, [center]);
  return null;
};

const LiveMap = ({ drivers = [], activeRide = null, driverLocation = null }) => {
  const center = driverLocation
    ? [driverLocation.lat, driverLocation.lng]
    : CAMPUS_CENTER;

  return (
    <div className="map-wrapper">
      <MapContainer center={CAMPUS_CENTER} zoom={15} style={{ height: '420px', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        {driverLocation && <Recenter center={center} />}

        {/* Online drivers */}
        {drivers.map(d => (
          <Marker
            key={d._id}
            position={[d.currentLocation?.lat || 29.8674, d.currentLocation?.lng || 77.8960]}
            icon={makeIcon(d.isBusy ? 'orange' : 'green')}
          >
            <Popup>
              <div style={{ minWidth: 150 }}>
                <strong>{d.name}</strong><br />
                {d.vehicleType} · {d.vehicleNumber}<br />
                ⭐ {d.averageRating || 'New'}<br />
                <span style={{ color: d.isBusy ? '#f59e0b' : '#10b981', fontWeight: 600 }}>
                  {d.isBusy ? '🟡 On a ride' : '🟢 Available'}
                </span>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Pickup marker */}
        {activeRide && (
          <Marker
            position={[activeRide.pickupLocation.lat, activeRide.pickupLocation.lng]}
            icon={makeIcon('blue')}
          >
            <Popup>📍 Pickup: {activeRide.pickupLocation.name}</Popup>
          </Marker>
        )}

        {/* Drop point marker — separate from drivers */}
        {activeRide && (
          <Marker
            position={[activeRide.destination.lat, activeRide.destination.lng]}
            icon={makeIcon('red')}
          >
            <Popup>🏁 Drop: {activeRide.destination.name}</Popup>
          </Marker>
        )}

        {/* Live driver location during ride */}
        {driverLocation && (
          <Marker position={[driverLocation.lat, driverLocation.lng]} icon={makeIcon('green')}>
            <Popup>🛺 Driver is here</Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Fixed legend — correct labels */}
      <div className="map-legend">
        <span><span className="legend-dot" style={{ background: '#10b981' }} /> Available driver</span>
        <span><span className="legend-dot" style={{ background: '#f59e0b' }} /> Driver on ride</span>
        <span><span className="legend-dot" style={{ background: '#3b82f6' }} /> Pickup point</span>
        <span><span className="legend-dot" style={{ background: '#ef4444' }} /> Drop point</span>
      </div>
    </div>
  );
};

export default LiveMap;
