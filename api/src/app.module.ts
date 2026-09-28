import { Module } from "@nestjs/common";
import { PlansModule } from "./plans/plans.module";
import { EligibilityModule } from "./eligibility/eligibility.module";
import { AppController } from "./app.controller";

@Module({
  imports: [PlansModule, EligibilityModule],
  controllers: [AppController],
})
export class AppModule {}
