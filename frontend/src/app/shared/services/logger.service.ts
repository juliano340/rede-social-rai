import { Injectable, inject } from '@angular/core';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

@Injectable({ providedIn: 'root' })
export class LoggerService {
  private readonly ENABLE_LOGGING = true;
  private readonly ENABLE_ERROR_LOGGING = true;

  debug(message: string, context?: string, data?: unknown): void {
    if (this.ENABLE_LOGGING) {
      this.log('debug', message, context, data);
    }
  }

  info(message: string, context?: string, data?: unknown): void {
    if (this.ENABLE_LOGGING) {
      this.log('info', message, context, data);
    }
  }

  warn(message: string, context?: string, data?: unknown): void {
    this.log('warn', message, context, data);
  }

  error(message: string, context?: string, data?: unknown): void {
    if (this.ENABLE_ERROR_LOGGING) {
      this.log('error', message, context, data);
    }
  }

  private log(level: LogLevel, message: string, context?: string, data?: unknown): void {
    const timestamp = new Date().toISOString();
    const prefix = context ? `[${timestamp}] [${level.toUpperCase()}] [${context}]` : `[${timestamp}] [${level.toUpperCase()}]`;
    const dataStr = data ? ` ${JSON.stringify(data)}` : '';

    const fullMessage = `${prefix} ${message}${dataStr}`;

    switch (level) {
      case 'error':
        console.error(fullMessage);
        break;
      case 'warn':
        console.warn(fullMessage);
        break;
      case 'debug':
        console.debug(fullMessage);
        break;
      default:
        console.log(fullMessage);
    }
  }

  logApiRequest(endpoint: string, method: string, body?: unknown): void {
    this.debug(`API: ${method} ${endpoint}`, 'HTTP', body);
  }

  logAuthEvent(event: 'login' | 'logout' | 'register', success: boolean): void {
    const level = success ? 'info' : 'error';
    const message = `Auth ${event}: ${success ? 'success' : 'failed'}`;
    (this as Record<string, (...args: unknown[]) => void>)[level](message, 'AUTH');
  }
}