"use strict";(()=>{var c=[{months:3,feeRate:0},{months:6,feeRate:.03},{months:12,feeRate:.06},{months:24,feeRate:.11},{months:36,feeRate:.16}];function m(n,a=c){if(!Number.isFinite(n)||n<=0)throw new RangeError("amount must be a positive number");return a.map(({months:e,feeRate:t})=>{let o=l(n*t),i=l(n+o),s=l(i/e);return{months:e,monthlyPayment:s,totalCost:i,feeAmount:o}})}function l(n){return Math.round(n*100)/100}var r=class extends HTMLElement{constructor(){super();this.selectedMonths=null;this.plans=[];this.amount=0;this.shadow=this.attachShadow({mode:"open"})}connectedCallback(){this.amount=Number(this.getAttribute("data-amount")??"0"),this.plans=this.amount>0?m(this.amount):[],this.render()}get apiBase(){return this.getAttribute("data-api-base")??""}get merchantId(){return this.getAttribute("data-merchant-id")??""}render(){this.shadow.innerHTML=`
      <style>${h}</style>
      <div class="blnk-widget">
        <div class="tenors">
          ${this.plans.map(t=>`
            <button class="tenor" data-months="${t.months}">
              <span class="months">${t.months} mo</span>
              <span class="monthly">${p(t.monthlyPayment)}/mo</span>
              <span class="total">${p(t.totalCost)} total</span>
            </button>`).join("")}
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
    `,this.shadow.querySelectorAll(".tenor").forEach(t=>{t.addEventListener("click",()=>this.selectTenor(Number(t.dataset.months)))}),this.shadow.querySelector(".eligibility-form").addEventListener("submit",t=>this.onSubmit(t))}selectTenor(e){this.selectedMonths=e,this.shadow.querySelectorAll(".tenor").forEach(t=>{t.classList.toggle("selected",Number(t.dataset.months)===e)}),this.shadow.querySelector(".eligibility-form").hidden=!1}async onSubmit(e){if(e.preventDefault(),!this.selectedMonths||!this.apiBase)return;let t=e.target,o=new FormData(t).get("nationalId")??"",i=this.shadow.querySelector(".result");i.hidden=!1,i.textContent="Checking\u2026";try{let s=await this.checkEligibility(o,this.selectedMonths);i.textContent=this.describe(s),s.status==="pending"&&await this.pollUntilResolved(s.applicationId,i)}catch{i.textContent="Couldn't reach the eligibility service \u2014 please try again."}}async checkEligibility(e,t){let o=await fetch(`${this.apiBase}/eligibility`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({merchantId:this.merchantId,nationalId:e,months:t,amount:this.amount})});if(!o.ok)throw new Error(`eligibility check failed: ${o.status}`);return o.json()}async pollUntilResolved(e,t){for(let i=0;i<10;i++){await u(1500);let s=await fetch(`${this.apiBase}/applications/${e}`);if(!s.ok)continue;let d=await s.json();if(t.textContent=this.describe(d),d.status!=="pending")return}}describe(e){switch(e.status){case"approved":return e.plan?`Approved \u2014 ${p(e.plan.monthlyPayment)}/mo for ${e.plan.months} months.`:"Approved.";case"declined":return"Not approved for this plan.";case"pending":return"Reviewing your application\u2026"}}};function p(n){return n.toLocaleString(void 0,{style:"currency",currency:"EGP"})}function u(n){return new Promise(a=>setTimeout(a,n))}var h=`
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
`;customElements.define("blnk-installment-widget",r);})();
