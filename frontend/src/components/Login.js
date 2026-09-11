import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Divider,
} from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import LockResetIcon from "@mui/icons-material/LockReset";
import axios from "axios";

const API_BASE = "http://localhost:8000/api";

function Login({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);

  // Forms State
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [signupForm, setSignupForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [resetForm, setResetForm] = useState({
    email: "",
    code: "",
    password: "",
  });
  const [resetStep, setResetStep] = useState(1);

  // UI state
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const handleTabChange = (event, newValue) => {
    setTab(newValue);
    clearMessages();
  };

  // 1. Sign In
  const handleLogin = async () => {
    if (!loginForm.username || !loginForm.password) {
      setError("Please enter both username and password.");
      return;
    }
    setLoading(true);
    clearMessages();

    try {
      const res = await axios.post(`${API_BASE}/auth/login/`, loginForm, {
        withCredentials: true,
      });
      const userData = res.data;
      if (userData.token) {
        localStorage.setItem("token", userData.token);
      }
      localStorage.setItem("user", JSON.stringify(userData));

      if (onLoginSuccess) {
        onLoginSuccess(userData);
      }

      setSuccess(`Login successful! Welcome back, ${userData.username}.`);

      setTimeout(() => {
        if (userData.is_admin) {
          navigate("/admin");
        } else {
          navigate("/dashboard");
        }
      }, 500);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.error ||
          "Login failed. Please check your credentials.",
      );
    } finally {
      setLoading(false);
    }
  };

  // 2. Sign Up
  const handleSignup = async () => {
    if (!signupForm.username || !signupForm.email || !signupForm.password) {
      setError("Please fill in all required fields.");
      return;
    }
    if (signupForm.password !== signupForm.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    clearMessages();

    try {
      await axios.post(`${API_BASE}/auth/signup/`, {
        username: signupForm.username,
        email: signupForm.email,
        password: signupForm.password,
      });
      setSuccess("Account created successfully! You can now log in.");
      setLoginForm({ username: signupForm.username, password: "" });
      setSignupForm({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
      setTab(0);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.error ||
          "Account creation failed.",
      );
    } finally {
      setLoading(false);
    }
  };

  // 3. Request Password Reset Code
  const handleRequestResetCode = async () => {
    if (!resetForm.email) {
      setError("Please enter your registered email address.");
      return;
    }
    setLoading(true);
    clearMessages();

    try {
      const res = await axios.post(`${API_BASE}/auth/forgot-password/`, {
        email: resetForm.email,
      });
      setSuccess(res.data?.detail || "Verification code sent to your email.");
      if (res.data?.code) {
        setResetForm((prev) => ({ ...prev, code: res.data.code }));
      }
      setResetStep(2);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to send reset code.");
    } finally {
      setLoading(false);
    }
  };

  // 4. Confirm Password Reset
  const handleConfirmReset = async () => {
    if (!resetForm.code || !resetForm.password) {
      setError("Please enter the verification code and your new password.");
      return;
    }
    setLoading(true);
    clearMessages();

    try {
      const res = await axios.post(`${API_BASE}/auth/reset-password/`, {
        email: resetForm.email,
        code: resetForm.code,
        password: resetForm.password,
      });
      setSuccess(
        res.data?.detail || "Password reset successfully! You can now log in.",
      );
      setResetForm({ email: "", code: "", password: "" });
      setResetStep(1);
      setTab(0);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="75vh"
      py={4}
    >
      <Paper
        sx={{ p: 4, width: { xs: "100%", sm: 440 }, borderRadius: 2 }}
        elevation={4}
      >
        <Box display="flex" alignItems="center" gap={1.5} mb={2}>
          <LockIcon color="primary" fontSize="large" />
          <Box>
            <Typography variant="h5" fontWeight="bold">
              Account Access
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Rwanda Rural Youth Migration Risk Mapping System
            </Typography>
          </Box>
        </Box>

        <Tabs
          value={tab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ mb: 2 }}
        >
          <Tab
            icon={<LockIcon fontSize="small" />}
            iconPosition="start"
            label="Sign In"
          />
          <Tab
            icon={<PersonAddIcon fontSize="small" />}
            iconPosition="start"
            label="Register"
          />
          <Tab
            icon={<LockResetIcon fontSize="small" />}
            iconPosition="start"
            label="Reset"
          />
        </Tabs>

        <Divider sx={{ mb: 2.5 }} />

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {/* TAB 0: SIGN IN */}
        {tab === 0 && (
          <Box
            component="form"
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin();
            }}
          >
            <TextField
              fullWidth
              label="Username"
              value={loginForm.username}
              onChange={(e) =>
                setLoginForm({ ...loginForm, username: e.target.value })
              }
              sx={{ mb: 2 }}
              autoFocus
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={loginForm.password}
              onChange={(e) =>
                setLoginForm({ ...loginForm, password: e.target.value })
              }
              sx={{ mb: 3 }}
            />
            <Button
              fullWidth
              variant="contained"
              size="large"
              type="submit"
              disabled={loading}
              sx={{ py: 1.2 }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Sign In"
              )}
            </Button>
          </Box>
        )}

        {/* TAB 1: REGISTER */}
        {tab === 1 && (
          <Box
            component="form"
            onSubmit={(e) => {
              e.preventDefault();
              handleSignup();
            }}
          >
            <TextField
              fullWidth
              label="Username"
              value={signupForm.username}
              onChange={(e) =>
                setSignupForm({ ...signupForm, username: e.target.value })
              }
              sx={{ mb: 2 }}
              autoFocus
            />
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={signupForm.email}
              onChange={(e) =>
                setSignupForm({ ...signupForm, email: e.target.value })
              }
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={signupForm.password}
              onChange={(e) =>
                setSignupForm({ ...signupForm, password: e.target.value })
              }
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Confirm Password"
              type="password"
              value={signupForm.confirmPassword}
              onChange={(e) =>
                setSignupForm({
                  ...signupForm,
                  confirmPassword: e.target.value,
                })
              }
              sx={{ mb: 3 }}
            />
            <Button
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              type="submit"
              disabled={loading}
              sx={{ py: 1.2 }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Create Account"
              )}
            </Button>
          </Box>
        )}

        {/* TAB 2: FORGOT / RESET PASSWORD */}
        {tab === 2 && (
          <Box
            component="form"
            onSubmit={(e) => {
              e.preventDefault();
              resetStep === 1 ? handleRequestResetCode() : handleConfirmReset();
            }}
          >
            {resetStep === 1 ? (
              <>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  Enter your email address to receive a password reset
                  verification code.
                </Typography>
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={resetForm.email}
                  onChange={(e) =>
                    setResetForm({ ...resetForm, email: e.target.value })
                  }
                  sx={{ mb: 3 }}
                  autoFocus
                />
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  size="large"
                  type="submit"
                  disabled={loading}
                  sx={{ py: 1.2 }}
                >
                  {loading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    "Send Reset Code"
                  )}
                </Button>
              </>
            ) : (
              <>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  Enter the verification code sent to{" "}
                  <strong>{resetForm.email}</strong> and set your new password.
                </Typography>
                <TextField
                  fullWidth
                  label="Verification Code"
                  value={resetForm.code}
                  onChange={(e) =>
                    setResetForm({ ...resetForm, code: e.target.value })
                  }
                  sx={{ mb: 2 }}
                  autoFocus
                />
                <TextField
                  fullWidth
                  label="New Password"
                  type="password"
                  value={resetForm.password}
                  onChange={(e) =>
                    setResetForm({ ...resetForm, password: e.target.value })
                  }
                  sx={{ mb: 3 }}
                />
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  size="large"
                  type="submit"
                  disabled={loading}
                  sx={{ py: 1.2 }}
                >
                  {loading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </>
            )}
          </Box>
        )}
      </Paper>
    </Box>
  );
}

export default Login;
