import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type NotificationType = 'LIKE' | 'FOLLOW' | 'REPLY' | 'MENTION';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    type: NotificationType;
    userId: string;
    actorId: string;
    postId?: string;
    replyId?: string;
  }) {
    if (data.userId === data.actorId) {
      return null;
    }

    return this.prisma.notification.create({
      data: {
        type: data.type,
        userId: data.userId,
        actorId: data.actorId,
        postId: data.postId,
        replyId: data.replyId,
      },
      include: {
        actor: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
        post: {
          select: {
            id: true,
            content: true,
            author: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
      },
    });
  }

  async findAll(userId: string, cursor?: string, limit = 20) {
    const take = limit + 1;
    const args: Parameters<typeof this.prisma.notification.findMany>[0] = {
      where: { userId },
      take,
      orderBy: [
        { createdAt: 'desc' },
        { id: 'desc' },
      ],
      include: {
        actor: {
          select: { id: true, username: true, name: true, avatar: true },
        },
        post: {
          select: {
            id: true,
            content: true,
            author: { select: { id: true, username: true } },
          },
        },
      },
    };

    if (cursor) {
      const cursorNotification = await this.prisma.notification.findFirst({
        where: { id: cursor, userId },
        select: { id: true, createdAt: true },
      });

      if (cursorNotification) {
        args.where = {
          userId,
          OR: [
            { createdAt: { lt: cursorNotification.createdAt } },
            { createdAt: cursorNotification.createdAt, id: { lt: cursorNotification.id } },
          ],
        };
      }
    }

    const notifications = await this.prisma.notification.findMany(args);
    const hasMore = notifications.length > limit;
    const results = hasMore ? notifications.slice(0, limit) : notifications;
    const nextCursor = hasMore && results.length > 0 ? results[results.length - 1].id : null;

    return { notifications: results, nextCursor, hasMore };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, read: false },
    });
  }

  async markAsRead(userId: string, notificationId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { read: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }

  async createLikeNotification(postAuthorId: string, actorId: string, postId: string) {
    return this.create({
      type: 'LIKE',
      userId: postAuthorId,
      actorId,
      postId,
    });
  }

  async createFollowNotification(followingId: string, followerId: string) {
    return this.create({
      type: 'FOLLOW',
      userId: followingId,
      actorId: followerId,
    });
  }

  async createReplyNotification(postAuthorId: string, actorId: string, postId: string, replyId?: string) {
    return this.create({
      type: 'REPLY',
      userId: postAuthorId,
      actorId,
      postId,
      replyId,
    });
  }

  async createMentionNotification(mentionedUserId: string, actorId: string, postId: string) {
    return this.create({
      type: 'MENTION',
      userId: mentionedUserId,
      actorId,
      postId,
    });
  }
}
