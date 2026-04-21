import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

const AUTHOR_SELECT = {
  id: true,
  username: true,
  name: true,
  avatar: true,
} as const;

const COUNT_SELECT = {
  likes: true,
  replies: true,
} as const;

const POST_INCLUDE = {
  author: { select: AUTHOR_SELECT },
  _count: { select: COUNT_SELECT },
} as const;

const REPLY_AUTHOR_INCLUDE = {
  author: { select: AUTHOR_SELECT },
} as const;

interface PostWithMeta {
  id: string;
}

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

  private validateContent(content: string, label = 'Post'): void {
    if (!content || content.trim().length === 0) {
      throw new BadRequestException(`${label} content cannot be empty`);
    }
    if (content.length > 280) {
      throw new BadRequestException(`${label} content cannot exceed 280 characters`);
    }
  }

  private buildCursorPagination<T extends PostWithMeta>(posts: T[], limit: number) {
    const hasMore = posts.length > limit;
    const results = hasMore ? posts.slice(0, limit) : posts;
    const nextCursor = hasMore && results.length > 0 ? results[results.length - 1].id : null;
    return { posts: results, nextCursor, hasMore };
  }

  private async assertPostExists(postId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    return post;
  }

  private assertOwnership(postAuthorId: string, userId: string, action: string): void {
    if (postAuthorId !== userId) {
      throw new ForbiddenException(`You can only ${action} your own posts`);
    }
  }

  async create(userId: string, content: string, mediaUrl?: string, mediaType?: string, linkUrl?: string) {
    this.validateContent(content);

    return this.prisma.post.create({
      data: {
        content: content.trim(),
        authorId: userId,
        mediaUrl,
        mediaType,
        linkUrl,
      },
      include: POST_INCLUDE,
    });
  }

  async findAll(cursor?: string, limit = 20, userId?: string) {
    const take = limit + 1;
    const where = cursor ? { createdAt: { lt: await this.getCursorDate(cursor) } } : {};

    const posts = await this.prisma.post.findMany({
      where,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: AUTHOR_SELECT },
        _count: { select: COUNT_SELECT },
        likes: userId ? { where: { userId }, select: { id: true } } : false,
        replies: {
          where: { parentId: null },
          take: 3,
          orderBy: { createdAt: 'asc' },
          include: {
            author: { select: AUTHOR_SELECT },
            children: {
              take: 2,
              orderBy: { createdAt: 'asc' },
              include: { author: { select: AUTHOR_SELECT } },
            },
          },
        },
      },
    });

    return this.buildCursorPagination(
      posts.map(post => {
        const { likes, ...rest } = post;
        return {
          ...rest,
          isLiked: userId ? likes.length > 0 : false,
        };
      }),
      limit
    );
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
    const where: { authorId: { in: string[] }; createdAt?: { lt: Date } } = { authorId: { in: followingIds } };
    if (cursor) {
      where.createdAt = { lt: await this.getCursorDate(cursor) };
    }

    const posts = await this.prisma.post.findMany({
      where,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: AUTHOR_SELECT },
        _count: { select: COUNT_SELECT },
        likes: { where: { userId }, select: { id: true } },
        replies: {
          where: { parentId: null },
          take: 3,
          orderBy: { createdAt: 'asc' },
          include: {
            author: { select: AUTHOR_SELECT },
            children: {
              take: 2,
              orderBy: { createdAt: 'asc' },
              include: { author: { select: AUTHOR_SELECT } },
            },
          },
        },
      },
    });

    return this.buildCursorPagination(
      posts.map(post => {
        const { likes, ...rest } = post;
        return {
          ...rest,
          isLiked: likes.length > 0,
        };
      }),
      limit
    );
  }

  async findByUser(userId: string, cursor?: string, limit = 20) {
    const take = limit + 1;
    const where: { authorId: string; createdAt?: { lt: Date } } = { authorId: userId };
    if (cursor) {
      where.createdAt = { lt: await this.getCursorDate(cursor) };
    }

    const posts = await this.prisma.post.findMany({
      where,
      take,
      orderBy: { createdAt: 'desc' },
      include: POST_INCLUDE,
    });

    return this.buildCursorPagination(posts, limit);
  }

  async findById(postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: POST_INCLUDE,
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return post;
  }

  async update(postId: string, userId: string, content: string, mediaUrl?: string | null, mediaType?: string | null, linkUrl?: string | null) {
    const post = await this.assertPostExists(postId);
    this.assertOwnership(post.authorId, userId, 'edit');
    this.validateContent(content);

    const updateData: { content: string; mediaUrl?: string | null; mediaType?: string | null; linkUrl?: string | null } = { content: content.trim() };
    updateData.mediaUrl = mediaUrl === null ? null : mediaUrl;
    updateData.mediaType = mediaType === null ? null : mediaType;
    updateData.linkUrl = linkUrl === null ? null : linkUrl;

    return this.prisma.post.update({
      where: { id: postId },
      data: updateData,
      include: POST_INCLUDE,
    });
  }

  async delete(postId: string, userId: string) {
    const post = await this.assertPostExists(postId);
    this.assertOwnership(post.authorId, userId, 'delete');

    await this.prisma.post.delete({ where: { id: postId } });

    return { message: 'Post deleted successfully' };
  }

  async like(postId: string, userId: string) {
    const post = await this.assertPostExists(postId);

    const existingLike = await this.prisma.like.findUnique({
      where: {
        userId_postId: { userId, postId },
      },
    });

    if (existingLike) {
      await this.prisma.like.delete({ where: { id: existingLike.id } });
      return { liked: false };
    }

    await this.prisma.like.create({ data: { userId, postId } });

    if (post.authorId !== userId) {
      const existingNotification = await this.prisma.notification.findFirst({
        where: { type: 'LIKE', userId: post.authorId, actorId: userId, postId },
      });

      if (!existingNotification) {
        this.notificationsService.createLikeNotification(post.authorId, userId, postId);
      }
    }

    return { liked: true };
  }

  async isLiked(postId: string, userId: string) {
    const like = await this.prisma.like.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    return !!like;
  }

  async createReply(postId: string, userId: string, content: string, parentId?: string) {
    const post = await this.assertPostExists(postId);

    if (parentId) {
      const parentReply = await this.prisma.reply.findUnique({ where: { id: parentId } });
      if (!parentReply) {
        throw new NotFoundException('Reply not found');
      }
      if (parentReply.postId !== postId) {
        throw new BadRequestException('Reply does not belong to this post');
      }
    }

    this.validateContent(content, 'Reply');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const repliesCount = await this.prisma.reply.count({
      where: { authorId: userId, createdAt: { gte: today, lt: tomorrow } },
    });

    if (repliesCount >= 10) {
      throw new BadRequestException('Limite de 10 respostas por dia atingido. Tente novamente amanhã.');
    }

    const reply = await this.prisma.reply.create({
      data: {
        content: content.trim(),
        postId,
        authorId: userId,
        ...(parentId && { parentId }),
      },
      include: REPLY_AUTHOR_INCLUDE,
    });

    if (post.authorId !== userId) {
      this.notificationsService.createReplyNotification(post.authorId, userId, postId, reply.id);
    }

    return reply;
  }

  async getReplies(postId: string, cursor?: string, limit = 20) {
    const take = limit + 1;
    const where: { postId: string; parentId: null; createdAt?: { lt: Date } } = {
      postId,
      parentId: null,
    };

    if (cursor) {
      where.createdAt = { lt: await this.getCursorDate(cursor) };
    }

    const replies = await this.prisma.reply.findMany({
      where,
      take,
      orderBy: { createdAt: 'asc' },
      include: {
        author: { select: AUTHOR_SELECT },
        children: {
          orderBy: { createdAt: 'asc' },
          include: { author: { select: AUTHOR_SELECT } },
        },
      },
    });

    const hasMore = replies.length > limit;
    const results = hasMore ? replies.slice(0, limit) : replies;
    const nextCursor = hasMore && results.length > 0
      ? results[results.length - 1].createdAt.toISOString()
      : null;

    return { replies: results, nextCursor, hasMore };
  }

  async updateReply(replyId: string, userId: string, content: string) {
    const reply = await this.prisma.reply.findUnique({ where: { id: replyId } });
    if (!reply) {
      throw new NotFoundException('Reply not found');
    }
    if (reply.authorId !== userId) {
      throw new ForbiddenException('You can only edit your own replies');
    }
    this.validateContent(content, 'Reply');

    return this.prisma.reply.update({
      where: { id: replyId },
      data: { content: content.trim() },
      include: REPLY_AUTHOR_INCLUDE,
    });
  }

  async deleteReply(replyId: string, userId: string) {
    const reply = await this.prisma.reply.findUnique({ where: { id: replyId } });
    if (!reply) {
      throw new NotFoundException('Reply not found');
    }
    if (reply.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own replies');
    }

    await this.prisma.reply.delete({ where: { id: replyId } });

    return { success: true };
  }
}
