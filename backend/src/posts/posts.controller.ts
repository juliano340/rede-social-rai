import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { User } from '../auth/decorators/user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { PostsService } from './posts.service';

@Controller('posts')
export class PostsController {
  constructor(private postsService: PostsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@User() user: any, @Body('content') content: string) {
    return this.postsService.create(user.userId, content);
  }

  @Get()
  @Public()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.postsService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get('following')
  @UseGuards(JwtAuthGuard)
  async findFollowing(
    @User() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.postsService.findFollowing(
      user.userId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get('user/:userId')
  @Public()
  async findByUser(
    @Param('userId') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.postsService.findByUser(
      userId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
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

  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
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