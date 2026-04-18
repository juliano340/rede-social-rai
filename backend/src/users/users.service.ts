import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { isIP } from 'node:net';
import { PrismaService } from '../prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private uploadsService: UploadsService,
    private notificationsService: NotificationsService,
  ) {}

  private normalizeBioLink(value?: string): string | undefined {
    if (value === undefined) return undefined;
    if (typeof value !== 'string') {
      throw new BadRequestException(
        'Invalid bioLink. Provide a valid public http/https URL.'
      );
    }

    const raw = value.trim();
    if (!raw) return undefined;

    try {
      const url = new URL(raw);
      const host = url.hostname.toLowerCase();

      if (!/^https?:$/.test(url.protocol)) {
        throw new BadRequestException(
          'Invalid bioLink. Only public http/https URLs are allowed.'
        );
      }

      const isLocalhost = host === 'localhost' || host.endsWith('.localhost');
      const isInternalHostname = host.endsWith('.local') || (!host.includes('.') && isIP(host) === 0);
      const isLoopbackIpv4 = /^127\./.test(host);
      const isPrivateIpv4 =
        /^10\./.test(host) ||
        /^192\.168\./.test(host) ||
        /^172\.(1[6-9]|2\d|3[0-1])\./.test(host) ||
        /^169\.254\./.test(host) ||
        /^0\./.test(host);
      const isBlockedIpv6 = host === '::1' || /^fe80:/i.test(host) || /^fc/i.test(host) || /^fd/i.test(host);

      if (isLocalhost || isInternalHostname || isLoopbackIpv4 || isPrivateIpv4 || isBlockedIpv6) {
        throw new BadRequestException(
          'Invalid bioLink. Localhost, private, and internal URLs are not allowed.'
        );
      }

      return raw;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException(
        'Invalid bioLink. Provide a valid public http/https URL.'
      );
    }
  }

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
    const bioLink = this.normalizeBioLink(data.bioLink);

    const result = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.bio !== undefined ? { bio: data.bio } : {}),
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

  private validateAvatarUrl(url: string): void {
    try {
      const parsed = new URL(url);
      
      if (!/^https?:$/.test(parsed.protocol)) {
        throw new BadRequestException('Avatar URL must use http or https protocol');
      }

      const host = parsed.hostname.toLowerCase();

      const isLocalhost = host === 'localhost' || host.endsWith('.localhost');
      const isInternalHostname = host.endsWith('.local') || (!host.includes('.') && isIP(host) === 0);
      const isLoopbackIpv4 = /^127\./.test(host);
      const isPrivateIpv4 =
        /^10\./.test(host) ||
        /^192\.168\./.test(host) ||
        /^172\.(1[6-9]|2\d|3[0-1])\./.test(host) ||
        /^169\.254\./.test(host) ||
        /^0\./.test(host);
      const isBlockedIpv6 = host === '::1' || /^fe80:/i.test(host) || /^fc/i.test(host) || /^fd/i.test(host);

      if (isLocalhost || isInternalHostname || isLoopbackIpv4 || isPrivateIpv4 || isBlockedIpv6) {
        throw new BadRequestException('Avatar URL cannot point to localhost, private, or internal networks');
      }

      const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
      const path = parsed.pathname.toLowerCase();
      const hasExtension = validExtensions.some(ext => path.endsWith(ext));
      const hasImageQuery = /(\?|&)(jpg|jpeg|png|gif|webp)=/i.test(parsed.search);

      if (!hasExtension && !hasImageQuery) {
        throw new BadRequestException('Avatar URL must point to an image file (jpg, jpeg, png, gif, webp)');
      }
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('Invalid avatar URL format');
    }
  }

  async updateAvatarUrl(userId: string, url: string) {
    this.validateAvatarUrl(url);

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
    const bioLink = this.normalizeBioLink(data.bioLink);

    const result = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.bio !== undefined ? { bio: data.bio } : {}),
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

    this.notificationsService.createFollowNotification(followingId, followerId);

    return { following: true };
  }

  async getFollowers(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    
    const [followers, total] = await Promise.all([
      this.prisma.follow.findMany({
        where: { followingId: userId },
        skip,
        take: limit,
        include: {
          follower: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true,
            },
          },
        },
      }),
      this.prisma.follow.count({ where: { followingId: userId } }),
    ]);

    return {
      users: followers.map(f => f.follower),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getFollowing(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    
    const [following, total] = await Promise.all([
      this.prisma.follow.findMany({
        where: { followerId: userId },
        skip,
        take: limit,
        include: {
          following: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true,
            },
          },
        },
      }),
      this.prisma.follow.count({ where: { followerId: userId } }),
    ]);

    return {
      users: following.map(f => f.following),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async search(query: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: {
          OR: [
            { username: { contains: query } },
            { name: { contains: query } },
          ],
        },
        skip,
        take: limit,
        select: {
          id: true,
          username: true,
          name: true,
          bio: true,
          bioLink: true,
          avatar: true,
          createdAt: true,
        },
      }),
      this.prisma.user.count({
        where: {
          OR: [
            { username: { contains: query } },
            { name: { contains: query } },
          ],
        },
      }),
    ]);

    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
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
