import { useCallback, useEffect, useState } from "react";
import { fetchNotifications } from "../api/notifications";
import { logEvent } from "../lib/logger";
import { getTopPriorityNotifications } from "../utils/notifications";

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [priorityNotifications, setPriorityNotifications] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const limit = 10;

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await fetchNotifications({
        page,
        limit,
        notificationType: filter,
      });

      setNotifications(data.notifications ?? []);
      setPriorityNotifications(getTopPriorityNotifications(data.notifications ?? [], 10));
      setTotal(data.total ?? 0);

      await logEvent(
        "frontend",
        "info",
        "hook",
        `Notification data refreshed for page ${page} with filter ${filter}`
      );
    } catch (fetchError) {
      const message = fetchError instanceof Error ? fetchError.message : String(fetchError);
      setError(message);

      await logEvent(
        "frontend",
        "error",
        "hook",
        `Notification load failed: ${message}`
      );
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      void loadNotifications();
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [loadNotifications]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    notifications,
    priorityNotifications,
    total,
    totalPages,
    loading,
    error,
    page,
    filter,
    setPage,
    setFilter,
    refresh: loadNotifications,
  };
}
