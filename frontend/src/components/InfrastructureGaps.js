import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Paper,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Divider,
} from "@mui/material";
import { Bar } from "react-chartjs-2";
import axios from "axios";

const API_BASE = "http://localhost:8000/api";

const GAP_COLORS = {
  critical: "#f44336",
  high: "#ff9800",
  medium: "#ffeb3b",
  low: "#4caf50",
};

function getGapColor(index) {
  if (index >= 75) return GAP_COLORS.critical;
  if (index >= 50) return GAP_COLORS.high;
  if (index >= 25) return GAP_COLORS.medium;
  return GAP_COLORS.low;
}

function MapCenter() {
  const map = useMap();
  useEffect(() => {
    map.setView([-1.9403, 29.8739], 7);
  }, [map]);
  return null;
}

function IndicatorBar({ label, value, color }) {
  return (
    <Box sx={{ mb: 1 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography variant="caption">{label}</Typography>
        <Typography variant="caption" fontWeight="bold">
          {value != null ? `${value.toFixed(1)}%` : "N/A"}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={value || 0}
        sx={{
          height: 6,
          borderRadius: 3,
          bgcolor: "#e0e0e0",
          "& .MuiLinearProgress-bar": { bgcolor: color },
        }}
      />
    </Box>
  );
}

function InfrastructureGaps() {
  const navigate = useNavigate();
  const [geoData, setGeoData] = useState(null);
  const [infraData, setInfraData] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [year, setYear] = useState(2023);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      axios.get(`${API_BASE}/locations/geojson/`, { params: { year } }),
      axios.get(`${API_BASE}/locations/study-districts/`),
    ])
      .then(([geoRes, distRes]) => {
        setGeoData(geoRes.data);
        const locs = distRes.data.results || distRes.data;
        setDistricts(locs);
        Promise.all(
          locs.map((d) =>
            axios
              .get(`${API_BASE}/locations/${d.id}/profile/`, {
                params: { year },
              })
              .then((r) => ({
                id: d.id,
                name: d.name,
                province: d.province,
                infra: r.data.infrastructure,
              }))
              .catch(() => ({
                id: d.id,
                name: d.name,
                province: d.province,
                infra: null,
              })),
          ),
        ).then((results) => setInfraData(results));
      })
      .catch((err) =>
        setError(`Failed to load infrastructure data: ${err.message}`),
      );
  }, [year]);

  const getFeatureStyle = (feature) => {
    const gap = feature.properties.infrastructure_gap_index || 0;
    return {
      fillColor: getGapColor(gap),
      weight: 2,
      opacity: 1,
      color: "#fff",
      dashArray: "3",
      fillOpacity: 0.6,
    };
  };

  const onEachFeature = (feature, layer) => {
    const p = feature.properties;
    const gapVal =
      p.infrastructure_gap_index != null
        ? p.infrastructure_gap_index.toFixed(1)
        : "N/A";
    layer.bindTooltip(
      `<div style="text-align: center;"><strong>${p.name}</strong><br/><span style="font-size: 10px; font-weight: normal;">Gap: ${gapVal}</span></div>`,
      { permanent: true, direction: "center", className: "district-map-label" },
    );
    layer.on({
      click: () => navigate(`/district/${p.id}`),
      mouseover: (e) =>
        e.target.setStyle({ weight: 3, color: "#333", fillOpacity: 0.85 }),
      mouseout: (e) =>
        e.target.setStyle({
          weight: 2,
          color: "#fff",
          dashArray: "3",
          fillOpacity: 0.6,
        }),
    });
  };

  // Bar chart comparing all districts
  const barData =
    infraData.filter((d) => d.infra).length > 0
      ? {
          labels: infraData.map((d) => d.name),
          datasets: [
            {
              label: "Electricity %",
              data: infraData.map((d) => d.infra?.electricity_coverage || 0),
              backgroundColor: "#f57c00",
              borderRadius: 3,
            },
            {
              label: "Internet %",
              data: infraData.map((d) => d.infra?.internet_coverage || 0),
              backgroundColor: "#0288d1",
              borderRadius: 3,
            },
            {
              label: "Water %",
              data: infraData.map((d) => d.infra?.water_access_rate || 0),
              backgroundColor: "#00838f",
              borderRadius: 3,
            },
          ],
        }
      : null;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Infrastructure Gaps
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Infrastructure coverage and gaps across the six study districts
      </Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Year</InputLabel>
          <Select
            value={year}
            label="Year"
            onChange={(e) => setYear(e.target.value)}
          >
            {[2023, 2022, 2021, 2020].map((y) => (
              <MenuItem key={y} value={y}>
                {y}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      {error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Map */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ height: 500 }}>
            <MapContainer
              style={{ height: "100%", width: "100%" }}
              center={[-1.9403, 29.8739]}
              zoom={7}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap"
              />
              <MapCenter />
              {geoData?.features?.length > 0 && (
                <GeoJSON
                  key={year}
                  data={geoData}
                  style={getFeatureStyle}
                  onEachFeature={onEachFeature}
                />
              )}
            </MapContainer>
          </Paper>
        </Grid>

        {/* Legend + Summary */}
        <Grid item xs={12} md={5}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Gap Index Legend
              </Typography>
              {[
                { label: "Critical Gap (75–100)", color: GAP_COLORS.critical },
                { label: "High Gap (50–74)", color: GAP_COLORS.high },
                { label: "Medium Gap (25–49)", color: GAP_COLORS.medium },
                { label: "Low Gap (0–24)", color: GAP_COLORS.low },
              ].map((item) => (
                <Box
                  key={item.label}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mb: 0.5,
                  }}
                >
                  <Box
                    sx={{
                      width: 18,
                      height: 18,
                      bgcolor: item.color,
                      borderRadius: 1,
                      flexShrink: 0,
                    }}
                  />
                  <Typography variant="body2">{item.label}</Typography>
                </Box>
              ))}
            </CardContent>
          </Card>

          {/* Per-district infrastructure cards */}
          <Box
            sx={{
              maxHeight: 340,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 1,
            }}
          >
            {infraData.map((d) => (
              <Card
                key={d.id}
                sx={{ cursor: "pointer", "&:hover": { boxShadow: 3 } }}
                onClick={() => navigate(`/district/${d.id}`)}
              >
                <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                  <Typography variant="subtitle2">
                    {d.name}{" "}
                    <Typography
                      component="span"
                      variant="caption"
                      color="text.secondary"
                    >
                      — {d.province}
                    </Typography>
                  </Typography>
                  {d.infra ? (
                    <>
                      <IndicatorBar
                        label="Electricity"
                        value={d.infra.electricity_coverage}
                        color="#f57c00"
                      />
                      <IndicatorBar
                        label="Internet"
                        value={d.infra.internet_coverage}
                        color="#0288d1"
                      />
                      <IndicatorBar
                        label="Water"
                        value={d.infra.water_access_rate}
                        color="#00838f"
                      />
                      <Typography variant="caption" color="text.secondary">
                        Gap Index:{" "}
                        <strong>
                          {d.infra.infrastructure_gap_index?.toFixed(1) ||
                            "N/A"}
                        </strong>
                        /100
                      </Typography>
                    </>
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      No infrastructure data for {year}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            ))}
          </Box>
        </Grid>

        {/* Comparison Bar Chart */}
        {barData && (
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Infrastructure Coverage Comparison
              </Typography>
              <Bar
                data={barData}
                options={{
                  responsive: true,
                  plugins: { legend: { position: "top" } },
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 100,
                      title: { display: true, text: "Coverage (%)" },
                    },
                  },
                }}
              />
            </Paper>
          </Grid>
        )}

        {!barData && (
          <Grid item xs={12}>
            <Alert severity="info">
              No infrastructure data available for {year}. Upload and process an
              infrastructure dataset in the Admin Dashboard.
            </Alert>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}

export default InfrastructureGaps;
