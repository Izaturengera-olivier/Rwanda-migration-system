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
  CircularProgress,
  Alert,
  Paper,
  Chip,
  Button,
  Grid,
  Card,
  CardContent,
  TextField,
  InputAdornment,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import axios from "axios";

const API_BASE = "http://localhost:8000/api";

const RISK_COLORS = {
  low: "#4caf50",
  moderate: "#ffeb3b",
  high: "#ff9800",
  very_high: "#f44336",
};

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

function MigrationRiskMap() {
  const navigate = useNavigate();
  const [showSectors, setShowSectors] = useState(false); // Only show sector list when user clicks Gisagara
  const [geoData, setGeoData] = useState(null);
  const [sectorsList, setSectorsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [year, setYear] = useState(2023);
  const [riskFilter, setRiskFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState(null);

  useEffect(() => {
    fetchMapData();
    fetchSectors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year]);

  const fetchMapData = async () => {
    try {
      setLoading(true);
      const params = { year, type: "district" };
      let response = await axios.get(`${API_BASE}/locations/geojson/`, { params });
      if (!response.data || !response.data.features || response.data.features.length === 0) {
        delete params.type;
        response = await axios.get(`${API_BASE}/locations/geojson/`, { params });
      }
      setGeoData(response.data);
      setError(null);
    } catch (err) {
      setError("Failed to load map data. Ensure the Django server is running.");
    } finally {
      setLoading(false);
    }
  };

  const fetchSectors = async () => {
    try {
      const [locRes, predRes] = await Promise.all([
        axios.get(`${API_BASE}/locations/`, { params: { type: "sector", district: "Gisagara" } }),
        axios.get(`${API_BASE}/predictions/by-district/`, { params: { year } }),
      ]);
      const locs = locRes.data.results || locRes.data;
      const preds = predRes.data.results || predRes.data;
      const combined = locs.map((l) => {
        const pred = preds.find(
          (p) => String(p.location) === String(l.id) || (p.location_name && p.location_name.includes(l.sector))
        );
        return {
          ...l,
          risk_category: pred ? pred.risk_category : "moderate",
          risk_score: pred ? pred.risk_score : 0.45,
        };
      });
      setSectorsList(combined);
    } catch (err) {
      console.error("Failed to load sectors list:", err);
    }
  };

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
        e.target.setStyle({ weight: 3, color: "#1565c0", fillOpacity: 0.18 }),
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

  const filteredSectors = sectorsList.filter((s) => {
    const matchesRisk = riskFilter === "all" || s.risk_category === riskFilter;
    const matchesSearch =
      !searchQuery ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.sector && s.sector.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesRisk && matchesSearch;
  });

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2, mb: 1 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Gisagara Sector Migration Risk Map
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {showSectors
              ? "Showing Gisagara District's 13 administrative sectors. Click any sector card to view its profile."
              : "Overview of Rwanda with Gisagara District. Click on Gisagara on the map to view its 13 sectors."}
          </Typography>
        </Box>
        <Box>
          {showSectors ? (
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => {
                setShowSectors(false);
                setSelectedLocation(null);
              }}
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

      {/* Filter and Search Bar */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box
          sx={{
            display: "flex",
            gap: 2,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <FormControl sx={{ minWidth: 140 }}>
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
            <FormControl sx={{ minWidth: 180 }}>
              <InputLabel>Risk Level</InputLabel>
              <Select
                value={riskFilter}
                label="Risk Level"
                onChange={(e) => setRiskFilter(e.target.value)}
              >
                <MenuItem value="all">All Risk Levels</MenuItem>
                <MenuItem value="very_high">Very High Risk</MenuItem>
                <MenuItem value="high">High Risk</MenuItem>
                <MenuItem value="moderate">Moderate Risk</MenuItem>
                <MenuItem value="low">Low Risk</MenuItem>
              </Select>
            </FormControl>
          )}

          {showSectors && (
            <TextField
              placeholder="Search sector name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ minWidth: 220 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
          )}

          <Box sx={{ ml: "auto", display: "flex", gap: 1, flexWrap: "wrap" }}>
            {Object.entries(RISK_COLORS).map(([key, color]) => (
              <Chip
                key={key}
                label={key.replace("_", " ")}
                size="small"
                sx={{
                  bgcolor: color,
                  color: key === "moderate" ? "black" : "white",
                  textTransform: "capitalize",
                }}
              />
            ))}
          </Box>
        </Box>
      </Paper>

      {error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Map Container */}
      {loading ? (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="350px"
        >
          <CircularProgress />
        </Box>
      ) : (
        <Paper sx={{ height: "350px", position: "relative" }}>
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
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            <ScaleControl position="bottomright" imperial={false} />
            <MapCenter showSectors={showSectors} />
            {geoData && geoData.features && geoData.features.length > 0 && (
              <GeoJSON
                key={year}
                data={geoData}
                style={getFeatureStyle}
                onEachFeature={onEachFeature}
              />
            )}
          </MapContainer>
        </Paper>
      )}

      {/* Sector List Under Map - ONLY shown when user clicks Gisagara */}
      {showSectors && sectorsList.length > 0 && (
        <Paper sx={{ mt: 3, p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h6" fontWeight="bold">
              Gisagara District Administrative Sectors ({filteredSectors.length})
            </Typography>
            <Button
              variant="outlined"
              size="small"
              color="secondary"
              onClick={() => {
                setShowSectors(false);
                setSelectedLocation(null);
              }}
            >
              ✕ Hide Sector List
            </Button>
          </Box>

          {filteredSectors.length === 0 ? (
            <Alert severity="info">No sectors match your search filter.</Alert>
          ) : (
            <Grid container spacing={2}>
              {filteredSectors.map((sec) => (
                <Grid item xs={12} sm={6} md={4} key={sec.id}>
                  <Card
                    sx={{
                      cursor: "pointer",
                      transition: "transform 0.15s ease-in-out, box-shadow 0.15s",
                      "&:hover": { boxShadow: 5, transform: "translateY(-2px)" },
                      borderLeft: `5px solid ${RISK_COLORS[sec.risk_category] || "#1976d2"}`,
                      bgcolor: selectedLocation?.id === sec.id ? "#e3f2fd" : "white",
                    }}
                    onClick={() => {
                      setSelectedLocation(sec);
                      navigate(`/district/${sec.id}`);
                    }}
                  >
                    <CardContent sx={{ pb: 1.5, "&:last-child": { pb: 2 } }}>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold" sx={{ fontSize: "1rem" }}>
                          {sec.name}
                        </Typography>
                        {sec.risk_category && (
                          <Chip
                            label={sec.risk_category.replace("_", " ").toUpperCase()}
                            size="small"
                            sx={{
                              bgcolor: RISK_COLORS[sec.risk_category],
                              color: sec.risk_category === "moderate" ? "black" : "white",
                              fontWeight: "bold",
                              fontSize: "10px",
                            }}
                          />
                        )}
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {sec.district} District &nbsp;|&nbsp; {sec.province} Province
                      </Typography>
                      {sec.risk_score != null && (
                        <Typography variant="body2" sx={{ mt: 1, fontWeight: 500 }}>
                          Migration Risk Score: <strong>{(sec.risk_score * 100).toFixed(1)}%</strong>
                        </Typography>
                      )}
                      <Button
                        variant="contained"
                        size="small"
                        color="primary"
                        fullWidth
                        sx={{ mt: 1.5, textTransform: "none", fontWeight: "bold" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/district/${sec.id}`);
                        }}
                      >
                        View Sector Profile →
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Paper>
      )}
    </Box>
  );
}

export default MigrationRiskMap;
