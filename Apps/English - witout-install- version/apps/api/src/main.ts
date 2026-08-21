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
  const origins = (
    process.env.CORS_ORIGINS ??
    "http://127.0.0.1:3202,http://localhost:3202,http://127.0.0.1:3201,http://localhost:3201,http://127.0.0.1:3000,http://localhost:3000"
  )
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: [
      ...origins,
      // Any loopback origin, on any port. This API binds to 127.0.0.1 and
      // exists only as a local grading helper, so a loopback Origin can
      // only come from a dev server the user is running themselves (the
      // repo is checked out in several copies on different ports). A
      // malicious public page cannot forge one: its Origin would be its
      // own https:// host, which still fails this test.
      /^http:\/\/(127\.0\.0\.1|localhost):\d+$/,
      // Scoped to this project's own Vercel deployments (production +
      // preview URLs, which Vercel names "<project>-<hash-or-branch>.
      // vercel.app") -- the previous /^https:\/\/[a-z0-9-]+\.vercel\.app$/
      // trusted literally any Vercel-hosted site, letting any other
      // project's page read this API's responses cross-origin.
      /^https:\/\/english-grammar-automaticity-pwa(-[a-z0-9-]+)?\.vercel\.app$/i,
    ],
    methods: ["GET", "POST", "OPTIONS"],
  });
  app.setGlobalPrefix("api");
  app.enableShutdownHooks();

  const port = Number(process.env.PORT ?? 4201);
  // Loopback-only: this runs as a local grading helper on the user's own
  // machine (bun dist/main.js via the desktop installer), not a
  // containerized/cloud deployment that would need 0.0.0.0 to be routable
  // -- binding all interfaces needlessly exposed it to every other device
  // on the same network.
  await app.listen(port, "127.0.0.1");
}

void bootstrap();
