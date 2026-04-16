import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

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

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    
    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
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
          _count: {
            select: {
              likes: true,
              replies: true,
            },
          },
        },
      }),
      this.prisma.post.count(),
    ]);

    return {
      posts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByUser(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    
    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where: { authorId: userId },
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
          _count: {
            select: {
              likes: true,
              replies: true,
            },
          },
        },
      }),
      this.prisma.post.count({ where: { authorId: userId } }),
    ]);

    return {
      posts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
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

    return this.prisma.reply.create({
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