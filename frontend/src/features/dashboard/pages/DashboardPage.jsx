import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Box, Button, CircularProgress, Typography } from '@mui/material';
import { AddOutlined, ArrowForwardOutlined, KeyOutlined, SettingsOutlined } from '@mui/icons-material';
import { getCategories } from '../../../api/categoryApi';
import { getPasswords } from '../../../api/vaultApi';
import './DashboardPage.css';

function DashboardPage() {
  const [passwords, setPasswords] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    Promise.all([getPasswords(), getCategories()])
      .then(([passwordEntries, categoryEntries]) => {
        if (active) {
          setPasswords(passwordEntries);
          setCategories(categoryEntries);
        }
      })
      .catch(() => {
        if (active) setError('Your vault summary is temporarily unavailable.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const recentEntries = [...passwords].reverse().slice(0, 4);

  return (
    <Box className="dashboard-page">
      <section className="dashboard-hero" aria-labelledby="dashboard-title">
        <p className="dashboard-hero__eyebrow">Delph Vault / Secure workspace</p>
        <h1 className="dashboard-hero__title" id="dashboard-title">Your credentials, under control.</h1>
        <p className="dashboard-hero__description">
          Keep your private accounts organized in one encrypted vault, ready when you need them.
        </p>
      </section>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <section aria-labelledby="vault-overview-title">
        <Typography className="dashboard-section-title" component="h2" id="vault-overview-title">Vault overview</Typography>
        <div className="dashboard-stats">
          <div className="dashboard-stat">
            <span className="dashboard-stat__label">Saved credentials</span>
            <strong className="dashboard-stat__value">{isLoading ? '...' : passwords.length}</strong>
          </div>
          <div className="dashboard-stat">
            <span className="dashboard-stat__label">Categories</span>
            <strong className="dashboard-stat__value">{isLoading ? '...' : categories.length}</strong>
          </div>
          <div className="dashboard-stat">
            <span className="dashboard-stat__label">Vault status</span>
            <strong className="dashboard-stat__value">{isLoading ? '...' : 'Ready'}</strong>
          </div>
        </div>
      </section>

      <div className="dashboard-grid">
        <section className="dashboard-panel" aria-labelledby="recent-title">
          <div className="dashboard-panel__header">
            <Typography className="dashboard-section-title" component="h2" id="recent-title">Recently saved</Typography>
            <Button component={Link} to="/passwords" size="small" endIcon={<ArrowForwardOutlined />}>View vault</Button>
          </div>
          <div className="dashboard-panel__body">
            {isLoading ? <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 150 }}><CircularProgress size={28} /></Box> : recentEntries.length ? recentEntries.map((entry) => (
              <div className="dashboard-recent-entry" key={entry.id}>
                <div>
                  <div className="dashboard-recent-entry__name">{entry.name}</div>
                  <div className="dashboard-recent-entry__url">{entry.url || 'No URL saved'}</div>
                </div>
                <KeyOutlined color="disabled" />
              </div>
            )) : <p className="dashboard-empty">Your vault is empty. Add your first credential to get started.</p>}
          </div>
        </section>

        <section className="dashboard-panel" aria-labelledby="actions-title">
          <div className="dashboard-panel__header">
            <Typography className="dashboard-section-title" component="h2" id="actions-title">Quick actions</Typography>
          </div>
          <div className="dashboard-panel__body dashboard-actions">
            <Button component={Link} to="/passwords" variant="contained" startIcon={<AddOutlined />}>Add password</Button>
            <Button component={Link} to="/passwords" variant="outlined" startIcon={<KeyOutlined />}>Open vault</Button>
            <Button component={Link} to="/settings" variant="text" startIcon={<SettingsOutlined />}>Account settings</Button>
          </div>
        </section>
      </div>
    </Box>
  );
}

export default DashboardPage;
