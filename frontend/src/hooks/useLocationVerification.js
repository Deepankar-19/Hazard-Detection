import { useState, useCallback } from 'react';

export function useLocationVerification() {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const requestLocation = useCallback(() => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: new Date().toISOString(),
        });
        setLoading(false);
      },
      (err) => {
        let msg = 'Location access is required to report road hazards.';
        if (err.code === err.PERMISSION_DENIED) {
          msg = 'Location permission denied. Please enable location services to proceed.';
        }
        setError(msg);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  return { location, error, loading, requestLocation, setLocation };
}
