import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: false,
  });
  const origins = (
    process.env.WEB_ORIGINS ?? 'http://127.0.0.1:3210,http://localhost:3210'
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.setGlobalPrefix('api/v1');
  app.enableCors({
    origin: [
      ...origins,
      // Any loopback origin, on any port -- the repo is checked out in
      // several copies served on different local ports. Safe because a
      // malicious public page's Origin is its own https:// host, which
      // still fails this test; only locally-run servers produce loopback
      // origins.
      /^http:\/\/(127\.0\.0\.1|localhost):\d+$/,
    ],
    credentials: true,
  });
  app.enableShutdownHooks();

  const port = Number(process.env.API_PORT ?? 4210);
  await app.listen(port, '0.0.0.0');
}

void bootstrap();
