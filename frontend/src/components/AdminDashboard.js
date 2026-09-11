import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  LinearProgress,
  Grid,
  Divider,
  IconButton,
  Tooltip,
} from "@mui/material";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import DeleteIcon from "@mui/icons-material/Delete";
import SecurityIcon from "@mui/icons-material/Security";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { Bar } from "react-chartjs-2";
import axios from "axios";

const API_BASE = "http://localhost:8000/api";

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const STATUS_COLORS = {
  uploaded: "default",
  validated: "info",
  processed: "success",
  active: "success",
  archived: "default",
  error: "error",
  training: "warning",
  trained: "info",
  evaluated: "info",
  deprecated: "default",
};

const WORKFLOW_STEPS = [
  "Upload Dataset",
  "Validate & Process",
  "Review Data Quality",
  "Train Model",
  "Review Performance",
  "Publish Results",
];

function AdminDashboard({ adminUser }) {
  const [tab, setTab] = useState(0);
  const [datasets, setDatasets] = useState([]);
  const [models, setModels] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Dialogs state
  const [uploadDialog, setUploadDialog] = useState(false);
  const [trainDialog, setTrainDialog] = useState(false);
  const [qualityDialog, setQualityDialog] = useState(false);
  const [userDialog, setUserDialog] = useState(false);
  const [deleteUserDialog, setDeleteUserDialog] = useState(null);

  const [selectedDataset, setSelectedDataset] = useState(null);

  // Forms
  const [uploadForm, setUploadForm] = useState({
    name: "",
    dataset_type: "population",
    year: 2023,
    version: "1.0",
    source: "",
  });
  const [trainForm, setTrainForm] = useState({
    algorithm: "random_forest",
    dataset_id: "",
  });
  const [userForm, setUserForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "viewer",
    first_name: "",
    last_name: "",
    organization: "",
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef();

  useEffect(() => {
    fetchAll();
  }, []);

  const getAuthHeaders = (isMultipart = false) => {
    const headers = {};
    if (isMultipart) headers["Content-Type"] = "multipart/form-data";
    const token = adminUser?.token || localStorage.getItem("token");
    if (token) headers["Authorization"] = `Token ${token}`;
    return headers;
  };

  const fetchAll = () => {
    fetchDatasets();
    fetchModels();
    fetchAuditLogs();
    fetchUsers();
  };

  const fetchDatasets = () =>
    axios
      .get(`${API_BASE}/datasets/`, {
        headers: getAuthHeaders(),
        withCredentials: true,
      })
      .then((r) => setDatasets(r.data.results || r.data))
      .catch(() => {});

  const fetchModels = () =>
    axios
      .get(`${API_BASE}/models/`, {
        headers: getAuthHeaders(),
        withCredentials: true,
      })
      .then((r) => setModels(r.data.results || r.data))
      .catch(() => {});

  const fetchAuditLogs = () =>
    axios
      .get(`${API_BASE}/audit-logs/`, {
        headers: getAuthHeaders(),
        withCredentials: true,
      })
      .then((r) => setAuditLogs(r.data.results || r.data))
      .catch(() => {});

  const fetchUsers = () =>
    axios
      .get(`${API_BASE}/users/`, {
        headers: getAuthHeaders(),
        withCredentials: true,
      })
      .then((r) => setUsers(r.data.results || r.data))
      .catch(() => {});

  const showSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 5000);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select a file");
      return;
    }
    if (!uploadForm.name) {
      setError("Please enter a dataset name");
      return;
    }
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("name", uploadForm.name);
    formData.append("dataset_type", uploadForm.dataset_type);
    formData.append("year", uploadForm.year);
    formData.append("version", uploadForm.version);
    formData.append("source", uploadForm.source);

    setLoading(true);
    setError(null);
    try {
      await axios.post(`${API_BASE}/datasets/`, formData, {
        headers: getAuthHeaders(true),
        withCredentials: true,
      });
      setUploadDialog(false);
      setSelectedFile(null);
      setUploadForm({
        name: "",
        dataset_type: "population",
        year: 2023,
        version: "1.0",
        source: "",
      });
      fetchDatasets();
      fetchAuditLogs();
      showSuccess(
        'Dataset uploaded. Now click "Validate & Process" to continue.',
      );
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.detail ||
          err.message ||
          "Upload failed",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(
        `${API_BASE}/datasets/${id}/process/`,
        {},
        {
          headers: getAuthHeaders(),
          withCredentials: true,
        },
      );
      fetchDatasets();
      fetchAuditLogs();
      if (res.data.status === "processed") {
        showSuccess(
          "Dataset validated and processed successfully. You can now train models.",
        );
      } else {
        setError(res.data.error || "Processing failed");
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.detail ||
          err.message ||
          "Processing failed",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTrain = async () => {
    if (!trainForm.dataset_id) {
      setError("Please select a dataset");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await axios.post(`${API_BASE}/models/train/`, trainForm, {
        headers: getAuthHeaders(),
        withCredentials: true,
      });
      setTrainDialog(false);
      fetchModels();
      fetchAuditLogs();
      showSuccess(
        "Model training complete. Review performance metrics before publishing.",
      );
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.detail ||
          err.message ||
          "Training failed",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (id) => {
    setLoading(true);
    setError(null);
    try {
      await axios.post(
        `${API_BASE}/models/${id}/activate/`,
        {},
        {
          headers: getAuthHeaders(),
          withCredentials: true,
        },
      );
      fetchModels();
      fetchAuditLogs();
      showSuccess(
        "Model published and activated. The dashboard now reflects the updated results.",
      );
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.detail ||
          err.message ||
          "Activation failed",
      );
    } finally {
      setLoading(false);
    }
  };

  // USER MANAGEMENT HANDLERS
  const handleCreateUser = async () => {
    if (!userForm.username || !userForm.email || !userForm.password) {
      setError("Username, email, and password are required.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await axios.post(`${API_BASE}/users/`, userForm, {
        headers: getAuthHeaders(),
        withCredentials: true,
      });
      setUserDialog(false);
      setUserForm({
        username: "",
        email: "",
        password: "",
        role: "viewer",
        first_name: "",
        last_name: "",
        organization: "",
      });
      fetchUsers();
      fetchAuditLogs();
      showSuccess(`User "${userForm.username}" created successfully.`);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.username?.[0] ||
          err.response?.data?.email?.[0] ||
          "User creation failed",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserActive = async (user) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(
        `${API_BASE}/users/${user.id}/toggle_active/`,
        {},
        {
          headers: getAuthHeaders(),
          withCredentials: true,
        },
      );
      fetchUsers();
      fetchAuditLogs();
      showSuccess(res.data.detail || `Updated status for ${user.username}`);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.error ||
          "Failed to update user status",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChangeUserRole = async (user, newRole) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(
        `${API_BASE}/users/${user.id}/change_role/`,
        { role: newRole },
        {
          headers: getAuthHeaders(),
          withCredentials: true,
        },
      );
      fetchUsers();
      fetchAuditLogs();
      showSuccess(res.data.detail || `Updated role for ${user.username}`);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.error ||
          "Failed to change user role",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (user) => {
    setLoading(true);
    setError(null);
    try {
      await axios.delete(`${API_BASE}/users/${user.id}/`, {
        headers: getAuthHeaders(),
        withCredentials: true,
      });
      setDeleteUserDialog(null);
      fetchUsers();
      fetchAuditLogs();
      showSuccess(`User "${user.username}" deleted successfully.`);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.error ||
          "Failed to delete user",
      );
    } finally {
      setLoading(false);
    }
  };

  const processedDatasets = datasets.filter(
    (d) => d.status === "processed" || d.status === "active",
  );
  const activeModel = models.find((m) => m.is_active);
  const pendingModels = models.filter(
    (m) => !m.is_active && (m.status === "evaluated" || m.status === "trained"),
  );
  const currentStep =
    datasets.length === 0
      ? 0
      : processedDatasets.length === 0
        ? 1
        : models.length === 0
          ? 3
          : pendingModels.length > 0
            ? 4
            : activeModel
              ? 5
              : 3;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Manage datasets, ML models, user accounts, and system activity
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}
      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Workflow Progress */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Administrator Workflow
        </Typography>
        <Stepper activeStep={currentStep} alternativeLabel sx={{ mb: 2 }}>
          {WORKFLOW_STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        <Box
          sx={{
            display: "flex",
            gap: 2,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <Button variant="contained" onClick={() => setUploadDialog(true)}>
            1. Upload Dataset
          </Button>
          <Button
            variant="outlined"
            disabled={
              datasets.filter((d) => d.status === "uploaded").length === 0
            }
            onClick={() => setTab(0)}
          >
            2. Validate & Process
          </Button>
          <Button
            variant="outlined"
            disabled={processedDatasets.length === 0}
            onClick={() => {
              setSelectedDataset(processedDatasets[0]);
              setQualityDialog(true);
            }}
          >
            3. Review Data Quality
          </Button>
          <Button
            variant="outlined"
            disabled={processedDatasets.length === 0}
            onClick={() => {
              setTrainForm({
                ...trainForm,
                dataset_id: processedDatasets[0]?.id || "",
              });
              setTrainDialog(true);
            }}
          >
            4. Train Model
          </Button>
          <Button
            variant="outlined"
            disabled={models.length === 0}
            onClick={() => setTab(1)}
          >
            5. Review Performance
          </Button>
          <Button
            variant="contained"
            color="success"
            disabled={pendingModels.length === 0}
            onClick={() =>
              pendingModels.length > 0 && handleActivate(pendingModels[0].id)
            }
          >
            6. Publish Results
          </Button>
        </Box>
      </Paper>

      <Paper>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label={`Datasets (${datasets.length})`} />
          <Tab label={`ML Models (${models.length})`} />
          <Tab label="Audit Logs" />
          <Tab label={`User Management (${users.length})`} />
        </Tabs>

        {/* DATASETS TAB */}
        <TabPanel value={tab} index={0}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
            <Typography variant="h6">Dataset Management</Typography>
            <Button variant="contained" onClick={() => setUploadDialog(true)}>
              Upload New Dataset
            </Button>
          </Box>

          {datasets.length === 0 ? (
            <Alert severity="info">
              No datasets uploaded yet. Click "Upload New Dataset" to begin.
            </Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Year</TableCell>
                    <TableCell>Uploaded By</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Upload Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {datasets.map((dataset) => (
                    <TableRow key={dataset.id}>
                      <TableCell>{dataset.name}</TableCell>
                      <TableCell>{dataset.dataset_type}</TableCell>
                      <TableCell>{dataset.year}</TableCell>
                      <TableCell>
                        {dataset.uploaded_by_name || "System"}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={dataset.status}
                          color={STATUS_COLORS[dataset.status] || "default"}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(dataset.upload_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {dataset.status === "uploaded" && (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleProcess(dataset.id)}
                          >
                            Validate & Process
                          </Button>
                        )}
                        {(dataset.status === "processed" ||
                          dataset.status === "active") && (
                          <Button
                            size="small"
                            variant="text"
                            onClick={() => {
                              setSelectedDataset(dataset);
                              setQualityDialog(true);
                            }}
                          >
                            Review Quality
                          </Button>
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
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
            <Typography variant="h6">ML Models</Typography>
            <Button
              variant="contained"
              disabled={processedDatasets.length === 0}
              onClick={() => setTrainDialog(true)}
            >
              Train New Model
            </Button>
          </Box>

          {models.length === 0 ? (
            <Alert severity="info">
              No ML models trained yet. Process a dataset first to train a
              model.
            </Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Algorithm</TableCell>
                    <TableCell>Version</TableCell>
                    <TableCell>Accuracy</TableCell>
                    <TableCell>F1 Score</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Training Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {models.map((model) => (
                    <TableRow key={model.id}>
                      <TableCell>{model.algorithm}</TableCell>
                      <TableCell>v{model.version}</TableCell>
                      <TableCell>
                        {model.accuracy
                          ? `${(model.accuracy * 100).toFixed(1)}%`
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        {model.f1_score
                          ? `${(model.f1_score * 100).toFixed(1)}%`
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={model.is_active ? "ACTIVE" : model.status}
                          color={model.is_active ? "success" : "default"}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(model.training_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {!model.is_active && (
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            onClick={() => handleActivate(model.id)}
                          >
                            Publish & Activate
                          </Button>
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
          <Typography variant="h6" gutterBottom>
            System Audit Logs
          </Typography>
          {auditLogs.length === 0 ? (
            <Alert severity="info">No audit logs recorded yet.</Alert>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell>Description</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {auditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        {new Date(log.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>{log.user_name || "System"}</TableCell>
                      <TableCell>
                        <Chip label={log.action} size="small" />
                      </TableCell>
                      <TableCell>{log.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>

        {/* USER MANAGEMENT TAB */}
        <TabPanel value={tab} index={3}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="h6">User Account Management</Typography>
            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              onClick={() => setUserDialog(true)}
            >
              Add New User
            </Button>
          </Box>

          {users.length === 0 ? (
            <Alert severity="info">No user accounts found.</Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created Date</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <Typography fontWeight="bold">{u.username}</Typography>
                        {u.first_name || u.last_name ? (
                          <Typography variant="caption" color="text.secondary">
                            {u.first_name} {u.last_name}
                          </Typography>
                        ) : null}
                      </TableCell>
                      <TableCell>{u.email || "—"}</TableCell>
                      <TableCell>
                        <Chip
                          label={u.role || "viewer"}
                          color={
                            u.role === "admin"
                              ? "primary"
                              : u.role === "researcher"
                                ? "info"
                                : "default"
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={u.is_active ? "Active" : "Inactive"}
                          color={u.is_active ? "success" : "error"}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(u.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell align="right">
                        <Box
                          sx={{
                            display: "flex",
                            gap: 1,
                            justifyContent: "flex-end",
                          }}
                        >
                          {/* Activate / Deactivate */}
                          <Tooltip
                            title={
                              u.is_active ? "Deactivate User" : "Activate User"
                            }
                          >
                            <Button
                              size="small"
                              color={u.is_active ? "warning" : "success"}
                              variant="outlined"
                              onClick={() => handleToggleUserActive(u)}
                              startIcon={
                                u.is_active ? (
                                  <BlockIcon fontSize="small" />
                                ) : (
                                  <CheckCircleIcon fontSize="small" />
                                )
                              }
                            >
                              {u.is_active ? "Deactivate" : "Activate"}
                            </Button>
                          </Tooltip>

                          {/* Role Toggle */}
                          {u.role === "admin" ? (
                            <Tooltip title="Revoke Admin Access">
                              <Button
                                size="small"
                                color="secondary"
                                variant="outlined"
                                onClick={() =>
                                  handleChangeUserRole(u, "viewer")
                                }
                                startIcon={<SecurityIcon fontSize="small" />}
                              >
                                Make Viewer
                              </Button>
                            </Tooltip>
                          ) : (
                            <Tooltip title="Grant Admin Access">
                              <Button
                                size="small"
                                color="primary"
                                variant="contained"
                                onClick={() => handleChangeUserRole(u, "admin")}
                                startIcon={<SecurityIcon fontSize="small" />}
                              >
                                Make Admin
                              </Button>
                            </Tooltip>
                          )}

                          {/* Delete */}
                          <Tooltip title="Delete User">
                            <IconButton
                              color="error"
                              size="small"
                              onClick={() => setDeleteUserDialog(u)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>
      </Paper>

      {/* UPLOAD DIALOG */}
      <Dialog
        open={uploadDialog}
        onClose={() => setUploadDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Upload Dataset</DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}
        >
          <TextField
            label="Dataset Name"
            value={uploadForm.name}
            onChange={(e) =>
              setUploadForm({ ...uploadForm, name: e.target.value })
            }
            required
          />
          <FormControl>
            <InputLabel>Dataset Type</InputLabel>
            <Select
              value={uploadForm.dataset_type}
              label="Dataset Type"
              onChange={(e) =>
                setUploadForm({ ...uploadForm, dataset_type: e.target.value })
              }
            >
              {[
                "population",
                "migration",
                "employment",
                "education",
                "healthcare",
                "infrastructure",
              ].map((t) => (
                <MenuItem key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Year"
            type="number"
            value={uploadForm.year}
            onChange={(e) =>
              setUploadForm({ ...uploadForm, year: parseInt(e.target.value) })
            }
          />
          <TextField
            label="Version"
            value={uploadForm.version}
            onChange={(e) =>
              setUploadForm({ ...uploadForm, version: e.target.value })
            }
          />
          <TextField
            label="Source (e.g. NISR 2023)"
            value={uploadForm.source}
            onChange={(e) =>
              setUploadForm({ ...uploadForm, source: e.target.value })
            }
          />
          <Box>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              style={{ display: "none" }}
              onChange={(e) => setSelectedFile(e.target.files[0])}
            />
            <Button
              variant="outlined"
              onClick={() => fileInputRef.current.click()}
            >
              {selectedFile ? selectedFile.name : "Choose CSV / Excel File"}
            </Button>
          </Box>
          <Alert severity="info" sx={{ mt: 1 }}>
            Required columns vary by type. Example: population needs district,
            year, total_population. Sector and province are optional.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setUploadDialog(false);
              setSelectedFile(null);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={loading || !selectedFile}
          >
            Upload
          </Button>
        </DialogActions>
      </Dialog>

      {/* TRAIN DIALOG */}
      <Dialog
        open={trainDialog}
        onClose={() => setTrainDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Train New ML Model</DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}
        >
          <FormControl>
            <InputLabel>Algorithm</InputLabel>
            <Select
              value={trainForm.algorithm}
              label="Algorithm"
              onChange={(e) =>
                setTrainForm({ ...trainForm, algorithm: e.target.value })
              }
            >
              <MenuItem value="random_forest">Random Forest</MenuItem>
              <MenuItem value="logistic_regression">
                Logistic Regression
              </MenuItem>
              <MenuItem value="decision_tree">Decision Tree</MenuItem>
              <MenuItem value="gradient_boosting">Gradient Boosting</MenuItem>
            </Select>
          </FormControl>
          <FormControl>
            <InputLabel>Training Dataset</InputLabel>
            <Select
              value={trainForm.dataset_id}
              label="Training Dataset"
              onChange={(e) =>
                setTrainForm({ ...trainForm, dataset_id: e.target.value })
              }
            >
              {processedDatasets.map((d) => (
                <MenuItem key={d.id} value={d.id}>
                  {d.name} — {d.dataset_type} ({d.year})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Alert severity="warning">
            After training, review the accuracy, precision, recall and F1 score
            before publishing.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTrainDialog(false)}>Cancel</Button>
          <Button onClick={handleTrain} variant="contained" disabled={loading}>
            Start Training
          </Button>
        </DialogActions>
      </Dialog>

      {/* ADD USER DIALOG */}
      <Dialog
        open={userDialog}
        onClose={() => setUserDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add New User Account</DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}
        >
          <TextField
            label="Username"
            value={userForm.username}
            onChange={(e) =>
              setUserForm({ ...userForm, username: e.target.value })
            }
            required
            autoFocus
          />
          <TextField
            label="Email Address"
            type="email"
            value={userForm.email}
            onChange={(e) =>
              setUserForm({ ...userForm, email: e.target.value })
            }
            required
          />
          <TextField
            label="Password"
            type="password"
            value={userForm.password}
            onChange={(e) =>
              setUserForm({ ...userForm, password: e.target.value })
            }
            required
          />
          <FormControl fullWidth>
            <InputLabel>System Role</InputLabel>
            <Select
              value={userForm.role}
              label="System Role"
              onChange={(e) =>
                setUserForm({ ...userForm, role: e.target.value })
              }
            >
              <MenuItem value="admin">Administrator (Full Access)</MenuItem>
              <MenuItem value="researcher">
                Researcher (Data Upload/Processing)
              </MenuItem>
              <MenuItem value="viewer">Viewer (Read Only)</MenuItem>
            </Select>
          </FormControl>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="First Name"
                value={userForm.first_name}
                onChange={(e) =>
                  setUserForm({ ...userForm, first_name: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={userForm.last_name}
                onChange={(e) =>
                  setUserForm({ ...userForm, last_name: e.target.value })
                }
              />
            </Grid>
          </Grid>
          <TextField
            label="Organization"
            value={userForm.organization}
            onChange={(e) =>
              setUserForm({ ...userForm, organization: e.target.value })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserDialog(false)}>Cancel</Button>
          <Button
            onClick={handleCreateUser}
            variant="contained"
            disabled={loading}
          >
            Create User
          </Button>
        </DialogActions>
      </Dialog>

      {/* DELETE USER CONFIRMATION DIALOG */}
      <Dialog
        open={Boolean(deleteUserDialog)}
        onClose={() => setDeleteUserDialog(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Confirm Delete User</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete user account{" "}
            <strong>{deleteUserDialog?.username}</strong>?
          </Typography>
          <Alert severity="error" sx={{ mt: 2 }}>
            This action is permanent and cannot be undone.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteUserDialog(null)}>Cancel</Button>
          <Button
            onClick={() => handleDeleteUser(deleteUserDialog)}
            variant="contained"
            color="error"
            disabled={loading}
          >
            Delete User
          </Button>
        </DialogActions>
      </Dialog>

      {/* DATA QUALITY DIALOG */}
      <Dialog
        open={qualityDialog}
        onClose={() => setQualityDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Data Quality Review — {selectedDataset?.name}</DialogTitle>
        <DialogContent>
          {selectedDataset && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <Typography variant="body2">
                  <strong>Type:</strong> {selectedDataset.dataset_type}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2">
                  <strong>Year:</strong> {selectedDataset.year}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2">
                  <strong>Version:</strong> {selectedDataset.version}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2">
                  <strong>Source:</strong> {selectedDataset.source || "—"}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2">
                  <strong>Rows Processed:</strong>{" "}
                  {selectedDataset.row_count || "—"}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2">
                  <strong>Status:</strong>{" "}
                  <Chip
                    label={selectedDataset.status}
                    size="small"
                    color={STATUS_COLORS[selectedDataset.status] || "default"}
                  />
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Divider />
              </Grid>
              {selectedDataset.processing_log && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Processing Log:</Typography>
                  <Paper sx={{ p: 1, bgcolor: "#f5f5f5", mt: 0.5 }}>
                    <Typography
                      variant="caption"
                      component="pre"
                      sx={{ whiteSpace: "pre-wrap" }}
                    >
                      {selectedDataset.processing_log}
                    </Typography>
                  </Paper>
                </Grid>
              )}
              {selectedDataset.validation_errors && (
                <Grid item xs={12}>
                  <Alert severity="warning">
                    <Typography variant="subtitle2">
                      Validation Issues:
                    </Typography>
                    <Typography
                      variant="caption"
                      component="pre"
                      sx={{ whiteSpace: "pre-wrap" }}
                    >
                      {selectedDataset.validation_errors}
                    </Typography>
                  </Alert>
                </Grid>
              )}
              {!selectedDataset.validation_errors && (
                <Grid item xs={12}>
                  <Alert severity="success">
                    No validation errors found. Data quality is acceptable.
                  </Alert>
                </Grid>
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
