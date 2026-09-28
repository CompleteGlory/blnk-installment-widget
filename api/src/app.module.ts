import { Module } from "@nestjs/common";
import { PlansModule } from "./plans/plans.module";
import { EligibilityModule } from "./eligibility/eligibility.module";

@Module({
  imports: [PlansModule, EligibilityModule],
})
export class AppModule {}
