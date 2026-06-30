import NotificationsIcon from "@mui/icons-material/Notifications";
import RefreshIcon from "@mui/icons-material/Refresh";
import {
  Alert,
  Badge,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Pagination,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import { NotificationCard } from "../components/NotificationCard";
import { NotificationFilter } from "../components/NotificationFilter";
import { useNotifications } from "../hooks/useNotifications";

export function NotificationsPage() {
  const {
    notifications,
    priorityNotifications,
    totalPages,
    loading,
    error,
    page,
    filter,
    setPage,
    setFilter,
    refresh,
  } = useNotifications();

  const unreadCount = notifications.filter((notification) => !notification.read).length;

  const handleFilterChange = (_, newFilter) => {
    setFilter(newFilter ?? "All");
    setPage(1);
  };

  const handlePageChange = (_, newPage) => {
    setPage(newPage);
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", px: { xs: 2, md: 4 }, py: { xs: 3, md: 6 } }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, md: 4 },
          borderRadius: 4,
          border: "1px solid rgba(15, 118, 110, 0.12)",
          background:
            "linear-gradient(135deg, rgba(15,118,110,0.08) 0%, rgba(255,255,255,0.96) 55%, rgba(249,115,22,0.08) 100%)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: 2,
            alignItems: { xs: "flex-start", md: "center" },
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Badge badgeContent={unreadCount} color="primary" max={99}>
              <NotificationsIcon sx={{ fontSize: 32, color: "primary.main" }} />
            </Badge>
            <Box>
              <Typography variant="overline" color="text.secondary">
                Campus Notification Feed
              </Typography>
              <Typography variant="h4" fontWeight={800} sx={{ lineHeight: 1.1 }}>
                Notifications
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                Filter by type, inspect your priority inbox, and review every update in one place.
              </Typography>
            </Box>
          </Box>

          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={refresh}
            sx={{ alignSelf: { xs: "stretch", md: "center" } }}
          >
            Refresh feed
          </Button>
        </Box>

        <Box
          sx={{
            mt: 1,
            display: "grid",
            gap: 2.5,
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
          }}
        >
          <Card variant="outlined" sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                Unread
              </Typography>
              <Typography variant="h3" fontWeight={800}>
                {unreadCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Notifications that still need attention.
              </Typography>
            </CardContent>
          </Card>
          <Card variant="outlined" sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                Priority inbox
              </Typography>
              <Typography variant="h3" fontWeight={800}>
                {priorityNotifications.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Top-ranked notifications surfaced by type and recency.
              </Typography>
            </CardContent>
          </Card>
          <Card variant="outlined" sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                Active filter
              </Typography>
              <Typography variant="h3" fontWeight={800}>
                {filter}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Page {page} of {totalPages}
              </Typography>
            </CardContent>
          </Card>
        </Box>

      </Paper>

      <Paper elevation={0} sx={{ mt: 3, p: { xs: 2, md: 3 }, borderRadius: 4, border: "1px solid rgba(15, 118, 110, 0.12)" }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              gap: 2,
              justifyContent: "space-between",
              alignItems: { xs: "flex-start", md: "center" },
            }}
          >
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Filter notifications
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Switch between all notifications and specific campus update categories.
              </Typography>
            </Box>
            <NotificationFilter value={filter} onChange={handleFilterChange} />
          </Box>

          <Divider />

          {loading && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress />
            </Box>
          )}

          {!loading && error && (
            <Alert severity="error">Failed to load notifications: {error}</Alert>
          )}

          {!loading && !error && priorityNotifications.length > 0 && (
            <Stack spacing={1.5}>
              <Typography variant="h6" fontWeight={700}>
                Priority inbox
              </Typography>
              {priorityNotifications.map((notification) => (
                <NotificationCard key={notification.id} notification={notification} />
              ))}
            </Stack>
          )}

          {!loading && !error && priorityNotifications.length === 0 && (
            <Alert severity="info">No priority notifications available for the current filter.</Alert>
          )}

          {!loading && !error && (
            <>
              <Divider />
              <Stack spacing={1.5}>
                <Typography variant="h6" fontWeight={700}>
                  All notifications
                </Typography>
                {notifications.length === 0 ? (
                  <Alert severity="info">No notifications found for the selected filter.</Alert>
                ) : (
                  notifications.map((notification) => (
                    <NotificationCard key={notification.id} notification={notification} />
                  ))
                )}
              </Stack>

              {totalPages > 1 && (
                <Box sx={{ display: "flex", justifyContent: "center", pt: 2 }}>
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={handlePageChange}
                    color="primary"
                    shape="rounded"
                  />
                </Box>
              )}
            </>
          )}
        </Box>
      </Paper>
    </Box>
  );
}
