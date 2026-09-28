import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { EligibilityService } from "./eligibility.service";

interface CheckEligibilityDto {
  merchantId: string;
  nationalId: string;
  months: number;
  amount: number;
}

@Controller()
export class EligibilityController {
  constructor(private readonly eligibility: EligibilityService) {}

  @Post("eligibility")
  check(@Body() body: CheckEligibilityDto) {
    return this.eligibility.check(body.merchantId, body.nationalId, body.months, body.amount);
  }

  @Get("applications/:id")
  poll(@Param("id") id: string) {
    return this.eligibility.poll(id);
  }
}
