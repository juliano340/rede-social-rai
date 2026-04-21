import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { User } from '../auth/decorators/user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { PostsService } from './posts.service';
import { CreatePostDto, UpdatePostDto, CreateReplyDto, UpdateReplyDto } from './dto';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

@Controller('posts')
export class PostsController {
  constructor(private postsService: PostsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 2, ttl: 60000 } })
  async create(@User() user: AuthenticatedUser, @Body() dto: CreatePostDto) {
    return this.postsService.create(user.userId, dto.content, dto.mediaUrl, dto.mediaType, dto.linkUrl);
  }

  @Get()
  @Public()
  async findAll(
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
    @Req() req?: Request,
  ) {
    const parsedLimit = Math.min(parseInt(limit || '20'), 50) || 20;
    const userId = (req as any)?.user?.userId;
    return this.postsService.findAll(cursor, parsedLimit, userId);
  }

  @Get('following')
  @UseGuards(JwtAuthGuard)
  async findFollowing(
    @User() user: AuthenticatedUser,
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
  async delete(@Param('id') id: string, @User() user: AuthenticatedUser) {
    return this.postsService.delete(id, user.userId);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @User() user: AuthenticatedUser,
    @Body() dto: UpdatePostDto,
  ) {
    return this.postsService.update(id, user.userId, dto.content, dto.mediaUrl, dto.mediaType, dto.linkUrl);
  }

  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async like(@Param('id') id: string, @User() user: AuthenticatedUser) {
    return this.postsService.like(id, user.userId);
  }

  @Post(':id/reply')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 2, ttl: 60000 } })
  async createReply(
    @Param('id') postId: string,
    @User() user: AuthenticatedUser,
    @Body() dto: CreateReplyDto,
  ) {
    return this.postsService.createReply(postId, user.userId, dto.content, dto.parentId);
  }

  @Get(':id/replies')
  @Public()
  async getReplies(
    @Param('id') postId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = Math.min(parseInt(limit || '20'), 50) || 20;
    return this.postsService.getReplies(postId, cursor, parsedLimit);
  }

  @Put(':id/reply/:replyId')
  @UseGuards(JwtAuthGuard)
  async updateReply(
    @Param('id') postId: string,
    @Param('replyId') replyId: string,
    @User() user: AuthenticatedUser,
    @Body() dto: UpdateReplyDto,
  ) {
    return this.postsService.updateReply(replyId, user.userId, dto.content);
  }

  @Delete(':id/reply/:replyId')
  @UseGuards(JwtAuthGuard)
  async deleteReply(
    @Param('id') postId: string,
    @Param('replyId') replyId: string,
    @User() user: AuthenticatedUser,
  ) {
    return this.postsService.deleteReply(replyId, user.userId);
  }
}
