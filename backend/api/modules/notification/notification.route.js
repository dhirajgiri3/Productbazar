import express from 'express';
import * as notificationController from '../../../controllers/notifications/notification.controller.js';
import { protect } from '../../middlewares/user/auth.middleware.js';

const router = express.Router();

// All notification routes require authentication
router.use(protect);

// Get all notifications for current user
router.get('/', notificationController.getUserNotifications);

// Mark notification(s) as read
router.put('/read/:id', notificationController.markAsRead);
router.put('/read-all', notificationController.markAllAsRead);

// Delete notification
router.delete('/:id', notificationController.deleteNotification);

export default router;