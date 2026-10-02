// MEDLIFE homepage member authentication entry point.
// The homepage used to show a placeholder login modal. Route members to the real login page.
(function(){
  function wire(){
    const btn=document.getElementById('loginBtn');
    const mobile=document.getElementById('mobileLoginBtn');
    const go=()=>{window.location.href='login.html'};
    if(btn){btn.onclick=go;btn.setAttribute('aria-label','دخول الأعضاء');}
    if(mobile){mobile.onclick=go;}
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',wire);
  else wire();
})();
