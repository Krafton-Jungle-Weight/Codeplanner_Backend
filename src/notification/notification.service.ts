import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './notification.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) { }
  
  async getNotifications(userId: string) {
    const notifications = await this.notificationRepository.find({
      where: { userId: userId },
      order: { createdAt: 'DESC' },
    });
    // payload만 추출해서 반환
    return notifications.map(n => ({
      issueId: n.payload?.issueId,
      issueTitle: n.payload?.issueTitle,
      projectName: n.payload?.projectName,
      projectId: n.payload?.projectId,
      createdAt: n.payload?.createdAt,
    }));
  }

  async getRecentNotifications(userId: string) {
    const notifications = await this.notificationRepository.find({
      where: { userId: userId },
      order: { createdAt: 'DESC' },
      take: 5,
    });
    // payload만 추출해서 반환
    return notifications.map(n => ({
      issueId: n.payload?.issueId,
      issueTitle: n.payload?.issueTitle,
      projectName: n.payload?.projectName,
      projectId: n.payload?.projectId,
      createdAt: n.payload?.createdAt,
    }));
  }

  async createNotification(userId: string, type: string, payload: any) {
    const notification = this.notificationRepository.create({
      userId,
      type,
      payload,
    });
    return this.notificationRepository.save(notification);
  }
}