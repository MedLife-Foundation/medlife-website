const $=id=>document.getElementById(id);const esc=v=>String(v??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
function exec(cmd,val=null){$('editor').focus();document.execCommand(cmd,false,val)}
document.querySelectorAll('[data-cmd]').forEach(b=>b.onclick=()=>exec(b.dataset.cmd,b.dataset.value||null));document.querySelectorAll('[data-block]').forEach(b=>b.onclick=()=>exec('formatBlock','<'+b.dataset.block+'>'));
$('link').onclick=()=>{const u=prompt('أدخل الرابط:');if(u)exec('createLink',u)};$('hr').onclick=()=>exec('insertHorizontalRule');$('clear').onclick=()=>exec('removeFormat');
$('callout').onclick=()=>exec('insertHTML','<div class="callout"><strong>⚠️ تنبيه:</strong> اكتب التنبيه هنا.</div><p><br></p>');$('faq').onclick=()=>exec('insertHTML','<h3>❓ سؤال شائع</h3><p><strong>السؤال:</strong> اكتب السؤال هنا.</p><p><strong>الإجابة:</strong> اكتب الإجابة هنا.</p><p><br></p>');
$('table').onclick=()=>{const rows=Math.max(2,Math.min(8,Number(prompt('عدد الصفوف؟','3'))||3)),cols=Math.max(2,Math.min(6,Number(prompt('عدد الأعمدة؟','3'))||3));let h='<table><thead><tr>';for(let c=0;c<cols;c++)h+='<th>عنوان</th>';h+='</tr></thead><tbody>';for(let r=1;r<rows;r++){h+='<tr>';for(let c=0;c<cols;c++)h+='<td>محتوى</td>';h+='</tr>'}exec('insertHTML',h+'</tbody></table><p><br></p>')};

function setupImageUpload(){
  const toolbar=document.querySelector('.toolbar');if(!toolbar||document.getElementById('articleImageBtn'))return;
  const btn=document.createElement('button');btn.type='button';btn.className='tool';btn.id='articleImageBtn';btn.textContent='📷 صورة';btn.title='رفع صورة أو أكثر وإدراجها داخل المقال';
  const input=document.createElement('input');input.type='file';input.accept='image/jpeg,image/png,image/webp,image/gif,image/avif';input.multiple=true;input.hidden=true;input.id='articleImageInput';
  const status=document.createElement('span');status.id='articleImageStatus';status.style.cssText='font-size:11px;color:#64748b;align-self:center';
  btn.onclick=()=>input.click();
  input.onchange=async()=>{const files=[...input.files||[]];if(!files.length)return;if(files.length>5){status.textContent='يمكن رفع 5 صور كحد أقصى.';input.value='';return}
    if(!$('title_ar').value.trim()||!$('author_name').value.trim()){status.textContent='اكتب عنوان المقال واسم الكاتب أولاً.';input.value='';return}
    for(const file of files){if(file.size>8*1024*1024){status.textContent=`الصورة ${file.name} أكبر من 8MB.`;input.value='';return}}
    const form=new FormData();files.forEach(f=>form.append('images',f));form.append('title_ar',$('title_ar').value.trim());form.append('author_name',$('author_name').value.trim());
    status.textContent='جاري رفع الصور…';btn.disabled=true;
    try{const r=await fetch('/api/article-images',{method:'POST',body:form,credentials:'include'});const raw=await r.text();let d={};try{d=raw?JSON.parse(raw):{}}catch{d={}}if(!r.ok||!d.success)throw Error(d.error||`تعذر رفع الصور (HTTP ${r.status}).`);
      const images=d.images||[];$('editor').focus();
      images.forEach(img=>{const alt=prompt(`وصف الصورة (Alt Text) — ${img.name}`,'صورة مرتبطة بالمقال')||'صورة مرتبطة بالمقال';exec('insertHTML',`<figure class="article-image" style="margin:20px 0;text-align:center"><img src="${esc(img.url)}" alt="${esc(alt)}" loading="lazy" style="max-width:100%;height:auto;border-radius:14px"><figcaption style="font-size:12px;color:#64748b;margin-top:6px">${esc(alt)}</figcaption></figure><p><br></p>`)});
      status.textContent=`✅ تم رفع ${images.length} ${images.length===1?'صورة':'صور'}.`;setTimeout(()=>{status.textContent=''},3500);
    }catch(err){status.textContent='❌ '+(err&&err.message?err.message:'تعذر رفع الصور.');console.error('MedLife image upload failed:',err)}finally{btn.disabled=false;input.value=''}
  };
  toolbar.append(btn,input,status);
}
setupImageUpload();

function setupImageDownloads(){
  const editor=$('editor');if(!editor||editor.dataset.medlifeDownloadControls==='1')return;
  editor.dataset.medlifeDownloadControls='1';
  const enhance=()=>editor.querySelectorAll('figure.article-image img').forEach(img=>{
    const figure=img.closest('figure');if(!figure||figure.querySelector('.article-image-download'))return;
    const wrap=figure.ownerDocument.createElement('div');wrap.style.cssText='display:flex;justify-content:center;gap:8px;flex-wrap:wrap;margin-top:8px';
    const btn=figure.ownerDocument.createElement('button');btn.type='button';btn.className='tool article-image-download';btn.textContent='⬇️ تحميل الصورة';btn.title='تحميل الصورة إلى جهازك';
    btn.onclick=async()=>{try{btn.disabled=true;btn.textContent='⏳ جاري التحميل…';const src=img.getAttribute('src')||'';const r=await fetch('/api/article-image-download?url='+encodeURIComponent(src),{credentials:'include'});if(!r.ok)throw Error('تعذر تحميل الصورة.');const blob=await r.blob();const u=URL.createObjectURL(blob);const a=document.createElement('a');a.href=u;a.download=(img.alt||'medlife-article-image').replace(/[^\p{L}\p{N}_-]+/gu,'-').slice(0,80)+'.'+((blob.type.split('/')[1]||'jpg').replace('jpeg','jpg'));document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000)}catch(e){alert(e.message||'تعذر تحميل الصورة.')}finally{btn.disabled=false;btn.textContent='⬇️ تحميل الصورة'}};
    wrap.appendChild(btn);figure.appendChild(wrap);
  });
  enhance();new MutationObserver(enhance).observe(editor,{subtree:true,childList:true});
}
setupImageDownloads();

