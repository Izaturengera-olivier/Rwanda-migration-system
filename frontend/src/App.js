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
import Footer from "./components/Footer";
import Messages from "./components/Messages";
import logo from "./logo.png";

const API_BASE = "http://localhost:8000/api";

const PUBLIC_NAV = [
  { label: "Home", path: "/" },
  { label: "Dashboard", path: "/dashboard" },
  { label: "Infrastructure", path: "/infrastructure" },
  { label: "Trends", path: "/trends" },
];

export function getUserRoleLabel(user) {
  if (!user) return "Guest";
  const r = (user.role || "").toLowerCase();
  if (user.is_admin || r === "admin") return "Admin";
  if (user.is_officer || r === "officer" || r === "researcher") return "District Officer";
  return "Youth";
}

export function isUserAdmin(user) {
  if (!user) return false;
  return Boolean(user.is_admin || user.role === "admin");
}

export function isUserOfficer(user) {
  if (!user) return false;
  return Boolean(
    user.is_admin ||
    user.is_officer ||
    user.role === "admin" ||
    user.role === "officer" ||
    user.role === "researcher"
  );
}

export function isUserYouth(user) {
  if (!user) return false;
  if (isUserAdmin(user) || isUserOfficer(user)) return false;
  const r = (user.role || "").toLowerCase();
  return r === "user" || r === "viewer" || !r;
}

function NavBar({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (location.pathname === "/") return null;

  const navLinks = [...PUBLIC_NAV];
  if (isUserOfficer(user)) {
    navLinks.push({ label: "Compare", path: "/compare" });
    navLinks.push({ label: "Reports", path: "/reports" });
    if (isUserAdmin(user)) {
      navLinks.push({ label: "Admin Dashboard", path: "/admin" });
    } else {
      navLinks.push({ label: "Officer Portal", path: "/data-management" });
    }
  }

  return (
    <AppBar position="fixed" sx={{ zIndex: 1300 }}>
      <Toolbar>
        <Box
          display="flex"
          alignItems="center"
          gap={1.5}
          sx={{ flexGrow: 1, cursor: "pointer" }}
          onClick={() => navigate("/")}
        >
          <Box
            component="img"
            src={logo}
            alt="Rwanda Youth Migration & Infrastructure Insights Logo"
            sx={{
              height: 42,
              width: 42,
              objectFit: "contain",
              borderRadius: "50%",
              bgcolor: "white",
              p: 0.3,
              boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
            }}
          />
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              fontSize: { xs: "0.85rem", md: "1.05rem" },
            }}
          >
            Rwanda Youth Migration & Infrastructure Insights
          </Typography>
        </Box>

        {isMobile ? (
          <>
            {user && <Messages user={user} />}
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
                <Messages user={user} />
                <Chip
                  label={`${user.username} (${getUserRoleLabel(user)})`}
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

function ProtectedOfficer({ user, children }) {
  if (!isUserOfficer(user)) {
    return <Navigate to={user ? "/dashboard" : "/login"} replace />;
  }
  return children;
}

function ProtectedManagement({ user, adminOnly = false }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isUserAdmin(user)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (!isUserOfficer(user)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <AdminDashboard adminUser={user} />;
}

function App() {
  const location = useLocation();
  const isHome = location.pathname === "/";
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

  const pageContent = (
        <Routes>
          <Route
            path="/"
            element={<HomePage user={user} onLogout={handleLogout} />}
          />
          <Route path="/dashboard" element={<Dashboard user={user} />} />
          <Route path="/map" element={<MigrationRiskMap />} />
          <Route path="/district/:id" element={<DistrictProfile user={user} />} />
          <Route path="/infrastructure" element={<InfrastructureGaps />} />
          <Route
            path="/compare"
            element={
              <ProtectedOfficer user={user}>
                <CompareAreas />
              </ProtectedOfficer>
            }
          />
          <Route path="/trends" element={<Trends />} />
          <Route
            path="/reports"
            element={
              <ProtectedOfficer user={user}>
                <Reports />
              </ProtectedOfficer>
            }
          />
          <Route
            path="/login"
            element={<Login onLoginSuccess={(u) => setUser(u)} />}
          />
          <Route path="/admin" element={<ProtectedManagement user={user} adminOnly={true} />} />
          <Route path="/data-management" element={<ProtectedManagement user={user} adminOnly={false} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <NavBar user={user} onLogout={handleLogout} />
      {isHome ? (
        <Box sx={{ flex: 1 }}>{pageContent}</Box>
      ) : (
        <Container maxWidth="xl" sx={{ mt: 10, mb: 4, flex: 1 }}>
          {pageContent}
        </Container>
      )}
      <Footer user={user} />
    </Box>
  );
}

export default App;
