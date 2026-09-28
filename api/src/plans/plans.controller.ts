import { BadRequestException, Controller, Get, Query } from "@nestjs/common";
import { PlansService } from "./plans.service";

@Controller("plans")
export class PlansController {
  constructor(private readonly plans: PlansService) {}

  @Get()
  get(@Query("amount") amount: string) {
    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      throw new BadRequestException("query param `amount` must be a positive number");
    }
    return { amount: parsed, plans: this.plans.calculate(parsed) };
  }
}
