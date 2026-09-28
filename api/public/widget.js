"use strict";(()=>{var p=[{months:1,feeRate:0},{months:2,feeRate:0},{months:4,feeRate:.03},{months:6,feeRate:.05}];function c(o,i=p){if(!Number.isFinite(o)||o<=0)throw new RangeError("amount must be a positive number");return i.map(({months:t,feeRate:e})=>{let a=m(o*e),n=m(o+a),u=m(n/t);return{months:t,monthlyPayment:u,totalCost:n,feeAmount:a}})}function m(o){return Math.round(o*100)/100}var d=class extends HTMLElement{constructor(){super();this.screen="amount";this.amount=0;this.minAmount=500;this.maxAmount=15e3;this.plans=[];this.budget=0;this.shadow=this.attachShadow({mode:"open"})}connectedCallback(){this.amount=h(Number(this.getAttribute("data-amount")??"3000")||3e3,100,1e6),this.minAmount=Number(this.getAttribute("data-min-amount")??"500")||500,this.maxAmount=Number(this.getAttribute("data-max-amount")??String(Math.max(this.amount*3,1e4)))||Math.max(this.amount*3,1e4),this.amount=h(this.amount,this.minAmount,this.maxAmount),this.recalculatePlans(),this.render()}get apiBase(){return this.getAttribute("data-api-base")??""}get merchantId(){return this.getAttribute("data-merchant-id")??""}recalculatePlans(){this.plans=c(this.amount);let t=this.plans[Math.floor(this.plans.length/2)];this.budget=t.monthlyPayment}get budgetBounds(){let t=this.plans.map(e=>e.monthlyPayment);return{min:Math.min(...t),max:Math.max(...t)}}suggestedPlan(t){return this.plans.filter(a=>a.monthlyPayment<=t+.01)[0]??this.plans[this.plans.length-1]}render(){this.shadow.innerHTML=`
      <style>${v}</style>
      <div class="blnk">
        <header class="blnk-header">
          <span class="blnk-logo">${r.spark}blnk</span>
          <div class="blnk-steps" role="tablist" aria-label="Progress">
            <span class="dot ${this.screen==="amount"?"active":"done"}"></span>
            <span class="dot ${this.screen==="budget"?"active":""}"></span>
          </div>
        </header>
        <div class="blnk-body">
          ${this.screen==="amount"?this.renderAmountScreen():this.renderBudgetScreen()}
        </div>
      </div>
    `,this.bindEvents()}renderAmountScreen(){let t=(this.amount-this.minAmount)/(this.maxAmount-this.minAmount)*100,e=b(this.minAmount,this.maxAmount);return`
      <div class="chip-icon">${r.wallet}</div>
      <h2 class="blnk-title">How much do you want?</h2>
      <p class="blnk-subtitle">You'll tell us what you can pay monthly next.</p>

      <div class="amount-display">${s(this.amount)}</div>

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
        <span>${s(this.minAmount)}</span>
        <span>${s(this.maxAmount)}</span>
      </div>

      <div class="presets">
        ${e.map(a=>`<button type="button" class="preset ${a===this.amount?"selected":""}" data-amount="${a}">${s(a)}</button>`).join("")}
      </div>

      <button type="button" class="cta">Continue</button>
    `}renderBudgetScreen(){let{min:t,max:e}=this.budgetBounds,a=(this.budget-t)/(e-t||1)*100,n=this.suggestedPlan(this.budget);return`
      <button type="button" class="back">\u2190 ${s(this.amount)}</button>
      <div class="chip-icon">${r.calendarBig}</div>
      <h2 class="blnk-title">How much can you pay monthly?</h2>
      <p class="blnk-subtitle">We'll match you to a plan that fits.</p>

      <div class="amount-display">${s(this.budget)}<small>/mo</small></div>

      <input
        class="amount-slider"
        type="range"
        min="${Math.floor(t)}"
        max="${Math.ceil(e)}"
        step="1"
        value="${this.budget}"
        style="--fill:${a}%"
        aria-label="Monthly budget"
      />
      <div class="amount-range">
        <span>${s(t)}/mo</span>
        <span>${s(e)}/mo</span>
      </div>

      <div class="suggestion">
        <div class="suggestion-label">Suggested plan</div>
        <div class="suggestion-row">
          <span class="suggestion-months">${r.calendar}${n.months} ${n.months===1?"month":"months"}</span>
          <span class="suggestion-monthly">${s(n.monthlyPayment)}<small>/mo</small></span>
        </div>
        <div class="suggestion-total ${n.feeAmount===0?"no-fee":""}">
          ${n.feeAmount===0?`${r.tag}No fees`:`${s(n.totalCost)} total`}
        </div>
      </div>

      <button type="button" class="cta">Check eligibility</button>
    `}bindEvents(){let t=this.shadow;if(t.querySelector(".back")?.addEventListener("click",()=>{this.screen="amount",this.render()}),this.screen==="amount"){let e=t.querySelector(".amount-slider"),a=t.querySelector(".amount-display");e.addEventListener("input",()=>{this.amount=Number(e.value),a.textContent=s(this.amount),e.style.setProperty("--fill",`${(this.amount-this.minAmount)/(this.maxAmount-this.minAmount)*100}%`),t.querySelectorAll(".preset").forEach(n=>{n.classList.toggle("selected",Number(n.dataset.amount)===this.amount)})}),t.querySelectorAll(".preset").forEach(n=>{n.addEventListener("click",()=>{this.amount=Number(n.dataset.amount),this.render()})}),t.querySelector(".cta")?.addEventListener("click",()=>{this.recalculatePlans(),this.screen="budget",this.render()})}else{let e=t.querySelector(".amount-slider"),a=t.querySelector(".amount-display"),n=t.querySelector(".suggestion"),{min:u,max:g}=this.budgetBounds;e.addEventListener("input",()=>{this.budget=Number(e.value),a.innerHTML=`${s(this.budget)}<small>/mo</small>`,e.style.setProperty("--fill",`${(this.budget-u)/(g-u||1)*100}%`);let l=this.suggestedPlan(this.budget);n.innerHTML=`
          <div class="suggestion-label">Suggested plan</div>
          <div class="suggestion-row">
            <span class="suggestion-months">${r.calendar}${l.months} ${l.months===1?"month":"months"}</span>
            <span class="suggestion-monthly">${s(l.monthlyPayment)}<small>/mo</small></span>
          </div>
          <div class="suggestion-total ${l.feeAmount===0?"no-fee":""}">
            ${l.feeAmount===0?`${r.tag}No fees`:`${s(l.totalCost)} total`}
          </div>
        `}),t.querySelector(".cta")?.addEventListener("click",()=>this.goToDecision())}}goToDecision(){let t=this.suggestedPlan(this.budget),e=new URLSearchParams({merchantId:this.merchantId,amount:String(this.amount),months:String(t.months)});window.location.href=`${this.apiBase}/apply/?${e.toString()}`}};function h(o,i,t){return Math.min(Math.max(o,i),t)}function b(o,i){let e=[0,.25,.5,.75,1].map(a=>Math.round((o+(i-o)*a)/50)*50);return[...new Set(e)]}function s(o){return o.toLocaleString(void 0,{style:"currency",currency:"EGP",maximumFractionDigits:0})}var r={spark:'<svg class="ic-spark" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M11 1.5L4.5 11h4L7.5 18.5 16 8h-4l1-6.5z" fill="#f37b70"/></svg>',wallet:'<svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="6" width="18" height="13" rx="3" stroke="#242366" stroke-width="1.6"/><path d="M3 9.5h18" stroke="#242366" stroke-width="1.6"/><circle cx="16.5" cy="14" r="1.4" fill="#f37b70"/></svg>',calendar:'<svg class="ic-inline" viewBox="0 0 20 20" fill="none" aria-hidden="true"><rect x="3" y="4.5" width="14" height="12.5" rx="2" stroke="currentColor" stroke-width="1.4"/><path d="M3 8h14" stroke="currentColor" stroke-width="1.4"/><path d="M7 2.5v3M13 2.5v3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',calendarBig:'<svg width="24" height="24" viewBox="0 0 20 20" fill="none" aria-hidden="true"><rect x="3" y="4.5" width="14" height="12.5" rx="2" stroke="#242366" stroke-width="1.5"/><path d="M3 8h14" stroke="#242366" stroke-width="1.5"/><path d="M7 2.5v3M13 2.5v3" stroke="#242366" stroke-width="1.5" stroke-linecap="round"/><circle cx="7.5" cy="12" r="1.1" fill="#f37b70"/></svg>',tag:'<svg class="ic-inline" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10.5 2.5H16a1.5 1.5 0 011.5 1.5v5.5a1.5 1.5 0 01-.44 1.06l-7 7a1.5 1.5 0 01-2.12 0l-5.5-5.5a1.5 1.5 0 010-2.12l7-7a1.5 1.5 0 011.06-.44z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><circle cx="13" cy="7" r="1.3" fill="currentColor"/></svg>'},v=`
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
  .amount-display small { font-size: 14px; font-weight: 600; color: var(--muted); margin-left: 2px; }

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

  .ic-inline { width: 14px; height: 14px; flex-shrink: 0; }

  .suggestion {
    background: var(--bg);
    border: 1.5px solid var(--border);
    border-radius: 16px;
    padding: 16px;
    margin-bottom: 20px;
  }
  .suggestion-label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 8px;
  }
  .suggestion-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .suggestion-months {
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 700;
    font-size: 15px;
    color: var(--navy);
  }
  .suggestion-months .ic-inline { color: var(--navy); }
  .suggestion-monthly { font-weight: 800; font-size: 18px; color: var(--navy); }
  .suggestion-monthly small { font-weight: 600; font-size: 11px; color: var(--muted); }
  .suggestion-total {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    color: var(--muted);
    font-weight: 700;
    margin-top: 8px;
  }
  .suggestion-total.no-fee { color: var(--coral-dark); }
  .suggestion-total .ic-inline { color: var(--coral-dark); }

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
`;customElements.define("blnk-installment-widget",d);})();
