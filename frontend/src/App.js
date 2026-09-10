import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar, Toolbar, Typography, Container, Box, Button, Drawer,
  List, ListItem, ListItemButton, ListItemText, IconButton,
  useMediaQuery, useTheme, Chip
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import axios from 'axios';
import Dashboard from './components/Dashboard';
import MigrationRiskMap from './components/MigrationRiskMap';
import DistrictProfile from './components/DistrictProfile';
import InfrastructureGaps from './components/InfrastructureGaps';
import CompareAreas from './components/CompareAreas';
import Trends from './components/Trends';
import Reports from './components/Reports';
import AdminDashboard from './components/AdminDashboard';
import Login from './components/Login';

const API_BASE = 'http://localhost:8000/api';

const PUBLIC_NAV = [
  { label: 'Dashboard', path: '/' },
  { label: 'Risk Map', path: '/map' },
  { label: 'Infrastructure', path: '/infrastructure' },
  { label: 'Compare', path: '/compare' },
  { label: 'Trends', path: '/trends' },
  { label: 'Reports', path: '/reports' },
];

function NavBar({ adminUser, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);

  const allLinks = [...PUBLIC_NAV, { label: adminUser ? 'Admin ✓' : 'Admin', path: '/admin' }];

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography
          variant="h6"
          sx={{ flexGrow: 1, cursor: 'pointer', fontSize: { xs: '0.85rem', md: '1.1rem' } }}
          onClick={() => navigate('/')}
        >
          Rwanda Migration Risk Mapping
        </Typography>

        {isMobile ? (
          <>
            <IconButton color="inherit" onClick={() => setDrawerOpen(true)}><MenuIcon /></IconButton>
            <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
              <List sx={{ width: 220 }}>
                {allLinks.map(link => (
                  <ListItem key={link.path} disablePadding>
                    <ListItemButton
                      selected={location.pathname === link.path}
                      onClick={() => { navigate(link.path); setDrawerOpen(false); }}
                    >
                      <ListItemText primary={link.label} />
                    </ListItemButton>
                  </ListItem>
                ))}
                {adminUser && (
                  <ListItem disablePadding>
                    <ListItemButton onClick={() => { onLogout(); setDrawerOpen(false); }}>
                      <ListItemText primary="Logout" />
                    </ListItemButton>
                  </ListItem>
                )}
              </List>
            </Drawer>
          </>
        ) : (
          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
            {allLinks.map(link => (
              <Button
                key={link.path}
                color="inherit"
                onClick={() => navigate(link.path)}
                sx={{
                  fontWeight: location.pathname === link.path ? 'bold' : 'normal',
                  textDecoration: location.pathname === link.path ? 'underline' : 'none',
                  color: link.path === '/admin' && adminUser ? '#a5d6a7' : 'inherit',
                }}
              >
                {link.label}
              </Button>
            ))}
            {adminUser && (
              <>
                <Chip
                  label={adminUser.username}
                  size="small"
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', ml: 1 }}
                />
                <Button color="inherit" size="small" onClick={onLogout} sx={{ ml: 0.5 }}>
                  Logout
                </Button>
              </>
            )}
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}

function ProtectedAdmin({ adminUser, onLoginSuccess }) {
  if (!adminUser) return <Login onLoginSuccess={onLoginSuccess} />;
  return <AdminDashboard adminUser={adminUser} />;
}

function App() {
  const [adminUser, setAdminUser] = useState(null);

  // Restore session on page reload
  useEffect(() => {
    axios.get(`${API_BASE}/auth/login/`, { withCredentials: true })
      .then(res => { if (res.data?.is_admin) setAdminUser(res.data); })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post(`${API_BASE}/auth/logout/`, {}, { withCredentials: true });
    } catch {}
    setAdminUser(null);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <NavBar adminUser={adminUser} onLogout={handleLogout} />
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4, flex: 1 }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/map" element={<MigrationRiskMap />} />
          <Route path="/district/:id" element={<DistrictProfile />} />
          <Route path="/infrastructure" element={<InfrastructureGaps />} />
          <Route path="/compare" element={<CompareAreas />} />
          <Route path="/trends" element={<Trends />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/admin" element={<ProtectedAdmin adminUser={adminUser} onLoginSuccess={setAdminUser} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Container>
      <Box component="footer" sx={{ py: 2, textAlign: 'center', bgcolor: 'grey.100' }}>
        <Typography variant="body2" color="text.secondary">
          Rwanda Rural Youth Migration Risk Mapping System — Decision-support tool. Results do not predict individual migration decisions.
        </Typography>
      </Box>
    </Box>
  );
}

export default App;
