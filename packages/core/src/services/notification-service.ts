import { Repository } from "./repository";
import { HopkeyNotification } from "../models/notification";

export class NotificationService {
  constructor(private repository: Repository) {
    if (!this.repository.getNotifications()) {
      this.repository.setNotifications([]);
    }
  }

  getNotifications(unread?: boolean): HopkeyNotification[] {
    if (unread !== undefined && unread === true) {
      return this.repository.getNotifications().filter((n: HopkeyNotification) => !n.read);
    }
    return this.repository.getNotifications();
  }

  setNotificationAsRead(uuid: string): void {
    const notifications = this.getNotifications();
    notifications.forEach((n: HopkeyNotification) => {
      if (n.uuid === uuid) {
        n.read = true;
      }
    });
    this.repository.setNotifications(notifications);
  }

  setNotifications(notifications: HopkeyNotification[]): void {
    this.repository.setNotifications(notifications);
  }

  removeNotification(notificationToBeRemoved: HopkeyNotification): void {
    const notifications = this.getNotifications();
    const newNotifications = notifications.filter((notification) => notification.uuid !== notificationToBeRemoved.uuid);
    this.setNotifications(newNotifications);
  }

  getNotificationByUuid(uuid: string): HopkeyNotification | undefined {
    return this.getNotifications().find((hopkeyNotification) => hopkeyNotification.uuid === uuid);
  }
}
