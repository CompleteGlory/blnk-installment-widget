import { calculatePlans, InstallmentPlan } from "./calculator";

type Screen = "amount" | "tenor";

/**
 * <blnk-installment-widget
 *   data-api-base="https://api.example.com"
 *   data-merchant-id="merchant_123"
 *   data-amount="4500"
 *   data-min-amount="500"
 *   data-max-amount="15000">
 * </blnk-installment-widget>
 *
 * Two steps happen inline, on the merchant's own page: pick an amount, pick
 * a plan. The eligibility decision itself does not — it hands off to a
 * hosted page on the same origin as the API (a "different page", the same
 * redirect pattern real BNPL providers use for the underwriting step),
 * instead of resolving inline with no visible handoff.
 *
 * Shadow DOM keeps the widget's styles from leaking into (or being clobbered
 * by) the host page — the whole point of an embed that has to survive
 * landing on someone else's Shopify theme or hand-rolled HTML.
 */
export class BlnkInstallmentWidget extends HTMLElement {
  private shadow: ShadowRoot;
  private screen: Screen = "amount";
  private amount = 0;
  private minAmount = 500;
  private maxAmount = 15000;
  private plans: InstallmentPlan[] = [];
  private selectedMonths: number | null = null;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.amount = clamp(
      Number(this.getAttribute("data-amount") ?? "3000") || 3000,
      100,
      1_000_000
    );
    this.minAmount = Number(this.getAttribute("data-min-amount") ?? "500") || 500;
    this.maxAmount =
      Number(this.getAttribute("data-max-amount") ?? String(Math.max(this.amount * 3, 10_000))) ||
      Math.max(this.amount * 3, 10_000);
    this.amount = clamp(this.amount, this.minAmount, this.maxAmount);
    this.recalculatePlans();
    this.render();
  }

  private get apiBase(): string {
    return this.getAttribute("data-api-base") ?? "";
  }

  private get merchantId(): string {
    return this.getAttribute("data-merchant-id") ?? "";
  }

  private recalculatePlans() {
    this.plans = calculatePlans(this.amount);
    if (this.selectedMonths && !this.plans.some((p) => p.months === this.selectedMonths)) {
      this.selectedMonths = null;
    }
  }

  // ---------------------------------------------------------------- render

  private render() {
    this.shadow.innerHTML = `
      <style>${STYLES}</style>
      <div class="blnk">
        <header class="blnk-header">
          <span class="blnk-logo">${ICONS.spark}blnk</span>
          <div class="blnk-steps" role="tablist" aria-label="Progress">
            <span class="dot ${this.screen === "amount" ? "active" : "done"}"></span>
            <span class="dot ${this.screen === "tenor" ? "active" : ""}"></span>
          </div>
        </header>
        <div class="blnk-body">
          ${this.screen === "amount" ? this.renderAmountScreen() : this.renderTenorScreen()}
        </div>
      </div>
    `;
    this.bindEvents();
  }

  private renderAmountScreen(): string {
    const pct = ((this.amount - this.minAmount) / (this.maxAmount - this.minAmount)) * 100;
    const presets = presetAmounts(this.minAmount, this.maxAmount);

    return `
      <div class="chip-icon">${ICONS.wallet}</div>
      <h2 class="blnk-title">How much do you need?</h2>
      <p class="blnk-subtitle">Pick an amount — you'll choose a plan next.</p>

      <div class="amount-display">${money(this.amount)}</div>

      <input
        class="amount-slider"
        type="range"
        min="${this.minAmount}"
        max="${this.maxAmount}"
        step="50"
        value="${this.amount}"
        style="--fill:${pct}%"
        aria-label="Amount"
      />
      <div class="amount-range">
        <span>${money(this.minAmount)}</span>
        <span>${money(this.maxAmount)}</span>
      </div>

      <div class="presets">
        ${presets
          .map(
            (p) => `<button type="button" class="preset ${p === this.amount ? "selected" : ""}" data-amount="${p}">${money(p)}</button>`
          )
          .join("")}
      </div>

      <button type="button" class="cta">Continue</button>
    `;
  }

  private renderTenorScreen(): string {
    return `
      <button type="button" class="back">← ${money(this.amount)}</button>
      <h2 class="blnk-title">Choose your plan</h2>
      <p class="blnk-subtitle">Split ${money(this.amount)} into monthly payments.</p>

      <div class="tenors">
        ${this.plans
          .map((p) => {
            const selected = p.months === this.selectedMonths;
            return `
            <button type="button" class="tenor ${selected ? "selected" : ""}" data-months="${p.months}">
              <span class="months">${ICONS.calendar}${p.months} months</span>
              <span class="monthly">${money(p.monthlyPayment)}<small>/mo</small></span>
              <span class="total ${p.feeAmount === 0 ? "no-fee" : ""}">${p.feeAmount === 0 ? `${ICONS.tag}No fees` : `${money(p.totalCost)} total`}</span>
            </button>`;
          })
          .join("")}
      </div>

      <button type="button" class="cta" ${this.selectedMonths ? "" : "disabled"}>Check eligibility</button>
    `;
  }

  // ----------------------------------------------------------------events

  private bindEvents() {
    const root = this.shadow;

    root.querySelector<HTMLButtonElement>(".back")?.addEventListener("click", () => {
      this.screen = "amount";
      this.render();
    });

    if (this.screen === "amount") {
      const slider = root.querySelector<HTMLInputElement>(".amount-slider")!;
      const display = root.querySelector<HTMLDivElement>(".amount-display")!;

      slider.addEventListener("input", () => {
        this.amount = Number(slider.value);
        display.textContent = money(this.amount);
        slider.style.setProperty(
          "--fill",
          `${((this.amount - this.minAmount) / (this.maxAmount - this.minAmount)) * 100}%`
        );
        root.querySelectorAll<HTMLButtonElement>(".preset").forEach((btn) => {
          btn.classList.toggle("selected", Number(btn.dataset.amount) === this.amount);
        });
      });

      root.querySelectorAll<HTMLButtonElement>(".preset").forEach((btn) => {
        btn.addEventListener("click", () => {
          this.amount = Number(btn.dataset.amount);
          this.render();
        });
      });

      root.querySelector<HTMLButtonElement>(".cta")?.addEventListener("click", () => {
        this.recalculatePlans();
        this.screen = "tenor";
        this.render();
      });
    } else {
      root.querySelectorAll<HTMLButtonElement>(".tenor").forEach((btn) => {
        btn.addEventListener("click", () => {
          this.selectedMonths = Number(btn.dataset.months);
          root.querySelectorAll<HTMLButtonElement>(".tenor").forEach((b) => {
            b.classList.toggle("selected", Number(b.dataset.months) === this.selectedMonths);
          });
          const cta = root.querySelector<HTMLButtonElement>(".cta")!;
          cta.removeAttribute("disabled");
        });
      });

      root.querySelector<HTMLButtonElement>(".cta")?.addEventListener("click", () => this.goToDecision());
    }
  }

  /**
   * Hands off to the hosted decision page instead of resolving inline.
   * Mirrors how real BNPL checkouts work: the merchant's page collects the
   * amount and plan, then the provider's own page (same origin as its API,
   * not the merchant's) makes the call and shows the result.
   */
  private goToDecision() {
    if (!this.selectedMonths) return;
    const params = new URLSearchParams({
      merchantId: this.merchantId,
      amount: String(this.amount),
      months: String(this.selectedMonths),
    });
    window.location.href = `${this.apiBase}/apply/?${params.toString()}`;
  }
}

