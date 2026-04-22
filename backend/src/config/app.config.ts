import { registerAs } from '@nestjs/config';
import * as Joi from 'joi';

export const appConfigValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3000),
  DATABASE_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().required().min(10),
  JWT_REFRESH_SECRET: Joi.string().required().min(10),
  CORS_ORIGIN: Joi.string().default('http://localhost:4200'),
  REDIS_URL: Joi.string().optional(),
});

export const appConfig = registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:4200',
}));
