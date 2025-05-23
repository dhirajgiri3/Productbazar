// src/utils/formatTimeAgo.js
import { formatDistanceToNowStrict } from 'date-fns';

export const FormatTimeAgo = (dateString) => {
  if (!dateString) return '';
  try {
    // formatDistanceToNowStrict gives more concise output like "5m", "2h", "3d"
    return formatDistanceToNowStrict(new Date(dateString), { addSuffix: true });
  } catch (error) {
    console.error("Error formatting date:", dateString, error);
    return 'invalid date';
  }
};