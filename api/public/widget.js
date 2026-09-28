"use strict";(()=>{var c=[{months:3,feeRate:0},{months:6,feeRate:.03},{months:12,feeRate:.06},{months:24,feeRate:.11},{months:36,feeRate:.16}];function u(e,s=c){if(!Number.isFinite(e)||e<=0)throw new RangeError("amount must be a positive number");return s.map(({months:t,feeRate:n})=>{let o=l(e*n),r=l(e+o),d=l(r/t);return{months:t,monthlyPayment:d,totalCost:r,feeAmount:o}})}function l(e){return Math.round(e*100)/100}var i=class extends HTMLElement{constructor(){super();this.screen="amount";this.amount=0;this.minAmount=500;this.maxAmount=15e3;this.plans=[];this.selectedMonths=null;this.shadow=this.attachShadow({mode:"open"})}connectedCallback(){this.amount=m(Number(this.getAttribute("data-amount")??"3000")||3e3,100,1e6),this.minAmount=Number(this.getAttribute("data-min-amount")??"500")||500,this.maxAmount=Number(this.getAttribute("data-max-amount")??String(Math.max(this.amount*3,1e4)))||Math.max(this.amount*3,1e4),this.amount=m(this.amount,this.minAmount,this.maxAmount),this.recalculatePlans(),this.render()}get apiBase(){return this.getAttribute("data-api-base")??""}get merchantId(){return this.getAttribute("data-merchant-id")??""}recalculatePlans(){this.plans=u(this.amount),this.selectedMonths&&!this.plans.some(t=>t.months===this.selectedMonths)&&(this.selectedMonths=null)}render(){this.shadow.innerHTML=`
      <style>${h}</style>
      <div class="blnk">
        <header class="blnk-header">
          <span class="blnk-logo">blnk</span>
          <div class="blnk-steps" role="tablist" aria-label="Progress">
            <span class="dot ${this.screen==="amount"?"active":"done"}"></span>
            <span class="dot ${this.screen==="tenor"?"active":""}"></span>
          </div>
        </header>
        <div class="blnk-body">
          ${this.screen==="amount"?this.renderAmountScreen():this.renderTenorScreen()}
        </div>
      </div>
    `,this.bindEvents()}renderAmountScreen(){let t=(this.amount-this.minAmount)/(this.maxAmount-this.minAmount)*100,n=p(this.minAmount,this.maxAmount);return`
      <h2 class="blnk-title">How much do you need?</h2>
      <p class="blnk-subtitle">Pick an amount \u2014 you'll choose a plan next.</p>

      <div class="amount-display">${a(this.amount)}</div>

      <input
        class="amount-slider"
        type="range"
        min="${this.minAmount}"
        max="${this.maxAmount}"
        step="50"
        value="${this.amount}"
        style="--fill:${t}%"
        aria-label="Amount"
      />
      <div class="amount-range">
        <span>${a(this.minAmount)}</span>
        <span>${a(this.maxAmount)}</span>
      </div>

      <div class="presets">
        ${n.map(o=>`<button type="button" class="preset ${o===this.amount?"selected":""}" data-amount="${o}">${a(o)}</button>`).join("")}
      </div>

      <button type="button" class="cta">Continue</button>
    `}renderTenorScreen(){return`
      <button type="button" class="back">\u2190 ${a(this.amount)}</button>
      <h2 class="blnk-title">Choose your plan</h2>
      <p class="blnk-subtitle">Split ${a(this.amount)} into monthly payments.</p>

      <div class="tenors">
        ${this.plans.map(t=>`
            <button type="button" class="tenor ${t.months===this.selectedMonths?"selected":""}" data-months="${t.months}">
              <span class="months">${t.months} months</span>
              <span class="monthly">${a(t.monthlyPayment)}<small>/mo</small></span>
              <span class="total">${t.feeAmount===0?"No fees":`${a(t.totalCost)} total`}</span>
            </button>`).join("")}
      </div>

      <button type="button" class="cta" ${this.selectedMonths?"":"disabled"}>Check eligibility</button>
    `}bindEvents(){let t=this.shadow;if(t.querySelector(".back")?.addEventListener("click",()=>{this.screen="amount",this.render()}),this.screen==="amount"){let n=t.querySelector(".amount-slider"),o=t.querySelector(".amount-display");n.addEventListener("input",()=>{this.amount=Number(n.value),o.textContent=a(this.amount),n.style.setProperty("--fill",`${(this.amount-this.minAmount)/(this.maxAmount-this.minAmount)*100}%`),t.querySelectorAll(".preset").forEach(r=>{r.classList.toggle("selected",Number(r.dataset.amount)===this.amount)})}),t.querySelectorAll(".preset").forEach(r=>{r.addEventListener("click",()=>{this.amount=Number(r.dataset.amount),this.render()})}),t.querySelector(".cta")?.addEventListener("click",()=>{this.recalculatePlans(),this.screen="tenor",this.render()})}else t.querySelectorAll(".tenor").forEach(n=>{n.addEventListener("click",()=>{this.selectedMonths=Number(n.dataset.months),t.querySelectorAll(".tenor").forEach(r=>{r.classList.toggle("selected",Number(r.dataset.months)===this.selectedMonths)}),t.querySelector(".cta").removeAttribute("disabled")})}),t.querySelector(".cta")?.addEventListener("click",()=>this.goToDecision())}goToDecision(){if(!this.selectedMonths)return;let t=new URLSearchParams({merchantId:this.merchantId,amount:String(this.amount),months:String(this.selectedMonths)});window.location.href=`${this.apiBase}/apply/?${t.toString()}`}};function m(e,s,t){return Math.min(Math.max(e,s),t)}function p(e,s){let n=[0,.25,.5,.75,1].map(o=>Math.round((e+(s-e)*o)/50)*50);return[...new Set(n)]}function a(e){return e.toLocaleString(void 0,{style:"currency",currency:"EGP",maximumFractionDigits:0})}var h=`
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
    font-weight: 800;
    font-size: 20px;
    color: var(--navy);
    letter-spacing: -0.02em;
  }
  .blnk-steps { display: flex; gap: 6px; }
  .dot { width: 18px; height: 6px; border-radius: 999px; background: var(--border); transition: background .2s; }
  .dot.active { background: var(--coral); }
  .dot.done { background: var(--blue); }

  .blnk-title { font-size: 19px; font-weight: 700; margin: 0 0 4px; }
  .blnk-subtitle { font-size: 13px; color: var(--muted); margin: 0 0 18px; font-weight: 500; }

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
  .tenor .months { font-weight: 700; font-size: 14px; color: var(--navy); flex: 1; }
  .tenor .monthly { font-weight: 800; font-size: 15px; color: var(--navy); }
  .tenor .monthly small { font-weight: 600; font-size: 11px; color: var(--muted); }
  .tenor .total { font-size: 11px; color: var(--coral-dark); font-weight: 700; min-width: 78px; text-align: right; }

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
`;customElements.define("blnk-installment-widget",i);})();
