import { BlnkInstallmentWidget } from "./widget";

customElements.define("blnk-installment-widget", BlnkInstallmentWidget);

export { calculatePlans, DEFAULT_TENORS } from "./calculator";
export type { InstallmentPlan, TenorOption } from "./calculator";
