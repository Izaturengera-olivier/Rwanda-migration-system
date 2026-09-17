import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap, ScaleControl } from "react-leaflet";
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
  Chip,
  Button,
  TextField,
  InputAdornment,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
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

function MapCenter({ showSectors }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    if (showSectors) {
      map.setView([-2.62, 29.86], 11.5, { animate: false });
    } else {
      map.setView([-1.94, 29.87], 8, { animate: false });
    }
  }, [map, showSectors]);
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
  const [showSectors, setShowSectors] = useState(false); // Only show sector list when user clicks Gisagara
  const [geoData, setGeoData] = useState(null);
  const [infraData, setInfraData] = useState([]);
  const [year, setYear] = useState(2023);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      axios.get(`${API_BASE}/locations/geojson/`, { params: { year, type: "district" } }),
      axios.get(`${API_BASE}/locations/`, { params: { type: "sector", district: "Gisagara" } }),
    ])
      .then(([geoRes, distRes]) => {
        setGeoData(geoRes.data);
        const locs = distRes.data.results || distRes.data;
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

  const onEachFeature = (feature, layer) => {
    layer.bindTooltip(
      `<div style="text-align: center; padding: 4px 8px; font-weight: bold; font-size: 15px; color: #1a237e;">
        📍 Gisagara District<br/>
        <span style="font-size: 11px; font-weight: 600; color: #d32f2f;">👉 Click map to view 13 sectors</span>
       </div>`,
      { permanent: true, direction: "center", className: "gisagara-text-label" },
    );
    layer.on({
      click: () => {
        setShowSectors((prev) => !prev);
      },
      mouseover: (e) =>
        e.target.setStyle({ weight: 2.5, color: "#1565c0", fillOpacity: 0.12 }),
      mouseout: (e) =>
        e.target.setStyle({
          weight: 1.5,
          color: "#1976d2",
          dashArray: "4",
          fillOpacity: 0.04,
        }),
    });
  };

  const getFeatureStyle = () => ({
    fillColor: "#1976d2",
    weight: 1.5,
    opacity: 0.8,
    color: "#1976d2",
    dashArray: "4",
    fillOpacity: 0.04,
  });

  const filteredInfra = infraData.filter(
    (d) =>
      !searchQuery ||
      d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Bar chart comparing sectors
  const barData =
    filteredInfra.filter((d) => d.infra).length > 0
      ? {
          labels: filteredInfra.map((d) => d.name),
          datasets: [
            {
              label: "Electricity %",
              data: filteredInfra.map((d) => d.infra?.electricity_coverage || 0),
              backgroundColor: "#f57c00",
              borderRadius: 3,
            },
            {
              label: "Internet %",
              data: filteredInfra.map((d) => d.infra?.internet_coverage || 0),
              backgroundColor: "#0288d1",
              borderRadius: 3,
            },
            {
              label: "Water %",
              data: filteredInfra.map((d) => d.infra?.water_access_rate || 0),
              backgroundColor: "#00838f",
              borderRadius: 3,
            },
          ],
        }
      : null;

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2, mb: 1 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Infrastructure Gaps Analysis
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {showSectors
              ? "Showing Gisagara District's 13 administrative sectors. Click any sector card to view its profile."
              : "Overview of Rwanda with Gisagara District. Click on Gisagara on the map to view sector gaps."}
          </Typography>
        </Box>
        <Box>
          {showSectors ? (
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => setShowSectors(false)}
            >
              ✕ Hide Sector List (Reset View)
            </Button>
          ) : (
            <Button
              variant="contained"
              color="primary"
              onClick={() => setShowSectors(true)}
            >
              Click Gisagara / View 13 Sectors →
            </Button>
          )}
        </Box>
      </Box>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
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

          {showSectors && (
            <TextField
              placeholder="Search sector name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ minWidth: 240 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
          )}
        </Box>
      </Paper>

      {error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Map Container */}
      <Paper sx={{ height: 350, position: "relative", mb: 3 }}>
        {/* North Arrow / Compass Rose Overlay */}
        <Box
          sx={{
            position: "absolute",
            top: 16,
            left: 16,
            zIndex: 1000,
            bgcolor: "rgba(255, 255, 255, 0.9)",
            p: 1,
            borderRadius: 1,
            boxShadow: 2,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            pointerEvents: "none",
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24">
            <path d="M12 2L15 9H9L12 2Z" fill="#e53935" />
            <path d="M12 22L9 15H15L12 22Z" fill="#9e9e9e" />
          </svg>
          <Typography variant="caption" sx={{ fontWeight: "bold", fontSize: "10px", lineHeight: 1 }}>
            N
          </Typography>
        </Box>

        <MapContainer
          style={{ height: "100%", width: "100%", background: "#f8fafc" }}
          center={[-1.94, 29.87]}
          zoom={8}
          minZoom={6}
          maxZoom={15}
          maxBounds={[[-3.50, 28.00], [-0.50, 31.50]]}
          maxBoundsViscosity={0.8}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap"
          />
          <ScaleControl position="bottomright" imperial={false} />
          <MapCenter showSectors={showSectors} />
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

      {/* Gisagara Sector Infrastructure List & Cards Under Map - ONLY shown when user clicks Gisagara */}
      {showSectors && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h6" fontWeight="bold">
              Gisagara Administrative Sectors Infrastructure ({filteredInfra.length})
            </Typography>
            <Button
              variant="outlined"
              size="small"
              color="secondary"
              onClick={() => setShowSectors(false)}
            >
              ✕ Hide Sector List
            </Button>
          </Box>

          {filteredInfra.length === 0 ? (
            <Alert severity="info">No sectors match your search query.</Alert>
          ) : (
            <Grid container spacing={2}>
              {filteredInfra.map((d) => {
                const gap = d.infra?.infrastructure_gap_index;
                return (
                  <Grid item xs={12} sm={6} md={4} key={d.id}>
                    <Card
                      sx={{
                        cursor: "pointer",
                        transition: "transform 0.15s ease-in-out, box-shadow 0.15s",
                        "&:hover": { boxShadow: 5, transform: "translateY(-2px)" },
                        borderLeft: `5px solid ${gap != null ? getGapColor(gap) : "#9e9e9e"}`,
                      }}
                      onClick={() => navigate(`/district/${d.id}`)}
                    >
                      <CardContent sx={{ pb: 1.5, "&:last-child": { pb: 2 } }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {d.name}
                          </Typography>
                          {gap != null && (
                            <Chip
                              label={`Gap: ${gap.toFixed(1)}`}
                              size="small"
                              sx={{
                                bgcolor: getGapColor(gap),
                                color: gap >= 25 && gap < 50 ? "black" : "white",
                                fontWeight: "bold",
                                fontSize: "10px",
                              }}
                            />
                          )}
                        </Box>

                        {d.infra && (
                          <Box sx={{ mt: 1, mb: 1 }}>
                            <IndicatorBar
                              label="Electricity Coverage"
                              value={d.infra.electricity_coverage}
                              color="#f57c00"
                            />
                            <IndicatorBar
                              label="Internet Access"
                              value={d.infra.internet_coverage}
                              color="#0288d1"
                            />
                            <IndicatorBar
                              label="Water Access"
                              value={d.infra.water_access_rate}
                              color="#00838f"
                            />
                          </Box>
                        )}

                        <Button
                          variant="contained"
                          size="small"
                          color="primary"
                          fullWidth
                          sx={{ mt: 1, textTransform: "none", fontWeight: "bold" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/district/${d.id}`);
                          }}
                        >
                          View Sector Profile →
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Paper>
      )}

      {/* Bar chart comparison */}
      {showSectors && barData && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Infrastructure Coverage Comparison Across Gisagara Sectors
          </Typography>
          <Box sx={{ height: 320 }}>
            <Bar
              data={barData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 100,
                    title: { display: true, text: "Coverage (%)" },
                  },
                },
              }}
            />
          </Box>
        </Paper>
      )}
    </Box>
  );
}

export default InfrastructureGaps;
