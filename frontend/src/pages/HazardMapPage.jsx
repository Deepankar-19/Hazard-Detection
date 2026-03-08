import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ReportService } from '../services/api';
import { Spinner } from '../components/ui/Spinner';

// Fix Leaflet's default icon path issues in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom severity icons
const createIcon = (color) => new L.Icon({
  iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const icons = {
  LOW: createIcon('green'),
  MEDIUM: createIcon('orange'),
  HIGH: createIcon('red'),
  DEFAULT: createIcon('blue')
};

const municipalityIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-black.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Map auto-center behavior
function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}

export default function HazardMapPage() {
  const [hazards, setHazards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [center, setCenter] = useState([13.0827, 80.2707]); // Default Chennai

  useEffect(() => {
    // 1. Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setCenter([latitude, longitude]);
          fetchHazards(latitude, longitude);
        },
        () => {
          // fallback to default
          fetchHazards(center[0], center[1]);
        }
      );
    } else {
      fetchHazards(center[0], center[1]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchHazards = async (lat, lng) => {
    try {
      const data = await ReportService.getHazards(lat, lng, 10000); // 10km radius
      setHazards(data);
    } catch (err) {
      console.error('Failed to fetch map hazards', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-4">
        <Spinner size="lg" />
        <p className="text-gray-500 font-medium">Getting your location & loading map data...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col pt-2 pb-6 animate-in fade-in duration-300">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-900">Hazard Map</h2>
        <p className="text-gray-500 text-sm">View reported road issues nearby.</p>
      </div>

      <div className="h-[450px] w-full bg-gray-100 rounded-2xl overflow-hidden shadow-inner border border-gray-200 relative z-0">
        <MapContainer 
          center={center} 
          zoom={13} 
          className="absolute inset-0 w-full h-full"
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapUpdater center={center} />

          {/* User Location Marker */}
          <Marker position={center} icon={userIcon}>
            <Popup className="rounded-xl overflow-hidden font-bold text-center">
              📍 You Are Here
            </Popup>
          </Marker>

          <MarkerClusterGroup
            chunkedLoading
            maxClusterRadius={50}
          >
            {hazards.map((hazard) => (
              <Marker 
                key={hazard.id} 
                position={[hazard.latitude, hazard.longitude]}
                icon={hazard.hazard_type === 'municipality_center' ? municipalityIcon : (icons[hazard.severity_score] || icons.DEFAULT)}
              >
                <Popup className="rounded-xl overflow-hidden">
                  <div className="p-1 min-w-[200px]">
                    <img 
                      src={hazard.image_url} 
                      alt="Hazard" 
                      className="w-full h-24 object-cover rounded-lg mb-2 bg-gray-100"
                      loading="lazy"
                    />
                    <h3 className="font-bold capitalize mb-1">{hazard.hazard_type ? hazard.hazard_type.replace(/_/g, ' ') : 'Unknown'}</h3>
                    {hazard.hazard_type !== 'municipality_center' && (
                      <div className="space-y-1 text-sm text-gray-600">
                        <p>Status: <b className="text-gray-900 capitalize">{hazard.status ? hazard.status.replace(/_/g, ' ') : 'Unknown'}</b></p>
                        <p>Severity: <b className={`capitalize ${
                          hazard.severity_score === 'HIGH' ? 'text-red-600' :
                          hazard.severity_score === 'MEDIUM' ? 'text-orange-600' : 'text-green-600'
                        }`}>{hazard.severity_score || 'N/A'}</b></p>
                        <p>Repair Cost: <b className="text-gray-900">₹{hazard.repair_cost_estimate?.toLocaleString() || 'N/A'}</b></p>
                        <p>Reported: {hazard.created_at ? new Date(hazard.created_at).toLocaleDateString() : 'N/A'}</p>
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MarkerClusterGroup>
        </MapContainer>
        
        {/* Floating Legend */}
        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-gray-100 text-xs font-medium space-y-2 z-[400]">
          <p className="text-gray-500 font-bold uppercase tracking-wider mb-1">Severity</p>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500"></div> Low</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-orange-500"></div> Medium</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div> High</div>
        </div>
      </div>
    </div>
  );
}
