import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, type NestFastifyApplication } from "@nestjs/platform-fastify";
import { AppModule } from "./app.module.js";

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter({ logger: true }));
  const port = Number(process.env.API_PORT || 4313);
  const webOrigin = process.env.WEB_ORIGIN || "http://127.0.0.1:4312";

  app.setGlobalPrefix("v1");
  app.enableCors({ origin: [webOrigin, "http://localhost:4312"], credentials: true });
  app.enableShutdownHooks();

  await app.listen(port, "127.0.0.1");
}

void bootstrap();
