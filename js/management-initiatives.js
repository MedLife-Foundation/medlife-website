(function(){
"use strict";

const TYPES={
  medical:"طبي",
  awareness:"توعية",
  training:"تدريب",
  humanitarian:"إنساني",
  community:"مجتمعي",
  school:"مدارس",
  other:"أخرى"
};

const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const safeUrl=v=>{
  try{
    const u=new URL(String(v||""),location.origin);
    return u.protocol==="https:" || u.origin===location.origin ? u.href : "";
  }catch{return "";}
};
const formatDate=v=>{
  if(!v)return "";
  const d=new Date(v);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("ar-SY",{year:"numeric",month:"long",day:"numeric"});
};

async function load(){
  const host=document.getElementById("managementActivities");
  const filtersHost=document.getElementById("activityFilters");
  if(!host)return;

  try{
    const r=await fetch("/api/management?resource=activities&limit=50",{headers:{Accept:"application/json"},cache:"no-store"});
    if(!r.ok)throw new Error("activities request failed");
    const payload=await r.json();
    const rows=Array.isArray(payload?.data)?payload.data:[];

    if(!rows.length){
      host.innerHTML='<div class="activities-empty">لا توجد أنشطة منشورة للعامة حاليًا.</div>';
      if(filtersHost)filtersHost.innerHTML="";
      return;
    }

    const typeValues=[...new Set(rows.map(x=>String(x.activity_type||"other")))];
    const filters=["all",...typeValues];

    if(filtersHost){
      filtersHost.innerHTML=filters.map((key,i)=>'<button type="button" class="activities-filter '+(i===0?"active":"")+'" data-filter="'+esc(key)+'">'+(key==="all"?"الكل":esc(TYPES[key]||key))+"</button>").join("");
    }

    const render=filter=>{
      const visible=filter==="all"?rows:rows.filter(x=>String(x.activity_type||"other")===filter);
      if(!visible.length){
        host.innerHTML='<div class="activities-empty">لا توجد أنشطة ضمن هذا التصنيف.</div>';
        return;
      }

      host.innerHTML='<div class="activities-grid">'+visible.map(x=>{
        const image=safeUrl(x.cover_image_url);
        const type=TYPES[x.activity_type]||x.activity_type||"نشاط";
        const date=formatDate(x.start_at);
        const location=[x.city,x.governorate].filter(Boolean).join(" — ");
        return '<article class="activity-card">'+
          '<div class="activity-cover '+(image?"":"placeholder")+'">'+
            (image
              ? '<img src="'+image+'" alt="'+esc(x.title||"نشاط ميدلايف")+'" loading="lazy">'
              : '<img src="/logo.PNG" alt="ميدلايف" loading="lazy"><span class="activity-no-image">لم تتم إضافة صورة</span>')+
          '</div>'+
          '<div class="activity-body">'+
            '<div class="activity-meta"><span class="activity-chip primary">'+esc(type)+'</span>'+(date?'<span class="activity-chip">'+esc(date)+'</span>':"")+'</div>'+
            '<h2>'+esc(x.title||"نشاط ميدلايف")+'</h2>'+
            '<p>'+esc(x.description||"نشاط من أنشطة ميدلايف المنشورة.")+'</p>'+
            '<div class="activity-info">'+
              (location?'<div><strong>المكان</strong>'+esc(location)+'</div>':"")+
              (x.participant_count!=null?'<div><strong>المشاركون</strong>'+esc(String(x.participant_count))+'</div>':"")+
            '</div>'+
          '</div>'+
        '</article>';
      }).join("")+'</div>';
    };

    render("all");

    filtersHost?.querySelectorAll(".activities-filter").forEach(button=>{
      button.addEventListener("click",()=>{
        filtersHost.querySelectorAll(".activities-filter").forEach(b=>b.classList.remove("active"));
        button.classList.add("active");
        render(button.dataset.filter||"all");
      });
    });
  }catch(error){
    console.warn("Management activities integration skipped",error);
    host.innerHTML='<div class="activities-empty">تعذر تحميل الأنشطة المنشورة حاليًا.</div>';
  }
}

if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",load,{once:true});
else load();
})();