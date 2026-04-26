import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:5000';

export function useEVTracker() {
  const [location, setLocation] = useState(null);
  const [status, setStatus] = useState('connecting');
  const [connected, setConnected] = useState(false);
  const [locationHistory, setLocationHistory] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    // Fetch initial latest location via REST
    fetch('/api/location/latest')
      .then(r => r.json())
      .then(data => {
        if (data.location) setLocation(data.location);
        setStatus(data.status);
      })
      .catch(() => {});

    // Connect socket
    socketRef.current = io(SOCKET_URL, { transports: ['websocket', 'polling'] });

    socketRef.current.on('connect', () => {
      setConnected(true);
    });

    socketRef.current.on('disconnect', () => {
      setConnected(false);
      setStatus('offline');
    });

    socketRef.current.on('location_update', (loc) => {
      setLocation(loc);
      setLocationHistory(prev => {
        const next = [...prev, loc];
        return next.slice(-50); // keep last 50 points for trail
      });
    });

    socketRef.current.on('ev_status', ({ status }) => {
      setStatus(status);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  return { location, status, connected, locationHistory };
}
