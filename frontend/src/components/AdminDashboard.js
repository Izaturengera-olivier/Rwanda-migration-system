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
  InputAdornment,
  Pagination,
} from "@mui/material";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import DeleteIcon from "@mui/icons-material/Delete";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DownloadIcon from "@mui/icons-material/Download";
import EditIcon from "@mui/icons-material/Edit";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
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

const extractErrorMessage = (err, fallbackMsg = "An error occurred") => {
  if (!err || !err.response) return err?.message || fallbackMsg;
  const data = err.response.data;
  if (!data) return fallbackMsg;
  if (typeof data === "string") return data;
  if (data.detail) return data.detail;
  if (data.error) return data.error;

  if (typeof data === "object") {
    const messages = [];
    for (const [field, errors] of Object.entries(data)) {
      const fieldName = field.replace("_", " ").toUpperCase();
      if (Array.isArray(errors)) {
        messages.push(`${fieldName}: ${errors.join(", ")}`);
      } else if (typeof errors === "string") {
        messages.push(`${fieldName}: ${errors}`);
      }
    }
    if (messages.length > 0) return messages.join(" | ");
  }
  return fallbackMsg;
};

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
  const [userDialogError, setUserDialogError] = useState(null);
  const [editUserDialog, setEditUserDialog] = useState(false);
  const [editUserDialogError, setEditUserDialogError] = useState(null);
  const [deleteUserDialog, setDeleteUserDialog] = useState(null);
  const [deleteDatasetDialog, setDeleteDatasetDialog] = useState(null);

  const [selectedDataset, setSelectedDataset] = useState(null);
  const [editingUser, setEditingUser] = useState(null);

  // Tab Search States
  const [datasetSearch, setDatasetSearch] = useState("");
  const [modelSearch, setModelSearch] = useState("");
  const [auditSearch, setAuditSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");

  // Tab Pagination States
  const [datasetPage, setDatasetPage] = useState(1);
  const [datasetRowsPerPage, setDatasetRowsPerPage] = useState(10);

  const [modelPage, setModelPage] = useState(1);
  const [modelRowsPerPage, setModelRowsPerPage] = useState(10);

  const [auditPage, setAuditPage] = useState(1);
  const [auditRowsPerPage, setAuditRowsPerPage] = useState(10);

  const [userPage, setUserPage] = useState(1);
  const [userRowsPerPage, setUserRowsPerPage] = useState(10);

  useEffect(() => { setDatasetPage(1); }, [datasetSearch]);
  useEffect(() => { setModelPage(1); }, [modelSearch]);
  useEffect(() => { setAuditPage(1); }, [auditSearch]);
  useEffect(() => { setUserPage(1); }, [userSearch]);

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
    role: "user",
    first_name: "",
    last_name: "",
    organization: "",
  });
  const [editUserForm, setEditUserForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "user",
    first_name: "",
    last_name: "",
    organization: "",
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef();

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleDownloadDataset = (dataset) => {
    try {
      const downloadUrl = dataset.download_url
        ? `${API_BASE.replace(/\/api$/, "")}${dataset.download_url}`
        : `${API_BASE}/datasets/${dataset.id}/download/`;

      axios({
        url: downloadUrl,
        method: "GET",
        responseType: "blob",
        headers: getAuthHeaders(),
        withCredentials: true,
      })
        .then((response) => {
          const url = window.URL.createObjectURL(new Blob([response.data]));
          const link = document.createElement("a");
          link.href = url;
          const filename =
            dataset.name &&
            (dataset.name.endsWith(".csv") || dataset.name.endsWith(".xlsx"))
              ? dataset.name
              : `${dataset.name || "dataset"}.csv`;
          link.setAttribute("download", filename);
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(url);
          showSuccess(`Downloading dataset "${dataset.name}"...`);
        })
        .catch((err) => {
          setError(
            err.response?.data?.error || "Failed to download dataset file.",
          );
        });
    } catch (err) {
      setError("Failed to download dataset.");
    }
  };

  const handleDeleteDataset = async (dataset) => {
    if (!dataset) return;
    setLoading(true);
    setError(null);
    try {
      await axios.delete(`${API_BASE}/datasets/${dataset.id}/`, {
        headers: getAuthHeaders(),
        withCredentials: true,
      });
      setDeleteDatasetDialog(null);
      fetchDatasets();
      fetchAuditLogs();
      showSuccess(`Dataset "${dataset.name}" deleted successfully.`);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.error ||
          "Failed to delete dataset",
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
      setUserDialogError("Username, email, and password are required.");
      return;
    }
    setLoading(true);
    setUserDialogError(null);
    setError(null);
    const createdUsername = userForm.username;
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
        role: "user",
        first_name: "",
        last_name: "",
        organization: "",
      });
      fetchUsers();
      fetchAuditLogs();
      showSuccess(`User "${createdUsername}" created successfully.`);
    } catch (err) {
      const msg = extractErrorMessage(err, "User creation failed");
      setUserDialogError(msg);
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
      setError(extractErrorMessage(err, "Failed to update user status"));
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
      setError(extractErrorMessage(err, "Failed to change user role"));
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
      setError(extractErrorMessage(err, "Failed to delete user"));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditUser = (user) => {
    setEditingUser(user);
    setEditUserForm({
      username: user.username || "",
      email: user.email || "",
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      organization: user.organization || "",
      role: user.role === "viewer" ? "user" : user.role === "researcher" ? "officer" : user.role || "user",
      password: "",
    });
    setEditUserDialogError(null);
    setEditUserDialog(true);
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    if (!editUserForm.username || !editUserForm.email) {
      setEditUserDialogError("Username and email are required.");
      return;
    }
    setLoading(true);
    setEditUserDialogError(null);
    setError(null);
    const updatedUsername = editUserForm.username;
    try {
      const payload = { ...editUserForm };
      if (!payload.password) delete payload.password;

      await axios.patch(`${API_BASE}/users/${editingUser.id}/`, payload, {
        headers: getAuthHeaders(),
        withCredentials: true,
      });
      setEditUserDialog(false);
      setEditingUser(null);
      fetchUsers();
      fetchAuditLogs();
      showSuccess(`Profile for user "${updatedUsername}" updated successfully.`);
    } catch (err) {
      const msg = extractErrorMessage(err, "Failed to update user profile");
      setEditUserDialogError(msg);
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

  // Tab Filtering
  const filteredDatasets = datasets.filter((d) => {
    if (!datasetSearch.trim()) return true;
    const term = datasetSearch.toLowerCase();
    return (
      (d.name && d.name.toLowerCase().includes(term)) ||
      (d.dataset_type && d.dataset_type.toLowerCase().includes(term)) ||
      (d.year && d.year.toString().includes(term)) ||
      (d.source && d.source.toLowerCase().includes(term)) ||
      (d.uploaded_by_name && d.uploaded_by_name.toLowerCase().includes(term)) ||
      (d.status && d.status.toLowerCase().includes(term))
    );
  });

  const filteredModels = models.filter((m) => {
    if (!modelSearch.trim()) return true;
    const term = modelSearch.toLowerCase();
    return (
      (m.algorithm && m.algorithm.toLowerCase().includes(term)) ||
      (m.version && m.version.toString().toLowerCase().includes(term)) ||
      (m.status && m.status.toLowerCase().includes(term)) ||
      (m.description && m.description.toLowerCase().includes(term))
    );
  });

  const filteredAuditLogs = auditLogs.filter((log) => {
    if (!auditSearch.trim()) return true;
    const term = auditSearch.toLowerCase();
    return (
      (log.user_name && log.user_name.toLowerCase().includes(term)) ||
      (log.action && log.action.toLowerCase().includes(term)) ||
      (log.description && log.description.toLowerCase().includes(term)) ||
      (log.timestamp && new Date(log.timestamp).toLocaleString().toLowerCase().includes(term))
    );
  });

  const filteredUsers = users.filter((u) => {
    if (!userSearch.trim()) return true;
    const term = userSearch.toLowerCase();
    return (
      (u.username && u.username.toLowerCase().includes(term)) ||
      (u.email && u.email.toLowerCase().includes(term)) ||
      (u.first_name && u.first_name.toLowerCase().includes(term)) ||
      (u.last_name && u.last_name.toLowerCase().includes(term)) ||
      (u.role && u.role.toLowerCase().includes(term)) ||
      (u.organization && u.organization.toLowerCase().includes(term))
    );
  });

  // Tab Pagination Slicing
  const paginatedDatasets = filteredDatasets.slice(
    (datasetPage - 1) * datasetRowsPerPage,
    datasetPage * datasetRowsPerPage
  );

  const paginatedModels = filteredModels.slice(
    (modelPage - 1) * modelRowsPerPage,
    modelPage * modelRowsPerPage
  );

  const paginatedAuditLogs = filteredAuditLogs.slice(
    (auditPage - 1) * auditRowsPerPage,
    auditPage * auditRowsPerPage
  );

  const paginatedUsers = filteredUsers.slice(
    (userPage - 1) * userRowsPerPage,
    userPage * userRowsPerPage
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
          <Tab
            label={`Datasets (${filteredDatasets.length}${datasets.length !== filteredDatasets.length ? ` / ${datasets.length}` : ""})`}
          />
          <Tab
            label={`ML Models (${filteredModels.length}${models.length !== filteredModels.length ? ` / ${models.length}` : ""})`}
          />
          <Tab
            label={`Audit Logs (${filteredAuditLogs.length}${auditLogs.length !== filteredAuditLogs.length ? ` / ${auditLogs.length}` : ""})`}
          />
          <Tab
            label={`User Management (${filteredUsers.length}${users.length !== filteredUsers.length ? ` / ${users.length}` : ""})`}
          />
        </Tabs>

        {/* DATASETS TAB */}
        <TabPanel value={tab} index={0}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 2,
              mb: 2,
            }}
          >
            <Typography variant="h6">Dataset Management</Typography>
            <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
              <TextField
                size="small"
                placeholder="Search datasets..."
                value={datasetSearch}
                onChange={(e) => setDatasetSearch(e.target.value)}
                sx={{ minWidth: 240 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                  endAdornment: datasetSearch ? (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setDatasetSearch("")}>
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                }}
              />
              <Button variant="contained" onClick={() => setUploadDialog(true)}>
                Upload New Dataset
              </Button>
            </Box>
          </Box>

          {datasets.length === 0 ? (
            <Alert severity="info">
              No datasets uploaded yet. Click "Upload New Dataset" to begin.
            </Alert>
          ) : filteredDatasets.length === 0 ? (
            <Alert severity="info">
              No datasets found matching "{datasetSearch}".
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
                  {paginatedDatasets.map((dataset) => (
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
                        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                          <Tooltip title="Download Dataset File">
                            <Button
                              size="small"
                              variant="outlined"
                              color="info"
                              startIcon={<DownloadIcon fontSize="small" />}
                              onClick={() => handleDownloadDataset(dataset)}
                            >
                              Download
                            </Button>
                          </Tooltip>
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
                          <Tooltip title="Delete Dataset">
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              startIcon={<DeleteIcon fontSize="small" />}
                              onClick={() => setDeleteDatasetDialog(dataset)}
                            >
                              Delete
                            </Button>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {filteredDatasets.length > 0 && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 2,
                mt: 2,
                pt: 2,
                borderTop: "1px solid #e0e0e0",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Rows per page:
                </Typography>
                <Select
                  size="small"
                  value={datasetRowsPerPage}
                  onChange={(e) => {
                    setDatasetRowsPerPage(Number(e.target.value));
                    setDatasetPage(1);
                  }}
                  sx={{ height: 32, fontSize: "0.875rem" }}
                >
                  <MenuItem value={5}>5</MenuItem>
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={25}>25</MenuItem>
                  <MenuItem value={50}>50</MenuItem>
                </Select>
                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                  Showing {(datasetPage - 1) * datasetRowsPerPage + 1}–
                  {Math.min(datasetPage * datasetRowsPerPage, filteredDatasets.length)} of{" "}
                  {filteredDatasets.length}
                </Typography>
              </Box>
              <Pagination
                count={Math.ceil(filteredDatasets.length / datasetRowsPerPage)}
                page={datasetPage}
                onChange={(_, p) => setDatasetPage(p)}
                color="primary"
                shape="rounded"
                showFirstButton
                showLastButton
              />
            </Box>
          )}
        </TabPanel>

        {/* MODELS TAB */}
        <TabPanel value={tab} index={1}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 2,
              mb: 2,
            }}
          >
            <Typography variant="h6">ML Models</Typography>
            <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
              <TextField
                size="small"
                placeholder="Search models..."
                value={modelSearch}
                onChange={(e) => setModelSearch(e.target.value)}
                sx={{ minWidth: 240 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                  endAdornment: modelSearch ? (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setModelSearch("")}>
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                }}
              />
              <Button
                variant="contained"
                disabled={processedDatasets.length === 0}
                onClick={() => setTrainDialog(true)}
              >
                Train New Model
              </Button>
            </Box>
          </Box>

          {models.length === 0 ? (
            <Alert severity="info">
              No ML models trained yet. Process a dataset first to train a
              model.
            </Alert>
          ) : filteredModels.length === 0 ? (
            <Alert severity="info">
              No ML models found matching "{modelSearch}".
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
                  {paginatedModels.map((model) => (
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

          {filteredModels.length > 0 && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 2,
                mt: 2,
                pt: 2,
                borderTop: "1px solid #e0e0e0",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Rows per page:
                </Typography>
                <Select
                  size="small"
                  value={modelRowsPerPage}
                  onChange={(e) => {
                    setModelRowsPerPage(Number(e.target.value));
                    setModelPage(1);
                  }}
                  sx={{ height: 32, fontSize: "0.875rem" }}
                >
                  <MenuItem value={5}>5</MenuItem>
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={25}>25</MenuItem>
                  <MenuItem value={50}>50</MenuItem>
                </Select>
                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                  Showing {(modelPage - 1) * modelRowsPerPage + 1}–
                  {Math.min(modelPage * modelRowsPerPage, filteredModels.length)} of{" "}
                  {filteredModels.length}
                </Typography>
              </Box>
              <Pagination
                count={Math.ceil(filteredModels.length / modelRowsPerPage)}
                page={modelPage}
                onChange={(_, p) => setModelPage(p)}
                color="primary"
                shape="rounded"
                showFirstButton
                showLastButton
              />
            </Box>
          )}
        </TabPanel>

        {/* AUDIT LOGS TAB */}
        <TabPanel value={tab} index={2}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 2,
              mb: 2,
            }}
          >
            <Typography variant="h6">System Audit Logs</Typography>
            <TextField
              size="small"
              placeholder="Search audit logs..."
              value={auditSearch}
              onChange={(e) => setAuditSearch(e.target.value)}
              sx={{ minWidth: 240 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: auditSearch ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setAuditSearch("")}>
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
            />
          </Box>

          {auditLogs.length === 0 ? (
            <Alert severity="info">No audit logs recorded yet.</Alert>
          ) : filteredAuditLogs.length === 0 ? (
            <Alert severity="info">
              No audit logs found matching "{auditSearch}".
            </Alert>
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
                  {paginatedAuditLogs.map((log) => (
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

          {filteredAuditLogs.length > 0 && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 2,
                mt: 2,
                pt: 2,
                borderTop: "1px solid #e0e0e0",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Rows per page:
                </Typography>
                <Select
                  size="small"
                  value={auditRowsPerPage}
                  onChange={(e) => {
                    setAuditRowsPerPage(Number(e.target.value));
                    setAuditPage(1);
                  }}
                  sx={{ height: 32, fontSize: "0.875rem" }}
                >
                  <MenuItem value={5}>5</MenuItem>
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={25}>25</MenuItem>
                  <MenuItem value={50}>50</MenuItem>
                </Select>
                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                  Showing {(auditPage - 1) * auditRowsPerPage + 1}–
                  {Math.min(auditPage * auditRowsPerPage, filteredAuditLogs.length)} of{" "}
                  {filteredAuditLogs.length}
                </Typography>
              </Box>
              <Pagination
                count={Math.ceil(filteredAuditLogs.length / auditRowsPerPage)}
                page={auditPage}
                onChange={(_, p) => setAuditPage(p)}
                color="primary"
                shape="rounded"
                showFirstButton
                showLastButton
              />
            </Box>
          )}
        </TabPanel>

        {/* USER MANAGEMENT TAB */}
        <TabPanel value={tab} index={3}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 2,
              mb: 2,
            }}
          >
            <Typography variant="h6">User Account Management</Typography>
            <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
              <TextField
                size="small"
                placeholder="Search user accounts..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                sx={{ minWidth: 240 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                  endAdornment: userSearch ? (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setUserSearch("")}>
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                }}
              />
              <Button
                variant="contained"
                startIcon={<PersonAddIcon />}
                onClick={() => {
                  setUserDialogError(null);
                  setUserDialog(true);
                }}
              >
                Add New User
              </Button>
            </Box>
          </Box>

          {users.length === 0 ? (
            <Alert severity="info">No user accounts found.</Alert>
          ) : filteredUsers.length === 0 ? (
            <Alert severity="info">
              No user accounts found matching "{userSearch}".
            </Alert>
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
                  {paginatedUsers.map((u) => (
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
                        <Select
                          size="small"
                          value={u.role === "viewer" ? "user" : u.role === "researcher" ? "officer" : u.role || "user"}
                          onChange={(e) => handleChangeUserRole(u, e.target.value)}
                          sx={{
                            fontSize: "0.82rem",
                            height: 32,
                            fontWeight: "bold",
                            color:
                              u.role === "admin"
                                ? "primary.main"
                                : u.role === "officer" || u.role === "researcher"
                                  ? "info.main"
                                  : "text.primary",
                          }}
                        >
                          <MenuItem value="admin">Administrator</MenuItem>
                          <MenuItem value="officer">Officer</MenuItem>
                          <MenuItem value="user">User (View Only)</MenuItem>
                        </Select>
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
                          {/* Edit Profile */}
                          <Tooltip title="Edit User Profile">
                            <Button
                              size="small"
                              color="info"
                              variant="outlined"
                              onClick={() => handleOpenEditUser(u)}
                              startIcon={<EditIcon fontSize="small" />}
                            >
                              Edit Profile
                            </Button>
                          </Tooltip>

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

          {filteredUsers.length > 0 && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 2,
                mt: 2,
                pt: 2,
                borderTop: "1px solid #e0e0e0",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Rows per page:
                </Typography>
                <Select
                  size="small"
                  value={userRowsPerPage}
                  onChange={(e) => {
                    setUserRowsPerPage(Number(e.target.value));
                    setUserPage(1);
                  }}
                  sx={{ height: 32, fontSize: "0.875rem" }}
                >
                  <MenuItem value={5}>5</MenuItem>
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={25}>25</MenuItem>
                  <MenuItem value={50}>50</MenuItem>
                </Select>
                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                  Showing {(userPage - 1) * userRowsPerPage + 1}–
                  {Math.min(userPage * userRowsPerPage, filteredUsers.length)} of{" "}
                  {filteredUsers.length}
                </Typography>
              </Box>
              <Pagination
                count={Math.ceil(filteredUsers.length / userRowsPerPage)}
                page={userPage}
                onChange={(_, p) => setUserPage(p)}
                color="primary"
                shape="rounded"
                showFirstButton
                showLastButton
              />
            </Box>
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
          {userDialogError && (
            <Alert severity="error" onClose={() => setUserDialogError(null)}>
              {userDialogError}
            </Alert>
          )}
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
              <MenuItem value="officer">Officer (Compare & Reports)</MenuItem>
              <MenuItem value="user">User (View Only)</MenuItem>
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

      {/* EDIT USER DIALOG */}
      <Dialog
        open={editUserDialog}
        onClose={() => setEditUserDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit User Profile</DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}
        >
          {editUserDialogError && (
            <Alert severity="error" onClose={() => setEditUserDialogError(null)}>
              {editUserDialogError}
            </Alert>
          )}
          <TextField
            label="Username"
            value={editUserForm.username}
            onChange={(e) =>
              setEditUserForm({ ...editUserForm, username: e.target.value })
            }
            required
          />
          <TextField
            label="Email Address"
            type="email"
            value={editUserForm.email}
            onChange={(e) =>
              setEditUserForm({ ...editUserForm, email: e.target.value })
            }
            required
          />
          <TextField
            label="New Password (leave blank to keep current)"
            type="password"
            value={editUserForm.password}
            onChange={(e) =>
              setEditUserForm({ ...editUserForm, password: e.target.value })
            }
            helperText="Enter a new password only if you wish to reset it."
          />
          <FormControl fullWidth>
            <InputLabel>System Role</InputLabel>
            <Select
              value={editUserForm.role}
              label="System Role"
              onChange={(e) =>
                setEditUserForm({ ...editUserForm, role: e.target.value })
              }
            >
              <MenuItem value="admin">Administrator (Full Access)</MenuItem>
              <MenuItem value="officer">Officer (Compare & Reports)</MenuItem>
              <MenuItem value="user">User (View Only)</MenuItem>
            </Select>
          </FormControl>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="First Name"
                value={editUserForm.first_name}
                onChange={(e) =>
                  setEditUserForm({
                    ...editUserForm,
                    first_name: e.target.value,
                  })
                }
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={editUserForm.last_name}
                onChange={(e) =>
                  setEditUserForm({
                    ...editUserForm,
                    last_name: e.target.value,
                  })
                }
              />
            </Grid>
          </Grid>
          <TextField
            label="Organization"
            value={editUserForm.organization}
            onChange={(e) =>
              setEditUserForm({
                ...editUserForm,
                organization: e.target.value,
              })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditUserDialog(false)}>Cancel</Button>
          <Button
            onClick={handleUpdateUser}
            variant="contained"
            color="primary"
            disabled={loading}
          >
            Save Changes
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

      {/* DELETE DATASET DIALOG */}
      <Dialog
        open={Boolean(deleteDatasetDialog)}
        onClose={() => setDeleteDatasetDialog(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Confirm Delete Dataset</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete dataset{" "}
            <strong>"{deleteDatasetDialog?.name}"</strong> ({deleteDatasetDialog?.year})?
          </Typography>
          <Alert severity="error" sx={{ mt: 2 }}>
            This will permanently delete the uploaded dataset file and remove its database records.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDatasetDialog(null)}>Cancel</Button>
          <Button
            onClick={() => handleDeleteDataset(deleteDatasetDialog)}
            variant="contained"
            color="error"
            disabled={loading}
          >
            Delete Dataset
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AdminDashboard;