function addRef(){const r=document.createElement('div');r.className='ref';r.innerHTML='<input class="r-title" placeholder="عنوان المرجع"><input class="r-org" placeholder="الجهة / المجلة"><input class="r-year" type="number" placeholder="السنة"><input class="r-url" placeholder="الرابط أو DOI"><button type="button" class="btn">حذف</button>';r.querySelector('button').onclick=()=>r.remove();$('refs').appendChild(r)}
function refs(){return [...document.querySelectorAll('.ref')].map(r=>({title:r.querySelector('.r-title').value.trim(),organization:r.querySelector('.r-org').value.trim(),year:r.querySelector('.r-year').value.trim(),url:r.querySelector('.r-url').value.trim()})).filter(x=>x.title)}addRef();$('addRef').onclick=addRef;
function brief(){return {article_type:$('article_type').value,intended_audience:$('audience').value,goal:$('goal').value,suggested_sections:$('sections').value,key_questions:$('questions').value,desired_tone:$('tone').value,visual_preferences:$('presentation').value,source_types:[...document.querySelectorAll('.source input:checked')].map(x=>x.value),required_sources:$('required_sources').value,medical_safety:$('medical_safety').value,safety_focus:$('safety_focus').value,notes:$('notes').value}}
$('image_url').oninput=()=>{const u=$('image_url').value.trim();$('cover').innerHTML=u?'<img src="'+esc(u)+'" alt="غلاف المقال" onerror="this.parentElement.textContent=\'تعذر تحميل الصورة\'">':'معاينة الغلاف'};
function preview(){const b=brief(),r=refs();$('preview').innerHTML='<h1>'+esc($('title_ar').value||'بدون عنوان')+'</h1>'+( $('excerpt_ar').value?'<p>'+esc($('excerpt_ar').value)+'</p>':'')+($('image_url').value?'<img src="'+esc($('image_url').value)+'" alt="غلاف المقال">':'')+($('editor').innerHTML||'<p>لا يوجد محتوى.</p>')+'<h2>Editorial Brief</h2><ul><li>النوع: '+esc(b.article_type)+'</li><li>الجمهور: '+esc(b.intended_audience)+'</li><li>النبرة: '+esc(b.desired_tone)+'</li><li>العرض: '+esc(b.visual_preferences)+'</li><li>السلامة: '+esc(b.medical_safety)+'</li></ul>'+(r.length?'<h2>المراجع</h2><ol>'+r.map(x=>'<li>'+esc(x.title)+' — '+esc(x.organization)+(x.year?' ('+esc(x.year)+')':'')+(x.url?' — <a href="'+esc(x.url)+'" target="_blank" rel="noopener">الرابط</a>':'')+'</li>').join('')+'</ol>':'');$('modal').classList.add('show')}$('previewBtn').onclick=preview;$('close').onclick=()=>$('modal').classList.remove('show');
$('form').onsubmit=async e=>{e.preventDefault();const m=$('msg');m.className='';m.textContent='جاري إرسال المقال وحفظ المعلومات التحريرية…';try{if(!$('title_ar').value.trim()||!$('author_name').value.trim()||!$('editor').innerText.trim())throw Error('يرجى إكمال العنوان واسم الكاتب ومحتوى المقال.');const payload={title_ar:$('title_ar').value.trim(),title_en:$('title_en').value.trim(),excerpt_ar:$('excerpt_ar').value.trim(),author_name:$('author_name').value.trim(),author_email:$('author_email').value.trim(),category:$('category').value,author_member_id:Number($('member_id').value)||undefined,content_ar:$('editor').innerHTML,image_url:$('image_url').value.trim(),status:'pending',references:refs(),editorial_brief:brief()};let r=await fetch('/api/articles',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify(payload)}),d=await r.json().catch(()=>({}));if(!r.ok||!d.success)throw Error(d.error||`تعذر إرسال المقال (HTTP ${r.status}).`);m.className='success';m.textContent='✅ تم إرسال المقال للمراجعة بنجاح. رقم المقال: '+(d.id||'—');$('form').reset();$('editor').innerHTML='';$('refs').innerHTML='';addRef();$('cover').textContent='معاينة الغلاف'}catch(err){m.className='error';m.textContent='❌ '+(err&&err.message?err.message:'تعذر إرسال المقال.');console.error('MedLife article submission failed:',err)}};
