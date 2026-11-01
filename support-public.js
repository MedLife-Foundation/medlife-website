(() => {
  const money = (value, currency = 'SYP') => new Intl.NumberFormat('en-US',{maximumFractionDigits:2}).format(Number(value||0)) + ' ' + (currency||'SYP');
  const node = (tag, cls, value) => { const el=document.createElement(tag); if(cls) el.className=cls; if(value!==undefined&&value!==null) el.textContent=String(value); return el; };
  const link = (label, href, cls='btn primary') => { const a=node('a',cls,label); a.href=href; return a; };
  function completedCard(row) {
    const article=node('article','case-card'); const top=node('div','case-top');
    top.append(node('span','case-code',row.case_code),node('span','done','مساعدة مكتملة'));
    const body=node('div','case-body'); body.append(node('h4','',row.subject),node('div','amount',money(row.amount_secured,row.currency)));
    const meta=node('div','meta');
    [['المبلغ المطلوب',money(row.amount_required,row.currency)],['المبلغ المؤمّن',money(row.amount_secured,row.currency)],['المحافظة',row.governorate||'غير منشور'],['نوع الدعم',row.support_type||row.category||'—']].forEach(([k,v])=>{const d=node('div');d.append(node('b','',v),document.createTextNode(k));meta.append(d);});
    body.append(meta,node('p','case-summary',row.summary||row.description||'تم تنفيذ المساعدة وفق السجلات المعتمدة.')); article.append(top,body); return article;
  }
  function activeCard(row) {
    const article=node('article','open-card'); const layout=node('div','open-layout'); const copy=node('div');
    copy.append(node('span','done',row.progress_stage||'متاحة لاستقبال الدعم'),node('small','case-code',row.case_code),node('h4','',row.subject),node('p','',row.summary||row.description||'تحتاج هذه الحالة إلى دعم وفق المعلومات العامة المعتمدة.'));
    const details=node('div','open-details');
    [['المبلغ المطلوب',money(row.amount_required,row.currency)],['المبلغ المؤمّن',money(row.amount_secured,row.currency)],['المتبقي',money(row.amount_remaining,row.currency)],['نسبة التمويل',(row.progress_percent||0)+'%'],['المحافظة',row.governorate||'غير منشور'],['نوع المساعدة',row.support_type||row.category||'—']].forEach(([k,v])=>{const d=node('div');d.append(node('b','',v),document.createTextNode(k));details.append(d);});
    copy.append(details); if(row.public_status_note) copy.append(node('p','public-status-note',row.public_status_note));
    const actions=node('div','support-action'); actions.append(link('دعم هذه الحالة','support-donation.html?case='+encodeURIComponent(row.case_code))); copy.append(actions);
    const progress=node('div','progress-circle'); const pct=Math.max(0,Math.min(100,Number(row.progress_percent||0))); progress.style.background='conic-gradient(var(--red) '+(pct*3.6)+'deg,#eef1f5 0deg)'; progress.append(node('strong','',pct+'%')); layout.append(copy,progress); article.append(layout); return article;
  }
  function setTabCount(key,count){const badge=document.querySelector('.tab[data-tab="'+key+'"] .count');if(badge)badge.textContent=String(count);}
  function updateNumbers(rows){
    const boxes=document.querySelectorAll('.numbers-grid .number'); if(boxes.length<4)return;
    const active=rows.filter(x=>['published','supporting'].includes(x.status)); const complete=rows.filter(x=>x.status==='closed');
    const total=rows.reduce((s,x)=>s+Number(x.amount_secured||0),0);
    const values=[[rows.length,'إجمالي الحالات المنشورة'],[active.length,'حالات تستقبل الدعم'],[complete.length,'حالات مكتملة'],[money(total),'إجمالي المبالغ المؤمّنة']];
    boxes.forEach((box,i)=>{const strong=box.querySelector('strong')||node('strong');const small=box.querySelector('small')||node('small');strong.textContent=values[i][0];small.textContent=values[i][1];if(!strong.parentNode)box.prepend(strong);if(!small.parentNode)box.append(small);});
  }
  async function load(){
    try{
      const response=await fetch('/api/support',{headers:{Accept:'application/json'},cache:'no-store'}); const payload=await response.json();
      if(!response.ok||!payload.success)throw new Error(payload.error||'تعذر تحميل الحالات.');
      const rows=Array.isArray(payload.cases)?payload.cases:[];
      const active=rows.filter(x=>['published','supporting'].includes(x.status)); const complete=rows.filter(x=>x.status==='closed');
      document.querySelectorAll('.demo-banner').forEach(x=>x.remove());
      const grid=document.getElementById('completedGrid');
      if(grid){grid.replaceChildren();complete.forEach(x=>grid.append(completedCard(x)));if(!complete.length)grid.append(node('div','empty','لا توجد مساعدات مكتملة منشورة حالياً.'));
        const summary=document.querySelector('#completed .section-heading p');if(summary)summary.textContent=complete.length+' حالة مكتملة · إجمالي المبالغ المسجلة: '+money(complete.reduce((s,x)=>s+Number(x.amount_secured||0),0));}
      const open=document.getElementById('open');
      if(open){open.querySelectorAll('.open-card,.live-support-cases').forEach(x=>x.remove());const h=open.querySelector('.section-heading');const list=node('div','live-support-cases');
        if(active.length)active.forEach(x=>list.append(activeCard(x)));else list.append(node('div','empty','لا توجد حالياً حالات مفتوحة لاستقبال الدعم.'));
        if(h)h.insertAdjacentElement('afterend',list);}
      const review=document.querySelector('#review .section-heading p');if(review)review.textContent='لا تظهر طلبات قيد الدراسة للعامة. تبقى الطلبات الخاصة مخفية حتى اعتمادها للنشر.';
      const empty=document.querySelector('#review .empty');if(empty)empty.textContent='تتم مراجعة الطلبات والتحقق منها داخل فريق ميدلايف. لن تظهر هذه المرحلة للزوار.';
      setTabCount('completed',complete.length);setTabCount('open',active.length);setTabCount('review',0);updateNumbers(rows);
    }catch(error){console.error('MedLife support listing:',error);const grid=document.getElementById('completedGrid');if(grid)grid.replaceChildren(node('div','empty','تعذر تحميل حالات صندوق الدعم حالياً. يرجى تحديث الصفحة والمحاولة مجدداً.'));}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load,{once:true});else void load();
})();