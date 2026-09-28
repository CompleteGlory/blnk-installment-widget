import { Module } from "@nestjs/common";
import { PlansModule } from "../plans/plans.module";
import { EligibilityController } from "./eligibility.controller";
import { EligibilityService } from "./eligibility.service";
import { ApplicationsStore } from "./applications.store";

@Module({
  imports: [PlansModule],
  controllers: [EligibilityController],
  providers: [EligibilityService, ApplicationsStore],
})
export class EligibilityModule {}
