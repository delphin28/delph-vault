import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from '@mui/material';
import {
  DashboardOutlined,
  CategoryOutlined,
  KeyOutlined,
  LogoutOutlined,
  Menu as MenuIcon,
  SettingsOutlined,
} from '@mui/icons-material';
import { logout } from '../../api/authApi';

const drawerWidth = 248;

const navigation = [
  { label: 'Dashboard', path: '/dashboard', icon: <DashboardOutlined /> },
  { label: 'Passwords', path: '/passwords', icon: <KeyOutlined /> },
  { label: 'Settings', path: '/settings', icon: <SettingsOutlined /> },
  { label: 'Categories', path: '/categories', icon: <CategoryOutlined /> },
  { label: 'Logout', path: '/logout', icon: <LogoutOutlined /> },
];

function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  const drawer = (
    <Box sx={{ height: '100%', bgcolor: '#101c2c', color: '#dbe6f4' }}>
      <Toolbar sx={{ px: 3 }}>
        <Box>
          <Typography variant="overline" sx={{ color: '#79d1c3', letterSpacing: 1.5 }}>
            Delph Vault
          </Typography>
        </Box>
      </Toolbar>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
      <List sx={{ px: 1.5, py: 2 }}>
        {navigation.map((item) => (
          <ListItemButton
            key={item.path}
            component={item.path === '/logout' ? 'button' : NavLink}
            to={item.path === '/logout' ? undefined : item.path}
            onClick={() => {
              setMobileOpen(false);
              if (item.path === '/logout') {
                handleLogout();
              }
            }}
            sx={{
              mb: 0.75,
              borderRadius: 1.5,
              color: '#9fb0c5',
              '&.active': {
                bgcolor: '#1d3448',
                color: '#79d1c3',
              },
              '&:hover': {
                bgcolor: '#172b3e',
                color: '#ffffff',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f4f7fa' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: '#ffffff',
          color: '#16263a',
          borderBottom: '1px solid #dfe7ee',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setMobileOpen(!mobileOpen)}
            sx={{ mr: 2, display: { sm: 'none' } }}
            aria-label="open navigation"
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Secure workspace
          </Typography>
        </Toolbar>
      </AppBar>

      <Box component="nav" aria-label="main navigation">
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { width: drawerWidth } }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          open
          sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { width: drawerWidth } }}
        >
          {drawer}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, sm: 4 }, pt: { xs: 10, sm: 12 } }}>
        <Outlet />
      </Box>
    </Box>
  );
}

export default AppLayout;
