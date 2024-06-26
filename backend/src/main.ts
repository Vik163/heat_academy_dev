import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { readFileSync } from 'fs';
import cookieParser = require('cookie-parser');
import session = require('express-session');
import { doubleCsrfProtection } from '../csrf.config';
import * as passport from 'passport';
import { AppModule } from './app.module';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const MongoStore = require('connect-mongo');

// https сертификаты
const httpsOptions = {
  key: readFileSync('./security/localhost+3-key.pem'),
  cert: readFileSync('./security/localhost+3.pem'),
};
const option = [
  'https://heat-academy-dev-frontend.vercel.app',
  'https://127.0.0.1:3000',
  'https://localhost',
];

async function bootstrap() {
  // c https
  const app = await NestFactory.create(AppModule, {
    httpsOptions,
  });

  app.enableCors({
    origin: option,
    methods: 'HEAD,PUT,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.use(cookieParser());

  app.use(
    session({
      store: MongoStore.create({
        mongoUrl: process.env.DB_MONGO,
        // 30 дней
        ttl: 30 * 24 * 60 * 60,
      }),
      name: process.env.SESSION_NAME,
      secret: process.env.SESSION_SECRET_KEY || 'this is a secret msg',
      // указывает, нужно ли пересохранять сессию в хранилище, если она не изменилась (по умолчанию false);
      resave: false,
      // если true, то в хранилище будут попадать пустые сессии;
      saveUninitialized: false,
      cookie: {
        secure: true,
        signed: true,
        sameSite: 'strict',
        // 30 дней
        maxAge: 60 * 60 * 24 * 1000 * 30,
      },
    }),
  );

  app.useGlobalPipes(new ValidationPipe());

  app.use(passport.initialize());
  app.use(doubleCsrfProtection);

  await app.listen(8000);
  console.log('server listen port 8000');
}
bootstrap();
