import { ToggleButton, ToggleButtonGroup } from "@mui/material";

const filters = ["All", "Placement", "Result", "Event"];

export function NotificationFilter({ value, onChange }) {
  return (
    <ToggleButtonGroup
      value={value}
      exclusive
      onChange={onChange}
      size="small"
      aria-label="notification type filter"
      sx={{ flexWrap: "wrap", gap: 0.75 }}
    >
      {filters.map((type) => (
        <ToggleButton key={type} value={type} sx={{ textTransform: "none", px: 2 }}>
          {type}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}