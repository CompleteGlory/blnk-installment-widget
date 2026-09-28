import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { PlansService } from "../plans/plans.service";
import { ApplicationsStore } from "./applications.store";

export interface EligibilityResult {
  applicationId: string;
  status: "approved" | "declined" | "pending";
  plan?: ReturnType<PlansService["calculate"]>[number];
}

const RESOLVE_AFTER_MS = 3000;

@Injectable()
export class EligibilityService {
  constructor(
    private readonly applications: ApplicationsStore,
    private readonly plans: PlansService
  ) {}

  check(merchantId: string, months: number, amount: number): EligibilityResult {
    if (!merchantId) throw new BadRequestException("merchantId is required");
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException("amount must be a positive number");
    }
    if (!Number.isFinite(months) || months <= 0) {
      throw new BadRequestException("months must be a positive number");
    }

    const id = randomUUID();
    const finalStatus = decide(merchantId, amount, months);

    this.applications.save({
      id,
      merchantId,
      months,
      amount,
      finalStatus,
      resolveAt: Date.now() + RESOLVE_AFTER_MS,
      createdAt: Date.now(),
    });

    // Every application starts pending, same as a real underwriting call —
    // the hosted decision page polls /applications/:id until this resolves.
    return { applicationId: id, status: "pending" };
  }

  poll(id: string): EligibilityResult {
    const record = this.applications.findById(id);
    if (!record) throw new NotFoundException("application not found");

    if (Date.now() < record.resolveAt) {
      return { applicationId: id, status: "pending" };
    }

    if (record.finalStatus === "declined") {
      return { applicationId: id, status: "declined" };
    }

    const plan = this.plans
      .calculate(record.amount)
      .find((p) => p.months === record.months);

    return { applicationId: id, status: "approved", plan };
  }
}

/**
 * Deterministic mock decision so the same request gets the same answer on
 * repeat lookups, instead of a coin flip each time. Not a real credit
 * decision — a checksum standing in for one, keyed on merchant + amount +
 * tenor now that there's no National ID in the flow.
 */
function decide(merchantId: string, amount: number, months: number): "approved" | "declined" {
  const key = `${merchantId}:${amount}:${months}`;
  const digitSum = key
    .split("")
    .reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return digitSum % 10 < 8 ? "approved" : "declined";
}
