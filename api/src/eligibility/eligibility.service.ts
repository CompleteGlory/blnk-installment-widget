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

  check(merchantId: string, nationalId: string, months: number, amount: number): EligibilityResult {
    if (!isValidNationalId(nationalId)) {
      throw new BadRequestException("nationalId must be 14 digits");
    }

    const id = randomUUID();
    const finalStatus = decide(nationalId);

    this.applications.save({
      id,
      merchantId,
      nationalId,
      months,
      amount,
      finalStatus,
      resolveAt: Date.now() + RESOLVE_AFTER_MS,
      createdAt: Date.now(),
    });

    // Every application starts pending, same as a real underwriting call —
    // the widget polls /applications/:id until this resolves.
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

/** 14-digit Egyptian National ID format check (structure only, not a real registry lookup). */
function isValidNationalId(nationalId: string): boolean {
  return /^\d{14}$/.test(nationalId);
}

/**
 * Deterministic mock decision so the same National ID gets the same answer
 * on repeat lookups, instead of a coin flip each time. Not a real credit
 * decision — a checksum standing in for one.
 */
function decide(nationalId: string): "approved" | "declined" {
  const digitSum = nationalId
    .split("")
    .reduce((sum, digit) => sum + Number(digit), 0);
  return digitSum % 10 < 8 ? "approved" : "declined";
}
