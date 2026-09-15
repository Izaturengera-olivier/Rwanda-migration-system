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
} from "@mui/material";
import axios from "axios";

const API_BASE = "http://localhost:8000/api";

const RISK_COLORS = {
  low: "#4caf50",
  moderate: "#ffeb3b",
  high: "#ff9800",
  very_high: "#f44336",
};

function MapCenter() {
  const map = useMap();
  useEffect(() => {
    map.setView([-1.9403, 29.8739], 7);
  }, [map]);
  return null;
}

function MigrationRiskMap() {
  const navigate = useNavigate();
  const [geoData, setGeoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [year, setYear] = useState(2023);
  const [riskFilter, setRiskFilter] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [districtSectors, setDistrictSectors] = useState([]);
  const [selectedSector, setSelectedSector] = useState(null);

  useEffect(() => {
    fetchMapData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, riskFilter]);

  const fetchMapData = async () => {
    try {
      setLoading(true);
      const params = { year, type: "district" };
      if (riskFilter !== "all") params.risk_category = riskFilter;
      const response = await axios.get(`${API_BASE}/locations/geojson/`, {
        params,
      });
      setGeoData(response.data);
      setError(null);
    } catch (err) {
      setError("Failed to load map data. Ensure the Django server is running.");
    } finally {
      setLoading(false);
    }
  };

  const fetchSectorsForDistrict = async (districtName) => {
    try {
      const response = await axios.get(`${API_BASE}/locations/`, {
        params: { type: "sector", district: districtName },
      });
      setDistrictSectors(response.data.results || response.data);
    } catch (err) {
      setDistrictSectors([]);
    }
  };

  const onEachFeature = (feature, layer) => {
    const props = feature.properties;
    const riskLabel = (props.risk_category || "N/A")
      .replace("_", " ")
      .toUpperCase();
    layer.bindTooltip(
      `<div style="text-align: center;"><strong>${props.name}</strong><br/><span style="font-size: 10px; font-weight: normal;">${riskLabel}</span></div>`,
      { permanent: true, direction: "center", className: "district-map-label" },
    );
    layer.on({
      click: () => {
        setSelectedLocation(props);
        setSelectedSector(null);
        if (props.district || props.name) {
          fetchSectorsForDistrict(props.district || props.name);
        }
      },
      mouseover: (e) =>
        e.target.setStyle({ weight: 3, color: "#333", fillOpacity: 0.85 }),
      mouseout: (e) =>
        e.target.setStyle({
          weight: 2,
          color: "#fff",
          dashArray: "3",
          fillOpacity: 0.5,
        }),
    });
  };

  const getFeatureStyle = (feature) => ({
    fillColor: RISK_COLORS[feature.properties.risk_category] || "#9e9e9e",
    weight: 2,
    opacity: 1,
    color: "#fff",
    dashArray: "3",
    fillOpacity: 0.5,
  });

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Migration Risk Map
      </Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box
          sx={{
            display: "flex",
            gap: 2,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
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

          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Risk Level</InputLabel>
            <Select
              value={riskFilter}
              label="Risk Level"
              onChange={(e) => setRiskFilter(e.target.value)}
            >
              <MenuItem value="all">All Levels</MenuItem>
              <MenuItem value="very_high">Very High Risk</MenuItem>
              <MenuItem value="high">High Risk</MenuItem>
              <MenuItem value="moderate">Moderate Risk</MenuItem>
              <MenuItem value="low">Low Risk</MenuItem>
            </Select>
          </FormControl>

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

      {loading ? (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="400px"
        >
          <CircularProgress />
        </Box>
      ) : (
        <Paper sx={{ height: "600px", position: "relative" }}>
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
            center={[-1.9403, 29.8739]}
            zoom={8.5}
            minZoom={8}
            maxZoom={12}
            maxBounds={[[-2.95, 28.7], [-1.0, 31.05]]}
            maxBoundsViscosity={1.0}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            <ScaleControl position="bottomright" imperial={false} />
            <MapCenter />
            {geoData && geoData.features && geoData.features.length > 0 && (
              <GeoJSON
                key={JSON.stringify({ year, riskFilter })}
                data={geoData}
                style={getFeatureStyle}
                onEachFeature={onEachFeature}
              />
            )}
          </MapContainer>
        </Paper>
      )}

      {!loading &&
        (!geoData || !geoData.features || geoData.features.length === 0) && (
          <Alert severity="info" sx={{ mt: 2 }}>
            No geographic boundary data available. An administrator needs to
            import GeoJSON boundary files for the study districts.
          </Alert>
        )}

      {selectedLocation && (
        <Paper sx={{ mt: 2, p: 3, borderLeft: "4px solid #1976d2" }}>
          <Box display="flex" justify-content="space-between" alignItems="center">
            <Box>
              <Typography variant="h6" fontWeight="bold">
                {selectedLocation.name} District
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedLocation.province} Province &nbsp;|&nbsp; Risk:{" "}
                <strong>
                  {selectedLocation.risk_category
                    ? selectedLocation.risk_category.replace("_", " ").toUpperCase()
                    : "N/A"}
                </strong>
              </Typography>
            </Box>
            <Chip
              label="Choose Sector Below"
              color="primary"
              variant="outlined"
              size="small"
            />
          </Box>

          {districtSectors.length > 0 && (
            <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid #e0e0e0" }}>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: "bold" }}>
                Select Sector in {selectedLocation.name}:
              </Typography>

              <Box display="flex" gap={1} flexWrap="wrap">
                {districtSectors.map((sec) => (
                  <Chip
                    key={sec.id}
                    label={sec.sector || sec.name}
                    clickable
                    color={
                      selectedSector && selectedSector.id === sec.id
                        ? "primary"
                        : "default"
                    }
                    onClick={() => {
                      setSelectedSector(sec);
                      if (sec.id) navigate(`/district/${sec.id}`);
                    }}
                    sx={{ fontWeight: selectedSector?.id === sec.id ? "bold" : "normal" }}
                  />
                ))}
              </Box>
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
}

export default MigrationRiskMap;
