import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { User } from '../auth/decorators/user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { PostsService } from './posts.service';

@Controller('posts')
export class PostsController {
  constructor(private postsService: PostsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 2, ttl: 60000 } })
  async create(
    @User() user: any,
    @Body() body: { 
      content: string; 
      mediaUrl?: string; 
      mediaType?: string;
      linkUrl?: string;
    }
  ) {
    const { content, mediaUrl, mediaType, linkUrl } = body;
    
    if (mediaUrl && !mediaType) {
      throw new Error('Tipo de mídia é obrigatório quando URL é fornecida');
    }
    if (mediaType && !mediaUrl) {
      throw new Error('URL da mídia é obrigatória quando tipo é fornecido');
    }
    if (mediaType && !['image', 'youtube'].includes(mediaType)) {
      throw new Error('Tipo de mídia deve ser "image" ou "youtube"');
    }
    if (mediaUrl && mediaUrl.length > 500) {
      throw new Error('URL da mídia deve ter no máximo 500 caracteres');
    }
    
    return this.postsService.create(user.userId, content, mediaUrl, mediaType, linkUrl);
  }

  @Get()
  @Public()
  async findAll(
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = Math.min(parseInt(limit || '20'), 50) || 20;
    return this.postsService.findAll(cursor, parsedLimit);
  }

  @Get('following')
  @UseGuards(JwtAuthGuard)
  async findFollowing(
    @User() user: any,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = Math.min(parseInt(limit || '20'), 50) || 20;
    return this.postsService.findFollowing(user.userId, cursor, parsedLimit);
  }

  @Get('user/:userId')
  @Public()
  async findByUser(
    @Param('userId') userId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = Math.min(parseInt(limit || '20'), 50) || 20;
    return this.postsService.findByUser(userId, cursor, parsedLimit);
  }

  @Get(':id')
  @Public()
  async findOne(@Param('id') id: string) {
    return this.postsService.findById(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@Param('id') id: string, @User() user: any) {
    return this.postsService.delete(id, user.userId);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @User() user: any,
    @Body() body: { 
      content: string; 
      mediaUrl?: string | null; 
      mediaType?: string | null;
      linkUrl?: string | null;
    },
  ) {
    const { content, mediaUrl, mediaType, linkUrl } = body;
    
    if (mediaUrl && mediaUrl.length > 500) {
      throw new Error('URL da mídia deve ter no máximo 500 caracteres');
    }
    if (mediaType && !['image', 'youtube', null].includes(mediaType)) {
      throw new Error('Tipo de mídia deve ser "image" ou "youtube"');
    }
    
    return this.postsService.update(id, user.userId, content, mediaUrl, mediaType, linkUrl);
  }

  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async like(@Param('id') id: string, @User() user: any) {
    return this.postsService.like(id, user.userId);
  }

  @Get(':id/liked')
  @UseGuards(JwtAuthGuard)
  async isLiked(@Param('id') id: string, @User() user: any) {
    return this.postsService.isLiked(id, user.userId);
  }

  @Post(':id/reply')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 2, ttl: 60000 } })
  async createReply(
    @Param('id') postId: string,
    @User() user: any,
    @Body() body: { content: string; parentId?: string },
  ) {
    return this.postsService.createReply(postId, user.userId, body.content, body.parentId);
  }

  @Get(':id/replies')
  @Public()
  async getReplies(
    @Param('id') postId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.postsService.getReplies(
      postId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Put(':id/reply/:replyId')
  @UseGuards(JwtAuthGuard)
  async updateReply(
    @Param('id') postId: string,
    @Param('replyId') replyId: string,
    @User() user: any,
    @Body('content') content: string,
  ) {
    return this.postsService.updateReply(replyId, user.userId, content);
  }

  @Delete(':id/reply/:replyId')
  @UseGuards(JwtAuthGuard)
  async deleteReply(
    @Param('id') postId: string,
    @Param('replyId') replyId: string,
    @User() user: any,
  ) {
    return this.postsService.deleteReply(replyId, user.userId);
  }
}