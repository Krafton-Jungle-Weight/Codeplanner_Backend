import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Notification } from './notification.entity';
import { UserNotification } from './user-notification.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,

    @InjectRepository(UserNotification)
    private userNotificationRepository: Repository<UserNotification>,
  ) {}

  async getNotifications(userId: string) {
    // 1. user_notification 테이블에서 userId가 일치하는 엔트리들을 찾음
    const userNotifications = await this.userNotificationRepository.find({
      where: { userId: userId },
      order: { notificationId: 'DESC' },
    });

    // 2. 각 엔트리의 notificationId에 해당하는 알림을 notification 테이블에서 찾음
    // user_notification 테이블에서 찾은 엔트리에 대해서 notificationId를 추출.
    const notificationIds = userNotifications.map((un) => un.notificationId);
    const notifications = await this.notificationRepository.find({
      where: { id: In(notificationIds) },
      order: { createdAt: 'DESC' },
    });

    // 3. user_notification과 notification 데이터를 매핑하여 읽음 여부 포함
    const notificationsWithReadStatus = notifications.map((notification) => {
      const userNotification = userNotifications.find(
        (un) => un.notificationId === notification.id,
      );

      return {
        type: notification.type,
        notificationId: notification.id,
        issueId: notification.payload?.issueId,
        issueTitle: notification.payload?.issueTitle,
        projectName: notification.payload?.projectName,
        projectId: notification.payload?.projectId,
        createdAt: notification.createdAt,
        isRead: userNotification?.isRead || false,
      };
    });

    return notificationsWithReadStatus;
  }

  async getRecentNotifications(userId: string) {
    // 1. user_notification 테이블에서 userId가 일치하고 읽지 않은 엔트리들을 찾음 (최근 5개)
    const userNotifications = await this.userNotificationRepository.find({
      where: { userId: userId, isRead: false },
      order: { notificationId: 'DESC' },
      take: 5,
    });

    // 2. 각 엔트리의 notificationId에 해당하는 알림을 notification 테이블에서 찾음
    const notificationIds = userNotifications.map((un) => un.notificationId);
    const notifications = await this.notificationRepository.find({
      where: { id: In(notificationIds) },
      order: { createdAt: 'DESC' },
    });

    return notifications.map((n) => ({
      type: n.type,
      notificationId: n.id,
      issueId: n.payload?.issueId,
      issueTitle: n.payload?.issueTitle,
      projectName: n.payload?.projectName,
      projectId: n.payload?.projectId,
      createdAt: n.createdAt,
    }));
  }

  async createNotification(userId: string, type: string, payload: any) {
    // 1. notification 먼저 생성하고 저장하여 ID 획득
    const notification = this.notificationRepository.create({
      type,
      payload,
    });
    const savedNotification =
      await this.notificationRepository.save(notification);

    // 2. 저장된 notification의 ID를 사용하여 user_notification 생성
    const userNotification = this.userNotificationRepository.create({
      userId,
      notificationId: savedNotification.id,
      isRead: false,
    });

    // 3. user_notification 저장
    await this.userNotificationRepository.save(userNotification);
  }

  async setRead(userId: string, notificationId: string) {
    await this.userNotificationRepository.update(
      { userId, notificationId },
      { isRead: true },
    );

    console.log('setRead', userId, notificationId);
  }

  async deleteUserNotification(userId: string, notificationId: string) {
    await this.userNotificationRepository.delete({ userId, notificationId });
  }
}
