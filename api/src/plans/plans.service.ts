import { Injectable } from "@nestjs/common";
import { getTenorRules } from "./tenor-rules";

export interface InstallmentPlan {
  months: number;
  monthlyPayment: number;
  totalCost: number;
  feeAmount: number;
}

@Injectable()
export class PlansService {
  calculate(amount: number): InstallmentPlan[] {
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new RangeError("amount must be a positive number");
    }

    return getTenorRules().map(({ months, feeRate }) => {
      const feeAmount = round2(amount * feeRate);
      const totalCost = round2(amount + feeAmount);
      const monthlyPayment = round2(totalCost / months);
      return { months, monthlyPayment, totalCost, feeAmount };
    });
  }
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
