import React, { useState, useEffect } from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Button,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  IconButton,
  useMediaQuery,
  useTheme,
  Chip,
  Paper,
  Alert,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import axios from "axios";
import Dashboard from "./components/Dashboard";
import MigrationRiskMap from "./components/MigrationRiskMap";
import DistrictProfile from "./components/DistrictProfile";
import InfrastructureGaps from "./components/InfrastructureGaps";
import CompareAreas from "./components/CompareAreas";
import Trends from "./components/Trends";
import Reports from "./components/Reports";
import AdminDashboard from "./components/AdminDashboard";
import Login from "./components/Login";
import HomePage from "./components/HomePage";

const API_BASE = "http://localhost:8000/api";

const PUBLIC_NAV = [
  { label: "Home", path: "/" },
  { label: "Dashboard", path: "/dashboard" },
  { label: "Infrastructure", path: "/infrastructure" },
  { label: "Compare", path: "/compare" },
  { label: "Trends", path: "/trends" },
  { label: "Reports", path: "/reports" },
];

function NavBar({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (location.pathname === "/") return null;

  const navLinks = [...PUBLIC_NAV];
  if (user?.is_admin) {
    navLinks.push({ label: "Admin Dashboard", path: "/admin" });
  }

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography
          variant="h6"
          sx={{
            flexGrow: 1,
            cursor: "pointer",
            fontSize: { xs: "0.85rem", md: "1.1rem" },
          }}
          onClick={() => navigate("/")}
        >
          Rwanda Migration Risk Mapping
        </Typography>

        {isMobile ? (
          <>
            <IconButton color="inherit" onClick={() => setDrawerOpen(true)}>
              <MenuIcon />
            </IconButton>
            <Drawer
              anchor="right"
              open={drawerOpen}
              onClose={() => setDrawerOpen(false)}
            >
              <List sx={{ width: 220 }}>
                {navLinks.map((link) => (
                  <ListItem key={link.path} disablePadding>
                    <ListItemButton
                      selected={location.pathname === link.path}
                      onClick={() => {
                        navigate(link.path);
                        setDrawerOpen(false);
                      }}
                    >
                      <ListItemText primary={link.label} />
                    </ListItemButton>
                  </ListItem>
                ))}
                {!user ? (
                  <ListItem disablePadding>
                    <ListItemButton
                      onClick={() => {
                        navigate("/login");
                        setDrawerOpen(false);
                      }}
                    >
                      <ListItemText primary="Sign In" />
                    </ListItemButton>
                  </ListItem>
                ) : (
                  <ListItem disablePadding>
                    <ListItemButton
                      onClick={() => {
                        onLogout();
                        setDrawerOpen(false);
                      }}
                    >
                      <ListItemText primary="Logout" />
                    </ListItemButton>
                  </ListItem>
                )}
              </List>
            </Drawer>
          </>
        ) : (
          <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
            {navLinks.map((link) => (
              <Button
                key={link.path}
                color="inherit"
                onClick={() => navigate(link.path)}
                sx={{
                  fontWeight:
                    location.pathname === link.path ? "bold" : "normal",
                  textDecoration:
                    location.pathname === link.path ? "underline" : "none",
                }}
              >
                {link.label}
              </Button>
            ))}

            {!user ? (
              <Button
                color="inherit"
                variant="outlined"
                size="small"
                onClick={() => navigate("/login")}
                sx={{ ml: 1.5, borderColor: "rgba(255,255,255,0.7)" }}
              >
                Sign In
              </Button>
            ) : (
              <>
                <Chip
                  label={`${user.username} (${user.is_admin ? "Admin" : "User"})`}
                  size="small"
                  sx={{
                    bgcolor: "rgba(255,255,255,0.2)",
                    color: "white",
                    ml: 1,
                  }}
                />
                <Button
                  color="inherit"
                  size="small"
                  onClick={onLogout}
                  sx={{ ml: 0.5 }}
                >
                  Logout
                </Button>
              </>
            )}
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}

function ProtectedAdmin({ user }) {
  const navigate = useNavigate();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!user.is_admin) {
    return (
      <Box sx={{ mt: 6, display: "flex", justifyContent: "center" }}>
        <Paper sx={{ p: 4, maxWidth: 500, textAlign: "center" }} elevation={3}>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <strong>Access Denied:</strong> Administrator role is required to
            access the Admin Dashboard.
          </Alert>
          <Typography variant="body2" color="text.secondary" paragraph>
            You are currently signed in as <strong>{user.username}</strong> (
            {user.role || "user"}).
          </Typography>
          <Button variant="contained" onClick={() => navigate("/dashboard")}>
            Go to Main Dashboard
          </Button>
        </Paper>
      </Box>
    );
  }

  return <AdminDashboard adminUser={user} />;
}

function App() {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  // Restore session on load
  useEffect(() => {
    const token = localStorage.getItem("token");
    const headers = token ? { Authorization: `Token ${token}` } : {};

    axios
      .get(`${API_BASE}/auth/login/`, { headers, withCredentials: true })
      .then((res) => {
        if (res.data && res.data.username) {
          const userData = {
            ...res.data,
            token: token || res.data.token,
          };
          setUser(userData);
          localStorage.setItem("user", JSON.stringify(userData));
        }
      })
      .catch(() => {
        // If request fails and no saved token, reset state
        if (!token) {
          setUser(null);
          localStorage.removeItem("user");
        }
      });
  }, []);

  const handleLogout = async () => {
    const token = localStorage.getItem("token");
    const headers = token ? { Authorization: `Token ${token}` } : {};

    try {
      await axios.post(
        `${API_BASE}/auth/logout/`,
        {},
        { headers, withCredentials: true },
      );
    } catch {}

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <NavBar user={user} onLogout={handleLogout} />
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4, flex: 1 }}>
        <Routes>
          <Route
            path="/"
            element={<HomePage user={user} onLogout={handleLogout} />}
          />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/map" element={<MigrationRiskMap />} />
          <Route path="/district/:id" element={<DistrictProfile />} />
          <Route path="/infrastructure" element={<InfrastructureGaps />} />
          <Route path="/compare" element={<CompareAreas />} />
          <Route path="/trends" element={<Trends />} />
          <Route path="/reports" element={<Reports />} />
          <Route
            path="/login"
            element={<Login onLoginSuccess={(u) => setUser(u)} />}
          />
          <Route path="/admin" element={<ProtectedAdmin user={user} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Container>
      <Box
        component="footer"
        sx={{ py: 2, textAlign: "center", bgcolor: "grey.100" }}
      >
        <Typography variant="body2" color="text.secondary">
          Rwanda Rural Youth Migration Risk Mapping System — Decision-support
          tool. Results do not predict individual migration decisions.
        </Typography>
      </Box>
    </Box>
  );
}

export default App;
