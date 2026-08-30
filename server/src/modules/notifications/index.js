import router from "./notification.routes.js";
import Notification from "./notification.model.js";
import NotificationPreference from "./notificationPreference.model.js";
import { NotificationService } from "./notification.service.js";
import { NOTIFICATION_TEMPLATES } from "./notification.templates.js";
import {
  NOTIFICATION_TYPES,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_STATUSES,
} from "./notification.constants.js";

export {
  Notification,
  NotificationPreference,
  NotificationService,
  NOTIFICATION_TEMPLATES,
  NOTIFICATION_TYPES,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_STATUSES,
};

export default router;
