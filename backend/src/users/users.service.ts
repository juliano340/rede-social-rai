import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { normalizeBioLinkValue, validateAvatarUrl } from '../common/utils/url-validator.util';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private uploadsService: UploadsService,
    private notificationsService: NotificationsService,
  ) {}

  async findById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        bio: true,
        bioLink: true,
        avatar: true,
        createdAt: true,
        _count: {
          select: {
            posts: true,
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(userId: string, data: { name?: string; bio?: string; bioLink?: string }) {
    if (data.name !== undefined && !data.name.trim()) {
      throw new BadRequestException('Nome não pode ficar em branco.');
    }

    const bioLink = normalizeBioLinkValue(data.bioLink);
    const bio = data.bio !== undefined ? (data.bio.trim() || null) : undefined;

    const result = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name !== undefined ? { name: data.name.trim() } : {}),
        ...(bio !== undefined ? { bio } : {}),
        ...(bioLink !== undefined ? { bioLink } : {}),
      },
      select: {
        id: true,
        username: true,
        name: true,
        bio: true,
        bioLink: true,
        avatar: true,
      },
    });

    await this.invalidateUserCache(result.username);
    return result;
  }

  async findByUsername(username: string) {
    const cacheKey = `user:username:${username}`;
    const cached = await this.cacheManager.get<{
      id: string; username: string; name: string | null; bio: string | null; bioLink: string | null; avatar: string | null; createdAt: Date;
      _count: { posts: number; followers: number; following: number };
    }>(cacheKey);
    if (cached) return cached;

    const user = await this.prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        name: true,
        bio: true,
        bioLink: true,
        avatar: true,
        createdAt: true,
        _count: {
          select: {
            posts: true,
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.cacheManager.set(cacheKey, user, 300000);
    return user;
  }

  async getProfile(userId: string, currentUserId: string) {
    const user = await this.findById(userId);
    
    const isFollowing = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: userId,
        },
      },
    });

    return {
      ...user,
      isFollowing: !!isFollowing,
    };
  }

  async getProfileByUsername(username: string, currentUserId: string) {
    const cacheKey = `profile:username:${username}:${currentUserId}`;
    const cached = await this.cacheManager.get<{
      id: string; username: string; name: string | null; bio: string | null; bioLink: string | null; avatar: string | null; createdAt: Date;
      _count: { posts: number; followers: number; following: number }; isFollowing: boolean;
    }>(cacheKey);
    if (cached) return cached;

    const user = await this.findByUsername(username);
    
    const isFollowing = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: user.id,
        },
      },
    });

    const result = {
      ...user,
      isFollowing: !!isFollowing,
    };

    await this.cacheManager.set(cacheKey, result, 300000);
    return result;
  }

  async updateAvatar(userId: string, avatarPath: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { avatar: true },
    });
    
    const result = await this.prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarPath },
      select: {
        id: true,
        username: true,
        name: true,
        bio: true,
        bioLink: true,
        avatar: true,
      },
    });

    await this.invalidateUserCache(result.username);
    return result;
  }

  async updateAvatarUrl(userId: string, url: string) {
    validateAvatarUrl(url);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { avatar: true },
    });

    if (user?.avatar && user.avatar.startsWith('/uploads/')) {
      this.uploadsService.deleteAvatar(user.avatar);
    }

    const result = await this.prisma.user.update({
      where: { id: userId },
      data: { avatar: url },
      select: {
        id: true,
        username: true,
        name: true,
        bio: true,
        bioLink: true,
        avatar: true,
      },
    });

    await this.invalidateUserCache(result.username);
    return result;
  }

  async updateProfile(userId: string, data: { name?: string; bio?: string; bioLink?: string; avatar?: string }) {
    if (data.name !== undefined && !data.name.trim()) {
      throw new BadRequestException('Nome não pode ficar em branco.');
    }

    const bioLink = normalizeBioLinkValue(data.bioLink);
    const bio = data.bio !== undefined ? (data.bio.trim() || null) : undefined;

    const result = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name !== undefined ? { name: data.name.trim() } : {}),
        ...(bio !== undefined ? { bio } : {}),
        ...(bioLink !== undefined ? { bioLink } : {}),
        ...(data.avatar !== undefined ? { avatar: data.avatar } : {}),
      },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        bio: true,
        bioLink: true,
        avatar: true,
      },
    });

    await this.invalidateUserCache(result.username);

    return result;
  }

  private async invalidateUserCache(username: string) {
    await this.cacheManager.del(`user:username:${username}`);
  }

  async follow(followerId: string, followingId: string) {
    if (followerId === followingId) {
      return { following: false, message: 'Cannot follow yourself' };
    }

    const existingFollow = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (existingFollow) {
      await this.prisma.follow.delete({
        where: { id: existingFollow.id },
      });
      return { following: false };
    }

    await this.prisma.follow.create({
      data: {
        followerId,
        followingId,
      },
    });

    const existingNotification = await this.prisma.notification.findFirst({
      where: {
        type: 'FOLLOW',
        userId: followingId,
        actorId: followerId,
      },
    });

    if (!existingNotification) {
      this.notificationsService.createFollowNotification(followingId, followerId);
    }

    return { following: true };
  }

  async getFollowers(userId: string, cursor?: string, limit = 20) {
    const take = limit + 1;
    const args: Parameters<typeof this.prisma.follow.findMany>[0] = {
      where: { followingId: userId },
      take,
      orderBy: { id: 'desc' },
      include: {
        follower: { select: { id: true, username: true, name: true, avatar: true } },
      },
    };

    if (cursor) {
      args.cursor = { id: cursor };
      args.skip = 1;
    }

    const follows = await this.prisma.follow.findMany(args);
    const hasMore = follows.length > limit;
    const results = (hasMore ? follows.slice(0, limit) : follows) as (typeof follows[number] & { follower: { id: string; username: string; name: string; avatar: string | null } })[];
    const nextCursor = hasMore && results.length > 0 ? results[results.length - 1].id : null;

    return { users: results.map(f => f.follower), nextCursor, hasMore };
  }

  async getFollowing(userId: string, cursor?: string, limit = 20) {
    const take = limit + 1;
    const args: Parameters<typeof this.prisma.follow.findMany>[0] = {
      where: { followerId: userId },
      take,
      orderBy: { id: 'desc' },
      include: {
        following: { select: { id: true, username: true, name: true, avatar: true } },
      },
    };

    if (cursor) {
      args.cursor = { id: cursor };
      args.skip = 1;
    }

    const follows = await this.prisma.follow.findMany(args);
    const hasMore = follows.length > limit;
    const results = (hasMore ? follows.slice(0, limit) : follows) as (typeof follows[number] & { following: { id: string; username: string; name: string; avatar: string | null } })[];
    const nextCursor = hasMore && results.length > 0 ? results[results.length - 1].id : null;

    return { users: results.map(f => f.following), nextCursor, hasMore };
  }

  async search(query: string, cursor?: string, limit = 20) {
    const take = limit + 1;
    const args: Parameters<typeof this.prisma.user.findMany>[0] = {
      where: {
        OR: [
          { username: { contains: query } },
          { name: { contains: query } },
        ],
      },
      take,
      orderBy: { id: 'desc' },
      select: {
        id: true, username: true, name: true, bio: true, bioLink: true, avatar: true, createdAt: true,
      },
    };

    if (cursor) {
      args.cursor = { id: cursor };
      args.skip = 1;
    }

    const users = await this.prisma.user.findMany(args);
    const hasMore = users.length > limit;
    const results = hasMore ? users.slice(0, limit) : users;
    const nextCursor = hasMore && results.length > 0 ? results[results.length - 1].id : null;

    return { users: results, nextCursor, hasMore };
  }

  async getSuggested(limit = 10) {
    // Return users with posts or recent users (most relevant for exploration)
    const users = await this.prisma.user.findMany({
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        username: true,
        name: true,
        bio: true,
        bioLink: true,
        avatar: true,
        createdAt: true,
        _count: {
          select: {
            followers: true,
            following: true,
            posts: true,
          },
        },
      },
    });

    return { users, total: users.length };
  }
}
