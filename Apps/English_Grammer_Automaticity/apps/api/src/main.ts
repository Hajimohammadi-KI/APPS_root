import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true }),
  );
  const origins = (process.env.CORS_ORIGINS ?? "http://localhost:3201")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: [
      ...origins,
      /^https:\/\/[a-z0-9-]+\.vercel\.app$/i,
    ],
    methods: ["GET", "POST", "OPTIONS"],
  });
  app.setGlobalPrefix("api");
  app.enableShutdownHooks();

  const port = Number(process.env.PORT ?? 4201);
  await app.listen(port, "0.0.0.0");
}

void bootstrap();
