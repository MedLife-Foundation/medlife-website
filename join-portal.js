(function(){
  "use strict";
  const $=(id)=>document.getElementById(id);
  const form=$("form");
  if(!form)return;

  const gate=document.createElement("div");
  gate.id="joinGate";
  gate.className="join-gate";
  gate.textContent="جارٍ التحقق من حالة باب الانضمام...";
  form.parentNode.insertBefore(gate,form);

  const deptWrap=document.createElement("div");
  deptWrap.className="full";
  deptWrap.innerHTML='<label>الأقسام التي ترغب بالانضمام إليها</label><div id="joinDepartments" class="departments"><div style="font-size:11px;color:#64748b">جارٍ تحميل الأقسام...</div></div><div style="font-size:10px;color:#64748b;margin-top:7px">يمكن اختيار أكثر من قسم، والتوزيع النهائي يحدده HR حسب الاحتياج.</div>';
  const motivation=$("motivation")?.closest("div.full");
  if(motivation) motivation.parentNode.insertBefore(deptWrap,motivation.nextSibling);

  let open=false;

  async function load(){
    try{
      const [r,u]=await Promise.all([
        fetch("/api/management?resource=volunteer_recruitment",{cache:"no-store"}),
        fetch("/api/management?resource=join_units",{cache:"no-store"})
      ]);
      const rc=await r.json(), units=await u.json();
      const cfg=rc.data?.[0]||{};
      const now=Date.now();
      const opens=cfg.opens_at?Date.parse(cfg.opens_at):null;
      const closes=cfg.closes_at?Date.parse(cfg.closes_at):null;
      open=Boolean(cfg.is_open)&&(!opens||now>=opens)&&(!closes||now<closes);
      gate.className="join-gate "+(open?"open":"closed");
      gate.textContent=open?(cfg.title||"باب الانضمام مفتوح"):(cfg.closed_message||"باب الانضمام مغلق حالياً.");
      const list=units.data||[];
      $("joinDepartments").innerHTML=list.length?list.map(x=>{
        const value=String(x.name_ar||x.name_en||"");
        return '<label><input type="checkbox" name="requested_department" value="'+value.replace(/"/g,"&quot;")+'"><span>'+value+'</span></label>';
      }).join(""):"<div style='font-size:11px;color:#64748b'>لا توجد أقسام متاحة حالياً.</div>";
      if(!open) form.querySelectorAll("input,select,textarea,button").forEach(el=>{el.disabled=true});
    }catch(_){
      open=false;
      gate.className="join-gate closed";
      gate.textContent="تعذر التحقق من حالة باب الانضمام. يرجى المحاولة لاحقاً.";
      form.querySelectorAll("input,select,textarea,button").forEach(el=>{el.disabled=true});
    }
  }

  form.addEventListener("submit",async function(e){
    e.preventDefault();
    e.stopImmediatePropagation();
    if(!open)return;
    const required=["email","password","full_name","mother_name","national_id","gender","phone","governorate","academic_status","interest"];
    for(const id of required){
      if(!$(id)?.value){alert("يرجى تعبئة جميع الحقول الإلزامية.");$(id)?.focus();return}
    }
    if(!$("consent")?.checked){alert("يرجى الموافقة قبل الإرسال.");return}

    const ids=[
      "email","password","full_name","mother_name","national_id","gender","phone","governorate","address",
      "academic_status","university","faculty","study_year","graduation_year","profession","workplace",
      "resident_specialty","residency_year","residency_hospital","doctor_graduation_year","doctor_specialty",
      "doctor_workplace","specialty","specialist_graduation_year","specialist_workplace","interest","motivation"
    ];
    const data={};
    ids.forEach(id=>data[id]=$(id)?.value||"");
    data.requested_departments=[...form.querySelectorAll('input[name="requested_department"]:checked')].map(x=>x.value);

    const button=$("submit"),msg=$("msg");
    button.disabled=true;
    msg.className="msg show";
    msg.textContent="جارٍ إرسال الطلب...";
    try{
      const legacy=await fetch("/api/new-member",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});
      const legacyJson=await legacy.json().catch(()=>({}));
      if(!legacy.ok||!legacyJson.success)throw new Error(legacyJson.error||"تعذر إرسال الطلب");

      const {password,...safe}=data;
      const management=await fetch("/api/management",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...safe,application_kind:"new_member"})});
      const managementJson=await management.json().catch(()=>({}));
      if(!management.ok||!managementJson.success)console.warn("Management sync failed");

      msg.className="msg show ok";
      msg.textContent="تم استلام طلبك بنجاح. سيقوم فريق الموارد البشرية بمراجعته والتواصل معك عند الحاجة.";
      form.reset();
    }catch(err){
      msg.className="msg show err";
      msg.textContent=err.message||"تعذر إرسال الطلب حالياً.";
    }finally{
      button.disabled=!open;
    }
  },true);

  void load();
})();