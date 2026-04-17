import { Injectable, UnauthorizedException, ConflictException, HttpException, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

// Rate limiting por IP
const loginAttempts = new Map<string, { count: number; lockedUntil: number }>();
const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutos

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  private checkRateLimit(clientIp: string) {
    const record = loginAttempts.get(clientIp);

    if (record) {
      if (record.lockedUntil && Date.now() < record.lockedUntil) {
        const minutesLeft = Math.ceil((record.lockedUntil - Date.now()) / 60000);
        throw new HttpException(
          `Muitas tentativas de login. Tente novamente em ${minutesLeft} minuto(s).`,
          HttpStatus.TOO_MANY_REQUESTS
        );
      }
      if (record.lockedUntil && Date.now() >= record.lockedUntil) {
        loginAttempts.delete(clientIp);
      }
    }
  }

  private recordFailedAttempt(clientIp: string) {
    const record = loginAttempts.get(clientIp) || { count: 0, lockedUntil: 0 };
    record.count += 1;

    if (record.count >= MAX_ATTEMPTS) {
      record.lockedUntil = Date.now() + LOCK_DURATION_MS;
    }

    loginAttempts.set(clientIp, record);
  }

  private clearFailedAttempts(clientIp: string) {
    loginAttempts.delete(clientIp);
  }

  async register(dto: RegisterDto, clientIp: string) {
    this.checkRateLimit(clientIp);
    // Validacao manual - backup caso ValidationPipe nao funcione
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

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
      },
    });

    const token = this.generateToken(user.id, user.username);

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
      },
      token,
    };
  }

  async login(dto: LoginDto, clientIp: string) {
    this.checkRateLimit(clientIp);

    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      this.recordFailedAttempt(clientIp);
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      this.recordFailedAttempt(clientIp);
      throw new UnauthorizedException('Credenciais inválidas');
    }

    this.clearFailedAttempts(clientIp);

    const token = this.generateToken(user.id, user.username);

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
      },
      token,
    };
  }

  private generateToken(userId: string, username: string): string {
    return this.jwtService.sign({ sub: userId, username });
  }
}