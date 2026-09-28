import { calculatePlans, InstallmentPlan } from "./calculator";

type EligibilityStatus = "approved" | "declined" | "pending";

interface EligibilityResponse {
  applicationId: string;
  status: EligibilityStatus;
  plan?: InstallmentPlan;
}

/**
 * <blnk-installment-widget
 *   data-api-base="https://api.example.com"
 *   data-merchant-id="merchant_123"
 *   data-amount="4500">
 * </blnk-installment-widget>
 *
 * Shadow DOM keeps the widget's styles from leaking into (or being clobbered
 * by) the host page — the whole point of an embed that has to survive
 * landing on someone else's Shopify theme or hand-rolled HTML.
 */
export class BlnkInstallmentWidget extends HTMLElement {
  private shadow: ShadowRoot;
  private selectedMonths: number | null = null;
  private plans: InstallmentPlan[] = [];
  private amount = 0;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.amount = Number(this.getAttribute("data-amount") ?? "0");
    this.plans = this.amount > 0 ? calculatePlans(this.amount) : [];
    this.render();
  }

  private get apiBase(): string {
    return this.getAttribute("data-api-base") ?? "";
  }

  private get merchantId(): string {
    return this.getAttribute("data-merchant-id") ?? "";
  }

  private render() {
    this.shadow.innerHTML = `
      <style>${STYLES}</style>
      <div class="blnk-widget">
        <div class="tenors">
          ${this.plans
            .map(
              (p) => `
            <button class="tenor" data-months="${p.months}">
              <span class="months">${p.months} mo</span>
              <span class="monthly">${money(p.monthlyPayment)}/mo</span>
              <span class="total">${money(p.totalCost)} total</span>
            </button>`
            )
            .join("")}
        </div>
        <form class="eligibility-form" hidden>
          <label>
            National ID
            <input type="text" name="nationalId" inputmode="numeric" required />
          </label>
          <button type="submit">Check eligibility</button>
        </form>
        <div class="result" hidden></div>
      </div>
    `;

    this.shadow.querySelectorAll<HTMLButtonElement>(".tenor").forEach((btn) => {
      btn.addEventListener("click", () => this.selectTenor(Number(btn.dataset.months)));
    });

    const form = this.shadow.querySelector<HTMLFormElement>(".eligibility-form")!;
    form.addEventListener("submit", (e) => this.onSubmit(e));
  }

  private selectTenor(months: number) {
    this.selectedMonths = months;
    this.shadow.querySelectorAll<HTMLButtonElement>(".tenor").forEach((btn) => {
      btn.classList.toggle("selected", Number(btn.dataset.months) === months);
    });
    this.shadow.querySelector<HTMLFormElement>(".eligibility-form")!.hidden = false;
  }

  private async onSubmit(e: Event) {
    e.preventDefault();
    if (!this.selectedMonths || !this.apiBase) return;

    const form = e.target as HTMLFormElement;
    const nationalId = (new FormData(form).get("nationalId") as string) ?? "";
    const resultEl = this.shadow.querySelector<HTMLDivElement>(".result")!;
    resultEl.hidden = false;
    resultEl.textContent = "Checking…";

    try {
      const res = await this.checkEligibility(nationalId, this.selectedMonths);
      resultEl.textContent = this.describe(res);

      if (res.status === "pending") {
        await this.pollUntilResolved(res.applicationId, resultEl);
      }
    } catch {
      resultEl.textContent = "Couldn't reach the eligibility service — please try again.";
    }
  }

  private async checkEligibility(
    nationalId: string,
    months: number
  ): Promise<EligibilityResponse> {
    const res = await fetch(`${this.apiBase}/eligibility`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        merchantId: this.merchantId,
        nationalId,
        months,
        amount: this.amount,
      }),
    });
    if (!res.ok) throw new Error(`eligibility check failed: ${res.status}`);
    return res.json();
  }

  private async pollUntilResolved(applicationId: string, resultEl: HTMLDivElement) {
    const maxAttempts = 10;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await sleep(1500);
      const res = await fetch(`${this.apiBase}/applications/${applicationId}`);
      if (!res.ok) continue;
      const data: EligibilityResponse = await res.json();
      resultEl.textContent = this.describe(data);
      if (data.status !== "pending") return;
    }
  }

  private describe(res: EligibilityResponse): string {
    switch (res.status) {
      case "approved":
        return res.plan
          ? `Approved — ${money(res.plan.monthlyPayment)}/mo for ${res.plan.months} months.`
          : "Approved.";
      case "declined":
        return "Not approved for this plan.";
      case "pending":
        return "Reviewing your application…";
    }
  }
}

function money(n: number): string {
  return n.toLocaleString(undefined, { style: "currency", currency: "EGP" });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const STYLES = `
  .blnk-widget { font-family: system-ui, sans-serif; max-width: 420px; }
  .tenors { display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 8px; }
  .tenor {
    display: flex; flex-direction: column; align-items: center; gap: 2px;
    padding: 10px 8px; border: 1px solid #d0d5dd; border-radius: 8px;
    background: #fff; cursor: pointer; font: inherit;
  }
  .tenor.selected { border-color: #2563eb; box-shadow: 0 0 0 1px #2563eb; }
  .tenor .months { font-weight: 600; font-size: 13px; }
  .tenor .monthly { font-size: 14px; }
  .tenor .total { font-size: 11px; color: #667085; }
  .eligibility-form { margin-top: 12px; display: flex; gap: 8px; align-items: end; }
  .eligibility-form label { display: flex; flex-direction: column; font-size: 12px; gap: 4px; }
  .eligibility-form input { padding: 8px; border: 1px solid #d0d5dd; border-radius: 6px; }
  .eligibility-form button {
    padding: 8px 14px; border: none; border-radius: 6px;
    background: #2563eb; color: #fff; cursor: pointer;
  }
  .result { margin-top: 10px; font-size: 13px; }
`;
