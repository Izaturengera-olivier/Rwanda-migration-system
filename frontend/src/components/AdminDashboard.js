import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Paper, Tabs, Tab, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, Alert, Stepper, Step,
  StepLabel, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControl, InputLabel, Select, MenuItem, Chip,
  LinearProgress, Grid, Card, CardContent, Divider
} from '@mui/material';
import { Bar } from 'react-chartjs-2';
import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

function TabPanel({ children, value, index }) {
  return <div hidden={value !== index}>{value === index && <Box sx={{ p: 3 }}>{children}</Box>}</div>;
}

const STATUS_COLORS = {
  uploaded: 'default', validated: 'info', processed: 'success',
  active: 'success', archived: 'default', error: 'error',
  training: 'warning', trained: 'info', evaluated: 'info', deprecated: 'default'
};

const WORKFLOW_STEPS = ['Upload Dataset', 'Validate & Process', 'Review Data Quality', 'Train Model', 'Review Performance', 'Publish Results'];

function AdminDashboard() {
  const [tab, setTab] = useState(0);
  const [datasets, setDatasets] = useState([]);
  const [models, setModels] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [uploadDialog, setUploadDialog] = useState(false);
  const [trainDialog, setTrainDialog] = useState(false);
  const [qualityDialog, setQualityDialog] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [uploadForm, setUploadForm] = useState({ name: '', dataset_type: 'population', year: 2023, version: '1.0', source: '' });
  const [trainForm, setTrainForm] = useState({ algorithm: 'random_forest', dataset_id: '' });
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef();

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = () => { fetchDatasets(); fetchModels(); fetchAuditLogs(); };
  const fetchDatasets = () => axios.get(`${API_BASE}/datasets/`).then(r => setDatasets(r.data.results || r.data)).catch(() => {});
  const fetchModels = () => axios.get(`${API_BASE}/models/`).then(r => setModels(r.data.results || r.data)).catch(() => {});
  const fetchAuditLogs = () => axios.get(`${API_BASE}/audit-logs/`).then(r => setAuditLogs(r.data.results || r.data)).catch(() => {});

  const showSuccess = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(null), 5000); };

  const handleUpload = async () => {
    if (!selectedFile) { setError('Please select a file'); return; }
    if (!uploadForm.name) { setError('Please enter a dataset name'); return; }
    const formData = new FormData();
    formData.append('file', selectedFile);
    Object.entries(uploadForm).forEach(([k, v]) => formData.append(k, v));
    try {
      setLoading(true);
      await axios.post(`${API_BASE}/datasets/`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setUploadDialog(false);
      setSelectedFile(null);
      setUploadForm({ name: '', dataset_type: 'population', year: 2023, version: '1.0', source: '' });
      fetchDatasets();
      showSuccess('Dataset uploaded. Now click "Validate & Process" to continue.');
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed');
    } finally { setLoading(false); }
  };

  const handleProcess = async (id) => {
    try {
      setLoading(true);
      const res = await axios.post(`${API_BASE}/datasets/${id}/process/`);
      fetchDatasets();
      if (res.data.success) {
        showSuccess(`Processed ${res.data.processed} records successfully. Review data quality before training.`);
      } else {
        setError(res.data.error || 'Processing failed');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Processing failed');
    } finally { setLoading(false); }
  };

  const handleTrain = async () => {
    if (!trainForm.dataset_id) { setError('Please select a dataset'); return; }
    try {
      setLoading(true);
      await axios.post(`${API_BASE}/models/train/`, trainForm);
      setTrainDialog(false);
      fetchModels();
      showSuccess('Model training complete. Review performance metrics before publishing.');
    } catch (err) {
      setError(err.response?.data?.error || 'Training failed');
    } finally { setLoading(false); }
  };

  const handleActivate = async (id) => {
    try {
      setLoading(true);
      await axios.post(`${API_BASE}/models/${id}/activate/`);
      fetchModels();
      showSuccess('Model published and activated. The dashboard now reflects the updated results.');
    } catch (err) {
      setError(err.response?.data?.error || 'Activation failed');
    } finally { setLoading(false); }
  };

  // Determine current workflow step
  const processedDatasets = datasets.filter(d => d.status === 'processed' || d.status === 'active');
  const activeModel = models.find(m => m.is_active);
  const pendingModels = models.filter(m => !m.is_active && (m.status === 'evaluated' || m.status === 'trained'));
  const currentStep = datasets.length === 0 ? 0
    : processedDatasets.length === 0 ? 1
    : models.length === 0 ? 3
    : pendingModels.length > 0 ? 4
    : activeModel ? 5 : 3;

  // Model performance chart
  const modelChartData = models.length > 0 ? {
    labels: models.slice(0, 5).map(m => `${m.algorithm} v${m.version}`),
    datasets: [
      { label: 'Accuracy', data: models.slice(0, 5).map(m => m.accuracy ? (m.accuracy * 100).toFixed(1) : 0), backgroundColor: '#1976d2', borderRadius: 3 },
      { label: 'F1 Score', data: models.slice(0, 5).map(m => m.f1_score ? (m.f1_score * 100).toFixed(1) : 0), backgroundColor: '#388e3c', borderRadius: 3 },
    ]
  } : null;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Admin Dashboard</Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Manage datasets, ML models, and system activity
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Workflow Progress */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Administrator Workflow</Typography>
        <Stepper activeStep={currentStep} alternativeLabel sx={{ mb: 2 }}>
          {WORKFLOW_STEPS.map(label => (
            <Step key={label}><StepLabel>{label}</StepLabel></Step>
          ))}
        </Stepper>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Button variant="contained" onClick={() => setUploadDialog(true)}>1. Upload Dataset</Button>
          <Button variant="outlined" disabled={datasets.filter(d => d.status === 'uploaded').length === 0}
            onClick={() => setTab(0)}>2. Validate & Process</Button>
          <Button variant="outlined" disabled={processedDatasets.length === 0}
            onClick={() => { setSelectedDataset(processedDatasets[0]); setQualityDialog(true); }}>3. Review Data Quality</Button>
          <Button variant="outlined" disabled={processedDatasets.length === 0}
            onClick={() => { setTrainForm({ ...trainForm, dataset_id: processedDatasets[0]?.id || '' }); setTrainDialog(true); }}>4. Train Model</Button>
          <Button variant="outlined" disabled={models.length === 0} onClick={() => setTab(1)}>5. Review Performance</Button>
          <Button variant="contained" color="success" disabled={pendingModels.length === 0}
            onClick={() => pendingModels.length > 0 && handleActivate(pendingModels[0].id)}>6. Publish Results</Button>
        </Box>
      </Paper>

      <Paper>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label={`Datasets (${datasets.length})`} />
          <Tab label={`ML Models (${models.length})`} />
          <Tab label="Audit Logs" />
        </Tabs>

        {/* DATASETS TAB */}
        <TabPanel value={tab} index={0}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Dataset Management</Typography>
            <Button variant="contained" onClick={() => setUploadDialog(true)}>Upload New Dataset</Button>
          </Box>
          {datasets.length === 0 ? (
            <Alert severity="info">No datasets uploaded yet. Click "Upload New Dataset" to begin.</Alert>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell><TableCell>Type</TableCell><TableCell>Year</TableCell>
                    <TableCell>Version</TableCell><TableCell>Rows</TableCell><TableCell>Status</TableCell>
                    <TableCell>Source</TableCell><TableCell>Uploaded</TableCell><TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {datasets.map(ds => (
                    <TableRow key={ds.id}>
                      <TableCell>{ds.name}</TableCell>
                      <TableCell>{ds.dataset_type}</TableCell>
                      <TableCell>{ds.year}</TableCell>
                      <TableCell>{ds.version}</TableCell>
                      <TableCell>{ds.row_count || '—'}</TableCell>
                      <TableCell><Chip label={ds.status} color={STATUS_COLORS[ds.status] || 'default'} size="small" /></TableCell>
                      <TableCell>{ds.source || '—'}</TableCell>
                      <TableCell>{new Date(ds.upload_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {(ds.status === 'uploaded' || ds.status === 'validated') && (
                            <Button size="small" variant="outlined" onClick={() => handleProcess(ds.id)} disabled={loading}>
                              Validate & Process
                            </Button>
                          )}
                          {(ds.status === 'processed' || ds.status === 'active') && (
                            <Button size="small" variant="outlined" color="info"
                              onClick={() => { setSelectedDataset(ds); setQualityDialog(true); }}>
                              Data Quality
                            </Button>
                          )}
                        </Box>
                        {ds.validation_errors && (
                          <Typography variant="caption" color="error" display="block" sx={{ mt: 0.5 }}>
                            {ds.validation_errors.slice(0, 80)}
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>

        {/* MODELS TAB */}
        <TabPanel value={tab} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">ML Model Management</Typography>
            <Button variant="contained" onClick={() => setTrainDialog(true)} disabled={loading || processedDatasets.length === 0}>
              Train New Model
            </Button>
          </Box>

          {modelChartData && (
            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>Model Performance Comparison</Typography>
              <Bar data={modelChartData} options={{
                responsive: true,
                plugins: { legend: { position: 'top' } },
                scales: { y: { beginAtZero: true, max: 100, title: { display: true, text: 'Score (%)' } } }
              }} />
            </Paper>
          )}

          {models.length === 0 ? (
            <Alert severity="info">No models trained yet. Process a dataset first, then train a model.</Alert>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell><TableCell>Algorithm</TableCell><TableCell>Version</TableCell>
                    <TableCell>Accuracy</TableCell><TableCell>Precision</TableCell><TableCell>Recall</TableCell>
                    <TableCell>F1</TableCell><TableCell>Status</TableCell><TableCell>Trained</TableCell><TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {models.map(m => (
                    <TableRow key={m.id} sx={{ bgcolor: m.is_active ? '#e8f5e9' : 'inherit' }}>
                      <TableCell>{m.name}</TableCell>
                      <TableCell>{m.algorithm}</TableCell>
                      <TableCell>{m.version}</TableCell>
                      <TableCell>{m.accuracy != null ? (m.accuracy * 100).toFixed(1) + '%' : '—'}</TableCell>
                      <TableCell>{m.precision != null ? (m.precision * 100).toFixed(1) + '%' : '—'}</TableCell>
                      <TableCell>{m.recall != null ? (m.recall * 100).toFixed(1) + '%' : '—'}</TableCell>
                      <TableCell>{m.f1_score != null ? (m.f1_score * 100).toFixed(1) + '%' : '—'}</TableCell>
                      <TableCell>
                        <Chip label={m.is_active ? 'ACTIVE' : m.status}
                          color={m.is_active ? 'success' : STATUS_COLORS[m.status] || 'default'} size="small" />
                      </TableCell>
                      <TableCell>{new Date(m.training_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {!m.is_active && (m.status === 'evaluated' || m.status === 'trained') && (
                          <Button size="small" variant="contained" color="success"
                            onClick={() => handleActivate(m.id)} disabled={loading}>
                            Publish
                          </Button>
                        )}
                        {m.is_active && (
                          <Typography variant="caption" color="success.main">✓ Live</Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>

        {/* AUDIT LOGS TAB */}
        <TabPanel value={tab} index={2}>
          <Typography variant="h6" gutterBottom>System Audit Logs</Typography>
          {auditLogs.length === 0 ? (
            <Alert severity="info">No audit log entries yet.</Alert>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Timestamp</TableCell><TableCell>User</TableCell>
                    <TableCell>Action</TableCell><TableCell>Description</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {auditLogs.map(log => (
                    <TableRow key={log.id}>
                      <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                      <TableCell>{log.user_name || 'System'}</TableCell>
                      <TableCell><Chip label={log.action} size="small" /></TableCell>
                      <TableCell>{log.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>
      </Paper>

      {/* UPLOAD DIALOG */}
      <Dialog open={uploadDialog} onClose={() => setUploadDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Dataset</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField label="Dataset Name" value={uploadForm.name} onChange={e => setUploadForm({ ...uploadForm, name: e.target.value })} required />
          <FormControl>
            <InputLabel>Dataset Type</InputLabel>
            <Select value={uploadForm.dataset_type} label="Dataset Type" onChange={e => setUploadForm({ ...uploadForm, dataset_type: e.target.value })}>
              {['population', 'migration', 'employment', 'education', 'healthcare', 'infrastructure'].map(t => (
                <MenuItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField label="Year" type="number" value={uploadForm.year} onChange={e => setUploadForm({ ...uploadForm, year: parseInt(e.target.value) })} />
          <TextField label="Version" value={uploadForm.version} onChange={e => setUploadForm({ ...uploadForm, version: e.target.value })} />
          <TextField label="Source (e.g. NISR 2023)" value={uploadForm.source} onChange={e => setUploadForm({ ...uploadForm, source: e.target.value })} />
          <Box>
            <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" style={{ display: 'none' }}
              onChange={e => setSelectedFile(e.target.files[0])} />
            <Button variant="outlined" onClick={() => fileInputRef.current.click()}>
              {selectedFile ? selectedFile.name : 'Choose CSV / Excel File'}
            </Button>
          </Box>
          <Alert severity="info" sx={{ mt: 1 }}>
            Required columns vary by type. E.g. population needs: district, sector, year, total_population
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setUploadDialog(false); setSelectedFile(null); }}>Cancel</Button>
          <Button onClick={handleUpload} variant="contained" disabled={loading || !selectedFile}>Upload</Button>
        </DialogActions>
      </Dialog>

      {/* TRAIN DIALOG */}
      <Dialog open={trainDialog} onClose={() => setTrainDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Train New ML Model</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <FormControl>
            <InputLabel>Algorithm</InputLabel>
            <Select value={trainForm.algorithm} label="Algorithm" onChange={e => setTrainForm({ ...trainForm, algorithm: e.target.value })}>
              <MenuItem value="random_forest">Random Forest</MenuItem>
              <MenuItem value="logistic_regression">Logistic Regression</MenuItem>
              <MenuItem value="decision_tree">Decision Tree</MenuItem>
              <MenuItem value="gradient_boosting">Gradient Boosting</MenuItem>
            </Select>
          </FormControl>
          <FormControl>
            <InputLabel>Training Dataset</InputLabel>
            <Select value={trainForm.dataset_id} label="Training Dataset" onChange={e => setTrainForm({ ...trainForm, dataset_id: e.target.value })}>
              {processedDatasets.map(d => (
                <MenuItem key={d.id} value={d.id}>{d.name} — {d.dataset_type} ({d.year})</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Alert severity="warning">
            After training, review the accuracy, precision, recall and F1 score before publishing. A model should not go live without review.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTrainDialog(false)}>Cancel</Button>
          <Button onClick={handleTrain} variant="contained" disabled={loading}>Start Training</Button>
        </DialogActions>
      </Dialog>

      {/* DATA QUALITY DIALOG */}
      <Dialog open={qualityDialog} onClose={() => setQualityDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Data Quality Review — {selectedDataset?.name}</DialogTitle>
        <DialogContent>
          {selectedDataset && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}><Typography variant="body2"><strong>Type:</strong> {selectedDataset.dataset_type}</Typography></Grid>
              <Grid item xs={6}><Typography variant="body2"><strong>Year:</strong> {selectedDataset.year}</Typography></Grid>
              <Grid item xs={6}><Typography variant="body2"><strong>Version:</strong> {selectedDataset.version}</Typography></Grid>
              <Grid item xs={6}><Typography variant="body2"><strong>Source:</strong> {selectedDataset.source || '—'}</Typography></Grid>
              <Grid item xs={6}><Typography variant="body2"><strong>Rows Processed:</strong> {selectedDataset.row_count || '—'}</Typography></Grid>
              <Grid item xs={6}><Typography variant="body2"><strong>Status:</strong> <Chip label={selectedDataset.status} size="small" color={STATUS_COLORS[selectedDataset.status]} /></Typography></Grid>
              <Grid item xs={12}><Divider /></Grid>
              {selectedDataset.processing_log && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Processing Log:</Typography>
                  <Paper sx={{ p: 1, bgcolor: '#f5f5f5', mt: 0.5 }}>
                    <Typography variant="caption" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>{selectedDataset.processing_log}</Typography>
                  </Paper>
                </Grid>
              )}
              {selectedDataset.validation_errors && (
                <Grid item xs={12}>
                  <Alert severity="warning">
                    <Typography variant="subtitle2">Validation Issues:</Typography>
                    <Typography variant="caption" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>{selectedDataset.validation_errors}</Typography>
                  </Alert>
                </Grid>
              )}
              {!selectedDataset.validation_errors && (
                <Grid item xs={12}><Alert severity="success">No validation errors found. Data quality is acceptable.</Alert></Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQualityDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AdminDashboard;
