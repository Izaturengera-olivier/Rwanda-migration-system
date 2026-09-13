import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Button,
    Card,
    CardContent,
    Container,
    Grid,
    Link,
    Paper,
    Stack,
    Tab,
    Tabs,
    TextField,
    Typography,
    Alert,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    IconButton,
    Chip,
    Divider,
} from '@mui/material';
import {
    Close,
    Map,
    Assessment,
    CompareArrows,
    TrendingUp,
    Description,
    Lock,
    Person,
    Shield,
    ArrowForward,
    Explore,
    CheckCircleOutline,
    Storage,
    Group,
} from '@mui/icons-material';
import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

const QUICK_MODULES = [
    {
        title: 'Risk Dashboard',
        desc: 'Overview of district risk levels, population stats, and priority intervention areas.',
        path: '/dashboard',
        icon: <Assessment sx={{ fontSize: 32, color: '#2563eb' }} />,
        badge: 'Core Portal',
    },
    {
        title: 'Infrastructure Gaps',
        desc: 'Analyze gaps in electricity, clean water, transport, and public sanitation.',
        path: '/infrastructure',
        icon: <Storage sx={{ fontSize: 32, color: '#059669' }} />,
        badge: 'Spatial Data',
    },
    {
        title: 'District Comparison',
        desc: 'Side-by-side benchmarking of socio-economic and migration indicators.',
        path: '/compare',
        icon: <CompareArrows sx={{ fontSize: 32, color: '#d97706' }} />,
        badge: 'Analytics',
    },
    {
        title: 'Migration Trends',
        desc: 'Explore historical trajectories and predictive forecasting models.',
        path: '/trends',
        icon: <TrendingUp sx={{ fontSize: 32, color: '#7c3aed' }} />,
        badge: 'Forecasting',
    },
    {
        title: 'Policy Reports',
        desc: 'Generate automated decision briefs and export district summary files.',
        path: '/reports',
        icon: <Description sx={{ fontSize: 32, color: '#dc2626' }} />,
        badge: 'Reporting',
    },
];

const METRICS = [
    { label: '6 Districts', sub: 'Study Area Spatial Coverage' },
    { label: '4 Risk Levels', sub: 'Very High to Low Categories' },
    { label: 'Infrastructure', sub: 'Power, Water & Road Gap Tracking' },
    { label: 'Youth Focus', sub: 'Targeted Demographics (15–35 yrs)' },
];

