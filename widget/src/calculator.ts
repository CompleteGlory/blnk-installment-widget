/**
 * Installment math for the widget's instant preview.
 *
 * This mirrors the demo API's pricing table so the widget can show a plan
 * immediately (no network round trip) before confirming eligibility.
 * The API is the source of truth — this is a preview, not the offer.
 */

export interface TenorOption {
  months: number;
  /** Total cost markup over the purchase amount, e.g. 0.06 = 6% */
  feeRate: number;
}

export interface InstallmentPlan {
  months: number;
  monthlyPayment: number;
  totalCost: number;
  feeAmount: number;
}

/** Default tenor/fee table. The API's `/plans` endpoint may override this. */
export const DEFAULT_TENORS: TenorOption[] = [
  { months: 1, feeRate: 0 },
  { months: 2, feeRate: 0 },
  { months: 4, feeRate: 0.03 },
  { months: 6, feeRate: 0.05 },
];

export function calculatePlans(
  amount: number,
  tenors: TenorOption[] = DEFAULT_TENORS
): InstallmentPlan[] {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new RangeError("amount must be a positive number");
  }

  return tenors.map(({ months, feeRate }) => {
    const feeAmount = round2(amount * feeRate);
    const totalCost = round2(amount + feeAmount);
    const monthlyPayment = round2(totalCost / months);
    return { months, monthlyPayment, totalCost, feeAmount };
  });
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
