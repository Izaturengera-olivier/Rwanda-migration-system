import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, FormControl, InputLabel, Select, MenuItem,
  CircularProgress, Alert, Paper, Chip
} from '@mui/material';
import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

const RISK_COLORS = {
  low: '#4caf50',
  moderate: '#ffeb3b',
  high: '#ff9800',
  very_high: '#f44336'
};

function MapCenter() {
  const map = useMap();
  useEffect(() => { map.setView([-1.9403, 29.8739], 7); }, [map]);
  return null;
}

function MigrationRiskMap() {
  const navigate = useNavigate();
  const [geoData, setGeoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [year, setYear] = useState(2023);
  const [riskFilter, setRiskFilter] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState(null);

  useEffect(() => { fetchMapData(); }, [year, riskFilter]);

  const fetchMapData = async () => {
    try {
      setLoading(true);
      const params = { year };
      if (riskFilter !== 'all') params.risk_category = riskFilter;
      const response = await axios.get(`${API_BASE}/locations/geojson/`, { params });
      setGeoData(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load map data. Ensure the Django server is running.');
    } finally {
      setLoading(false);
    }
  };

  const onEachFeature = (feature, layer) => {
    const props = feature.properties;
    layer.bindTooltip(`<strong>${props.name}</strong><br/>Risk: ${props.risk_category || 'N/A'}`);
    layer.on({
      click: () => {
        setSelectedLocation(props);
        if (props.id) navigate(`/district/${props.id}`);
      },
      mouseover: (e) => e.target.setStyle({ weight: 3, color: '#333', fillOpacity: 0.8 }),
      mouseout: (e) => e.target.setStyle({ weight: 2, color: '#fff', dashArray: '3', fillOpacity: 0.5 }),
    });
  };

  const getFeatureStyle = (feature) => ({
    fillColor: RISK_COLORS[feature.properties.risk_category] || '#9e9e9e',
    weight: 2, opacity: 1, color: '#fff', dashArray: '3', fillOpacity: 0.5
  });

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Migration Risk Map</Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Year</InputLabel>
            <Select value={year} label="Year" onChange={(e) => setYear(e.target.value)}>
              {[2023, 2022, 2021, 2020].map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Risk Level</InputLabel>
            <Select value={riskFilter} label="Risk Level" onChange={(e) => setRiskFilter(e.target.value)}>
              <MenuItem value="all">All Levels</MenuItem>
              <MenuItem value="very_high">Very High Risk</MenuItem>
              <MenuItem value="high">High Risk</MenuItem>
              <MenuItem value="moderate">Moderate Risk</MenuItem>
              <MenuItem value="low">Low Risk</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ ml: 'auto', display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {Object.entries(RISK_COLORS).map(([key, color]) => (
              <Chip key={key} label={key.replace('_', ' ')} size="small"
                sx={{ bgcolor: color, color: key === 'moderate' ? 'black' : 'white', textTransform: 'capitalize' }} />
            ))}
          </Box>
        </Box>
      </Paper>

      {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      ) : (
        <Paper sx={{ height: '600px' }}>
          <MapContainer style={{ height: '100%', width: '100%' }} center={[-1.9403, 29.8739]} zoom={7}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            <MapCenter />
            {geoData && geoData.features && geoData.features.length > 0 && (
              <GeoJSON key={JSON.stringify({ year, riskFilter })} data={geoData} style={getFeatureStyle} onEachFeature={onEachFeature} />
            )}
          </MapContainer>
        </Paper>
      )}

      {!loading && (!geoData || !geoData.features || geoData.features.length === 0) && (
        <Alert severity="info" sx={{ mt: 2 }}>
          No geographic boundary data available. An administrator needs to import GeoJSON boundary files for the study districts.
        </Alert>
      )}

      {selectedLocation && (
        <Paper sx={{ mt: 2, p: 2 }}>
          <Typography variant="h6">{selectedLocation.name}</Typography>
          <Typography variant="body2">
            <strong>Type:</strong> {selectedLocation.location_type} &nbsp;|&nbsp;
            <strong>District:</strong> {selectedLocation.district || 'N/A'} &nbsp;|&nbsp;
            {selectedLocation.risk_category && (
              <><strong>Risk:</strong> {selectedLocation.risk_category.replace('_', ' ').toUpperCase()}</>
            )}
          </Typography>
        </Paper>
      )}
    </Box>
  );
}

export default MigrationRiskMap;
