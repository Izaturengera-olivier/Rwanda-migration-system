import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, FormControl, InputLabel, Select, MenuItem,
  CircularProgress, Alert
} from '@mui/material';
import { Line } from 'react-chartjs-2';
import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

function Trends() {
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [trendData, setTrendData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get(`${API_BASE}/locations/study-districts/`)
      .then(res => {
        const locs = res.data.results || res.data;
        setLocations(locs);
        if (locs.length > 0) setSelectedLocation(locs[0].id);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedLocation) return;
    setLoading(true);
    axios.get(`${API_BASE}/dashboard/trends/`, { params: { location: selectedLocation } })
      .then(res => { setTrendData(res.data); setError(null); })
      .catch(() => setError('Failed to load trend data'))
      .finally(() => setLoading(false));
  }, [selectedLocation]);

  const chartData = trendData && trendData.length > 0 ? {
    labels: trendData.map(t => t.year),
    datasets: [{
      label: 'Risk Score (%)',
      data: trendData.map(t => (t.risk_score * 100).toFixed(1)),
      borderColor: '#f44336',
      backgroundColor: 'rgba(244,67,54,0.1)',
      tension: 0.3,
      fill: true,
      pointRadius: 5,
    }]
  } : null;

  const chartOptions = {
    responsive: true,
    plugins: { legend: { position: 'top' }, title: { display: true, text: 'Migration Risk Score Over Time' } },
    scales: {
      y: { beginAtZero: true, max: 100, title: { display: true, text: 'Risk Score (%)' } },
      x: { title: { display: true, text: 'Year' } }
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Historical Trends</Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        View migration risk changes over available years
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <FormControl sx={{ minWidth: 300 }}>
          <InputLabel>Select Location</InputLabel>
          <Select value={selectedLocation} label="Select Location" onChange={(e) => setSelectedLocation(e.target.value)}>
            {locations.map(loc => (
              <MenuItem key={loc.id} value={loc.id}>{loc.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box display="flex" justifyContent="center" minHeight="300px" alignItems="center">
          <CircularProgress />
        </Box>
      ) : chartData ? (
        <Paper sx={{ p: 3 }}>
          <Line data={chartData} options={chartOptions} />
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>Year-by-Year Summary</Typography>
            {trendData.map((t, i) => (
              <Typography key={i} variant="body2">
                <strong>{t.year}:</strong> {t.risk_category.replace('_', ' ').toUpperCase()} — {(t.risk_score * 100).toFixed(1)}%
              </Typography>
            ))}
          </Box>
        </Paper>
      ) : (
        <Alert severity="info">No historical trend data available for this location. Data needs to be loaded for multiple years.</Alert>
      )}
    </Box>
  );
}

export default Trends;
