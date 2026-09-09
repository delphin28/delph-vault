import { useEffect, useState } from 'react';
import AppRoutes from './routes/AppRoutes';
import apiClient from './api/apiClient';
import './App.css';

function App() {
  const [backendStatus, setBackendStatus] = useState('Checking...');

  useEffect(() => {
    apiClient.get('/health')
      .then(({ data }) => setBackendStatus(data.status === 'UP' ? 'Connected' : 'Unavailable'))
      .catch(() => setBackendStatus('Unavailable'));
  }, []);
  return (
    <AppRoutes backendStatus={backendStatus} />
  );
  
  
}

export default App;
