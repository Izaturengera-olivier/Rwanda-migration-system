import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  IconButton,
  Badge,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Divider,
  Button,
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
  Alert,
  CircularProgress,
  Stack,
  Tooltip,
} from "@mui/material";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import SendIcon from "@mui/icons-material/Send";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import axios from "axios";
import { isUserOfficer } from "../App";

const API_BASE = "http://localhost:8000/api";

const SECTOR_COLORS = {
  water: "info",
  electricity: "warning",
  healthcare: "error",
  education: "success",
  roads: "secondary",
  internet: "primary",
  sanitation: "info",
  other: "default",
};

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Token ${token}` } : {};
}

export default function Messages({ user }) {
  const [open, setOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [sectors, setSectors] = useState([]);
  const [locations, setLocations] = useState([]);
  const [form, setForm] = useState({
    title: "",
    message: "",
    infrastructure_sector: "water",
    location: "",
  });
  const [sending, setSending] = useState(false);

  const canSend = isUserOfficer(user);

  const fetchUnread = useCallback(() => {
    if (!user) return;
    axios
      .get(`${API_BASE}/notifications/unread_count/`, {
        headers: authHeaders(),
      })
      .then((res) => setUnreadCount(res.data.unread_count || 0))
      .catch(() => {});
  }, [user]);

  const fetchNotifications = useCallback(() => {
    if (!user) return;
    setLoading(true);
    setError(null);
    axios
      .get(`${API_BASE}/notifications/`, { headers: authHeaders() })
      .then((res) => {
        const data = res.data.results || res.data || [];
        setNotifications(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        setError(
          err.response?.data?.detail || "Failed to load notifications."
        );
      })
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [user, fetchUnread]);

  useEffect(() => {
    if (!open || !user) return;
    fetchNotifications();
    axios
      .get(`${API_BASE}/notifications/sectors/`, { headers: authHeaders() })
      .then((res) => setSectors(res.data || []))
      .catch(() => {
        setSectors([
          { value: "water", label: "Water" },
          { value: "electricity", label: "Electricity" },
          { value: "healthcare", label: "Healthcare" },
          { value: "education", label: "Education" },
          { value: "roads", label: "Roads" },
          { value: "internet", label: "Internet" },
          { value: "sanitation", label: "Sanitation" },
          { value: "other", label: "Other" },
        ]);
      });
    if (canSend) {
      axios
        .get(`${API_BASE}/locations/`, {
          params: { type: "sector", district: "Gisagara" },
        })
        .then((res) => {
          const data = res.data.results || res.data || [];
          setLocations(Array.isArray(data) ? data : []);
        })
        .catch(() => setLocations([]));
    }
  }, [open, user, canSend, fetchNotifications]);

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setError(null);
    setSuccess(null);
  };

  const handleMarkRead = async (notification) => {
    if (notification.is_read) return;
    try {
      await axios.post(
        `${API_BASE}/notifications/${notification.id}/mark_read/`,
        {},
        { headers: authHeaders() }
      );
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, is_read: true } : n
        )
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await axios.post(
        `${API_BASE}/notifications/mark_all_read/`,
        {},
        { headers: authHeaders() }
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      setError(err.response?.data?.detail || "Could not mark all as read.");
    }
  };

  const handleSend = async () => {
    if (!form.title.trim() || !form.message.trim() || !form.infrastructure_sector) {
      setError("Title, message, and infrastructure sector are required.");
      return;
    }
    setSending(true);
    setError(null);
    try {
      const payload = {
        title: form.title.trim(),
        message: form.message.trim(),
        infrastructure_sector: form.infrastructure_sector,
      };
      if (form.location) payload.location = Number(form.location);

      await axios.post(`${API_BASE}/notifications/`, payload, {
        headers: authHeaders(),
      });
      setSuccess("Notification sent to Youth successfully.");
      setForm({
        title: "",
        message: "",
        infrastructure_sector: "water",
        location: "",
      });
      setComposeOpen(false);
      fetchNotifications();
      fetchUnread();
    } catch (err) {
      const data = err.response?.data;
      const msg =
        (typeof data === "object" &&
          (data.detail ||
            Object.values(data).flat?.()?.join?.(" ") ||
            JSON.stringify(data))) ||
        "Failed to send notification.";
      setError(msg);
    } finally {
      setSending(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <Tooltip title="Messages">
        <IconButton color="inherit" onClick={handleOpen} sx={{ ml: 0.5 }}>
          <Badge badgeContent={unreadCount} color="error" max={99}>
            <MailOutlineIcon />
          </Badge>
        </IconButton>
      </Tooltip>

      <Drawer
        anchor="right"
        open={open}
        onClose={handleClose}
        PaperProps={{ sx: { width: { xs: "100%", sm: 420 } } }}
      >
        <Box sx={{ p: 2, display: "flex", flexDirection: "column", height: "100%" }}>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            mb={1}
          >
            <Typography variant="h6" fontWeight={700}>
              Messages
            </Typography>
            <Box display="flex" gap={0.5}>
              {canSend && (
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<SendIcon />}
                  onClick={() => {
                    setComposeOpen(true);
                    setError(null);
                  }}
                >
                  Send
                </Button>
              )}
              {unreadCount > 0 && (
                <Tooltip title="Mark all as read">
                  <IconButton size="small" onClick={handleMarkAllRead}>
                    <DoneAllIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>

          <Typography variant="body2" color="text.secondary" mb={1.5}>
            {canSend
              ? "Send infrastructure notifications to Youth, or review messages below."
              : "Notifications from District Officers about planned infrastructure."}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 1 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert
              severity="success"
              sx={{ mb: 1 }}
              onClose={() => setSuccess(null)}
            >
              {success}
            </Alert>
          )}

          <Divider sx={{ mb: 1 }} />

          {loading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress size={32} />
            </Box>
          ) : notifications.length === 0 ? (
            <Typography
              variant="body2"
              color="text.secondary"
              textAlign="center"
              py={4}
            >
              No messages yet.
            </Typography>
          ) : (
            <List sx={{ overflow: "auto", flex: 1, px: 0 }}>
              {notifications.map((n) => (
                <ListItem
                  key={n.id}
                  alignItems="flex-start"
                  onClick={() => handleMarkRead(n)}
                  sx={{
                    cursor: "pointer",
                    bgcolor: n.is_read ? "transparent" : "action.hover",
                    borderRadius: 1,
                    mb: 0.5,
                    flexDirection: "column",
                    alignItems: "stretch",
                  }}
                >
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    flexWrap="wrap"
                    mb={0.5}
                  >
                    <Chip
                      size="small"
                      label={n.infrastructure_sector_label || n.infrastructure_sector}
                      color={SECTOR_COLORS[n.infrastructure_sector] || "default"}
                      variant="outlined"
                    />
                    {!n.is_read && (
                      <Chip size="small" label="New" color="error" />
                    )}
                  </Stack>
                  <ListItemText
                    primary={
                      <Typography
                        fontWeight={n.is_read ? 500 : 700}
                        variant="subtitle2"
                      >
                        {n.title}
                      </Typography>
                    }
                    secondary={
                      <>
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.primary"
                          sx={{ display: "block", whiteSpace: "pre-wrap", mt: 0.5 }}
                        >
                          {n.message}
                        </Typography>
                        <Typography
                          component="span"
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: "block", mt: 0.75 }}
                        >
                          From {n.sent_by_name || "District Officer"}
                          {n.location_name ? ` · ${n.location_name}` : ""}
                          {" · "}
                          {n.created_at
                            ? new Date(n.created_at).toLocaleString()
                            : ""}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </Drawer>

      <Dialog
        open={composeOpen}
        onClose={() => !sending && setComposeOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Send notification to Youth</DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}
        >
          <TextField
            label="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
            fullWidth
            autoFocus
          />
          <FormControl fullWidth required>
            <InputLabel>Infrastructure sector</InputLabel>
            <Select
              value={form.infrastructure_sector}
              label="Infrastructure sector"
              onChange={(e) =>
                setForm({ ...form, infrastructure_sector: e.target.value })
              }
            >
              {(sectors.length
                ? sectors
                : [
                    { value: "water", label: "Water" },
                    { value: "electricity", label: "Electricity" },
                    { value: "healthcare", label: "Healthcare" },
                  ]
              ).map((s) => (
                <MenuItem key={s.value} value={s.value}>
                  {s.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Geographic sector (optional)</InputLabel>
            <Select
              value={form.location}
              label="Geographic sector (optional)"
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            >
              <MenuItem value="">
                <em>All / not specified</em>
              </MenuItem>
              {locations.map((loc) => (
                <MenuItem key={loc.id} value={String(loc.id)}>
                  {loc.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Message"
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            required
            fullWidth
            multiline
            minRows={4}
            placeholder="Describe the planned infrastructure construction or update for Youth..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setComposeOpen(false)} disabled={sending}>
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            variant="contained"
            disabled={sending}
            startIcon={sending ? <CircularProgress size={16} /> : <SendIcon />}
          >
            Send to Youth
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
