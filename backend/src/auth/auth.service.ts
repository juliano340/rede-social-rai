import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenService } from './refresh-token.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private refreshTokenService: RefreshTokenService,
  ) {}

  private setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    res.cookie('token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
      path: '/',
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });
  }

  async register(dto: RegisterDto, clientIp: string, res: Response) {
    if (!dto.name || dto.name.trim().length === 0) {
      throw new ConflictException('Nome é obrigatório');
    }
    if (dto.name.length > 25) {
      throw new ConflictException('Nome deve ter no máximo 25 caracteres');
    }
    if (!dto.username || dto.username.trim().length === 0) {
      throw new ConflictException('Username é obrigatório');
    }
    if (dto.username.length < 3 || dto.username.length > 20) {
      throw new ConflictException('Username deve ter entre 3 e 20 caracteres');
    }
    if (!/^[a-zA-Z0-9_]+$/.test(dto.username)) {
      throw new ConflictException('Username só pode ter letras, números e underscore');
    }
    if (!dto.email || dto.email.trim().length === 0) {
      throw new ConflictException('Email é obrigatório');
    }
    if (!dto.password || dto.password.length < 6) {
      throw new ConflictException('Senha deve ter no mínimo 6 caracteres');
    }
    if (dto.password.length > 50) {
      throw new ConflictException('Senha deve ter no máximo 50 caracteres');
    }

    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email }, { username: dto.username }],
      },
    });

    if (existingUser) {
      throw new ConflictException('Email ou username já existe');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
      },
    });

    const accessToken = this.generateAccessToken(user.id, user.username);
    const refreshToken = await this.refreshTokenService.generateToken(user.id);

    this.setAuthCookies(res, accessToken, refreshToken);

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
    };
  }

  async login(dto: LoginDto, clientIp: string, res: Response) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const accessToken = this.generateAccessToken(user.id, user.username);
    const refreshToken = await this.refreshTokenService.generateToken(user.id);

    this.setAuthCookies(res, accessToken, refreshToken);

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
    };
  }

  async refresh(refreshToken: string, res: Response) {
    const tokenData = await this.refreshTokenService.validateToken(refreshToken);
    
    if (!tokenData) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: tokenData.userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    await this.refreshTokenService.revokeToken(refreshToken);

    const accessToken = this.generateAccessToken(user.id, user.username);
    const newRefreshToken = await this.refreshTokenService.generateToken(user.id);

    this.setAuthCookies(res, accessToken, newRefreshToken);

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
    };
  }

  async logout(refreshToken: string | undefined, res: Response) {
    if (refreshToken) {
      await this.refreshTokenService.revokeToken(refreshToken);
    }

    res.clearCookie('token', { path: '/' });
    res.clearCookie('refreshToken', { path: '/' });

    return { message: 'Logged out successfully' };
  }

  private generateAccessToken(userId: string, username: string): string {
    return this.jwtService.sign({ sub: userId, username });
  }
}