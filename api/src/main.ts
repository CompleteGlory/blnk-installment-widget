import "reflect-metadata";
import { join } from "node:path";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { cors: true });

  // Serves the merchant demo page (public/index.html) and the built widget
  // bundle (public/widget.js) at the API's own root, so the Railway URL is a
  // working demo, not a bare JSON endpoint. The demo's <blnk-installment-widget>
  // tag points data-api-base at "" (same-origin), so it calls this API directly.
  app.useStaticAssets(join(__dirname, "..", "public"));

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`blnk-installment-widget demo API listening on :${port}`);
}

bootstrap();
