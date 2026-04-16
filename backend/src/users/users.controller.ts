import { Controller, Get, Post, Patch, Param, Query, UseGuards, Body, Req, Headers, UseInterceptors, UploadedFile } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { User } from '../auth/decorators/user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UsersService } from './users.service';
import { JwtService } from '@nestjs/jwt';
import { UploadsService } from '../uploads/uploads.service';
import { FileInterceptor } from '@nestjs/platform-express';

interface UploadedFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
}

@Controller('users')
export class UsersController {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private uploadsService: UploadsService
  ) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@User() user: any) {
    return this.usersService.findById(user.userId);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async updateMe(@User() user: any, @Body() data: any) {
    return this.usersService.update(user.userId, data);
  }

  @Post('me/avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(@User() user: any, @UploadedFile() file: UploadedFile) {
    if (!file) {
      return { error: 'No file uploaded' };
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      return { error: 'Invalid file type. Only images are allowed.' };
    }
    
    // Process and save avatar
    const avatarPath = await this.uploadsService.processAndSaveAvatar(file, user.userId);
    
    // Update user avatar in database
    await this.usersService.updateAvatar(user.userId, avatarPath);
    
    return { avatar: avatarPath };
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
  async getProfile(
    @Param('username') username: string,
    @Headers('authorization') authHeader: string
  ) {
    let userId: string | null = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const payload = this.jwtService.verify(token);
        userId = payload.sub;
      } catch (e) {
        // token inválido, permanece null
      }
    }
    
    if (userId) {
      return this.usersService.getProfileByUsername(username, userId);
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