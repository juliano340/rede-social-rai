import { Controller, Get, Post, Patch, Param, Query, UseGuards, Body, Req, Headers, UseInterceptors, UploadedFile as UploadedFileDecorator, BadRequestException } from '@nestjs/common';
import { Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { User } from '../auth/decorators/user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UsersService } from './users.service';
import { JwtService } from '@nestjs/jwt';
import { UploadsService, UploadedFile } from '../uploads/uploads.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateAvatarUrlDto } from './dto/update-avatar-url.dto';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

@Controller('users')
export class UsersController {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private uploadsService: UploadsService
  ) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@User() user: AuthenticatedUser) {
    return this.usersService.findById(user.userId);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async updateMe(@User() user: AuthenticatedUser, @Body() data: UpdateUserDto) {
    return this.usersService.update(user.userId, data);
  }

  @Post('me/avatar')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @UseInterceptors(FileInterceptor('file', {
    limits: {
      fileSize: 5 * 1024 * 1024,
    },
  }))
  async uploadAvatar(@User() user: AuthenticatedUser, @UploadedFileDecorator() file: UploadedFile) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Only images are allowed.');
    }

    const avatarPath = await this.uploadsService.processAndSaveAvatar(file, user.userId);

    await this.usersService.updateAvatar(user.userId, avatarPath);

    return { avatar: avatarPath };
  }

  @Patch('me/avatar-url')
  @UseGuards(JwtAuthGuard)
  async updateAvatarUrl(@User() user: AuthenticatedUser, @Body() dto: UpdateAvatarUrlDto) {
    return this.usersService.updateAvatarUrl(user.userId, dto.url);
  }

  @Get('search')
  @Public()
  async search(
    @Query('q') query: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string
  ) {
    return this.usersService.search(query, cursor, limit ? parseInt(limit) : 20);
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
  async getProfile(
    @Param('username') username: string,
    @Req() req: Request,
    @Headers('authorization') authHeader: string
  ) {
    let userId: string | null = null;

    // 1. Tentar extrair do header Authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const payload = this.jwtService.verify(token);
        userId = payload.sub;
      } catch (e) {}
    }

    // 2. Se não achou, tentar extrair do cookie
    if (!userId && req.cookies?.token) {
      try {
        const payload = this.jwtService.verify(req.cookies.token);
        userId = payload.sub;
      } catch (e) {}
    }

    if (userId) {
      return this.usersService.getProfileByUsername(username, userId);
    }
    return this.usersService.findByUsername(username);
  }

  @Post(':id/follow')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async follow(@Param('id') followingId: string, @User() user: AuthenticatedUser) {
    return this.usersService.follow(user.userId, followingId);
  }

  @Get(':id/followers')
  @Public()
  async getFollowers(
    @Param('id') userId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string
  ) {
    return this.usersService.getFollowers(userId, cursor, limit ? parseInt(limit) : 20);
  }

  @Get(':id/following')
  @Public()
  async getFollowing(
    @Param('id') userId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string
  ) {
    return this.usersService.getFollowing(userId, cursor, limit ? parseInt(limit) : 20);
  }
}