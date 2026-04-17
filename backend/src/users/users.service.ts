import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { isIP } from 'node:net';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

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

    return this.prisma.user.update({
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
  }

  async findByUsername(username: string) {
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
    const user = await this.findByUsername(username);
    
    const isFollowing = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: user.id,
        },
      },
    });

    return {
      ...user,
      isFollowing: !!isFollowing,
    };
  }

  async updateAvatar(userId: string, avatarPath: string) {
    // Delete old avatar if exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { avatar: true },
    });
    
    if (user?.avatar) {
      // Avatar path is stored, will be handled by uploads service
    }
    
    return this.prisma.user.update({
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
  }

  async updateProfile(userId: string, data: { name?: string; bio?: string; bioLink?: string; avatar?: string }) {
    const bioLink = this.normalizeBioLink(data.bioLink);

    return this.prisma.user.update({
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
      // Unfollow
      await this.prisma.follow.delete({
        where: { id: existingFollow.id },
      });
      return { following: false };
    }

    // Follow
    await this.prisma.follow.create({
      data: {
        followerId,
        followingId,
      },
    });
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
