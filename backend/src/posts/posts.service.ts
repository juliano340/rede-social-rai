import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PostsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  private async getCursorDate(cursor: string): Promise<Date> {
    const post = await this.prisma.post.findUnique({
      where: { id: cursor },
      select: { createdAt: true },
    });
    if (!post) {
      throw new NotFoundException('Cursor post not found');
    }
    return post.createdAt;
  }

  async create(userId: string, content: string) {
    if (!content || content.trim().length === 0) {
      throw new BadRequestException('Post content cannot be empty');
    }

    if (content.length > 280) {
      throw new BadRequestException('Post content cannot exceed 280 characters');
    }

    return this.prisma.post.create({
      data: {
        content: content.trim(),
        authorId: userId,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            likes: true,
            replies: true,
          },
        },
      },
    });
  }

  async findAll(cursor?: string, limit = 20) {
    const take = limit + 1;

    const where = cursor ? { createdAt: { lt: await this.getCursorDate(cursor) } } : {};

    const posts = await this.prisma.post.findMany({
      where,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            likes: true,
            replies: true,
          },
        },
      },
    });

    const hasMore = posts.length > limit;
    const results = hasMore ? posts.slice(0, limit) : posts;
    const nextCursor = hasMore && results.length > 0 ? results[results.length - 1].id : null;

    return {
      posts: results,
      nextCursor,
      hasMore,
    };
  }

  async findFollowing(userId: string, cursor?: string, limit = 20) {
    const following = await this.prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });
    
    const followingIds = following.map(f => f.followingId);
    
    if (followingIds.length === 0) {
      return { posts: [], nextCursor: null, hasMore: false };
    }

    const take = limit + 1;
    const where: any = { authorId: { in: followingIds } };
    if (cursor) {
      where.createdAt = { lt: await this.getCursorDate(cursor) };
    }
    
    const posts = await this.prisma.post.findMany({
      where,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            likes: true,
            replies: true,
          },
        },
      },
    });

    const hasMore = posts.length > limit;
    const results = hasMore ? posts.slice(0, limit) : posts;
    const nextCursor = hasMore && results.length > 0 ? results[results.length - 1].id : null;

    return {
      posts: results,
      nextCursor,
      hasMore,
    };
  }

  async findByUser(userId: string, cursor?: string, limit = 20) {
    const take = limit + 1;
    const where: any = { authorId: userId };
    if (cursor) {
      where.createdAt = { lt: await this.getCursorDate(cursor) };
    }

    const posts = await this.prisma.post.findMany({
      where,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            likes: true,
            replies: true,
          },
        },
      },
    });

    const hasMore = posts.length > limit;
    const results = hasMore ? posts.slice(0, limit) : posts;
    const nextCursor = hasMore && results.length > 0 ? results[results.length - 1].id : null;

    return {
      posts: results,
      nextCursor,
      hasMore,
    };
  }

  async findById(postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            likes: true,
            replies: true,
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return post;
  }

  async delete(postId: string, userId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.authorId !== userId) {
      throw new BadRequestException('You can only delete your own posts');
    }

    await this.prisma.post.delete({
      where: { id: postId },
    });

    return { message: 'Post deleted successfully' };
  }

  async like(postId: string, userId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const existingLike = await this.prisma.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    if (existingLike) {
      await this.prisma.like.delete({
        where: { id: existingLike.id },
      });
      return { liked: false };
    }

    await this.prisma.like.create({
      data: {
        userId,
        postId,
      },
    });

    if (post.authorId !== userId) {
      this.notificationsService.createLikeNotification(post.authorId, userId, postId);
    }

    return { liked: true };
  }

  async isLiked(postId: string, userId: string) {
    const like = await this.prisma.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    return !!like;
  }

  async createReply(postId: string, userId: string, content: string, parentId?: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Se tem parentId, verificar se existe
    if (parentId) {
      const parentReply = await this.prisma.reply.findUnique({
        where: { id: parentId },
      });
      if (!parentReply) {
        throw new NotFoundException('Reply not found');
      }
      // Verificar se o parent pertence ao mesmo post
      if (parentReply.postId !== postId) {
        throw new BadRequestException('Reply does not belong to this post');
      }
    }

    if (!content || content.trim().length === 0) {
      throw new BadRequestException('Reply content cannot be empty');
    }

    if (content.length > 280) {
      throw new BadRequestException('Reply content cannot exceed 280 characters');
    }

    // Verificar limite de 10 respostas por dia
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const repliesCount = await this.prisma.reply.count({
      where: {
        authorId: userId,
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    if (repliesCount >= 10) {
      throw new BadRequestException('Limite de 10 respostas por dia atingido. Tente novamente amanhã.');
    }

    const replyData: any = {
      content: content.trim(),
      postId,
      authorId: userId,
    };
    
    if (parentId) {
      replyData.parentId = parentId;
    }

    const reply = await this.prisma.reply.create({
      data: replyData,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    if (post.authorId !== userId) {
      this.notificationsService.createReplyNotification(post.authorId, userId, postId);
    }

    return reply;
  }

  async getReplies(postId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    
    const [replies, total] = await Promise.all([
      this.prisma.reply.findMany({
        where: { postId, parentId: null }, // Only top-level replies
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true,
            },
          },
          children: {
            include: {
              author: {
                select: {
                  id: true,
                  username: true,
                  name: true,
                  avatar: true,
                },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      }),
      this.prisma.reply.count({ where: { postId, parentId: null } }),
    ]);

    return {
      replies,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateReply(replyId: string, userId: string, content: string) {
    const reply = await this.prisma.reply.findUnique({
      where: { id: replyId },
    });

    if (!reply) {
      throw new NotFoundException('Reply not found');
    }

    if (reply.authorId !== userId) {
      throw new ForbiddenException('You can only edit your own replies');
    }

    if (!content || content.trim().length === 0) {
      throw new BadRequestException('Reply content cannot be empty');
    }

    if (content.length > 280) {
      throw new BadRequestException('Reply content cannot exceed 280 characters');
    }

    return this.prisma.reply.update({
      where: { id: replyId },
      data: { content: content.trim() },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
      },
    });
  }

  async deleteReply(replyId: string, userId: string) {
    const reply = await this.prisma.reply.findUnique({
      where: { id: replyId },
    });

    if (!reply) {
      throw new NotFoundException('Reply not found');
    }

    if (reply.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own replies');
    }

    await this.prisma.reply.delete({
      where: { id: replyId },
    });

    return { success: true };
  }
}