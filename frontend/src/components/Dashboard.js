import React, { useState, useEffect } from 'react';
import {
  Grid, Card, CardContent, Typography, Box, Button,
  CircularProgress, Alert, FormControl, InputLabel, Select, MenuItem, Divider, Paper
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Bar, Doughnut } from 'react-chartjs-2';
import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

const RISK_COLORS = { low: '#4caf50', moderate: '#ffeb3b', high: '#ff9800', very_high: '#f44336' };
const RISK_BG = { low: '#e8f5e9', moderate: '#fffde7', high: '#fff3e0', very_high: '#ffebee' };

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [districts, setDistricts] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const safe = (promise) => promise.catch(() => null);
    Promise.all([
      safe(axios.get(`${API_BASE}/dashboard/`)),
      safe(axios.get(`${API_BASE}/locations/`, { params: { type: 'sector', district: 'Gisagara' } }).then(r => r.data.results && r.data.results.length > 0 ? r : axios.get(`${API_BASE}/locations/`))),
      safe(axios.get(`${API_BASE}/predictions/by-district/`).catch(() => axios.get(`${API_BASE}/predictions/by_district/`))),
    ]).then(([statsRes, distRes, predRes]) => {
      if (!statsRes && !distRes) {
        setError('Failed to load dashboard data. Make sure the Django server is running on port 8000.');
      }
      if (statsRes) setStats(statsRes.data);
      if (distRes) setDistricts(distRes.data.results || distRes.data);
      if (predRes) setPredictions(predRes.data.results || predRes.data);
    }).finally(() => setLoading(false));
  }, []);

  const handleDistrictSelect = (e) => {
    const id = e.target.value;
    setSelectedDistrict(id);
    if (id) navigate(`/district/${id}`);
  };

  const riskDistChart = stats ? {
    labels: ['Very High', 'High', 'Moderate', 'Low'],
    datasets: [{
      data: [stats.very_high_risk_count, stats.high_risk_count, stats.moderate_risk_count, stats.low_risk_count],
      backgroundColor: [RISK_COLORS.very_high, RISK_COLORS.high, RISK_COLORS.moderate, RISK_COLORS.low],
      borderWidth: 1,
    }]
  } : null;

  const districtBarChart = predictions.length > 0 ? {
    labels: predictions.map(p => p.location_name),
    datasets: [{
      label: 'Risk Score (%)',
      data: predictions.map(p => (p.risk_score * 100).toFixed(1)),
      backgroundColor: predictions.map(p => RISK_COLORS[p.risk_category] || '#9e9e9e'),
      borderRadius: 4,
    }]
  } : null;

  const riskCategoryBarChart = stats ? {
    labels: ['Very High', 'High', 'Moderate', 'Low'],
    datasets: [{
      label: 'Number of Sectors',
      data: [stats.very_high_risk_count, stats.high_risk_count, stats.moderate_risk_count, stats.low_risk_count],
      backgroundColor: [RISK_COLORS.very_high, RISK_COLORS.high, RISK_COLORS.moderate, RISK_COLORS.low],
      borderRadius: 4,
    }]
  } : null;

  const barChartData = districtBarChart || riskCategoryBarChart;
  const barChartTitle = districtBarChart ? 'Risk Score by Sector' : 'Risk Category Breakdown';

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px"><CircularProgress /></Box>;

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>Gisagara Migration Risk Dashboard</Typography>
          <Typography variant="body1" color="text.secondary">
            Predictive mapping of rural youth migration risk across Gisagara administrative sectors
          </Typography>
        </Box>
        <FormControl sx={{ minWidth: 260 }}>
          <InputLabel>Select Sector to View Profile</InputLabel>
          <Select value={selectedDistrict} label="Select Sector to View Profile" onChange={handleDistrictSelect}>
            {districts.map(d => <MenuItem key={d.id} value={d.id}>{d.name} — {d.province} Province</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Very High Risk', count: stats?.very_high_risk_count || 0, color: 'very_high', desc: 'Immediate attention required' },
          { label: 'High Risk', count: stats?.high_risk_count || 0, color: 'high', desc: 'Priority intervention areas' },
          { label: 'Moderate Risk', count: stats?.moderate_risk_count || 0, color: 'moderate', desc: 'Areas to monitor' },
          { label: 'Low Risk', count: stats?.low_risk_count || 0, color: 'low', desc: 'Relatively stable areas' },
        ].map(item => (
          <Grid item xs={6} md={3} key={item.label}>
            <Card sx={{ bgcolor: RISK_BG[item.color], height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle2" sx={{ color: RISK_COLORS[item.color], fontWeight: 'bold' }}>{item.label}</Typography>
                <Typography variant="h3" sx={{ my: 1 }}>{item.count}</Typography>
                <Typography variant="caption" color="text.secondary">{item.desc}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}

        <Grid item xs={12} md={6}>
          <Card sx={{ bgcolor: '#fce4ec', height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#c62828' }}>Infrastructure Priority Areas</Typography>
              <Typography variant="h3" sx={{ my: 1 }} color="error">{stats?.infrastructure_priority_count || 0}</Typography>
              <Typography variant="caption" color="text.secondary">High migration risk overlapping with infrastructure gaps</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>System Status</Typography>
              <Divider sx={{ my: 1 }} />
              <Typography variant="body2"><strong>Study Sectors:</strong> {stats?.total_locations || 0}</Typography>
              <Typography variant="body2"><strong>Active Model:</strong> {stats?.active_model_version || 'None — train a model in Admin'}</Typography>
              <Typography variant="body2">
                <strong>Last Data Update:</strong>{' '}
                {stats?.last_data_update ? new Date(stats.last_data_update).toLocaleDateString() : 'No data uploaded yet'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {riskDistChart && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', height: '100%', minHeight: 360 }}>
              <Typography variant="h6" align="center" gutterBottom sx={{ width: '100%', fontWeight: 600 }}>
                Risk Distribution
              </Typography>
              <Box sx={{ width: '100%', maxWidth: 280, display: 'flex', justifyContent: 'center', alignItems: 'center', my: 'auto', py: 1 }}>
                <Doughnut
                  data={riskDistChart}
                  options={{
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                      legend: {
                        position: 'bottom',
                        align: 'center',
                        labels: {
                          boxWidth: 14,
                          padding: 12,
                        },
                      },
                    },
                  }}
                />
              </Box>
            </Paper>
          </Grid>
        )}
        {barChartData && (
          <Grid item xs={12} md={riskDistChart ? 6 : 12}>
            <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', minHeight: 360 }}>
              <Typography variant="h6" align="center" gutterBottom sx={{ fontWeight: 600 }}>
                {barChartTitle}
              </Typography>
              <Box sx={{ width: '100%', flex: 1, display: 'flex', alignItems: 'center', py: 1 }}>
                <Bar data={barChartData} options={{
                  responsive: true,
                  maintainAspectRatio: true,
                  plugins: { legend: { display: false } },
                  scales: { y: { beginAtZero: true, max: districtBarChart ? 100 : undefined, title: { display: true, text: districtBarChart ? 'Risk Score (%)' : 'Number of Sectors' } } }
                }} />
              </Box>
            </Paper>
          </Grid>
        )}
        {!riskDistChart && !barChartData && (
          <Grid item xs={12}>
            <Alert severity="info">
              No prediction data available yet. An administrator needs to upload datasets and train a model to see risk analysis charts.
            </Alert>
          </Grid>
        )}
      </Grid>

      {/* Sector Cards */}
      {districts.length > 0 && (
        <>
          <Typography variant="h6" gutterBottom>Study Sectors</Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {districts.map(d => {
              const pred = predictions.find(p => {
                const locId = typeof p.location === 'object' ? p.location?.id : p.location;
                const locName = p.location_name || (typeof p.location === 'object' ? p.location?.name : '');
                return (
                  String(locId) === String(d.id) ||
                  String(p.location_id) === String(d.id) ||
                  (locName && d.name && locName.trim().toLowerCase() === d.name.trim().toLowerCase())
                );
              });
              return (
                <Grid item xs={12} sm={6} md={4} key={d.id}>
                  <Card sx={{ cursor: 'pointer', '&:hover': { boxShadow: 4 }, bgcolor: pred ? RISK_BG[pred.risk_category] : 'white' }}
                    onClick={() => navigate(`/district/${d.id}`)}>
                    <CardContent>
                      <Typography variant="h6">{d.name}</Typography>
                      <Typography variant="body2" color="text.secondary">{d.province} Province</Typography>
                      {pred ? (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" sx={{ color: RISK_COLORS[pred.risk_category], fontWeight: 'bold' }}>
                            {pred.risk_category.replace('_', ' ').toUpperCase()} RISK
                          </Typography>
                          <Typography variant="body2">Score: {(pred.risk_score * 100).toFixed(1)}%</Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>No prediction yet</Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </>
      )}

      {/* Quick Actions */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>Quick Actions</Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button variant="contained" onClick={() => navigate('/map')}>View Risk Map</Button>
          <Button variant="outlined" onClick={() => navigate('/infrastructure')}>Infrastructure Gaps</Button>
          <Button variant="outlined" onClick={() => navigate('/compare')}>Compare Sectors</Button>
          <Button variant="outlined" onClick={() => navigate('/trends')}>Historical Trends</Button>
          <Button variant="outlined" onClick={() => navigate('/reports')}>Generate Report</Button>
        </Box>
      </Paper>
    </Box>
  );
}

export default Dashboard;
