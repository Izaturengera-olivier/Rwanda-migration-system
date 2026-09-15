import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, FormControl, InputLabel, Select, MenuItem,
  Button, Alert, Grid, Checkbox, FormControlLabel
} from '@mui/material';
import axios from 'axios';
import { jsPDF } from 'jspdf';

const API_BASE = 'http://localhost:8000/api';

function Reports() {
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [year, setYear] = useState(2023);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [includeSections, setIncludeSections] = useState({
    overview: true,
    risk: true,
    infrastructure: true,
    demographics: true,
    recommendations: true
  });

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const response = await axios.get(`${API_BASE}/locations/study-districts/`);
      const locs = response.data.results || response.data;
      setLocations(locs);
      if (locs.length > 0) {
        setSelectedLocation(locs[0].id);
      }
    } catch (err) {
      console.error('Error fetching locations:', err);
    }
  };

  const fetchProfileData = async () => {
    if (!selectedLocation) return;

    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/locations/${selectedLocation}/profile/`, {
        params: { year }
      });
      setProfileData(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load profile data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSectionToggle = (section) => {
    setIncludeSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const generatePDF = () => {
    if (!profileData) return;

    const doc = new jsPDF();
    const { location, population, employment, education, healthcare, infrastructure, prediction } = profileData;

    let yPosition = 20;

    // Title
    doc.setFontSize(20);
    doc.text('Migration Risk Analysis Report', 20, yPosition);
    yPosition += 15;

    doc.setFontSize(12);
    doc.text(`Location: ${location.name}`, 20, yPosition);
    yPosition += 8;
    doc.text(`District: ${location.district}`, 20, yPosition);
    yPosition += 8;
    doc.text(`Province: ${location.province}`, 20, yPosition);
    yPosition += 8;
    doc.text(`Year: ${year}`, 20, yPosition);
    yPosition += 15;

    if (includeSections.overview) {
      doc.setFontSize(14);
      doc.text('Overview', 20, yPosition);
      yPosition += 10;
      doc.setFontSize(10);
      doc.text(`Total Population: ${population?.total_population?.toLocaleString() || 'N/A'}`, 20, yPosition);
      yPosition += 6;
      doc.text(`Youth Population (15-24): ${population?.youth_population_15_24?.toLocaleString() || 'N/A'}`, 20, yPosition);
      yPosition += 6;
      doc.text(`Youth Percentage: ${population?.youth_percentage?.toFixed(1) || 'N/A'}%`, 20, yPosition);
      yPosition += 10;
    }

    if (includeSections.risk && prediction) {
      doc.setFontSize(14);
      doc.text('Migration Risk Assessment', 20, yPosition);
      yPosition += 10;
      doc.setFontSize(10);
      doc.text(`Risk Category: ${prediction.risk_category.replace('_', ' ').toUpperCase()}`, 20, yPosition);
      yPosition += 6;
      doc.text(`Risk Score: ${(prediction.risk_score * 100).toFixed(1)}%`, 20, yPosition);
      yPosition += 10;
    }

    if (includeSections.infrastructure) {
      doc.setFontSize(14);
      doc.text('Infrastructure Indicators', 20, yPosition);
      yPosition += 10;
      doc.setFontSize(10);
      doc.text(`Electricity Coverage: ${infrastructure?.electricity_coverage?.toFixed(1) || 'N/A'}%`, 20, yPosition);
      yPosition += 6;
      doc.text(`Internet Coverage: ${infrastructure?.internet_coverage?.toFixed(1) || 'N/A'}%`, 20, yPosition);
      yPosition += 6;
      doc.text(`Water Access: ${infrastructure?.water_access_rate?.toFixed(1) || 'N/A'}%`, 20, yPosition);
      yPosition += 6;
      doc.text(`Infrastructure Gap Index: ${infrastructure?.infrastructure_gap_index?.toFixed(1) || 'N/A'}/100`, 20, yPosition);
      yPosition += 10;
    }

    if (includeSections.demographics) {
      doc.setFontSize(14);
      doc.text('Socioeconomic Indicators', 20, yPosition);
      yPosition += 10;
      doc.setFontSize(10);
      doc.text(`Unemployment Rate: ${employment?.unemployment_rate?.toFixed(1) || 'N/A'}%`, 20, yPosition);
      yPosition += 6;
      doc.text(`Youth Unemployment: ${employment?.youth_unemployment_rate?.toFixed(1) || 'N/A'}%`, 20, yPosition);
      yPosition += 6;
      doc.text(`Poverty Rate: ${employment?.poverty_rate?.toFixed(1) || 'N/A'}%`, 20, yPosition);
      yPosition += 6;
      doc.text(`Literacy Rate: ${education?.literacy_rate?.toFixed(1) || 'N/A'}%`, 20, yPosition);
      yPosition += 6;
      doc.text(`Education Access Index: ${education?.education_access_index?.toFixed(1) || 'N/A'}/100`, 20, yPosition);
      yPosition += 6;
      doc.text(`Healthcare Access Index: ${healthcare?.healthcare_access_index?.toFixed(1) || 'N/A'}/100`, 20, yPosition);
      yPosition += 10;
    }

    if (includeSections.recommendations) {
      doc.setFontSize(14);
      doc.text('Recommendations', 20, yPosition);
      yPosition += 10;
      doc.setFontSize(10);
      doc.text('Based on the analysis, consider the following:', 20, yPosition);
      yPosition += 6;
      
      if (prediction?.risk_category === 'high' || prediction?.risk_category === 'very_high') {
        doc.text('- Prioritize infrastructure development in this area', 20, yPosition);
        yPosition += 6;
        doc.text('- Implement youth employment programs', 20, yPosition);
        yPosition += 6;
        doc.text('- Enhance educational facilities and access', 20, yPosition);
        yPosition += 6;
      }
      
      if (infrastructure?.infrastructure_gap_index > 50) {
        doc.text('- Address critical infrastructure gaps', 20, yPosition);
        yPosition += 6;
      }
      
      if (employment?.youth_unemployment_rate > 20) {
        doc.text('- Focus on youth job creation initiatives', 20, yPosition);
        yPosition += 6;
      }
    }

    // Disclaimer
    yPosition += 15;
    doc.setFontSize(8);
    doc.text('Disclaimer: This report provides decision-support information based on available data and', 20, yPosition);
    yPosition += 4;
    doc.text('model analysis. It does not predict individual migration decisions and should be used as', 20, yPosition);
    yPosition += 4;
    doc.text('one of several factors in planning and policy decisions.', 20, yPosition);

    doc.save(`${location.name}_report_${year}.pdf`);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Generate Report
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Create and export summary reports for selected districts
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Report Configuration
            </Typography>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Select Location</InputLabel>
              <Select
                value={selectedLocation}
                label="Select Location"
                onChange={(e) => setSelectedLocation(e.target.value)}
              >
                {locations.map(location => (
                  <MenuItem key={location.id} value={location.id}>
                    {location.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
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

            <Typography variant="subtitle1" gutterBottom>
              Include Sections:
            </Typography>
            
            <FormControlLabel
              control={
                <Checkbox
                  checked={includeSections.overview}
                  onChange={() => handleSectionToggle('overview')}
                />
              }
              label="Overview"
            />
            
            <FormControlLabel
              control={
                <Checkbox
                  checked={includeSections.risk}
                  onChange={() => handleSectionToggle('risk')}
                />
              }
              label="Migration Risk Assessment"
            />
            
            <FormControlLabel
              control={
                <Checkbox
                  checked={includeSections.infrastructure}
                  onChange={() => handleSectionToggle('infrastructure')}
                />
              }
              label="Infrastructure Indicators"
            />
            
            <FormControlLabel
              control={
                <Checkbox
                  checked={includeSections.demographics}
                  onChange={() => handleSectionToggle('demographics')}
                />
              }
              label="Socioeconomic Indicators"
            />
            
            <FormControlLabel
              control={
                <Checkbox
                  checked={includeSections.recommendations}
                  onChange={() => handleSectionToggle('recommendations')}
                />
              }
              label="Recommendations"
            />

            <Button
              variant="contained"
              fullWidth
              sx={{ mt: 2 }}
              onClick={fetchProfileData}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Load Data'}
            </Button>

            <Button
              variant="outlined"
              fullWidth
              sx={{ mt: 2 }}
              onClick={generatePDF}
              disabled={!profileData}
            >
              Generate PDF Report
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {profileData && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Report Preview
              </Typography>
              <Typography variant="body1">
                <strong>Location:</strong> {profileData.location.name}
              </Typography>
              <Typography variant="body1">
                <strong>Year:</strong> {year}
              </Typography>
              {profileData.prediction && (
                <>
                  <Typography variant="body1">
                    <strong>Risk Category:</strong> {profileData.prediction.risk_category.replace('_', ' ').toUpperCase()}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Risk Score:</strong> {(profileData.prediction.risk_score * 100).toFixed(1)}%
                  </Typography>
                </>
              )}
              <Alert severity="info" sx={{ mt: 2 }}>
                Click "Generate PDF Report" to download the full report
              </Alert>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}

export default Reports;
