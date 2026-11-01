(function(){
  'use strict';
  if(!/\/contact(?:\.html)?\/?$/i.test(window.location.pathname))return;

  function applyEmbeddedLayout(frame){
    try{
      const doc=frame.contentDocument;
      if(!doc||!doc.documentElement||!doc.body)return;
      doc.documentElement.classList.add('complaints-embed');

      // Remove the duplicate standalone page chrome: the modal already has its own heading.
      doc.querySelector('.hero')?.remove();
      doc.querySelector('.intro-grid')?.remove();
      doc.querySelector('.footer-note')?.remove();
      doc.querySelector('.site-header')?.remove();

      let style=doc.getElementById('medlife-complaints-modal-layout');
      if(!style){
        style=doc.createElement('style');
        style.id='medlife-complaints-modal-layout';
        style.textContent=`
          html,body{width:100%!important;min-width:0!important;min-height:100%!important;margin:0!important;background:#f4f7fa!important;overflow-x:hidden!important}
          body{font-family:Cairo,Arial,sans-serif!important;color:#172b45!important}
          .wrap{width:100%!important;max-width:900px!important;margin:0 auto!important;padding:12px 12px 26px!important;box-sizing:border-box!important}
          .content-grid{display:grid!important;grid-template-columns:minmax(0,1fr)!important;gap:12px!important;align-items:start!important}
          .card{width:100%!important;min-width:0!important;padding:16px!important;border:1px solid #e4eaf0!important;border-radius:15px!important;background:#fff!important;box-shadow:0 5px 18px rgba(16,37,66,.045)!important}
          .card-head{align-items:center!important;gap:10px!important;margin-bottom:13px!important}
          .card-icon{width:38px!important;height:38px!important;flex-basis:38px!important}
          .card-head h2{font-size:17px!important;line-height:1.5!important}
          .card-head p{font-size:11px!important;line-height:1.8!important}
          /* This embedded form must stay single-column even when iOS gives an iframe a desktop layout viewport. */
          form#complaintForm{width:100%!important;min-width:0!important}
          #complaintForm .form-grid{display:grid!important;grid-template-columns:minmax(0,1fr)!important;grid-auto-flow:row!important;gap:12px!important;width:100%!important;min-width:0!important}
          #complaintForm .form-grid>.field,
          #complaintForm .form-grid>.field.wide{grid-column:1/-1!important;display:flex!important;flex-direction:column!important;align-items:stretch!important;gap:6px!important;width:100%!important;min-width:0!important;margin:0!important}
          #complaintForm .field label:not(.anonymous-toggle):not(.consent){display:block!important;width:100%!important;max-width:none!important;margin:0!important;text-align:right!important;font-size:13px!important;line-height:1.7!important}
          #complaintForm .field input:not([type="checkbox"]),
          #complaintForm .field select,
          #complaintForm .field textarea{display:block!important;float:none!important;width:100%!important;max-width:100%!important;min-width:0!important;min-height:48px!important;margin:0!important;padding:11px 13px!important;border:1px solid #d9e1eb!important;border-radius:11px!important;background:#fff!important;font-family:Cairo,Arial,sans-serif!important;font-size:16px!important;line-height:1.65!important;box-sizing:border-box!important}
          #complaintForm .field textarea{min-height:130px!important;resize:vertical!important}
          #complaintForm .field .help{display:block!important;width:100%!important;font-size:10px!important;line-height:1.7!important}
          #complaintForm .anonymous-toggle,
          #complaintForm .consent{display:flex!important;flex-direction:row!important;align-items:flex-start!important;justify-content:flex-start!important;width:100%!important;max-width:100%!important;min-width:0!important;margin:0!important;padding:12px!important;gap:10px!important;box-sizing:border-box!important;border-radius:11px!important;font-size:12px!important;line-height:1.8!important}
          #complaintForm .anonymous-toggle>input[type="checkbox"],
          #complaintForm .consent>input[type="checkbox"]{display:block!important;appearance:auto!important;-webkit-appearance:checkbox!important;flex:0 0 20px!important;width:20px!important;height:20px!important;min-width:20px!important;min-height:20px!important;margin:2px 0 0!important;padding:0!important;box-sizing:border-box!important;accent-color:#bd2547!important}
          #complaintForm .anonymous-copy{display:block!important;flex:1 1 auto!important;min-width:0!important}
          #complaintForm .anonymous-copy strong{display:block!important;font-size:13px!important;line-height:1.7!important}
          #complaintForm .anonymous-copy small{display:block!important;font-size:11px!important;line-height:1.7!important}
          #complaintForm .consent span{display:block!important;flex:1 1 auto!important;min-width:0!important;font-size:11px!important;line-height:1.8!important}
          #complaintForm .form-actions{display:flex!important;flex-direction:column!important;align-items:stretch!important;gap:10px!important;width:100%!important}
          #complaintForm .form-actions>*{display:flex!important;width:100%!important;max-width:none!important;min-width:0!important;justify-content:center!important}
          #complaintForm .primary-btn,
          #trackForm .primary-btn,
          #complaintForm .secondary-btn{min-height:48px!important;font-size:13px!important}
          #nameField[style*="display: none"],
          #contactField[style*="display: none"]{display:none!important}
          .result-box{padding:12px!important}
          .result-box h3{font-size:14px!important}
          .result-box p,.secret-warning{font-size:11px!important}
          .result-field{grid-template-columns:minmax(0,1fr) auto!important}
          .copy-btn{font-size:11px!important}
          .track-card{position:static!important;top:auto!important}
          .track-form{gap:12px!important}
          .track-result{padding:12px!important}
          .track-top strong{font-size:14px!important}
          .track-top small,.track-events strong,.track-events p{font-size:11px!important;line-height:1.8!important}
          .state-pill{font-size:10px!important}
          .privacy-card{margin-top:10px!important;padding:11px!important;font-size:10px!important;line-height:1.8!important}
          @media(max-width:560px){
            .wrap{padding:10px 9px 20px!important}
            .card{padding:13px!important;border-radius:13px!important}
            .card-head h2{font-size:16px!important}
            .result-field{grid-template-columns:minmax(0,1fr)!important}
            .copy-btn{width:100%!important}
          }
        `;
        doc.head.appendChild(style);
      }
    }catch(error){
      // Keep the original secure complaint form available if the browser blocks frame styling.
      console.warn('MedLife complaints modal layout could not be applied.',error);
    }
  }

  function initComplaintsModal(){
    if(document.getElementById('medlifeComplaintsModal'))return;
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
      .ml-complaints-modal__dialog{display:flex;flex-direction:column;width:min(920px,100%);height:min(90vh,940px);min-height:360px;overflow:hidden;border:1px solid rgba(255,255,255,.55);border-radius:20px;background:#f4f7fa;box-shadow:0 24px 80px rgba(0,0,0,.28)}
      .ml-complaints-modal__header{display:flex;align-items:center;justify-content:space-between;gap:12px;flex:none;padding:12px 17px;background:#fff;border-bottom:1px solid #e7edf3}
      .ml-complaints-modal__heading{min-width:0}
      .ml-complaints-modal__heading strong{display:block;color:#071b3a;font-size:15px;font-weight:900}
      .ml-complaints-modal__heading small{display:block;margin-top:2px;color:#718198;font-size:10px}
      .ml-complaints-modal__close{display:inline-flex;align-items:center;justify-content:center;gap:7px;flex:none;min-height:36px;padding:7px 11px;border:1px solid #e3e8ef;border-radius:10px;background:#fff;color:#475a70;font:800 11px Cairo,Arial,sans-serif;cursor:pointer}
      .ml-complaints-modal__close:hover{background:#fff5f7;border-color:#f0cbd4;color:#a32140}
      .ml-complaints-modal__frame{display:block;flex:1 1 auto;width:100%;height:100%;min-height:0;max-height:100%;border:0;background:#f4f7fa}
      @media(max-width:560px){.ml-complaints-modal{padding:0}.ml-complaints-modal__dialog{width:100%;height:100vh;height:100dvh;min-height:0;border:0;border-radius:0}.ml-complaints-modal__header{padding:10px 12px}.ml-complaints-modal__heading strong{font-size:13px}}
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
        <iframe class="ml-complaints-modal__frame" id="medlifeComplaintsFrame" title="نموذج صندوق الشكاوى والملاحظات" data-src="/complaints.html?embed=1&layout=2" loading="lazy"></iframe>
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

    frame.addEventListener('load',()=>applyEmbeddedLayout(frame));
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

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',waitForContactPage,{once:true});
  else waitForContactPage();
})();