// -------------------------------------------------------------- helpers

function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}

function presetAmounts(min: number, max: number): number[] {
  const steps = [0, 0.25, 0.5, 0.75, 1];
  const values = steps.map((s) => Math.round((min + (max - min) * s) / 50) * 50);
  return [...new Set(values)];
}

function money(n: number): string {
  return n.toLocaleString(undefined, { style: "currency", currency: "EGP", maximumFractionDigits: 0 });
}

/** Small inline icon set — no external asset requests, so the widget stays a self-contained embed. */
const ICONS = {
  spark: `<svg class="ic-spark" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M11 1.5L4.5 11h4L7.5 18.5 16 8h-4l1-6.5z" fill="#f37b70"/></svg>`,
  wallet: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="6" width="18" height="13" rx="3" stroke="#242366" stroke-width="1.6"/><path d="M3 9.5h18" stroke="#242366" stroke-width="1.6"/><circle cx="16.5" cy="14" r="1.4" fill="#f37b70"/></svg>`,
  calendar: `<svg class="ic-inline" viewBox="0 0 20 20" fill="none" aria-hidden="true"><rect x="3" y="4.5" width="14" height="12.5" rx="2" stroke="currentColor" stroke-width="1.4"/><path d="M3 8h14" stroke="currentColor" stroke-width="1.4"/><path d="M7 2.5v3M13 2.5v3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`,
  tag: `<svg class="ic-inline" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10.5 2.5H16a1.5 1.5 0 011.5 1.5v5.5a1.5 1.5 0 01-.44 1.06l-7 7a1.5 1.5 0 01-2.12 0l-5.5-5.5a1.5 1.5 0 010-2.12l7-7a1.5 1.5 0 011.06-.44z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><circle cx="13" cy="7" r="1.3" fill="currentColor"/></svg>`,
};

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Dosis:wght@400;500;600;700;800&display=swap');

  :host {
    all: initial;
    display: block;
    font-family: 'Dosis', system-ui, sans-serif;
  }

  .blnk {
    --navy: #242366;
    --blue: #6aabdd;
    --coral: #f37b70;
    --coral-dark: #e8604f;
    --muted: #6f6fa0;
    --border: #e5e5f2;
    --bg: #f9f9fc;

    box-sizing: border-box;
    max-width: 380px;
    background: #fff;
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 20px;
    box-shadow: 0 8px 24px rgba(36, 35, 102, 0.08);
    color: var(--navy);
  }
  .blnk * { box-sizing: border-box; font-family: inherit; }

  .blnk-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 18px;
  }
  .blnk-logo {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-weight: 800;
    font-size: 20px;
    color: var(--navy);
    letter-spacing: -0.02em;
  }
  .ic-spark { width: 15px; height: 15px; }
  .blnk-steps { display: flex; gap: 6px; }
  .dot { width: 18px; height: 6px; border-radius: 999px; background: var(--border); transition: background .2s; }
  .dot.active { background: var(--coral); }
  .dot.done { background: var(--blue); }

  .blnk-title { font-size: 19px; font-weight: 700; margin: 0 0 4px; }
  .blnk-subtitle { font-size: 13px; color: var(--muted); margin: 0 0 18px; font-weight: 500; }

  .chip-icon {
    width: 46px;
    height: 46px;
    border-radius: 14px;
    background: var(--bg);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 12px;
  }

  .amount-display {
    font-size: 34px;
    font-weight: 800;
    text-align: center;
    padding: 10px 0 18px;
    color: var(--navy);
  }

  .amount-slider {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 6px;
    border-radius: 999px;
    background: linear-gradient(to right, var(--coral) 0%, var(--coral) var(--fill), var(--border) var(--fill), var(--border) 100%);
    outline: none;
    margin: 4px 0 6px;
  }
  .amount-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--navy);
    border: 3px solid #fff;
    box-shadow: 0 1px 4px rgba(36, 35, 102, 0.4);
    cursor: pointer;
  }
  .amount-slider::-moz-range-thumb {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--navy);
    border: 3px solid #fff;
    box-shadow: 0 1px 4px rgba(36, 35, 102, 0.4);
    cursor: pointer;
  }
  .amount-slider::-moz-range-track {
    height: 6px;
    border-radius: 999px;
    background: var(--border);
  }

  .amount-range {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: var(--muted);
    font-weight: 600;
    margin-bottom: 18px;
  }

  .presets {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 20px;
  }
  .preset {
    flex: 1 1 auto;
    border: 1.5px solid var(--border);
    background: #fff;
    color: var(--navy);
    font-family: inherit;
    font-weight: 600;
    font-size: 12px;
    padding: 8px 10px;
    border-radius: 999px;
    cursor: pointer;
    transition: border-color .15s, background .15s;
  }
  .preset:hover { border-color: var(--blue); }
  .preset.selected { border-color: var(--navy); background: var(--navy); color: #fff; }

  .tenors {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 20px;
  }
  .tenor {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    width: 100%;
    text-align: left;
    padding: 14px 16px;
    border: 1.5px solid var(--border);
    border-radius: 14px;
    background: var(--bg);
    font-family: inherit;
    cursor: pointer;
    transition: border-color .15s, background .15s;
  }
  .tenor:hover { border-color: var(--blue); }
  .tenor.selected { border-color: var(--navy); background: #fff; box-shadow: 0 0 0 1.5px var(--navy) inset; }
  .tenor .months {
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 700;
    font-size: 14px;
    color: var(--navy);
    flex: 1;
  }
  .ic-inline { width: 14px; height: 14px; flex-shrink: 0; color: var(--muted); }
  .tenor.selected .ic-inline { color: var(--navy); }
  .tenor .monthly { font-weight: 800; font-size: 15px; color: var(--navy); }
  .tenor .monthly small { font-weight: 600; font-size: 11px; color: var(--muted); }
  .tenor .total {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 4px;
    font-size: 11px;
    color: var(--muted);
    font-weight: 700;
    min-width: 78px;
  }
  .tenor .total.no-fee { color: var(--coral-dark); }
  .tenor .total .ic-inline { color: var(--coral-dark); }

  .back {
    background: none;
    border: none;
    color: var(--muted);
    font-family: inherit;
    font-weight: 600;
    font-size: 12px;
    padding: 0;
    margin-bottom: 12px;
    cursor: pointer;
  }
  .back:hover { color: var(--navy); }

  .cta {
    width: 100%;
    padding: 14px;
    border: none;
    border-radius: 999px;
    background: var(--coral);
    color: #fff;
    font-family: inherit;
    font-weight: 700;
    font-size: 15px;
    cursor: pointer;
    transition: background .15s, opacity .15s;
  }
  .cta:hover:not(:disabled) { background: var(--coral-dark); }
  .cta:disabled { background: var(--border); color: var(--muted); cursor: not-allowed; }
`;
