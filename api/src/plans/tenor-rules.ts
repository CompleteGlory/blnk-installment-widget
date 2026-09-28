/**
 * Pricing rules for installment plans.
 *
 * Today this is a constant table. The design doc calls for these to live in
 * Postgres so they can be changed without a redeploy — swap this for a
 * TypeORM repository (a `TenorRule` entity: months, feeRate, active) behind
 * the same `getTenorRules()` shape once a database is wired up.
 */

export interface TenorRule {
  months: number;
  /** Total cost markup over the purchase amount, e.g. 0.06 = 6% */
  feeRate: number;
}

const TENOR_RULES: TenorRule[] = [
  { months: 3, feeRate: 0 },
  { months: 6, feeRate: 0.03 },
  { months: 12, feeRate: 0.06 },
  { months: 24, feeRate: 0.11 },
  { months: 36, feeRate: 0.16 },
];

export function getTenorRules(): TenorRule[] {
  return TENOR_RULES;
}