function HomePage({ user, onLogout }) {
    const navigate = useNavigate();

    // Modal state for Authentication (Login / Sign Up / Reset)
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [authTab, setAuthTab] = useState(0); // 0: Login, 1: Sign Up, 2: Reset Password

    // Form states
    const [loginForm, setLoginForm] = useState({ username: '', password: '' });
    const [signupForm, setSignupForm] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [resetForm, setResetForm] = useState({ email: '', verificationCode: '', newPassword: '' });
    const [status, setStatus] = useState({ type: '', message: '' });
    const [loading, setLoading] = useState(false);

    const handleOpenAuth = (tabIndex = 0) => {
        setAuthTab(tabIndex);
        setStatus({ type: '', message: '' });
        setAuthModalOpen(true);
    };

    const handleCloseAuth = () => {
        setAuthModalOpen(false);
        setStatus({ type: '', message: '' });
    };

    const handleAuthMessage = (type, message) => {
        setStatus({ type, message });
    };

    const handleLogin = async () => {
        if (!loginForm.username || !loginForm.password) {
            handleAuthMessage('error', 'Please enter your username and password.');
            return;
        }

        setLoading(true);
        try {
            const res = await axios.post(`${API_BASE}/auth/login/`, loginForm, { withCredentials: true });
            const userData = res.data;
            if (userData.token) {
                localStorage.setItem('token', userData.token);
            }
            localStorage.setItem('user', JSON.stringify(userData));

            const isSystemAdmin = userData.is_admin;
            const targetMessage = isSystemAdmin
                ? 'Login successful! Redirecting to Admin Dashboard...'
                : 'Login successful! Redirecting to Dashboard...';
            const targetPath = isSystemAdmin ? '/admin' : '/dashboard';

            handleAuthMessage('success', targetMessage);
            setTimeout(() => {
                window.location.href = targetPath;
            }, 500);
        } catch (error) {
            const message = error.response?.data?.detail || error.response?.data?.error || 'Login failed. Please verify credentials.';
            handleAuthMessage('error', message);
        } finally {
            setLoading(false);
        }
    };

    const handleSignup = async () => {
        if (!signupForm.username || !signupForm.email || !signupForm.password) {
            handleAuthMessage('error', 'Please fill in all required fields.');
            return;
        }

        if (signupForm.password !== signupForm.confirmPassword) {
            handleAuthMessage('error', 'Passwords do not match.');
            return;
        }

        setLoading(true);
        try {
            await axios.post(`${API_BASE}/auth/signup/`, {
                username: signupForm.username,
                email: signupForm.email,
                password: signupForm.password,
            });
            handleAuthMessage('success', 'Account created successfully! You can now log in.');
            setSignupForm({ username: '', email: '', password: '', confirmPassword: '' });
            setTimeout(() => {
                setAuthTab(0);
            }, 1200);
        } catch (error) {
            const data = error.response?.data;
            let message = 'Unable to create account right now.';
            if (typeof data === 'string') {
                message = data;
            } else if (data?.detail) {
                message = data.detail;
            } else if (data?.error) {
                message = data.error;
            } else if (data && typeof data === 'object') {
                const firstKey = Object.keys(data)[0];
                if (firstKey) {
                    const errVal = data[firstKey];
                    message = Array.isArray(errVal) ? `${firstKey}: ${errVal.join(', ')}` : `${firstKey}: ${errVal}`;
                }
            }
            handleAuthMessage('error', message);
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordReset = async () => {
        if (!resetForm.email) {
            handleAuthMessage('error', 'Please enter your registered email address.');
            return;
        }

        setLoading(true);
        try {
            if (!resetForm.verificationCode) {
                const res = await axios.post(`${API_BASE}/auth/forgot-password/`, { email: resetForm.email });
                const devCode = res.data?.code;
                if (devCode) {
                    setResetForm((prev) => ({ ...prev, verificationCode: devCode }));
                }
                handleAuthMessage('success', res.data?.detail || 'Verification code sent! Check your inbox.');
                return;
            }

            await axios.post(`${API_BASE}/auth/reset-password/`, {
                email: resetForm.email,
                code: resetForm.verificationCode,
                password: resetForm.newPassword,
            });
            handleAuthMessage('success', 'Password reset successfully! You can now log in.');
            setResetForm({ email: '', verificationCode: '', newPassword: '' });
            setTimeout(() => {
                setAuthTab(0);
            }, 1200);
        } catch (error) {
            const message = error.response?.data?.detail || error.response?.data?.error || 'Password reset failed. Try again.';
            handleAuthMessage('error', message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc' }}>
            {/* Top Custom Header embedded in Home Page */}
            <Box
                sx={{
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    py: 1.5,
                    px: { xs: 2, md: 4 },
                }}
            >
                <Container maxWidth="xl">
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Stack
                            direction="row"
                            spacing={1.5}
                            alignItems="center"
                            onClick={() => navigate('/')}
                            sx={{ cursor: 'pointer' }}
                        >
                            <Box
                                sx={{
                                    bgcolor: '#2563eb',
                                    p: 0.8,
                                    borderRadius: 2,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                }}
                            >
                                <Shield fontSize="small" />
                            </Box>
                            <Typography variant="h6" fontWeight={700} sx={{ color: 'white', letterSpacing: 0.5, fontSize: { xs: '0.95rem', sm: '1.2rem' } }}>
                                Rwanda Migration Risk Mapping
                            </Typography>
                        </Stack>

                        <Stack direction="row" spacing={{ xs: 1, sm: 2 }} alignItems="center">
                            <Button
                                variant="text"
                                sx={{ color: '#cbd5e1', display: { xs: 'none', md: 'inline-flex' }, '&:hover': { color: 'white' } }}
                                onClick={() => navigate('/dashboard')}
                            >
                                Dashboard
                            </Button>
                            <Button
                                variant="text"
                                sx={{ color: '#cbd5e1', display: { xs: 'none', md: 'inline-flex' }, '&:hover': { color: 'white' } }}
                                onClick={() => navigate('/infrastructure')}
                            >
                                Infrastructure
                            </Button>
                            <Button
                                variant="text"
                                sx={{ color: '#cbd5e1', display: { xs: 'none', md: 'inline-flex' }, '&:hover': { color: 'white' } }}
                                onClick={() => navigate('/compare')}
                            >
                                Compare
                            </Button>
                            {user?.is_admin && (
                                <Button
                                    variant="text"
                                    sx={{ color: '#a5d6a7', display: { xs: 'none', md: 'inline-flex' }, '&:hover': { color: 'white' } }}
                                    onClick={() => navigate('/admin')}
                                >
                                    Admin Dashboard
                                </Button>
                            )}
                            {!user ? (
                                <Button
                                    variant="contained"
                                    size="small"
                                    startIcon={<Lock fontSize="small" />}
                                    onClick={() => navigate('/login')}
                                    sx={{
                                        bgcolor: '#2563eb',
                                        px: 2.5,
                                        py: 0.8,
                                        borderRadius: 2,
                                        fontWeight: 600,
                                        textTransform: 'none',
                                        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                                        '&:hover': { bgcolor: '#1d4ed8' },
                                    }}
                                >
                                    Sign In / Portal
                                </Button>
                            ) : (
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <Chip
                                        label={`${user.username} (${user.is_admin ? 'Admin' : 'User'})`}
                                        size="small"
                                        sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                                    />
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        onClick={onLogout}
                                        sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.4)' }}
                                    >
                                        Logout
                                    </Button>
                                </Stack>
                            )}
                        </Stack>
                    </Stack>
                </Container>
            </Box>

            {/* Hero Section */}
            <Box
                sx={{
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f2b46 100%)',
                    color: 'white',
                    pt: { xs: 6, md: 10 },
                    pb: { xs: 8, md: 12 },
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                <Container maxWidth="lg">
                    <Grid container spacing={4} justifyContent="center" alignItems="center">
                        <Grid item xs={12} md={10} lg={9}>
                            <Stack spacing={3} alignItems="center" textAlign="center">
                                <Box
                                    sx={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        px: 2,
                                        py: 0.75,
                                        borderRadius: 20,
                                        bgcolor: 'rgba(37, 99, 235, 0.15)',
                                        border: '1px solid rgba(37, 99, 235, 0.3)',
                                        color: '#60a5fa',
                                        width: 'fit-content',
                                        mx: 'auto',
                                    }}
                                >
                                    <Shield fontSize="small" />
                                    <Typography variant="subtitle2" fontWeight={600} sx={{ letterSpacing: 0.5 }}>
                                        Decision Support System for Policy Makers & Researchers
                                    </Typography>
                                </Box>

                                <Typography
                                    variant="h1"
                                    sx={{
                                        fontSize: { xs: '2.2rem', sm: '3.2rem', md: '3.8rem' },
                                        fontWeight: 800,
                                        lineHeight: 1.15,
                                        letterSpacing: '-0.02em',
                                        textAlign: 'center',
                                    }}
                                >
                                    Predictive Intelligence on Youth Migration Risk in Rwanda
                                </Typography>

                                <Typography
                                    variant="h6"
                                    sx={{
                                        color: '#94a3b8',
                                        fontWeight: 400,
                                        maxWidth: 720,
                                        lineHeight: 1.6,
                                        textAlign: 'center',
                                        mx: 'auto',
                                    }}
                                >
                                    Monitor vulnerable districts, assess infrastructure deficits, and analyze socio-economic factors driving youth out-migration across 6 districts of Rwanda.
                                </Typography>

                                <Stack
                                    direction={{ xs: 'column', sm: 'row' }}
                                    spacing={2}
                                    justifyContent="center"
                                    alignItems="center"
                                    sx={{ pt: 1 }}
                                >
                                    <Button
                                        variant="contained"
                                        size="large"
                                        endIcon={<ArrowForward />}
                                        onClick={() => navigate('/dashboard')}
                                        sx={{
                                            bgcolor: '#2563eb',
                                            py: 1.6,
                                            px: 3.5,
                                            borderRadius: 2.5,
                                            fontWeight: 700,
                                            fontSize: '1rem',
                                            textTransform: 'none',
                                            boxShadow: '0 8px 24px rgba(37, 99, 235, 0.4)',
                                            '&:hover': { bgcolor: '#1d4ed8' },
                                        }}
                                    >
                                        Explore Risk Dashboard
                                    </Button>

                                    <Button
                                        variant="outlined"
                                        size="large"
                                        startIcon={<Person />}
                                        onClick={() => handleOpenAuth(0)}
                                        sx={{
                                            color: '#e2e8f0',
                                            borderColor: 'rgba(255, 255, 255, 0.3)',
                                            py: 1.6,
                                            px: 3.5,
                                            borderRadius: 2.5,
                                            fontWeight: 600,
                                            fontSize: '1rem',
                                            textTransform: 'none',
                                            '&:hover': { borderColor: 'white', bgcolor: 'rgba(255, 255, 255, 0.05)' },
                                        }}
                                    >
                                        Portal Sign In
                                    </Button>
                                </Stack>
                            </Stack>
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            {/* Metrics Counter Bar */}
            <Container maxWidth="lg" sx={{ mt: -5, position: 'relative', zIndex: 10 }}>
                <Grid container spacing={2}>
                    {METRICS.map((metric, idx) => (
                        <Grid item xs={6} md={3} key={idx}>
                            <Paper
                                elevation={4}
                                sx={{
                                    p: 2.5,
                                    borderRadius: 3,
                                    bgcolor: 'white',
                                    border: '1px solid #e2e8f0',
                                    textAlign: 'center',
                                    transition: 'transform 0.2s',
                                    '&:hover': { transform: 'translateY(-3px)' },
                                }}
                            >
                                <Typography variant="h5" fontWeight={800} color="primary.main">
                                    {metric.label}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" fontWeight={500}>
                                    {metric.sub}
                                </Typography>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
            </Container>

            {/* Platform Analytics Modules Grid */}
            <Container maxWidth="lg" sx={{ py: 8 }}>
                <Box sx={{ textAlign: 'center', mb: 6 }}>
                    <Chip label="System Capabilities" color="primary" variant="outlined" sx={{ fontWeight: 600, mb: 1 }} />
                    <Typography variant="h4" fontWeight={800} color="#0f172a" sx={{ mb: 1 }}>
                        Comprehensive Spatial & Risk Analysis Modules
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
                        Designed for government agencies, NGOs, and researchers to make evidence-based policy decisions.
                    </Typography>
                </Box>

                <Grid container spacing={3}>
                    {QUICK_MODULES.map((mod, idx) => (
                        <Grid item xs={12} sm={6} md={4} key={idx}>
                            <Card
                                elevation={0}
                                sx={{
                                    height: '100%',
                                    borderRadius: 4,
                                    border: '1px solid #e2e8f0',
                                    bgcolor: 'white',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    transition: 'all 0.25s ease',
                                    '&:hover': {
                                        boxShadow: '0 12px 30px rgba(0, 0, 0, 0.08)',
                                        borderColor: '#bfdbfe',
                                        transform: 'translateY(-4px)',
                                    },
                                }}
                            >
                                <CardContent sx={{ p: 3 }}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                                        <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: '#f1f5f9' }}>{mod.icon}</Box>
                                        <Chip label={mod.badge} size="small" sx={{ fontWeight: 600, bgcolor: '#eff6ff', color: '#1d4ed8' }} />
                                    </Stack>

                                    <Typography variant="h6" fontWeight={700} color="#0f172a" sx={{ mb: 1 }}>
                                        {mod.title}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                                        {mod.desc}
                                    </Typography>
                                </CardContent>

                                <Box sx={{ p: 3, pt: 0 }}>
                                    <Button
                                        fullWidth
                                        variant="text"
                                        endIcon={<ArrowForward fontSize="small" />}
                                        onClick={() => navigate(mod.path)}
                                        sx={{
                                            justifyContent: 'space-between',
                                            fontWeight: 700,
                                            color: '#2563eb',
                                            textTransform: 'none',
                                            '&:hover': { bgcolor: '#eff6ff' },
                                        }}
                                    >
                                        Open {mod.title}
                                    </Button>
                                </Box>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Container>

            {/* Authentication Dialog (Modal) */}
            <Dialog
                open={authModalOpen}
                onClose={handleCloseAuth}
                maxWidth="xs"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 4,
                        p: 1,
                        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                    },
                }}
            >
                <DialogTitle sx={{ m: 0, p: 2, pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Box sx={{ p: 0.8, borderRadius: 2, bgcolor: '#eff6ff', color: '#2563eb', display: 'flex' }}>
                            <Lock fontSize="small" />
                        </Box>
                        <Typography variant="h6" fontWeight={700} color="#0f172a">
                            Portal Access
                        </Typography>
                    </Stack>
                    <IconButton onClick={handleCloseAuth} size="small">
                        <Close />
                    </IconButton>
                </DialogTitle>

                <DialogContent sx={{ p: 2, pt: 1 }}>
                    <Tabs
                        value={authTab}
                        onChange={(e, val) => {
                            setAuthTab(val);
                            setStatus({ type: '', message: '' });
                        }}
                        variant="fullWidth"
                        sx={{ mb: 2, borderBottom: '1px solid #e2e8f0' }}
                    >
                        <Tab label="Sign In" sx={{ fontWeight: 600, textTransform: 'none' }} />
                        <Tab label="Create Account" sx={{ fontWeight: 600, textTransform: 'none' }} />
                        <Tab label="Reset" sx={{ fontWeight: 600, textTransform: 'none' }} />
                    </Tabs>

                    {status.message && (
                        <Alert severity={status.type || 'info'} sx={{ mb: 2, borderRadius: 2 }}>
                            {status.message}
                        </Alert>
                    )}

                    {/* Tab 0: Login Form */}
                    {authTab === 0 && (
                        <Stack spacing={2} sx={{ pt: 1 }}>
                            <TextField
                                label="Username"
                                variant="outlined"
                                fullWidth
                                value={loginForm.username}
                                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                            />
                            <TextField
                                label="Password"
                                type="password"
                                variant="outlined"
                                fullWidth
                                value={loginForm.password}
                                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                            />

                            <Button
                                variant="contained"
                                size="large"
                                fullWidth
                                onClick={handleLogin}
                                disabled={loading}
                                sx={{
                                    bgcolor: '#2563eb',
                                    py: 1.4,
                                    borderRadius: 2.5,
                                    fontWeight: 700,
                                    textTransform: 'none',
                                    '&:hover': { bgcolor: '#1d4ed8' },
                                }}
                            >
                                {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
                            </Button>

                            <Divider sx={{ my: 1 }} />

                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Typography variant="body2" color="text.secondary">
                                    Don't have an account?{' '}
                                    <Link
                                        component="button"
                                        variant="body2"
                                        fontWeight={700}
                                        underline="hover"
                                        onClick={() => {
                                            setAuthTab(1);
                                            setStatus({ type: '', message: '' });
                                        }}
                                        sx={{ color: '#2563eb' }}
                                    >
                                        Create Account
                                    </Link>
                                </Typography>
                            </Stack>

                            <Box sx={{ textAlign: 'center' }}>
                                <Link
                                    component="button"
                                    variant="caption"
                                    color="text.secondary"
                                    underline="hover"
                                    onClick={() => {
                                        setAuthTab(2);
                                        setStatus({ type: '', message: '' });
                                    }}
                                >
                                    Forgot Password?
                                </Link>
                            </Box>
                        </Stack>
                    )}

                    {/* Tab 1: Sign Up Form */}
                    {authTab === 1 && (
                        <Stack spacing={2} sx={{ pt: 1 }}>
                            <TextField
                                label="Username"
                                variant="outlined"
                                fullWidth
                                value={signupForm.username}
                                onChange={(e) => setSignupForm({ ...signupForm, username: e.target.value })}
                            />
                            <TextField
                                label="Email Address"
                                type="email"
                                variant="outlined"
                                fullWidth
                                value={signupForm.email}
                                onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                            />
                            <TextField
                                label="Password"
                                type="password"
                                variant="outlined"
                                fullWidth
                                value={signupForm.password}
                                onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                            />
                            <TextField
                                label="Confirm Password"
                                type="password"
                                variant="outlined"
                                fullWidth
                                value={signupForm.confirmPassword}
                                onChange={(e) => setSignupForm({ ...signupForm, confirmPassword: e.target.value })}
                            />

                            <Button
                                variant="contained"
                                size="large"
                                fullWidth
                                onClick={handleSignup}
                                disabled={loading}
                                sx={{
                                    bgcolor: '#059669',
                                    py: 1.4,
                                    borderRadius: 2.5,
                                    fontWeight: 700,
                                    textTransform: 'none',
                                    '&:hover': { bgcolor: '#047857' },
                                }}
                            >
                                {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
                            </Button>

                            <Divider sx={{ my: 1 }} />

                            <Typography variant="body2" color="text.secondary" align="center">
                                Already have an account?{' '}
                                <Link
                                    component="button"
                                    variant="body2"
                                    fontWeight={700}
                                    underline="hover"
                                    onClick={() => {
                                        setAuthTab(0);
                                        setStatus({ type: '', message: '' });
                                    }}
                                    sx={{ color: '#2563eb' }}
                                >
                                    Sign In
                                </Link>
                            </Typography>
                        </Stack>
                    )}

                    {/* Tab 2: Reset Password Form */}
                    {authTab === 2 && (
                        <Stack spacing={2} sx={{ pt: 1 }}>
                            <TextField
                                label="Registered Email Address"
                                type="email"
                                variant="outlined"
                                fullWidth
                                value={resetForm.email}
                                onChange={(e) => setResetForm({ ...resetForm, email: e.target.value })}
                            />

                            {resetForm.verificationCode && (
                                <>
                                    <TextField
                                        label="Verification Code"
                                        variant="outlined"
                                        fullWidth
                                        value={resetForm.verificationCode}
                                        onChange={(e) => setResetForm({ ...resetForm, verificationCode: e.target.value })}
                                    />
                                    <TextField
                                        label="New Password"
                                        type="password"
                                        variant="outlined"
                                        fullWidth
                                        value={resetForm.newPassword}
                                        onChange={(e) => setResetForm({ ...resetForm, newPassword: e.target.value })}
                                    />
                                </>
                            )}

                            <Button
                                variant="contained"
                                size="large"
                                fullWidth
                                onClick={handlePasswordReset}
                                disabled={loading}
                                sx={{
                                    bgcolor: '#2563eb',
                                    py: 1.4,
                                    borderRadius: 2.5,
                                    fontWeight: 700,
                                    textTransform: 'none',
                                    '&:hover': { bgcolor: '#1d4ed8' },
                                }}
                            >
                                {loading ? (
                                    <CircularProgress size={24} color="inherit" />
                                ) : resetForm.verificationCode ? (
                                    'Reset Password'
                                ) : (
                                    'Send Verification Code'
                                )}
                            </Button>

                            <Divider sx={{ my: 1 }} />

                            <Typography variant="body2" color="text.secondary" align="center">
                                Back to{' '}
                                <Link
                                    component="button"
                                    variant="body2"
                                    fontWeight={700}
                                    underline="hover"
                                    onClick={() => {
                                        setAuthTab(0);
                                        setStatus({ type: '', message: '' });
                                    }}
                                    sx={{ color: '#2563eb' }}
                                >
                                    Sign In
                                </Link>
                            </Typography>
                        </Stack>
                    )}
                </DialogContent>
            </Dialog>

            {/* Footer */}
            <Box sx={{ bgcolor: '#0f172a', color: '#94a3b8', py: 4, px: 2, borderTop: '1px solid #1e293b', textAlign: 'center' }}>
                <Container maxWidth="lg">
                    <Typography variant="body2" sx={{ mb: 1 }}>
                        Rwanda Rural Youth Migration Risk Mapping System — Decision Support Tool
                    </Typography>
                    <Typography variant="caption" color="#64748b" display="block">
                        Results and predictive risk models provide aggregate analysis for policy formulation and do not predict individual decisions.
                    </Typography>
                </Container>
            </Box>
        </Box>
    );
}

export default HomePage;