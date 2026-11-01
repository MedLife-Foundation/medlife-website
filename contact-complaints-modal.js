(function(){
  'use strict';
  if(!/\/contact(?:\.html)?\/?$/i.test(window.location.pathname))return;

  function initComplaintsModal(){
    if(document.getElementById('medlifeComplaintsModal'))return;

    // The live Contact Us page is rebuilt by contact-page-v8.js.
    // Add the complaint entry to its actual contact card, not the removed legacy markup.
    const page=document.getElementById('medlife-contact-v8');
    const contactCard=page&&page.querySelector('.mc8-contact-card');
    const actions=contactCard&&contactCard.querySelector('.mc8-actions');
    if(!page||!contactCard||!actions)return;

    const style=document.createElement('style');
    style.id='medlife-complaints-modal-style';
    style.textContent=`
      body.medlife-complaints-modal-open{overflow:hidden!important}
      #medlife-contact-v8 .ml-complaints-entry{margin-top:13px;width:100%}
      #medlife-contact-v8 .ml-complaints-open{width:100%!important;min-height:47px!important;padding:10px 14px!important;display:flex!important;align-items:center!important;justify-content:center!important;gap:9px!important;border:1px solid #eabfc9!important;border-radius:12px!important;background:linear-gradient(135deg,#fff0f4,#fff8fa)!important;color:#a32140!important;font:900 12px Cairo,Arial,sans-serif!important;cursor:pointer!important;box-shadow:0 6px 16px rgba(189,37,71,.08)!important;transition:transform .2s,box-shadow .2s,border-color .2s!important}
      #medlife-contact-v8 .ml-complaints-open:hover{transform:translateY(-2px)!important;border-color:#bd2547!important;box-shadow:0 9px 20px rgba(189,37,71,.15)!important}
      #medlife-contact-v8 .ml-complaints-open:focus-visible,.ml-complaints-modal__close:focus-visible{outline:3px solid rgba(27,154,192,.35);outline-offset:3px}
      .ml-complaints-modal{position:fixed;inset:0;z-index:100000;display:none;align-items:center;justify-content:center;padding:18px;background:rgba(5,18,39,.76);backdrop-filter:blur(7px);-webkit-backdrop-filter:blur(7px)}
      .ml-complaints-modal.is-open{display:flex}
      .ml-complaints-modal__dialog{display:flex;flex-direction:column;width:min(1040px,100%);height:min(88vh,900px);min-height:360px;overflow:hidden;border:1px solid rgba(255,255,255,.55);border-radius:20px;background:#f4f7fa;box-shadow:0 24px 80px rgba(0,0,0,.28)}
      .ml-complaints-modal__header{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 17px;background:#fff;border-bottom:1px solid #e7edf3}
      .ml-complaints-modal__heading{min-width:0}
      .ml-complaints-modal__heading strong{display:block;color:#071b3a;font-size:15px;font-weight:900}
      .ml-complaints-modal__heading small{display:block;margin-top:2px;color:#718198;font-size:10px}
      .ml-complaints-modal__close{display:inline-flex;align-items:center;justify-content:center;gap:7px;flex:none;min-height:36px;padding:7px 11px;border:1px solid #e3e8ef;border-radius:10px;background:#fff;color:#475a70;font:800 11px Cairo,Arial,sans-serif;cursor:pointer}
      .ml-complaints-modal__close:hover{background:#fff5f7;border-color:#f0cbd4;color:#a32140}
      .ml-complaints-modal__frame{display:block;flex:1;width:100%;height:100%;min-height:0;border:0;background:#f4f7fa}
      @media(max-width:560px){.ml-complaints-modal{padding:0}.ml-complaints-modal__dialog{width:100%;height:100dvh;min-height:0;border:0;border-radius:0}.ml-complaints-modal__header{padding:10px 12px}.ml-complaints-modal__heading strong{font-size:13px}}
    `;
    document.head.appendChild(style);

    const entry=document.createElement('div');
    entry.className='ml-complaints-entry';
    entry.innerHTML='<button class="ml-complaints-open" id="openMedlifeComplaints" type="button"><i class="fa-solid fa-shield-heart" aria-hidden="true"></i><span>صندوق الشكاوى والملاحظات</span></button>';
    actions.insertAdjacentElement('afterend',entry);

    const modal=document.createElement('div');
    modal.className='ml-complaints-modal';
    modal.id='medlifeComplaintsModal';
    modal.setAttribute('aria-hidden','true');
    modal.innerHTML=`
      <section class="ml-complaints-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="mlComplaintsModalTitle">
        <div class="ml-complaints-modal__header">
          <div class="ml-complaints-modal__heading">
            <strong id="mlComplaintsModalTitle">صندوق الشكاوى والملاحظات</strong>
            <small>قناة رسمية وآمنة — تقديم الشكوى ومتابعتها بسرية</small>
          </div>
          <button class="ml-complaints-modal__close" id="closeMedlifeComplaints" type="button" aria-label="إغلاق صندوق الشكاوى"><i class="fa-solid fa-xmark" aria-hidden="true"></i> إغلاق</button>
        </div>
        <iframe class="ml-complaints-modal__frame" id="medlifeComplaintsFrame" title="نموذج صندوق الشكاوى والملاحظات" data-src="/complaints.html?embed=1" loading="lazy"></iframe>
      </section>`;
    document.body.appendChild(modal);

    const openButton=document.getElementById('openMedlifeComplaints');
    const closeButton=document.getElementById('closeMedlifeComplaints');
    const frame=document.getElementById('medlifeComplaintsFrame');
    let previousFocus=null;
    let previousOverflow='';

    function openModal(){
      previousFocus=document.activeElement;
      previousOverflow=document.body.style.overflow;
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden','false');
      document.body.classList.add('medlife-complaints-modal-open');
      document.body.style.overflow='hidden';
      if(!frame.getAttribute('src'))frame.setAttribute('src',frame.dataset.src);
      closeButton.focus();
    }
    function closeModal(){
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden','true');
      document.body.classList.remove('medlife-complaints-modal-open');
      document.body.style.overflow=previousOverflow;
      if(previousFocus&&typeof previousFocus.focus==='function')previousFocus.focus();
    }

    openButton.addEventListener('click',openModal);
    closeButton.addEventListener('click',closeModal);
    modal.addEventListener('click',event=>{if(event.target===modal)closeModal();});
    document.addEventListener('keydown',event=>{
      if(event.key==='Escape'&&modal.classList.contains('is-open'))closeModal();
    });

    if(window.location.hash==='#complaints')openModal();
  }

  function waitForContactPage(){
    if(document.getElementById('medlife-contact-v8')){
      initComplaintsModal();
      return;
    }
    // contact-page-v8.js rebuilds the page asynchronously after the navigation scripts.
    let attempts=0;
    const timer=window.setInterval(()=>{
      attempts+=1;
      if(document.getElementById('medlife-contact-v8')){
        window.clearInterval(timer);
        initComplaintsModal();
      }else if(attempts>=40){
        window.clearInterval(timer);
      }
    },100);
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',waitForContactPage,{once:true});
  }else{
    waitForContactPage();
  }
})();