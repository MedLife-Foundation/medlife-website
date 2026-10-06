const CLOUDINARY_CLOUD_NAME="pyvrk863";
const CLOUDINARY_UPLOAD_PRESET="medlife_supervisor_photo";
const MAX_BYTES=5*1024*1024;
const ALLOWED_TYPES=new Set(["image/jpeg","image/png","image/webp"]);

function json(body,status=200){
  return new Response(JSON.stringify(body),{
    status,
    headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}
  });
}

export async function onRequestPost({request}){
  try{
    const form=await request.formData();
    const file=form.get("file");
    if(!file || typeof file==="string") return json({success:false,error:"لم يتم اختيار ملف صورة."},400);
    const type=String(file.type||"").toLowerCase();
    const size=Number(file.size||0);
    if(!ALLOWED_TYPES.has(type)) return json({success:false,error:"يرجى اختيار صورة بصيغة JPG أو PNG أو WebP."},400);
    if(size<=0 || size>MAX_BYTES) return json({success:false,error:"حجم الصورة يجب ألا يتجاوز 5 ميغابايت."},400);

    const body=new FormData();
    body.append("file",file,file.name||"medlife-profile-image");
    body.append("upload_preset",CLOUDINARY_UPLOAD_PRESET);

    const response=await fetch("https://api.cloudinary.com/v1_1/"+encodeURIComponent(CLOUDINARY_CLOUD_NAME)+"/image/upload",{
      method:"POST",
      body
    });
    const payload=await response.json().catch(()=>({}));
    if(!response.ok || !payload.secure_url || !payload.public_id){
      const message=payload?.error?.message||"تعذر رفع الصورة إلى Cloudinary.";
      return json({success:false,error:message},502);
    }

    return json({
      success:true,
      secure_url:String(payload.secure_url),
      public_id:String(payload.public_id)
    });
  }catch(error){
    console.error("Cloudinary profile upload error",error);
    return json({success:false,error:"تعذر رفع الصورة الشخصية حالياً."},500);
  }
}
