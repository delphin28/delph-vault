import { useEffect, useState } from 'react';
import { Alert, Box, Button, Card, Stack, Typography } from '@mui/material';
import { DownloadOutlined, LogoutOutlined, SecurityOutlined } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, logout } from '../../../api/authApi';
import { exportPasswords } from '../../../api/vaultApi';
import './SettingsPage.css';

function SettingsPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState('');

  useEffect(() => {
    getCurrentUser().then(setUser).catch(() => setUser(null));
  }, []);
  function handleLogout() {
    logout();
    navigate('/');
  }

  async function handleExport() {
    setIsExporting(true);
    setExportError('');

    try {
      const data = await exportPasswords();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `delph-vault-export-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setExportError('Unable to export your vault data.');
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <Box className="settings-page">
      <header className="settings-page__header">
        <p className="settings-page__eyebrow">Workspace controls</p>
        <Typography className="settings-page__title" component="h1">Settings</Typography>
        <p className="settings-page__description">Review your session and Delph Vault security configuration.</p>
      </header>

      <div className="settings-page__grid">
        <Card className="settings-panel" variant="outlined">
          <div className="settings-panel__header">
            <Typography className="settings-panel__title" variant="h6">Account</Typography>
            <div className="settings-panel__description">Identity attached to this session.</div>
          </div>
          <div className="settings-panel__body">
            <Stack gap={2}>
              <div><Typography variant="caption" color="text.secondary">Email</Typography><Typography className="settings-value">{user?.email || 'Unavailable'}</Typography></div>
              <div><Typography variant="caption" color="text.secondary">User Name</Typography><Typography className="settings-value">{user?.username || 'Unavailable'}</Typography></div>
            </Stack>
          </div>
        </Card>

        <Card className="settings-panel" variant="outlined">
          <div className="settings-panel__header">
            <Typography className="settings-panel__title" variant="h6">Session</Typography>
            <div className="settings-panel__description">Your current authentication state.</div>
          </div>
          <div className="settings-panel__body">
            <Stack gap={2}>
              <div><Typography variant="caption" color="text.secondary">Status</Typography><Typography className="settings-status">Authenticated</Typography></div>
              <div><Typography variant="caption" color="text.secondary">Session storage</Typography><Typography className="settings-value">HttpOnly secure cookie</Typography></div>
            </Stack>
          </div>
        </Card>

        <Card className="settings-panel settings-panel--wide" variant="outlined">
          <div className="settings-panel__header">
            <Typography className="settings-panel__title" variant="h6">Security</Typography>
            <div className="settings-panel__description">Vault secrets are encrypted before they are stored.</div>
          </div>
          <div className="settings-panel__body">
            <Stack className="settings-security" gap={2}>
              <Stack direction="row" gap={1.5} alignItems="center">
                <SecurityOutlined color="primary" />
                <Box><Typography className="settings-value">Encrypted vault storage</Typography><Typography variant="body2" color="text.secondary">Protected API requests use your access token.</Typography></Box>
              </Stack>
              <Stack className="settings-security__actions" direction={{ xs: 'column', sm: 'row' }} gap={1}>
                <Button variant="outlined" startIcon={<DownloadOutlined />} onClick={handleExport} disabled={isExporting}>
                  {isExporting ? 'Exporting...' : 'Export JSON'}
                </Button>
                <Button color="error" variant="outlined" startIcon={<LogoutOutlined />} onClick={handleLogout}>Log out</Button>
              </Stack>
            </Stack>
            {exportError && <Alert severity="error" sx={{ mt: 2 }}>{exportError}</Alert>}
          </div>
        </Card>
      </div>
    </Box>
  );
}

export default SettingsPage;
