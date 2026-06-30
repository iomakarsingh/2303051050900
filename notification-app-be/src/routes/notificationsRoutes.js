import { Router } from 'express';
import { getNotificationById, getPriorityNotifications, listNotifications } from '../services/notificationsService.js';
import { logEvent } from '../lib/logger.js';

const router = Router();

router.get('/evaluation-service/notifications', async (req, res, next) => {
  try {
    const { page = 1, limit = 10, notification_type = 'All' } = req.query;

    await logEvent(
      'backend',
      'info',
      'route',
      `GET /evaluation-service/notifications page=${page} limit=${limit} type=${notification_type}`
    );

    const payload = listNotifications({
      page,
      limit,
      notificationType: notification_type,
    });

    res.json(payload);
  } catch (error) {
    next(error);
  }
});

router.get('/evaluation-service/notifications/priority', async (req, res, next) => {
  try {
    const { limit = 10, notification_type = 'All' } = req.query;

    await logEvent(
      'backend',
      'info',
      'route',
      `GET /evaluation-service/notifications/priority limit=${limit} type=${notification_type}`
    );

    res.json({
      notifications: getPriorityNotifications(limit, notification_type),
    });
  } catch (error) {
    next(error);
  }
});

router.get('/evaluation-service/notifications/:id', async (req, res, next) => {
  try {
    const notification = getNotificationById(req.params.id);

    if (!notification) {
      res.status(404).json({ message: 'Notification not found' });
      return;
    }

    res.json({ notification });
  } catch (error) {
    next(error);
  }
});

export { router as notificationsRouter };
