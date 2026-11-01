(() => {
  const money=(value,currency='SYP')=>new Intl.NumberFormat('en-US',{maximumFractionDigits:2}).format(Number(value||0))+' '+(currency||'SYP');
  const el=(tag,cls,value)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(value!==undefined&&value!==null)x.textContent=String(value);return x;};
  const params=new URLSearchParams(location.search);const caseCode=String(params.get('case')||'').trim();
  function field(label,control){const wrap=el('label','support-donor-field');if(label)wrap.append(el('span','',label));wrap.append(control);return wrap;}
  function input(type,name,placeholder,required=false){const x=document.createElement('input');x.type=type;x.name=name;x.placeholder=placeholder||'';x.required=required;if(type==='number'){x.min='1';x.step='1';}return x;}
  function statusBox(target,message,kind){target.className='support-donor-status '+kind;target.textContent=message;}
  async function load(){
    const main=document.querySelector('main.wrap')||document.querySelector('main');if(!main)return;
    if(!caseCode){main.replaceChildren(el('section','case','لم يتم تحديد رقم الحالة. ارجع إلى صندوق الدعم واختر الحالة التي ترغب بمساندتها.'));return;}
    try{
      const response=await fetch('/api/support?case='+encodeURIComponent(caseCode),{headers:{Accept:'application/json'},cache:'no-store'});
      const payload=await response.json();if(!response.ok||!payload.success||!payload.case)throw new Error(payload.error||'هذه الحالة غير متاحة حالياً لاستقبال الدعم.');
      const row=payload.case;const currency=row.currency||'SYP';
      const head=main.querySelector('.case-head');
      if(head)head.replaceChildren(el('small','','رقم الحالة: '+row.case_code),el('h2','',row.subject),el('p','',[row.governorate,row.support_type||row.category,row.progress_stage].filter(Boolean).join(' · ')));
      const stats=main.querySelector('.stats');
      if(stats){stats.replaceChildren();[['المبلغ المطلوب',money(row.amount_required,currency)],['المبلغ المؤمّن بعد التحقق',money(row.amount_secured,currency)],['المبلغ المتبقي',money(row.amount_remaining,currency)]].forEach(([k,v])=>{const box=el('div','stat');box.append(el('b','',v),document.createTextNode(k));stats.append(box);});}
      const methods=main.querySelector('.methods');
      if(methods){methods.replaceChildren();(payload.paymentMethods||[]).forEach(method=>{const card=el('div','method');card.append(el('div','method-title',method.label));if(method.instructions)card.append(el('p','',method.instructions));card.append(el('small','',method.account_label));const account=el('div','account');account.append(el('span','account-value',method.account_value));const copy=el('button','copy','نسخ');copy.type='button';copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(String(method.account_value||''));copy.textContent='تم النسخ';setTimeout(()=>copy.textContent='نسخ',1400);}catch{copy.textContent='انسخ الرقم يدوياً';}});account.append(copy);card.append(account);methods.append(card);});if(!(payload.paymentMethods||[]).length)methods.append(el('p','note','لا توجد حالياً وسائل تحويل مفعّلة. يرجى التواصل مع المؤسسة.'));}
      const instructions=Array.from(main.querySelectorAll('.section')).find(x=>x.textContent.includes('كيف يتم تسجيل التبرع'));
      const formCard=el('section','support-donor-form-card');formCard.append(el('h3','','إرسال إشعار المساهمة'),el('p','support-donation-intro','بعد التحويل، أرسل إشعار المساهمة أدناه مع مرجع العملية. سيبقى الإشعار بانتظار المراجعة، ولن يضاف المبلغ إلى إجمالي الحالة إلا بعد مطابقة التحويل والتحقق من وصوله.'));
      const form=el('form','support-donor-form');
      const methodSelect=document.createElement('select');methodSelect.name='method_code';methodSelect.required=true;const empty=document.createElement('option');empty.value='';empty.textContent='اختر وسيلة التحويل';methodSelect.append(empty);
      (payload.paymentMethods||[]).forEach(method=>{const option=document.createElement('option');option.value=method.method_code;option.textContent=method.label;methodSelect.append(option);});
      const amount=input('number','amount','أدخل المبلغ الذي حوّلته',true);
      const donorName=input('text','donor_name','اسمك (اختياري)',false);
      const donorContact=input('tel','donor_contact','رقم الهاتف أو واتساب',true);
      const reference=input('text','transaction_reference','رقم مرجع العملية أو الإيصال',true);
      const grid=el('div','support-donor-grid');grid.append(field('المبلغ الذي حوّلته',amount),field('طريقة التحويل',methodSelect),field('الاسم (اختياري)',donorName),field('رقم الهاتف أو وسيلة التواصل',donorContact),field('مرجع العملية أو رقم الإيصال',reference));
      const honeypot=input('text','website','');honeypot.tabIndex=-1;honeypot.autocomplete='off';honeypot.className='support-donor-honeypot';
      const consent=document.createElement('input');consent.type='checkbox';consent.name='consent';consent.required=true;const consentLabel=el('label','support-donor-consent');consentLabel.append(consent,el('span','','أوافق على استخدام وسيلة التواصل ومرجع التحويل للتحقق من المساهمة والتواصل معي عند الحاجة.'));
      const submit=el('button','btn primary','إرسال إشعار المساهمة');submit.type='submit';const message=el('div','support-donor-status');
      form.append(grid,honeypot,consentLabel,submit,message);
      form.addEventListener('submit',async event=>{event.preventDefault();if(!form.reportValidity())return;submit.disabled=true;submit.textContent='جارٍ إرسال الإشعار...';statusBox(message,'نرسل إشعار المساهمة للتحقق منه...','pending');
        const fd=new FormData(form);const body={action:'contribute',case_code:row.case_code,amount:fd.get('amount'),method_code:fd.get('method_code'),donor_name:fd.get('donor_name'),donor_contact:fd.get('donor_contact'),transaction_reference:fd.get('transaction_reference'),consent:consent.checked,website:honeypot.value};
        try{const res=await fetch('/api/support',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(body)});const result=await res.json();if(!res.ok||!result.success)throw new Error(result.error||'تعذر إرسال الإشعار.');form.reset();statusBox(message,'تم استلام إشعار المساهمة برقم '+result.contribution_code+'. سيُحتسب المبلغ بعد التحقق من التحويل.','success');}
        catch(error){statusBox(message,error.message||'تعذر إرسال الإشعار. حاول مجدداً.','error');}finally{submit.disabled=false;submit.textContent='إرسال إشعار المساهمة';}
      });
      formCard.append(form);
      if(instructions)instructions.insertAdjacentElement('afterend',formCard);else if(head)head.insertAdjacentElement('afterend',formCard);
      const note=main.querySelector('.note');if(note)note.textContent='نحافظ على خصوصية المستفيدين ولا ننشر أسماءهم أو مستنداتهم الشخصية. لا تُحتسب أي مساهمة ضمن إجمالي الحالة قبل التحقق من وصول التحويل واعتماده.';
    }catch(error){const card=main.querySelector('.case');if(card)card.replaceChildren(el('div','note',error.message||'تعذر تحميل الحالة.'));}
  }
  const style=document.createElement('style');style.textContent='
    .support-donation-intro{margin:8px 0 16px;color:#64748b;font-size:12px;line-height:1.9}
    .support-donor-form-card{margin:22px 0;padding:22px;border:1px solid #e2e9f0;border-radius:20px;background:#fff;box-shadow:0 12px 35px rgba(23,43,70,.06)}
    .support-donor-form-card h3{margin:0 0 8px;color:#17213b;font-size:21px}
    .support-donor-grid{display:grid;grid-template-columns:1fr 1fr;gap:13px}
    .support-donor-field{display:grid;gap:6px;color:#263e5d;font-size:11px;font-weight:800}
    .support-donor-field input,.support-donor-field select{width:100%;min-height:43px;padding:10px 12px;border:1px solid #dce5ee;border-radius:10px;background:#fff;color:#284666;font:12px Cairo,sans-serif}
    .support-donor-field input:focus,.support-donor-field select:focus{outline:0;border-color:#cb4965;box-shadow:0 0 0 3px rgba(203,73,101,.09)}
    .support-donor-consent{display:flex;align-items:flex-start;gap:9px;margin:15px 0;color:#596f88;font-size:11px;line-height:1.8}
    .support-donor-consent input{margin-top:5px;accent-color:#e83255}
    .support-donor-status{display:none;margin-top:12px;padding:12px;border-radius:10px;font-size:11px;line-height:1.8}
    .support-donor-status.pending{display:block;background:#fff9ec;color:#8b641e}
    .support-donor-status.success{display:block;background:#edf9f1;color:#216943}
    .support-donor-status.error{display:block;background:#fff1f3;color:#a32142}
    .support-donor-honeypot{position:absolute!important;left:-10000px!important;opacity:0!important}
    @media(max-width:650px){.support-donor-grid{grid-template-columns:1fr}.support-donor-form-card{padding:16px}}';
  document.head.append(style);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load,{once:true});else void load();
})();