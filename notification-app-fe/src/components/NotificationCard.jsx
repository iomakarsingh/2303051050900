import {
  Card,
  CardContent,
  Chip,
  Box,
  Stack,
  Typography,
} from "@mui/material";

const typeTone = {
  Event: "warning",
  Result: "success",
  Placement: "info",
};

function formatTimestamp(timestamp) {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function NotificationCard({ notification }) {
  return (
    <Card
      variant="outlined"
      sx={{
        borderColor: notification.read ? "divider" : "primary.main",
        bgcolor: notification.read ? "background.paper" : "rgba(15, 118, 110, 0.05)",
      }}
    >
      <CardContent>
        <Stack spacing={1.25}>
          <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1 }}>
            <Chip
              label={notification.type}
              color={typeTone[notification.type] ?? "default"}
              size="small"
              variant="filled"
            />
            <Chip
              label={notification.read ? "Viewed" : "New"}
              size="small"
              variant={notification.read ? "outlined" : "filled"}
              color={notification.read ? "default" : "primary"}
            />
            <Chip
              label={`Priority ${notification.priorityScore}`}
              size="small"
              variant="outlined"
            />
          </Box>

          <Typography variant="subtitle1" fontWeight={700}>
            {notification.message}
          </Typography>

          <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 1, justifyContent: "space-between" }}>
            <Typography variant="body2" color="text.secondary">
              {formatTimestamp(notification.timestamp)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Source: {notification.source}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}