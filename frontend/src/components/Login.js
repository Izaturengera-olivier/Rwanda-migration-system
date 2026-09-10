import React, { useState } from 'react';
import { Box, Paper, Typography, TextField, Button, Alert, CircularProgress } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

function Login({ onLoginSuccess }) {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!form.username || !form.password) { setError('Please enter username and password'); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(`${API_BASE}/auth/login/`, form, { withCredentials: true });
      onLoginSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="70vh">
      <Paper sx={{ p: 4, width: 380 }} elevation={4}>
        <Box display="flex" alignItems="center" gap={1.5} mb={3}>
          <LockIcon color="primary" fontSize="large" />
          <Box>
            <Typography variant="h5" fontWeight="bold">Admin Login</Typography>
            <Typography variant="caption" color="text.secondary">Rwanda Migration Risk System</Typography>
          </Box>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <TextField
          fullWidth label="Username" value={form.username}
          onChange={e => setForm({ ...form, username: e.target.value })}
          sx={{ mb: 2 }} onKeyDown={e => e.key === 'Enter' && handleLogin()}
          autoFocus
        />
        <TextField
          fullWidth label="Password" type="password" value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })}
          sx={{ mb: 3 }} onKeyDown={e => e.key === 'Enter' && handleLogin()}
        />

        <Button fullWidth variant="contained" size="large" onClick={handleLogin} disabled={loading}>
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Login'}
        </Button>

        <Alert severity="info" sx={{ mt: 2 }}>
          Only users with <strong>Administrator</strong> role can access this panel.
        </Alert>
      </Paper>
    </Box>
  );
}

export default Login;
