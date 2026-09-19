import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Button,
  Chip,
  Divider,
  LinearProgress,
} from "@mui/material";
import { Bar, Radar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import axios from "axios";
import { isUserOfficer } from "../App";

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
);

const API_BASE = "http://localhost:8000/api";

const RISK_COLORS = {
  low: "#4caf50",
  moderate: "#ff9800",
  high: "#f44336",
  very_high: "#b71c1c",
};
const RISK_BG = {
  low: "#e8f5e9",
  moderate: "#fff3e0",
  high: "#ffebee",
  very_high: "#fce4ec",
};

function formatFactorLabel(factor) {
  if (typeof factor === "string") return factor;
  if (!factor || typeof factor !== "object") return String(factor ?? "");

  if (factor.name) {
    const valueText = factor.value ? `: ${factor.value}` : "";
    const impactText = factor.impact ? ` (${factor.impact})` : "";
    return `${factor.name}${valueText}${impactText}`;
  }

  return Object.values(factor)
    .filter((value) => value !== null && value !== undefined && value !== "")
    .map(String)
    .join(" - ");
}

function IndicatorBar({ label, value, max = 100, color = "#1976d2" }) {
  return (
    <Box sx={{ mb: 1.5 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
        <Typography variant="body2"> {label} </Typography>{" "}
        <Typography variant="body2" fontWeight="bold">
          {" "}
          {value != null ? `${value}%` : "N/A"}{" "}
        </Typography>{" "}
      </Box>{" "}
      <LinearProgress
        variant="determinate"
        value={value != null ? Math.min(Math.max(value, 0), max) : 0}
        sx={{
          height: 8,
          borderRadius: 4,
          bgcolor: "#e0e0e0",
          "& .MuiLinearProgress-bar": { bgcolor: color },
        }}
      />{" "}
    </Box>
  );
}

function DistrictProfile({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    axios
      .get(`${API_BASE}/locations/${id}/profile/`)
      .then((response) => {
        setProfileData(response.data);
        setError(null);
      })
      .catch(() => setError("Failed to load district profile"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error"> {error} </Alert>;
  }

  if (!profileData) {
    return (
      <Alert severity="info"> No data available for this location. </Alert>
    );
  }

  const {
    location,
    population,
    migration,
    employment,
    education,
    healthcare,
    infrastructure,
    prediction,
  } = profileData;
  const riskCat = prediction?.risk_category || "low";

  const radarData = {
    labels: [
      "Employment",
      "Education",
      "Healthcare",
      "Infrastructure",
      "Water Access",
      "Electricity",
    ],
    datasets: [
      {
        label: location?.name || "District",
        data: [
          employment?.job_opportunities_index ?? 0,
          education?.education_access_index ?? 0,
          healthcare?.healthcare_access_index ?? 0,
          100 - (infrastructure?.infrastructure_gap_index ?? 0),
          infrastructure?.water_access_rate ?? 0,
          infrastructure?.electricity_coverage ?? 0,
        ],
        backgroundColor: "rgba(25,118,210,0.15)",
        borderColor: "#1976d2",
        pointBackgroundColor: "#1976d2",
      },
    ],
  };

  const infraBarData = {
    labels: ["Electricity", "Internet", "Water", "Sanitation", "Transport"],
    datasets: [
      {
        label: "Coverage (%)",
        data: [
          infrastructure?.electricity_coverage ?? 0,
          infrastructure?.internet_coverage ?? 0,
          infrastructure?.water_access_rate ?? 0,
          infrastructure?.sanitation_coverage ?? 0,
          infrastructure?.public_transport_access ?? 0,
        ],
        backgroundColor: [
          "#1976d2",
          "#388e3c",
          "#0288d1",
          "#7b1fa2",
          "#f57c00",
        ],
        borderRadius: 4,
      },
    ],
  };

  return (
    <Box>
      <Button onClick={() => navigate(-1)} sx={{ mb: 2 }}>
        {" "}
        ←Back{" "}
      </Button>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4"> {location?.name || "District"} </Typography>{" "}
          <Typography variant="body1" color="text.secondary">
            {" "}
            {location?.province || "Province"}
            Province· {location?.location_type || "District"}{" "}
          </Typography>{" "}
        </Box>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => navigate("/compare")}
          >
            Compare with Others{" "}
          </Button>{" "}
          <Button
            variant="outlined"
            size="small"
            onClick={() => navigate("/reports")}
          >
            Generate Report{" "}
          </Button>{" "}
        </Box>{" "}
      </Box>
      {prediction ? (
        <Paper
          sx={{
            p: 3,
            mb: 3,
            bgcolor: RISK_BG[riskCat] || RISK_BG.low,
            borderLeft: `6px solid ${RISK_COLORS[riskCat] || RISK_COLORS.low}`,
          }}
        >
          <Grid container alignItems="center" spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="overline">
                {" "}
                Predicted Youth Migration Risk{" "}
              </Typography>{" "}
              <Typography
                variant="h4"
                sx={{
                  color: RISK_COLORS[riskCat] || RISK_COLORS.low,
                  fontWeight: "bold",
                }}
              >
                {riskCat.replace("_", " ").toUpperCase()}{" "}
              </Typography>{" "}
              <Typography variant="h6">
                Risk Score: {((prediction.risk_score ?? 0) * 100).toFixed(1)} %
              </Typography>{" "}
              <Typography variant="caption" color="text.secondary">
                Model: {prediction.model_name}· Year: {prediction.year}{" "}
              </Typography>{" "}
            </Grid>
            <Grid item xs={12} md={6}>
              {" "}
              {prediction.contributing_factors?.length > 0 && (
                <>
                  <Typography variant="subtitle2" gutterBottom>
                    Key Contributing Factors:
                  </Typography>{" "}
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {" "}
                    {prediction.contributing_factors.map((factor, index) => (
                      <Chip
                        key={`${formatFactorLabel(factor)}-${index}`}
                        label={formatFactorLabel(factor)}
                        size="small"
                        sx={{
                          bgcolor: RISK_COLORS[riskCat] || RISK_COLORS.low,
                          color: "white",
                        }}
                      />
                    ))}{" "}
                  </Box>{" "}
                </>
              )}{" "}
            </Grid>{" "}
          </Grid>{" "}
        </Paper>
      ) : (
        <Alert severity="info" sx={{ mb: 3 }}>
          No prediction available for this district.An administrator needs to
          train and activate a model.{" "}
        </Alert>
      )}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Population & Demographics{" "}
              </Typography>{" "}
              <Divider sx={{ mb: 2 }} />{" "}
              <Typography variant="body2">
                <strong> Total Population: </strong>{" "}
                {population?.total_population?.toLocaleString() || "N/A"}{" "}
              </Typography>{" "}
              <Typography variant="body2">
                <strong> Youth(15– 24): </strong>{" "}
                {population?.youth_population_15_24?.toLocaleString() ||
                  "N/A"}{" "}
              </Typography>{" "}
              <Typography variant="body2">
                <strong> Youth(15– 35): </strong>{" "}
                {population?.youth_population_15_35?.toLocaleString() ||
                  "N/A"}{" "}
              </Typography>{" "}
              <Typography variant="body2">
                <strong> Youth %: </strong>{" "}
                {population?.youth_percentage?.toFixed(1) || "N/A"}%{" "}
              </Typography>{" "}
              <Typography variant="body2">
                <strong> Population Density: </strong>{" "}
                {population?.population_density?.toFixed(1) || "N/A"} /km²{" "}
              </Typography>{" "}
              <Typography variant="body2">
                <strong> Avg Household Size: </strong>{" "}
                {population?.avg_household_size?.toFixed(1) || "N/A"}{" "}
              </Typography>{" "}
            </CardContent>{" "}
          </Card>{" "}
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Migration Indicators{" "}
              </Typography>{" "}
              <Divider sx={{ mb: 2 }} />{" "}
              <Typography variant="body2">
                <strong> Migration Rate: </strong>{" "}
                {migration?.migration_rate?.toFixed(2) || "N/A"}%{" "}
              </Typography>{" "}
              <Typography variant="body2">
                <strong> Out - Migration Count: </strong>{" "}
                {migration?.out_migration_count?.toLocaleString() || "N/A"}{" "}
              </Typography>{" "}
              <Typography variant="body2">
                <strong> Youth Out - Migration: </strong>{" "}
                {migration?.youth_out_migration?.toLocaleString() || "N/A"}{" "}
              </Typography>{" "}
              <Typography variant="body2">
                <strong> Migration Intent: </strong>{" "}
                {migration?.migration_intent_percentage?.toFixed(1) || "N/A"}
                %{" "}
              </Typography>{" "}
              <Typography variant="body2">
                <strong> Primary Destination: </strong>{" "}
                {migration?.primary_destination || "N/A"}{" "}
              </Typography>{" "}
              <Typography variant="body2">
                <strong> Net Migration: </strong>{" "}
                {migration?.net_migration?.toLocaleString() || "N/A"}{" "}
              </Typography>{" "}
            </CardContent>{" "}
          </Card>{" "}
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Employment & Economy{" "}
              </Typography>{" "}
              <Divider sx={{ mb: 2 }} />{" "}
              <IndicatorBar
                label="Job Opportunities Index"
                value={employment?.job_opportunities_index}
                color="#388e3c"
              />
              <Typography variant="body2">
                <strong> Unemployment Rate: </strong>{" "}
                {employment?.unemployment_rate?.toFixed(1) || "N/A"}%{" "}
              </Typography>{" "}
              <Typography variant="body2">
                <strong> Youth Unemployment: </strong>{" "}
                {employment?.youth_unemployment_rate?.toFixed(1) || "N/A"}%{" "}
              </Typography>{" "}
              <Typography variant="body2">
                <strong> Poverty Rate: </strong>{" "}
                {employment?.poverty_rate?.toFixed(1) || "N/A"}%{" "}
              </Typography>{" "}
              <Typography variant="body2">
                <strong> Avg Monthly Income: </strong>{" "}
                {employment?.avg_monthly_income
                  ? ` RWF ${employment.avg_monthly_income.toLocaleString()}`
                  : " N/A"}{" "}
              </Typography>{" "}
              <Typography variant="body2">
                <strong> Business Count: </strong>{" "}
                {employment?.business_count?.toLocaleString() || "N/A"}{" "}
              </Typography>{" "}
            </CardContent>{" "}
          </Card>{" "}
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Education Access{" "}
              </Typography>{" "}
              <Divider sx={{ mb: 2 }} />{" "}
              <IndicatorBar
                label="Education Access Index"
                value={education?.education_access_index}
                color="#1976d2"
              />
              <Typography variant="body2">
                <strong> Literacy Rate: </strong>{" "}
                {education?.literacy_rate?.toFixed(1) || "N/A"}%{" "}
              </Typography>{" "}
              <Typography variant="body2">
                <strong> Youth Literacy: </strong>{" "}
                {education?.youth_literacy_rate?.toFixed(1) || "N/A"}%{" "}
              </Typography>{" "}
              <Typography variant="body2">
                <strong> School Enrollment: </strong>{" "}
                {education?.school_enrollment_rate?.toFixed(1) || "N/A"}%{" "}
              </Typography>{" "}
              <Typography variant="body2">
                <strong> Primary Schools: </strong>{" "}
                {education?.primary_schools || "N/A"}{" "}
              </Typography>{" "}
              <Typography variant="body2">
                <strong> Secondary Schools: </strong>{" "}
                {education?.secondary_schools || "N/A"}{" "}
              </Typography>{" "}
            </CardContent>{" "}
          </Card>{" "}
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Healthcare Access{" "}
              </Typography>{" "}
              <Divider sx={{ mb: 2 }} />{" "}
              <IndicatorBar
                label="Healthcare Access Index"
                value={healthcare?.healthcare_access_index}
                color="#d32f2f"
              />
              <Typography variant="body2">
                <strong> Hospitals: </strong>{" "}
                {healthcare?.hospitals || "N/A"}{" "}
              </Typography>{" "}
              <Typography variant="body2">
                <strong> Health Centers: </strong>{" "}
                {healthcare?.health_centers || "N/A"}{" "}
              </Typography>{" "}
              <Typography variant="body2">
                <strong> Distance to Hospital: </strong>{" "}
                {healthcare?.distance_to_nearest_hospital?.toFixed(1) || "N/A"}{" "}
                km{" "}
              </Typography>{" "}
              <Typography variant="body2">
                <strong> Vaccination Coverage: </strong>{" "}
                {healthcare?.vaccination_coverage?.toFixed(1) || "N/A"}%{" "}
              </Typography>{" "}
            </CardContent>{" "}
          </Card>{" "}
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Infrastructure{" "}
              </Typography>{" "}
              <Divider sx={{ mb: 2 }} />{" "}
              <IndicatorBar
                label="Electricity Coverage"
                value={infrastructure?.electricity_coverage}
                color="#f57c00"
              />
              <IndicatorBar
                label="Internet Coverage"
                value={infrastructure?.internet_coverage}
                color="#0288d1"
              />
              <IndicatorBar
                label="Water Access"
                value={infrastructure?.water_access_rate}
                color="#00838f"
              />
              <IndicatorBar
                label="Sanitation Coverage"
                value={infrastructure?.sanitation_coverage}
                color="#7b1fa2"
              />
              <Typography variant="body2" sx={{ mt: 1 }}>
                <strong> Road Density: </strong>{" "}
                {infrastructure?.road_density?.toFixed(2) || "N/A"} km/km²{" "}
              </Typography>{" "}
              <Typography variant="body2">
                <strong> Infrastructure Gap Index: </strong>{" "}
                {infrastructure?.infrastructure_gap_index?.toFixed(1) || "N/A"}
                /100{" "}
              </Typography>{" "}
            </CardContent>{" "}
          </Card>{" "}
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Socioeconomic Profile{" "}
            </Typography>{" "}
            <Radar
              data={radarData}
              options={{
                responsive: true,
                scales: {
                  r: { beginAtZero: true, max: 100, ticks: { stepSize: 20 } },
                },
                plugins: { legend: { display: false } },
              }}
            />{" "}
          </Paper>{" "}
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Infrastructure Coverage Breakdown{" "}
            </Typography>{" "}
            <Bar
              data={infraBarData}
              options={{
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 100,
                    title: { display: true, text: "Coverage (%)" },
                  },
                },
              }}
            />{" "}
          </Paper>{" "}
        </Grid>{" "}
      </Grid>
      <Alert severity="info" sx={{ mt: 3 }}>
        <strong> Note: </strong> This is decision-support information based on
        stored data and the active ML model. It does not predict individual
        migration decisions and should be used alongside other evidence for
        planning.Data year: {prediction?.year || "N/A"}· Model:{" "}
        {prediction?.model_name || "N/A"}{" "}
      </Alert>{" "}
    </Box>
  );
}

export default DistrictProfile;
