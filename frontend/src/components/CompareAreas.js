import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, FormControl, InputLabel, Select, MenuItem,
  CircularProgress, Alert, Button, Grid, Card, CardContent, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

function CompareAreas() {
  const [locations, setLocations] = useState([]);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [comparisonData, setComparisonData] = useState(null);
  const [year, setYear] = useState(2023);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const response = await axios.get(`${API_BASE}/locations/study-districts/`);
      setLocations(response.data.results || response.data);
    } catch (err) {
      console.error('Error fetching locations:', err);
    }
  };

  const handleLocationToggle = (locationId) => {
    setSelectedLocations(prev => {
      if (prev.includes(locationId)) {
        return prev.filter(id => id !== locationId);
      } else if (prev.length < 5) {
        return [...prev, locationId];
      }
      return prev;
    });
  };

  const fetchComparison = async () => {
    if (selectedLocations.length < 2) {
      setError('Please select at least 2 locations to compare');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/dashboard/compare/`, {
        params: {
          locations: selectedLocations.join(','),
          year
        }
      });
      setComparisonData(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load comparison data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Compare Areas
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Select districts to compare migration risk and infrastructure indicators
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Select Locations (max 5)
        </Typography>
        
        <FormControl sx={{ minWidth: 150, mb: 2 }}>
          <InputLabel>Year</InputLabel>
          <Select
            value={year}
            label="Year"
            onChange={(e) => setYear(e.target.value)}
          >
            <MenuItem value={2023}>2023</MenuItem>
            <MenuItem value={2022}>2022</MenuItem>
            <MenuItem value={2021}>2021</MenuItem>
          </Select>
        </FormControl>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {locations.map(location => (
            <Button
              key={location.id}
              variant={selectedLocations.includes(location.id) ? 'contained' : 'outlined'}
              onClick={() => handleLocationToggle(location.id)}
            >
              {location.name}
            </Button>
          ))}
        </Box>

        <Button
          variant="contained"
          size="large"
          onClick={fetchComparison}
          disabled={selectedLocations.length < 2 || loading}
        >
          {loading ? 'Loading...' : 'Compare'}
        </Button>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {comparisonData && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Comparison Results
          </Typography>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Location</TableCell>
                  <TableCell>Risk Category</TableCell>
                  <TableCell>Risk Score</TableCell>
                  <TableCell>Infra Gap Index</TableCell>
                  <TableCell>Unemployment</TableCell>
                  <TableCell>Youth Unemployment</TableCell>
                  <TableCell>Education Access</TableCell>
                  <TableCell>Healthcare Access</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {comparisonData.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.location_name}</TableCell>
                    <TableCell>
                      <strong>{item.risk_category.replace('_', ' ').toUpperCase()}</strong>
                    </TableCell>
                    <TableCell>{(item.risk_score * 100).toFixed(1)}%</TableCell>
                    <TableCell>{item.infrastructure_gap_index.toFixed(1)}/100</TableCell>
                    <TableCell>{item.unemployment_rate.toFixed(1)}%</TableCell>
                    <TableCell>{item.youth_unemployment_rate.toFixed(1)}%</TableCell>
                    <TableCell>{item.education_access_index.toFixed(1)}/100</TableCell>
                    <TableCell>{item.healthcare_access_index.toFixed(1)}/100</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );
}

export default CompareAreas;
