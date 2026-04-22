import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-auth.guard';
import { User } from '../auth/decorators/user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { PostsService } from './posts.service';
import { CreatePostDto, UpdatePostDto, CreateReplyDto, UpdateReplyDto } from './dto';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

@ApiTags('Posts')
@ApiBearerAuth()
@Controller('posts')
export class PostsController {
  constructor(private postsService: PostsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar um novo post' })
  @ApiResponse({ status: 201, description: 'Post criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 2, ttl: 60000 } })
  async create(@User() user: AuthenticatedUser, @Body() dto: CreatePostDto) {
    return this.postsService.create(user.userId, dto.content, dto.mediaUrl, dto.mediaType, dto.linkUrl);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os posts' })
  @ApiQuery({ name: 'cursor', required: false, description: 'Cursor para paginação' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limite de posts (max 50)' })
  @ApiResponse({ status: 200, description: 'Lista de posts' })
  @UseGuards(OptionalJwtAuthGuard)
  async findAll(
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
    @Req() req?: Request,
  ) {
    const parsedLimit = Math.min(parseInt(limit || '20'), 50) || 20;
    const userId = this.getUserIdFromRequest(req);
    return this.postsService.findAll(cursor, parsedLimit, userId);
  }

  @Get('following')
  @ApiOperation({ summary: 'Listar posts dos usuários seguidos' })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'Lista de posts' })
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
  @ApiOperation({ summary: 'Listar posts de um usuário específico' })
  @ApiParam({ name: 'userId', description: 'ID do usuário' })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'Lista de posts' })
  @UseGuards(OptionalJwtAuthGuard)
  async findByUser(
    @Param('userId') userId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
    @Req() req?: Request,
  ) {
    const parsedLimit = Math.min(parseInt(limit || '20'), 50) || 20;
    const requesterId = this.getUserIdFromRequest(req);
    return this.postsService.findByUser(userId, cursor, parsedLimit, requesterId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar um post por ID' })
  @ApiParam({ name: 'id', description: 'ID do post' })
  @ApiResponse({ status: 200, description: 'Post encontrado' })
  @ApiResponse({ status: 404, description: 'Post não encontrado' })
  @UseGuards(OptionalJwtAuthGuard)
  async findOne(@Param('id') id: string, @Req() req?: Request) {
    const userId = this.getUserIdFromRequest(req);
    return this.postsService.findById(id, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deletar um post' })
  @ApiParam({ name: 'id', description: 'ID do post' })
  @ApiResponse({ status: 200, description: 'Post deletado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  @ApiResponse({ status: 404, description: 'Post não encontrado' })
  @UseGuards(JwtAuthGuard)
  async delete(@Param('id') id: string, @User() user: AuthenticatedUser) {
    return this.postsService.delete(id, user.userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar um post' })
  @ApiParam({ name: 'id', description: 'ID do post' })
  @ApiResponse({ status: 200, description: 'Post atualizado' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @User() user: AuthenticatedUser,
    @Body() dto: UpdatePostDto,
  ) {
    return this.postsService.update(id, user.userId, dto.content, dto.mediaUrl, dto.mediaType, dto.linkUrl);
  }

  @Post(':id/like')
  @ApiOperation({ summary: 'Curtir/descurtir um post' })
  @ApiParam({ name: 'id', description: 'ID do post' })
  @ApiResponse({ status: 200, description: 'Like toggled' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async like(@Param('id') id: string, @User() user: AuthenticatedUser) {
    return this.postsService.like(id, user.userId);
  }

  @Post(':id/reply')
  @ApiOperation({ summary: 'Criar uma resposta em um post' })
  @ApiParam({ name: 'id', description: 'ID do post' })
  @ApiResponse({ status: 201, description: 'Resposta criada' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
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
  @ApiOperation({ summary: 'Listar respostas de um post' })
  @ApiParam({ name: 'id', description: 'ID do post' })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'Lista de respostas' })
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
  @ApiOperation({ summary: 'Atualizar uma resposta' })
  @ApiParam({ name: 'id', description: 'ID do post' })
  @ApiParam({ name: 'replyId', description: 'ID da resposta' })
  @ApiResponse({ status: 200, description: 'Resposta atualizada' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
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
  @ApiOperation({ summary: 'Deletar uma resposta' })
  @ApiParam({ name: 'id', description: 'ID do post' })
  @ApiParam({ name: 'replyId', description: 'ID da resposta' })
  @ApiResponse({ status: 200, description: 'Resposta deletada' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  @UseGuards(JwtAuthGuard)
  async deleteReply(
    @Param('id') postId: string,
    @Param('replyId') replyId: string,
    @User() user: AuthenticatedUser,
  ) {
    return this.postsService.deleteReply(replyId, user.userId);
  }

  private getUserIdFromRequest(req?: Request): string | undefined {
    return (req as any)?.user?.userId;
  }
}
