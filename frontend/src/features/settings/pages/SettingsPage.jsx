import { useEffect, useState } from 'react';
import { Alert, Box, Button, Card, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from '@mui/material';
import { DownloadOutlined, LogoutOutlined, QrCode2Outlined, SecurityOutlined } from '@mui/icons-material';
import { QRCodeSVG } from 'qrcode.react';
import { useNavigate } from 'react-router-dom';
import { disableMfa, getCurrentUser, logout, regenerateBackupCodes, setupMfa, verifyMfa } from '../../../api/authApi';
import { exportPasswords } from '../../../api/vaultApi';
import './SettingsPage.css';

function SettingsPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const [mfaSetup, setMfaSetup] = useState(null);
  const [mfaSetupRequested, setMfaSetupRequested] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaError, setMfaError] = useState('');
  const [isMfaSaving, setIsMfaSaving] = useState(false);
  const [mfaPassword, setMfaPassword] = useState('');
  const [disableDialogOpen, setDisableDialogOpen] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);

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
      const password = window.prompt('Enter your master password to encrypt this export.');
      if (!password) return;

      const data = await exportPasswords(password);
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

  async function handleSetupMfa() {
    if (!mfaSetupRequested) {
      setMfaSetupRequested(true);
      return;
    }
    setMfaError('');
    try {
      setMfaSetup(await setupMfa(mfaPassword));
      setMfaPassword('');
    } catch {
      setMfaError('Unable to start MFA setup.');
    }
  }

  async function handleVerifyMfa(event) {
    event.preventDefault();
    setIsMfaSaving(true);
    setMfaError('');
    try {
      const result = await verifyMfa(mfaSetup.secret, mfaCode);
      setUser((current) => ({ ...current, mfa_enabled: true }));
      setBackupCodes(result.backup_codes || []);
      setMfaSetupRequested(false);
      setMfaSetup(null);
      setMfaCode('');
    } catch {
      setMfaError('The authenticator code is invalid or expired.');
    } finally {
      setIsMfaSaving(false);
    }
  }

  async function handleDisableMfa() {
    await disableMfa(disablePassword, disableCode);
    setUser((current) => ({ ...current, mfa_enabled: false }));
    setDisableDialogOpen(false);
    setDisablePassword('');
    setDisableCode('');
  }

  async function handleRegenerateBackupCodes() {
    const password = window.prompt('Enter your master password to regenerate backup codes.');
    const otp = window.prompt('Enter your current Authenticator code.');
    if (!password || !otp) return;

    try {
      const result = await regenerateBackupCodes(password, otp);
      setBackupCodes(result.backup_codes);
    } catch {
      setMfaError('Unable to regenerate backup codes.');
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
              <Stack direction={{ xs: 'column', sm: 'row' }} gap={1}>
                {user?.mfa_enabled ? (
                  <>
                    <Button variant="outlined" onClick={handleRegenerateBackupCodes}>New backup codes</Button>
                    <Button variant="outlined" color="warning" onClick={() => setDisableDialogOpen(true)}>Disable MFA</Button>
                  </>
                ) : (
                  <Button variant="outlined" startIcon={<QrCode2Outlined />} onClick={handleSetupMfa}>Set up MFA</Button>
                )}
              </Stack>
              <Stack className="settings-security__actions" direction={{ xs: 'column', sm: 'row' }} gap={1}>
                <Button variant="outlined" startIcon={<DownloadOutlined />} onClick={handleExport} disabled={isExporting}>
                  {isExporting ? 'Exporting...' : 'Export encrypted JSON'}
                </Button>
                <Button color="error" variant="outlined" startIcon={<LogoutOutlined />} onClick={handleLogout}>Log out</Button>
              </Stack>
            </Stack>
            {exportError && <Alert severity="error" sx={{ mt: 2 }}>{exportError}</Alert>}
          </div>
        </Card>
      </div>

      <Dialog open={mfaSetupRequested} onClose={() => !isMfaSaving && (setMfaSetupRequested(false), setMfaSetup(null))} maxWidth="xs" fullWidth>
        <Box component="form" onSubmit={mfaSetup ? handleVerifyMfa : (event) => { event.preventDefault(); handleSetupMfa(); }}>
          <DialogTitle>Set up Microsoft Authenticator</DialogTitle>
          <DialogContent sx={{ display: 'grid', gap: 2, justifyItems: 'center', pt: 2 }}>
            <Typography variant="body2" color="text.secondary">{mfaSetup ? 'Scan this QR code, then enter the six-digit code from your app.' : 'Confirm your master password to generate an enrollment code.'}</Typography>
            <TextField autoFocus fullWidth required label="Master password" type="password" value={mfaPassword} onChange={(event) => setMfaPassword(event.target.value)} />
            {mfaSetup && <QRCodeSVG value={mfaSetup.otpauth_uri} size={190} includeMargin />}
            <Typography variant="caption" sx={{ wordBreak: 'break-all', textAlign: 'center' }}>Manual setup key: {mfaSetup?.secret}</Typography>
            {mfaSetup && <TextField fullWidth required label="Authenticator code" value={mfaCode} onChange={(event) => setMfaCode(event.target.value)} inputMode="numeric" inputProps={{ maxLength: 6, pattern: '[0-9]{6}' }} />}
            {mfaError && <Alert severity="error">{mfaError}</Alert>}
          </DialogContent>
          <DialogActions><Button onClick={() => { setMfaSetupRequested(false); setMfaSetup(null); }} disabled={isMfaSaving}>Cancel</Button><Button type="submit" variant="contained" disabled={isMfaSaving}>{isMfaSaving ? 'Working...' : mfaSetup ? 'Enable MFA' : 'Continue'}</Button></DialogActions>
        </Box>
      </Dialog>

      <Dialog open={disableDialogOpen} onClose={() => !isMfaSaving && setDisableDialogOpen(false)} maxWidth="xs" fullWidth>
        <Box component="form" onSubmit={(event) => { event.preventDefault(); handleDisableMfa(); }}>
          <DialogTitle>Disable MFA</DialogTitle>
          <DialogContent sx={{ display: 'grid', gap: 2, pt: 2 }}>
            <Typography variant="body2" color="text.secondary">Confirm your master password and current Authenticator code.</Typography>
            <TextField autoFocus fullWidth required label="Master password" type="password" value={disablePassword} onChange={(event) => setDisablePassword(event.target.value)} />
            <TextField fullWidth required label="Authenticator code" value={disableCode} onChange={(event) => setDisableCode(event.target.value)} inputMode="numeric" inputProps={{ maxLength: 6, pattern: '[0-9]{6}' }} />
            {mfaError && <Alert severity="error">{mfaError}</Alert>}
          </DialogContent>
          <DialogActions><Button onClick={() => setDisableDialogOpen(false)} disabled={isMfaSaving}>Cancel</Button><Button type="submit" color="warning" variant="contained" disabled={isMfaSaving}>Disable MFA</Button></DialogActions>
        </Box>
      </Dialog>

      <Dialog open={backupCodes.length > 0} onClose={() => setBackupCodes([])} maxWidth="xs" fullWidth>
        <DialogTitle>Save your backup codes</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Each code can be used once if you lose access to Microsoft Authenticator. Store them somewhere secure. They will not be shown again.</Typography>
          <Box component="pre" sx={{ p: 2, m: 0, bgcolor: '#f4f7fa', fontFamily: 'monospace', letterSpacing: 1, whiteSpace: 'pre-wrap' }}>{backupCodes.join('\n')}</Box>
        </DialogContent>
        <DialogActions><Button variant="contained" onClick={() => setBackupCodes([])}>I saved them</Button></DialogActions>
      </Dialog>
    </Box>
  );
}

export default SettingsPage;
