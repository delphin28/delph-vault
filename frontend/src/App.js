import { useEffect, useState } from 'react';
import AppRoutes from './routes/AppRoutes';
import './App.css';

function App() {
  const [backendStatus, setBackendStatus] = useState('Checking...');

  useEffect(() => {
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';

    fetch(`${apiUrl}/health`)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Backend request failed');
        }

        return response.json();
      })
      .then((data) => setBackendStatus(data.status === 'UP' ? 'Connected' : 'Unavailable'))
      .catch(() => setBackendStatus('Unavailable'));
  }, []);
  return (
    <AppRoutes backendStatus={backendStatus} />
  );
  
  
}

export default App;
