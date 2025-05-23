import Notification from '../../models/notification/notification.model.js';
import { AppError } from '../../utils/logging/error.js';
import logger from '../../utils/logging/logger.js';

export const getUserNotifications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const unreadOnly = req.query.unread === 'true';
    
    const query = { user: req.user._id };
    if (unreadOnly) {
      query.isRead = false;
    }
    
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
      
    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ 
      user: req.user._id,
      isRead: false
    });
    
    res.status(200).json({
      success: true,
      data: notifications,
      pagination: {
        page,
        pages: Math.ceil(total / limit),
        total,
        unreadCount
      }
    });
  } catch (error) {
    logger.error('Failed to get user notifications:', error);
    next(new AppError('Failed to fetch notifications', 500));
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const notification = await Notification.findOneAndUpdate(
      { _id: id, user: req.user._id },
      { isRead: true },
      { new: true }
    );
    
    if (!notification) {
      return next(new AppError('Notification not found', 404));
    }
    
    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    logger.error('Failed to mark notification as read:', error);
    next(new AppError('Failed to update notification', 500));
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, isRead: false },
      { isRead: true }
    );
    
    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    logger.error('Failed to mark all notifications as read:', error);
    next(new AppError('Failed to update notifications', 500));
  }
};

export const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const notification = await Notification.findOneAndDelete({
      _id: id,
      user: req.user._id
    });
    
    if (!notification) {
      return next(new AppError('Notification not found', 404));
    }
    
    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    logger.error('Failed to delete notification:', error);
    next(new AppError('Failed to delete notification', 500));
  }
};