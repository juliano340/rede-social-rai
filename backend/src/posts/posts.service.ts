import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Prisma } from '@prisma/client';
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

const FEED_TOP_REPLIES_LIMIT = 3;
const FEED_NESTED_REPLIES_LIMIT = 2;
const REPLIES_CHILDREN_LIMIT = 10;
const REPLIES_GRANDCHILDREN_LIMIT = 5;
const MAX_REPLIES_PER_DAY = 1000;
const MAX_CONTENT_LENGTH = 280;
const CACHE_TTL_MS = 30_000;

type PostWithOptionalLikes = PostWithMeta & {
  likes?: { id: string }[];
};

const FEED_REPLIES_INCLUDE = {
  where: { parentId: null },
  take: FEED_TOP_REPLIES_LIMIT,
  orderBy: { createdAt: 'desc' as const },
  include: {
    author: { select: AUTHOR_SELECT },
    _count: { select: { children: true } },
    children: {
      take: FEED_NESTED_REPLIES_LIMIT,
      orderBy: { createdAt: 'asc' as const },
      include: { author: { select: AUTHOR_SELECT } },
    },
  },
} as const;

interface PostWithMeta {
  id: string;
}

export type PostResponse = Omit<PostWithMeta, 'likes'> & {
  isLiked: boolean;
  [key: string]: unknown;
};

@Injectable()
export class PostsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
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
    if (content.length > MAX_CONTENT_LENGTH) {
      throw new BadRequestException(`${label} content cannot exceed ${MAX_CONTENT_LENGTH} characters`);
    }
  }

  private buildCursorPagination<T extends PostWithMeta>(posts: T[], limit: number) {
    const hasMore = posts.length > limit;
    const results = hasMore ? posts.slice(0, limit) : posts;
    const nextCursor = hasMore && results.length > 0 ? results[results.length - 1].id : null;
    return { posts: results, nextCursor, hasMore };
  }

  private buildFeedInclude(userId?: string): Prisma.PostInclude {
    return {
      author: { select: AUTHOR_SELECT },
      _count: { select: COUNT_SELECT },
      likes: userId ? { where: { userId }, select: { id: true } } : undefined,
      replies: FEED_REPLIES_INCLUDE,
    };
  }

  private mapPostWithLikeStatus<T extends PostWithOptionalLikes>(post: T, userId?: string): Omit<T, 'likes'> & { isLiked: boolean } {
    const { likes, ...rest } = post;
    return {
      ...rest,
      isLiked: userId ? (likes?.length ?? 0) > 0 : false,
    } as Omit<T, 'likes'> & { isLiked: boolean };
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

  private async fetchPaginatedPosts(
    cacheKey: string,
    where: Prisma.PostWhereInput,
    limit: number,
    userId?: string,
  ): Promise<{ posts: PostResponse[]; nextCursor: string | null; hasMore: boolean }> {
    const cached = await this.cacheManager.get<{ posts: PostResponse[]; nextCursor: string | null; hasMore: boolean }>(cacheKey);
    if (cached) return cached;

    const take = limit + 1;
    const posts = await this.prisma.post.findMany({
      where,
      take,
      orderBy: { createdAt: 'desc' },
      include: this.buildFeedInclude(userId),
    });

    const result = this.buildCursorPagination(
      posts.map(post => this.mapPostWithLikeStatus(post as unknown as PostWithOptionalLikes, userId)),
      limit,
    );

    await this.cacheManager.set(cacheKey, result, CACHE_TTL_MS);
    return result;
  }

  async findAll(cursor?: string, limit = 20, userId?: string): Promise<{ posts: PostResponse[]; nextCursor: string | null; hasMore: boolean }> {
    const cacheKey = `posts:all:${cursor || 'initial'}:${limit}:${userId || 'anon'}`;
    const where = cursor ? { createdAt: { lt: await this.getCursorDate(cursor) } } : {};
    return this.fetchPaginatedPosts(cacheKey, where, limit, userId);
  }

  async findFollowing(userId: string, cursor?: string, limit = 20): Promise<{ posts: PostResponse[]; nextCursor: string | null; hasMore: boolean }> {
    const following = await this.prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const followingIds = following.map(f => f.followingId);
    if (followingIds.length === 0) {
      return { posts: [], nextCursor: null, hasMore: false };
    }

    const cacheKey = `posts:following:${userId}:${cursor || 'initial'}:${limit}`;
    const where: Prisma.PostWhereInput = { authorId: { in: followingIds } };
    if (cursor) {
      where.createdAt = { lt: await this.getCursorDate(cursor) };
    }

    return this.fetchPaginatedPosts(cacheKey, where, limit, userId);
  }

  async findByUser(userId: string, cursor?: string, limit = 20, requesterId?: string): Promise<{ posts: PostResponse[]; nextCursor: string | null; hasMore: boolean }> {
    const cacheKey = `posts:user:${userId}:${cursor || 'initial'}:${limit}:${requesterId || 'anon'}`;
    const where: Prisma.PostWhereInput = { authorId: userId };
    if (cursor) {
      where.createdAt = { lt: await this.getCursorDate(cursor) };
    }

    return this.fetchPaginatedPosts(cacheKey, where, limit, requesterId);
  }

  async findById(postId: string, requesterId?: string): Promise<PostResponse> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: this.buildFeedInclude(requesterId),
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return this.mapPostWithLikeStatus(post as unknown as PostWithOptionalLikes, requesterId);
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

    if (repliesCount >= MAX_REPLIES_PER_DAY) {
      throw new BadRequestException(`Limite de ${MAX_REPLIES_PER_DAY} respostas por dia atingido. Tente novamente amanhã.`);
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

  private parseCursorDate(cursor: string): Date | null {
    const date = new Date(cursor);
    return isNaN(date.getTime()) ? null : date;
  }

  async getReplies(postId: string, cursor?: string, limit = 20) {
    const take = limit + 1;
    const where: Prisma.ReplyWhereInput = {
      postId,
      parentId: null,
    };

    if (cursor) {
      const cursorDate = this.parseCursorDate(cursor);
      if (cursorDate) {
        where.createdAt = { gt: cursorDate };
      }
    }

    const replies = await this.prisma.reply.findMany({
      where,
      take,
      orderBy: { createdAt: 'asc' },
      include: {
        author: { select: AUTHOR_SELECT },
        _count: { select: { children: true } },
        children: {
          take: REPLIES_CHILDREN_LIMIT,
          orderBy: { createdAt: 'asc' },
          include: {
            author: { select: AUTHOR_SELECT },
            children: {
              take: REPLIES_GRANDCHILDREN_LIMIT,
              orderBy: { createdAt: 'asc' },
              include: { author: { select: AUTHOR_SELECT } },
            },
          },
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
