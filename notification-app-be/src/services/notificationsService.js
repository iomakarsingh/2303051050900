import { mockNotifications } from '../data/notifications.js';

const TYPE_WEIGHTS = {
  Placement: 3,
  Result: 2,
  Event: 1,
};

function normalizeNotification(notification) {
  return {
    id: notification.id,
    type: notification.type,
    message: notification.message,
    timestamp: notification.timestamp,
    read: Boolean(notification.read),
    priorityScore: scoreNotification(notification),
    source: notification.source ?? 'notification-service',
  };
}

export function scoreNotification(notification) {
  const typeWeight = TYPE_WEIGHTS[notification.type] ?? 1;
  const createdAt = new Date(notification.timestamp).getTime();
  const safeCreatedAt = Number.isFinite(createdAt) ? createdAt : Date.now();
  const ageInHours = Math.max((Date.now() - safeCreatedAt) / (1000 * 60 * 60), 0);
  const unreadBoost = notification.read ? 0 : 60;

  return Math.round(typeWeight * 1000 + unreadBoost + Math.max(240 - ageInHours, 0));
}

export function sortByPriority(notifications) {
  return [...notifications].sort((left, right) => {
    const leftScore = left.priorityScore ?? scoreNotification(left);
    const rightScore = right.priorityScore ?? scoreNotification(right);

    if (rightScore !== leftScore) {
      return rightScore - leftScore;
    }

    return new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime();
  });
}

export function listNotifications({ page = 1, limit = 10, notificationType = 'All' } = {}) {
  const normalizedPage = Math.max(Number(page) || 1, 1);
  const normalizedLimit = Math.max(Number(limit) || 10, 1);

  const filtered = mockNotifications.filter((notification) => {
    if (notificationType === 'All') {
      return true;
    }

    return notification.type === notificationType;
  });

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / normalizedLimit));
  const startIndex = (normalizedPage - 1) * normalizedLimit;
  const notifications = filtered
    .slice(startIndex, startIndex + normalizedLimit)
    .map(normalizeNotification);

  return {
    notifications,
    total,
    totalPages,
    page: normalizedPage,
    limit: normalizedLimit,
  };
}

export function getNotificationById(id) {
  const notification = mockNotifications.find((item) => item.id === id);

  return notification ? normalizeNotification(notification) : null;
}

export function getPriorityNotifications(limit = 10, notificationType = 'All') {
  const filtered = mockNotifications.filter((notification) => {
    if (notificationType === 'All') {
      return true;
    }

    return notification.type === notificationType;
  });

  return sortByPriority(filtered).slice(0, Math.max(Number(limit) || 10, 1)).map(normalizeNotification);
}
