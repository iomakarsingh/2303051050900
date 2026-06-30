const TYPE_WEIGHTS = {
  Placement: 3,
  Result: 2,
  Event: 1,
};

export function normalizeNotification(notification) {
  return {
    id: notification.id ?? notification.ID ?? crypto.randomUUID(),
    type: notification.type ?? notification.Type ?? 'Event',
    message: notification.message ?? notification.Message ?? '',
    timestamp: notification.timestamp ?? notification.Timestamp ?? new Date().toISOString(),
    read: notification.read ?? notification.isRead ?? false,
    priorityScore:
      notification.priorityScore ?? notification.priority_score ?? scoreNotification(notification),
    metadata: notification.metadata ?? {},
    source: notification.source ?? 'notification-service',
  };
}

export function scoreNotification(notification) {
  const type = notification.type ?? notification.Type ?? 'Event';
  const timestampValue = notification.timestamp ?? notification.Timestamp ?? new Date().toISOString();
  const createdAt = new Date(timestampValue).getTime();
  const safeCreatedAt = Number.isFinite(createdAt) ? createdAt : Date.now();
  const ageInHours = Math.max((Date.now() - safeCreatedAt) / (1000 * 60 * 60), 0);
  const unreadBoost = (notification.read ?? notification.isRead) ? 0 : 60;

  return Math.round((TYPE_WEIGHTS[type] ?? 1) * 1000 + unreadBoost + Math.max(240 - ageInHours, 0));
}

export function sortByPriority(notifications) {
  return [...notifications].sort((left, right) => {
    const rightScore = right.priorityScore ?? scoreNotification(right);
    const leftScore = left.priorityScore ?? scoreNotification(left);

    if (rightScore !== leftScore) {
      return rightScore - leftScore;
    }

    return new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime();
  });
}

export function getTopPriorityNotifications(notifications, limit = 10) {
  return sortByPriority(notifications).slice(0, limit);
}
