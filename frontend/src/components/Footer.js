import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Container,
    Grid,
    Typography,
    Link as MuiLink,
    Stack,
    Divider,
    Chip,
} from '@mui/material';
import {
    LocationOn,
    Public,
} from '@mui/icons-material';
import logo from '../logo.png';

const Footer = () => {
    const navigate = useNavigate();

    return (
        <Box
            component="footer"
            sx={{
                bgcolor: '#0f172a',
                color: '#94a3b8',
                pt: 6,
                pb: 4,
                borderTop: '1px solid #1e293b',
                mt: 'auto',
            }}
        >
            <Container maxWidth="lg">
                <Grid container spacing={4}>
                    {/* Column 1: Branding & Mission */}
                    <Grid item xs={12} md={4}>
                        <Stack spacing={2}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Box
                                    component="img"
                                    src={logo}
                                    alt="Rwanda Youth Migration & Infrastructure Insights Logo"
                                    sx={{
                                        width: 44,
                                        height: 44,
                                        borderRadius: '50%',
                                        bgcolor: 'white',
                                        p: 0.3,
                                        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)',
                                    }}
                                />
                                <Typography variant="h6" fontWeight={700} color="#f8fafc" sx={{ fontSize: '1.05rem' }}>
                                    Rwanda Youth Migration System
                                </Typography>
                            </Box>
                            <Typography variant="body2" sx={{ lineHeight: 1.7, color: '#94a3b8' }}>
                                Advanced spatial decision-support platform tracking rural youth migration drivers, demographic trends, and infrastructure deficits across Gisagara District sectors.
                            </Typography>
                            <Stack spacing={1} sx={{ pt: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.875rem' }}>
                                    <LocationOn sx={{ fontSize: 18, color: '#38bdf8' }} />
                                    <span>Kigali, Republic of Rwanda</span>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.875rem' }}>
                                    <Public sx={{ fontSize: 18, color: '#38bdf8' }} />
                                    <span>National Spatial Data Infrastructure (NSDI)</span>
                                </Box>
                            </Stack>
                        </Stack>
                    </Grid>

                    {/* Column 2: Quick Navigation */}
                    <Grid item xs={6} sm={3} md={2.5}>
                        <Typography variant="subtitle1" fontWeight={700} color="#f8fafc" sx={{ mb: 2 }}>
                            Navigation
                        </Typography>
                        <Stack spacing={1.2}>
                            {[
                                { label: 'Home', path: '/' },
                                { label: 'Risk Dashboard', path: '/dashboard' },
                                { label: 'Infrastructure Gaps', path: '/infrastructure' },
                                { label: 'District Comparison', path: '/compare' },
                                { label: 'Migration Trends', path: '/trends' },
                                { label: 'Analytics Reports', path: '/reports' },
                            ].map((item) => (
                                <MuiLink
                                    key={item.path}
                                    component="button"
                                    onClick={() => navigate(item.path)}
                                    underline="hover"
                                    sx={{
                                        color: '#94a3b8',
                                        textAlign: 'left',
                                        fontSize: '0.9rem',
                                        transition: 'color 0.2s',
                                        '&:hover': { color: '#38bdf8' },
                                    }}
                                >
                                    {item.label}
                                </MuiLink>
                            ))}
                        </Stack>
                    </Grid>

                    {/* Column 3: Analytics Modules */}
                    <Grid item xs={6} sm={3} md={2.5}>
                        <Typography variant="subtitle1" fontWeight={700} color="#f8fafc" sx={{ mb: 2 }}>
                            Analytics & Tools
                        </Typography>
                        <Stack spacing={1.2}>
                            {[
                                { label: 'Spatial Risk Map', path: '/dashboard' },
                                { label: 'Prioritization Matrix', path: '/infrastructure' },
                                { label: 'Comparative Indicators', path: '/compare' },
                                { label: 'Policy Summaries', path: '/reports' },
                                { label: 'Administrator Portal', path: '/admin' },
                            ].map((item) => (
                                <MuiLink
                                    key={item.label}
                                    component="button"
                                    onClick={() => navigate(item.path)}
                                    underline="hover"
                                    sx={{
                                        color: '#94a3b8',
                                        textAlign: 'left',
                                        fontSize: '0.9rem',
                                        transition: 'color 0.2s',
                                        '&:hover': { color: '#38bdf8' },
                                    }}
                                >
                                    {item.label}
                                </MuiLink>
                            ))}
                        </Stack>
                    </Grid>

                    {/* Column 4: Institutional Framework & Tags */}
                    <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="subtitle1" fontWeight={700} color="#f8fafc" sx={{ mb: 2 }}>
                            Data & Governance
                        </Typography>
                        <Typography variant="body2" sx={{ lineHeight: 1.6, mb: 2 }}>
                            Integrated with national statistical census data, spatial GIS layers, and local economic development metrics.
                        </Typography>
                        <Stack direction="row" flexWrap="wrap" gap={0.8}>
                            <Chip label="NISR Data" size="small" sx={{ bgcolor: '#1e293b', color: '#cbd5e1', fontSize: '0.75rem' }} />
                            <Chip label="MINALOC" size="small" sx={{ bgcolor: '#1e293b', color: '#cbd5e1', fontSize: '0.75rem' }} />
                            <Chip label="GIS Spatial" size="small" sx={{ bgcolor: '#1e293b', color: '#cbd5e1', fontSize: '0.75rem' }} />
                            <Chip label="Youth Economic Index" size="small" sx={{ bgcolor: '#1e293b', color: '#cbd5e1', fontSize: '0.75rem' }} />
                        </Stack>
                    </Grid>
                </Grid>

                <Divider sx={{ my: 4, borderColor: '#1e293b' }} />

                {/* Bottom Bar & Policy Disclaimer */}
                <Stack
                    direction={{ xs: 'column', md: 'row' }}
                    justifyContent="space-between"
                    alignItems={{ xs: 'flex-start', md: 'center' }}
                    spacing={2}
                >
                    <Typography variant="caption" sx={{ color: '#64748b', maxWidth: 700, lineHeight: 1.6 }}>
                        <strong>Decision Support Disclaimer:</strong> Results and predictive risk models provide aggregate macro analysis for policy formulation and infrastructure planning. They do not predict or track individual migration choices.
                    </Typography>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                            © {new Date().getFullYear()} Republic of Rwanda
                        </Typography>
                        <Chip
                            label="v1.0.0"
                            size="small"
                            variant="outlined"
                            sx={{ borderColor: '#334155', color: '#94a3b8', height: 20, fontSize: '0.7rem' }}
                        />
                    </Stack>
                </Stack>
            </Container>
        </Box>
    );
};

export default Footer;
