import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { User } from '../auth/decorators/user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@User() user: any) {
    return this.usersService.findById(user.userId);
  }

  @Get('search')
  @Public()
  async search(
    @Query('q') query: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    return this.usersService.search(query, page ? parseInt(page) : 1, limit ? parseInt(limit) : 20);
  }

  @Get('suggested')
  @Public()
  async getSuggested(
    @Query('limit') limit?: string
  ) {
    return this.usersService.getSuggested(limit ? parseInt(limit) : 10);
  }

  @Get(':username')
  @Public()
  async getProfile(@Param('username') username: string, @User() user?: any) {
    if (user) {
      return this.usersService.getProfileByUsername(username, user.userId);
    }
    return this.usersService.findByUsername(username);
  }

  @Post(':id/follow')
  @UseGuards(JwtAuthGuard)
  async follow(@Param('id') followingId: string, @User() user: any) {
    return this.usersService.follow(user.userId, followingId);
  }

  @Get(':id/followers')
  @Public()
  async getFollowers(
    @Param('id') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    return this.usersService.getFollowers(userId, page ? parseInt(page) : 1, limit ? parseInt(limit) : 20);
  }

  @Get(':id/following')
  @Public()
  async getFollowing(
    @Param('id') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    return this.usersService.getFollowing(userId, page ? parseInt(page) : 1, limit ? parseInt(limit) : 20);
  }
}