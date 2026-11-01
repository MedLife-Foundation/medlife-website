(() => {
  'use strict';

  const ROOT_ID = 'medlife-contact-v8';
  const STYLE_ID = 'medlife-contact-v11-style';
  const BRAND = '/logo.PNG?v=20261102-contact11';

  const locations = [
    ['ميدلايف طرطوس', 34.8959, 35.8867, 'المكتب الرئيسي لمؤسسة ميدلايف في طرطوس.'],
    ['ميدلايف بانياس', 35.1818, 35.9486, 'فريق ميدلايف في بانياس.'],
    ['ميدلايف اللاذقية', 35.5317, 35.7914, 'فريق ميدلايف في اللاذقية.'],
    ['ميدلايف حمص', 34.7324, 36.7137, 'فريق ميدلايف في حمص.'],
    ['ميدلايف دمشق', 33.5138, 36.2765, 'فريق ميدلايف في دمشق.'],
    ['ميدلايف حلب', 36.2021, 37.1343, 'فريق ميدلايف في حلب.'],
    ['ميدلايف الحسكة', 36.5024, 40.7477, 'فريق ميدلايف في الحسكة.']
  ];

  const socialLinks = [
    ['Facebook', 'الصفحة الرسمية لمؤسسة ميدلايف', 'https://www.facebook.com/Medlifesy', 'fa-facebook-f'],
    ['أثر ميدلايف', 'الأنشطة والمبادرات الإنسانية', 'https://www.facebook.com/medlifesyathar/', 'fa-facebook-f'],
    ['Instagram', 'المحتوى الطبي', 'https://www.instagram.com/medlifesy/', 'fa-instagram'],
    ['Instagram Trends', 'الريلز والأنشطة ضمن الجامعات', 'https://www.instagram.com/medlifesy_trends/', 'fa-instagram'],
    ['Instagram Athar', 'الأنشطة الميدانية والمبادرات', 'https://www.instagram.com/medlifesy_athar/', 'fa-instagram'],
    ['Instagram Forum', 'منتدى ميدلايف', 'https://www.instagram.com/medlifesy_forum/', 'fa-instagram'],
    ['Telegram', 'القناة الرسمية لميدلايف', 'https://t.me/medlife0', 'fa-telegram'],
    ['Telegram Clinical', 'المحتوى السريري والطبي', 'https://t.me/medlifesy_clinical', 'fa-telegram'],
    ['YouTube', 'الفيديو والمحتوى المرئي', 'https://www.youtube.com/@medlifesy', 'fa-youtube'],
    ['LinkedIn', 'الحضور المهني والمؤسسي', 'https://www.linkedin.com/company/med-life-syria', 'fa-linkedin-in']
  ];

  function addStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = [
      "html{scroll-behavior:smooth}",
      "body{margin:0!important;background:#fbfaf8!important;color:#10182f!important;font-family:Cairo,Arial,sans-serif!important;overflow-x:hidden!important}",
      ".mc11-nav{position:sticky;top:0;z-index:2600;background:rgba(255,255,255,.97);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border-bottom:1px solid #e7e4e1;box-shadow:0 4px 16px rgba(16,24,47,.045);direction:rtl;font-family:Cairo,Arial,sans-serif}",
      ".mc11-nav .inner{width:min(1240px,calc(100% - 32px));min-height:66px;margin:auto;display:flex;align-items:center;gap:16px}",
      ".mc11-nav .brand{display:flex;align-items:center;flex:none}.mc11-nav .brand img{display:block;width:48px;height:48px;object-fit:contain}",
      ".mc11-nav nav{display:flex;align-items:center;justify-content:center;gap:2px;flex:1;min-width:0}",
      ".mc11-nav nav a{display:flex;align-items:center;justify-content:center;min-height:42px;padding:0 10px;border-radius:9px;color:#182039;text-decoration:none;white-space:nowrap;font-size:11px;font-weight:800;transition:.18s}",
      ".mc11-nav nav a:hover,.mc11-nav nav a.active{color:#df3658;background:#fff3f5}",
      ".mc11-nav .nav-actions{display:flex;align-items:center;gap:7px;flex:none}",
      ".mc11-nav .nav-actions a{padding:8px 12px;border:1px solid #e2dedb;border-radius:10px;text-decoration:none;color:#10182f;font-size:10px;font-weight:900;white-space:nowrap}",
      ".mc11-nav .nav-actions a.join{background:#df3658;color:#fff;border-color:#df3658}",
      ".mc11-nav .menu{display:none;border:1px solid #dedfe4;border-radius:10px;background:#fff;color:#10182f;padding:9px 13px;font:800 11px Cairo,Arial,sans-serif;cursor:pointer}",
      ".mc11-nav .mobile{display:none;background:#fff;border-top:1px solid #eee9e6;padding:6px 14px 12px}",
      ".mc11-nav .mobile.open{display:grid;grid-template-columns:1fr 1fr;gap:6px}",
      ".mc11-nav .mobile a{display:flex;align-items:center;justify-content:center;min-height:39px;padding:7px;border:1px solid #eee8e4;border-radius:9px;text-decoration:none;color:#10182f;font:800 10px Cairo,Arial,sans-serif}",
      ".mc11-nav .mobile a.active{color:#df3658;border-color:#f0cbd4;background:#fff6f8}.mc11-nav .mobile a.join{background:#df3658;color:#fff;border-color:#df3658}",
      "#"+ROOT_ID+"{direction:rtl;background:#fbfaf8;color:#10182f;min-height:100vh;font-family:Cairo,Arial,sans-serif;overflow:hidden}",
      "#"+ROOT_ID+" *{box-sizing:border-box}",
      "#"+ROOT_ID+" a{ text-decoration:none }",
      "#"+ROOT_ID+" .mc11-hero{padding:34px 16px 24px}",
      "#"+ROOT_ID+" .mc11-hero-panel{position:relative;isolation:isolate;overflow:hidden;width:min(1060px,100%);margin:auto;padding:30px 24px 27px;border:1px solid rgba(255,255,255,.12);border-radius:28px;background:linear-gradient(135deg,#11192f 0%,#242b42 100%);color:#fff;text-align:center;box-shadow:0 18px 46px rgba(16,24,47,.12)}",
      "#"+ROOT_ID+" .mc11-hero-panel:before{content:'';position:absolute;z-index:-1;width:270px;height:270px;top:-175px;right:-100px;border-radius:50%;background:rgba(255,255,255,.045)}",
      "#"+ROOT_ID+" .mc11-logo{display:grid;place-items:center;width:108px;height:108px;margin:0 auto 15px;padding:8px;border:5px solid #fff;border-radius:50%;background:#fff;box-shadow:0 8px 22px rgba(0,0,0,.16)}",
      "#"+ROOT_ID+" .mc11-logo img{display:block;width:100%;height:100%;object-fit:contain;border-radius:50%}",
      "#"+ROOT_ID+" .mc11-kicker{display:inline-flex;align-items:center;justify-content:center;padding:7px 14px;border:1px solid rgba(255,255,255,.2);border-radius:999px;background:rgba(255,255,255,.09);color:#ff6884;font-size:12px;font-weight:900}",
      "#"+ROOT_ID+" h1{margin:12px 0 6px;color:#fff;font-size:clamp(34px,5vw,48px);font-weight:900;line-height:1.2}",
      "#"+ROOT_ID+" h1 span{color:#ff5b7b}",
      "#"+ROOT_ID+" .mc11-hero-copy{max-width:680px;margin:0 auto;color:#e4e7ed;font-size:13px;line-height:1.9}",
      "#"+ROOT_ID+" .mc8-content{width:min(1120px,calc(100% - 36px));margin:auto;padding:22px 0 0}",
      "#"+ROOT_ID+" .mc8-title{margin:0 0 20px;text-align:right}",
      "#"+ROOT_ID+" .mc8-title small{display:inline-block;padding:5px 10px;border-radius:7px;background:#fff0f3;color:#df3658;font-size:11px;font-weight:900}",
      "#"+ROOT_ID+" .mc8-title h2{margin:7px 0 3px;color:#10182f;font-size:30px;font-weight:900;line-height:1.4}",
      "#"+ROOT_ID+" .mc8-title p{margin:0;color:#7a8291;font-size:12px;line-height:1.8}",
      "#"+ROOT_ID+" .mc8-main{display:grid;grid-template-columns:minmax(0,1.08fr) minmax(300px,.92fr);gap:18px;align-items:start}",
      "#"+ROOT_ID+" .mc8-card{min-width:0;padding:22px;border:1px solid #e8e2de;border-radius:22px;background:#fff;box-shadow:0 9px 28px rgba(16,24,47,.045)}",
      "#"+ROOT_ID+" .mc8-card-head{display:flex;align-items:center;gap:12px;margin:0 0 12px}",
      "#"+ROOT_ID+" .mc8-card-head img{width:48px;height:48px;padding:4px;border:2px solid #e23b5d;border-radius:50%;object-fit:contain;background:#fff;flex:none}",
      "#"+ROOT_ID+" .mc8-card-head h3{margin:0;color:#10182f;font-size:21px;font-weight:900;line-height:1.4}",
      "#"+ROOT_ID+" .mc8-card-head p{margin:2px 0 0;color:#7c8492;font-size:11px;line-height:1.7}",
      "#"+ROOT_ID+" .mc8-contact-list{display:grid;grid-template-columns:1fr 1fr;gap:0 18px}",
      "#"+ROOT_ID+" .mc8-item{display:flex;align-items:flex-start;gap:11px;min-width:0;padding:14px 0;border-bottom:1px solid #f0ece9}",
      "#"+ROOT_ID+" .mc8-item:nth-last-child(-n+2){border-bottom:0}",
      "#"+ROOT_ID+" .mc8-icon{display:grid;place-items:center;width:42px;height:42px;flex:none;border-radius:13px;background:#fff0f3;color:#df3658;font-size:17px}",
      "#"+ROOT_ID+" .mc8-item>div:last-child{min-width:0}",
      "#"+ROOT_ID+" .mc8-item strong{display:block;margin-bottom:3px;color:#151d35;font-size:12px;font-weight:900;line-height:1.6}",
      "#"+ROOT_ID+" .mc8-item small{display:block;color:#7a8291;font-size:10px;line-height:1.75}",
      "#"+ROOT_ID+" .mc8-item a{display:inline-block;margin-top:3px;color:#263044;font-size:11px;font-weight:900;direction:ltr;unicode-bidi:isolate;text-align:left;white-space:nowrap}",
      "#"+ROOT_ID+" .mc8-item a:hover{color:#df3658}",
      "#"+ROOT_ID+" .mc8-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:17px}",
      "#"+ROOT_ID+" .mc8-action{display:flex;align-items:center;justify-content:center;min-width:0;min-height:46px;padding:9px 10px;border:1px solid #e7e1dd;border-radius:12px;background:#fff;color:#10182f;text-align:center;font-size:11px;font-weight:900;line-height:1.55;transition:.18s}",
      "#"+ROOT_ID+" .mc8-action:hover{transform:translateY(-2px);border-color:#e23b5d;background:#fff8fa;color:#b32949}",
      "#"+ROOT_ID+" .mc8-map-card{min-width:0}",
      "#"+ROOT_ID+" .mc8-map{width:100%;height:350px;overflow:hidden;border:1px solid #e6e0dc;border-radius:16px;background:#f0efeb;direction:ltr}",
      "#"+ROOT_ID+" .mc8-map .leaflet-container{font-family:Cairo,Arial,sans-serif}",
      "#"+ROOT_ID+" .mc8-pin-wrap{background:transparent!important;border:0!important}",
      "#"+ROOT_ID+" .mc8-pin{display:block;width:29px;height:29px;border:3px solid #fff;border-radius:50%;background:#e23b5d;box-shadow:0 5px 14px rgba(16,24,47,.24);position:relative}",
      "#"+ROOT_ID+" .mc8-pin:after{content:'';position:absolute;top:50%;left:50%;width:7px;height:7px;border-radius:50%;background:#fff;transform:translate(-50%,-50%)}",
      "#"+ROOT_ID+" .mc8-team-list{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin-top:10px}",
      "#"+ROOT_ID+" .mc8-team-list button{min-height:39px;padding:7px 5px;border:1px solid #e8e2de;border-radius:10px;background:#fff;color:#10182f;font:800 10px Cairo,Arial,sans-serif;cursor:pointer;transition:.18s}",
      "#"+ROOT_ID+" .mc8-team-list button:before{content:'';display:inline-block;width:7px;height:7px;margin-left:7px;border-radius:50%;background:#e23b5d;vertical-align:middle}",
      "#"+ROOT_ID+" .mc8-team-list button:hover,#"+ROOT_ID+" .mc8-team-list button.active{border-color:#e23b5d;background:#fff6f8;color:#c52f50}",
      "#"+ROOT_ID+" .mc8-forum{margin-top:18px;padding:22px;border:1px solid #f0d7de;border-radius:20px;background:#fff2f5}",
      "#"+ROOT_ID+" .mc8-forum-head{display:flex;align-items:center;gap:12px;margin-bottom:14px}",
      "#"+ROOT_ID+" .mc8-forum-icon{display:grid;place-items:center;width:46px;height:46px;flex:none;border-radius:13px;background:#fff;color:#d93658;font-size:19px}",
      "#"+ROOT_ID+" .mc8-forum h3{margin:0;color:#10182f;font-size:20px;font-weight:900}",
      "#"+ROOT_ID+" .mc8-forum-head p{margin:2px 0 0;color:#747d8d;font-size:11px}",
      "#"+ROOT_ID+" .mc7-forum-details{display:grid;grid-template-columns:1fr 1fr;gap:0 18px}",
      "#"+ROOT_ID+" .mc7-forum-row{display:flex;align-items:flex-start;gap:10px;min-width:0;padding:12px 0;border-top:1px solid #efdde2}",
      "#"+ROOT_ID+" .mc7-forum-row>i{width:18px;flex:none;padding-top:4px;color:#df3658;text-align:center}",
      "#"+ROOT_ID+" .mc7-forum-row>div{min-width:0}",
      "#"+ROOT_ID+" .mc7-forum-row strong{display:block;color:#10182f;font-size:11px;font-weight:900}",
      "#"+ROOT_ID+" .mc7-forum-row span,#"+ROOT_ID+" .mc7-forum-row a{display:block;margin-top:3px;color:#677182;font-size:10px;line-height:1.8;overflow-wrap:anywhere}",
      "#"+ROOT_ID+" .mc7-forum-row a{direction:ltr;unicode-bidi:isolate;text-align:left;white-space:nowrap;font-weight:800}",
      "#"+ROOT_ID+" .mc10-forum-social{display:flex;flex-wrap:wrap;gap:8px;margin-top:13px;padding-top:13px;border-top:1px solid #efdde2}",
      "#"+ROOT_ID+" .mc10-forum-social a{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:38px;padding:8px 12px;border:1px solid #e7dadd;border-radius:10px;background:#fff;color:#10182f;font-size:10px;font-weight:900;white-space:nowrap}",
      "#"+ROOT_ID+" .mc10-forum-social a i{color:#df3658}",
      "#"+ROOT_ID+" .mc8-lower{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:18px}",
      "#"+ROOT_ID+" .mc8-lower-card{padding:19px;border:1px solid #e8e2de;border-radius:18px;background:#fff}",
      "#"+ROOT_ID+" .mc8-lower-card h3{margin:0 0 5px;color:#10182f;font-size:16px;font-weight:900}",
      "#"+ROOT_ID+" .mc8-lower-card p{margin:0;color:#727b8b;font-size:11px;line-height:1.8}",
      "#"+ROOT_ID+" .mc8-lower-links{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}",
      "#"+ROOT_ID+" .mc8-lower-links a{display:inline-flex;align-items:center;justify-content:center;min-height:36px;padding:7px 11px;border:1px solid #e7e1dd;border-radius:10px;background:#fff;color:#10182f;font-size:10px;font-weight:900}",
      "#"+ROOT_ID+" .mc8-lower-links a:hover{border-color:#df3658;color:#df3658}",
      "#"+ROOT_ID+" .mc11-social{margin-top:24px;padding:25px 0 2px;border-top:1px solid #e7e0dc}",
      "#"+ROOT_ID+" .mc11-social-head{text-align:center;margin:0 auto 16px;max-width:680px}",
      "#"+ROOT_ID+" .mc11-social-head span{display:inline-block;padding:5px 11px;border-radius:999px;background:#fff0f3;color:#df3658;font-size:10px;font-weight:900}",
      "#"+ROOT_ID+" .mc11-social-head h3{margin:8px 0 5px;color:#10182f;font-size:24px;font-weight:900}",
      "#"+ROOT_ID+" .mc11-social-head p{margin:0;color:#737d8d;font-size:11px;line-height:1.8}",
      "#"+ROOT_ID+" .mc7-social-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:9px}",
      "#"+ROOT_ID+" .mc7-social-card{display:flex;align-items:center;gap:9px;min-width:0;min-height:76px;padding:11px 12px;border:1px solid #e8e2de;border-radius:14px;background:#fff;color:#10182f;transition:.18s}",
      "#"+ROOT_ID+" .mc7-social-card:hover{transform:translateY(-2px);border-color:#df3658;box-shadow:0 7px 18px rgba(16,24,47,.05)}",
      "#"+ROOT_ID+" .mc7-social-icon{display:grid;place-items:center;width:37px;height:37px;flex:none;border-radius:11px;background:#fff0f3;color:#df3658;font-size:17px}",
      "#"+ROOT_ID+" .mc7-social-card strong{display:block;color:#10182f;font-size:10px;font-weight:900;line-height:1.5}",
      "#"+ROOT_ID+" .mc7-social-card small{display:block;margin-top:2px;color:#7c8492;font-size:8px;line-height:1.5;overflow-wrap:anywhere}",
      "#"+ROOT_ID+" .mc11-footer{margin-top:40px;padding:27px 0 19px;background:#10182f;color:#fff}",
      "#"+ROOT_ID+" .mc11-footer-inner{width:min(1120px,calc(100% - 36px));margin:auto}",
      "#"+ROOT_ID+" .mc11-footer-top{display:flex;align-items:center;justify-content:space-between;gap:20px}",
      "#"+ROOT_ID+" .mc11-footer-brand{display:flex;align-items:center;gap:12px;color:#fff}",
      "#"+ROOT_ID+" .mc11-footer-brand img{width:52px;height:52px;padding:3px;border-radius:50%;background:#fff;object-fit:contain}",
      "#"+ROOT_ID+" .mc11-footer-brand strong{display:block;font-size:14px;font-weight:900}",
      "#"+ROOT_ID+" .mc11-footer-brand small{display:block;margin-top:3px;color:#c4cad6;font-size:10px}",
      "#"+ROOT_ID+" .mc11-footer-links{display:flex;flex-wrap:wrap;gap:7px}",
      "#"+ROOT_ID+" .mc11-footer-links a{padding:8px 10px;border:1px solid rgba(255,255,255,.17);border-radius:9px;color:#fff;font-size:10px;font-weight:800}",
      "#"+ROOT_ID+" .mc11-footer-links a:hover{background:#df3658;border-color:#df3658}",
      "#"+ROOT_ID+" .mc11-footer-bottom{display:flex;justify-content:space-between;gap:15px;margin-top:18px;padding-top:13px;border-top:1px solid rgba(255,255,255,.14);color:#c1c7d2;font-size:9px;line-height:1.7}",
      "@media(max-width:1050px){.mc11-nav nav a{padding-inline:6px;font-size:10px}.mc11-nav .nav-actions a{padding-inline:8px}#"+ROOT_ID+" .mc7-social-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}",
      "@media(max-width:860px){.mc11-nav nav,.mc11-nav .nav-actions{display:none}.mc11-nav .menu{display:block;margin-inline-start:auto}#"+ROOT_ID+" .mc8-main{grid-template-columns:1fr}#"+ROOT_ID+" .mc8-map{height:320px}#"+ROOT_ID+" .mc11-footer-top{align-items:flex-start;flex-direction:column}}",
      "@media(max-width:640px){.mc11-nav .inner{width:calc(100% - 24px);min-height:60px}.mc11-nav .brand img{width:43px;height:43px}#"+ROOT_ID+" .mc11-hero{padding:17px 10px 8px}#"+ROOT_ID+" .mc11-hero-panel{padding:21px 15px 19px;border-radius:20px}#"+ROOT_ID+" .mc11-logo{width:86px;height:86px;margin-bottom:11px;padding:6px;border-width:4px}#"+ROOT_ID+" .mc11-kicker{padding:6px 10px;font-size:10px}#"+ROOT_ID+" h1{margin:9px 0 5px;font-size:34px}#"+ROOT_ID+" .mc11-hero-copy{font-size:11px;line-height:1.8}#"+ROOT_ID+" .mc8-content{width:calc(100% - 22px);padding-top:21px}#"+ROOT_ID+" .mc8-title{margin-bottom:14px}#"+ROOT_ID+" .mc8-title h2{font-size:24px}#"+ROOT_ID+" .mc8-title p{font-size:10px}#"+ROOT_ID+" .mc8-main{gap:12px}#"+ROOT_ID+" .mc8-card{padding:16px;border-radius:17px}#"+ROOT_ID+" .mc8-card-head{gap:9px;margin-bottom:8px}#"+ROOT_ID+" .mc8-card-head img{width:42px;height:42px}#"+ROOT_ID+" .mc8-card-head h3{font-size:18px}#"+ROOT_ID+" .mc8-card-head p{font-size:10px}#"+ROOT_ID+" .mc8-contact-list{grid-template-columns:1fr}#"+ROOT_ID+" .mc8-item{padding:10px 0}#"+ROOT_ID+" .mc8-item:nth-last-child(-n+2){border-bottom:1px solid #f0ece9}#"+ROOT_ID+" .mc8-item:last-child{border-bottom:0}#"+ROOT_ID+" .mc8-item strong{font-size:11px}#"+ROOT_ID+" .mc8-item small{font-size:9px}#"+ROOT_ID+" .mc8-item a{font-size:10px}#"+ROOT_ID+" .mc8-actions{gap:7px;margin-top:13px}#"+ROOT_ID+" .mc8-action{min-height:43px;padding:8px 6px;font-size:10px}#"+ROOT_ID+" .mc8-map{height:270px}#"+ROOT_ID+" .mc8-team-list{grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}#"+ROOT_ID+" .mc8-team-list button{min-height:37px;font-size:9px}#"+ROOT_ID+" .mc8-forum{margin-top:12px;padding:16px;border-radius:17px}#"+ROOT_ID+" .mc8-forum h3{font-size:17px}#"+ROOT_ID+" .mc7-forum-details{grid-template-columns:1fr}#"+ROOT_ID+" .mc7-forum-row{padding:9px 0}#"+ROOT_ID+" .mc8-lower{grid-template-columns:1fr;gap:10px;margin-top:13px}#"+ROOT_ID+" .mc8-lower-card{padding:15px}#"+ROOT_ID+" .mc11-social{margin-top:20px;padding-top:20px}#"+ROOT_ID+" .mc11-social-head{margin-bottom:12px}#"+ROOT_ID+" .mc11-social-head h3{font-size:20px}#"+ROOT_ID+" .mc11-social-head p{font-size:9px}#"+ROOT_ID+" .mc7-social-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}#"+ROOT_ID+" .mc7-social-card{min-height:66px;padding:8px 7px;gap:7px;border-radius:11px}#"+ROOT_ID+" .mc7-social-icon{width:32px;height:32px;font-size:14px}#"+ROOT_ID+" .mc7-social-card strong{font-size:9px}#"+ROOT_ID+" .mc7-social-card small{font-size:7px}#"+ROOT_ID+" .mc11-footer{margin-top:25px;padding:22px 0 15px}#"+ROOT_ID+" .mc11-footer-inner{width:calc(100% - 26px)}#"+ROOT_ID+" .mc11-footer-brand img{width:43px;height:43px}#"+ROOT_ID+" .mc11-footer-brand strong{font-size:11px}#"+ROOT_ID+" .mc11-footer-brand small{font-size:8px}#"+ROOT_ID+" .mc11-footer-links{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));width:100%}#"+ROOT_ID+" .mc11-footer-links a{text-align:center;font-size:9px;padding:8px 5px}#"+ROOT_ID+" .mc11-footer-bottom{flex-direction:column;gap:5px;font-size:8px}}",
      "@media(max-width:370px){#"+ROOT_ID+" .mc8-actions{grid-template-columns:1fr}#"+ROOT_ID+" .mc7-social-grid{grid-template-columns:1fr}}",
      "@media(prefers-reduced-motion:reduce){#"+ROOT_ID+" *, .mc11-nav *{transition:none!important;animation:none!important;scroll-behavior:auto!important}}"
    ].join("\n");
    document.head.appendChild(style);
  }

  function buildNavigation() {
    document.querySelectorAll('.medlife-global-header').forEach(function(node){ node.remove(); });
    if (document.querySelector('.mc11-nav')) return;
    const header = document.createElement('header');
    header.className = 'mc11-nav';
    header.innerHTML =
      '<div class="inner">' +
        '<a class="brand" href="/index.html" aria-label="مؤسسة ميدلايف"><img src="' + BRAND + '" alt="مؤسسة ميدلايف"></a>' +
        '<nav aria-label="التنقل الرئيسي">' +
          '<a href="/index.html">الرئيسية</a><a href="/about-medlife.html">عن المؤسسة</a><a href="/index.html#programs">مجالات العمل</a><a href="/articles.html">المقالات</a><a href="/forum-v3.html">المنتدى</a><a href="/gallery.html">الصور</a><a href="/support.html">صندوق الدعم</a><a class="active" href="/contact.html">تواصل معنا</a>' +
        '</nav>' +
        '<div class="nav-actions"><a href="/login.html">دخول الأعضاء</a><a class="join" href="/join-options.html">الانضمام</a></div>' +
        '<button class="menu" type="button" aria-expanded="false" aria-controls="mc11-mobile-menu">القائمة</button>' +
      '</div>' +
      '<div class="mobile" id="mc11-mobile-menu">' +
        '<a href="/index.html">الرئيسية</a><a href="/about-medlife.html">عن المؤسسة</a><a href="/index.html#programs">مجالات العمل</a><a href="/articles.html">المقالات</a><a href="/forum-v3.html">المنتدى</a><a href="/gallery.html">الصور</a><a href="/support.html">صندوق الدعم</a><a class="active" href="/contact.html">تواصل معنا</a><a href="/login.html">دخول الأعضاء</a><a class="join" href="/join-options.html">الانضمام إلى ميدلايف</a>' +
      '</div>';
    document.body.prepend(header);
    const button = header.querySelector('.menu');
    const mobile = header.querySelector('.mobile');
    button.addEventListener('click', function(){
      const open = mobile.classList.toggle('open');
      button.setAttribute('aria-expanded', String(open));
    });
    mobile.querySelectorAll('a').forEach(function(link){
      link.addEventListener('click', function(){
        mobile.classList.remove('open');
        button.setAttribute('aria-expanded','false');
      });
    });
  }

  function buildPage() {
    addStyles();
    document.querySelector('body > header.hero')?.remove();
    document.querySelector('body > main.wrap')?.remove();
    document.querySelector('body > .footer')?.remove();
    const old = document.getElementById(ROOT_ID);
    if (old) old.remove();

    const page = document.createElement('div');
    page.id = ROOT_ID;
    page.innerHTML =
      '<section class="mc11-hero"><div class="mc11-hero-panel">' +
        '<a class="mc11-logo" href="/index.html" aria-label="الصفحة الرئيسية لميدلايف"><img src="' + BRAND + '" alt="شعار مؤسسة ميدلايف"></a>' +
        '<span class="mc11-kicker">مؤسسة ميدلايف الطبية الخيرية التطوعية</span>' +
        '<h1>تواصل <span>معنا</span></h1>' +
        '<p class="mc11-hero-copy">نحن قريبون منك. تواصل مع المؤسسة أو مع فريق ميدلايف في محافظتك عبر القنوات الرسمية.</p>' +
      '</div></section>' +
      '<main class="mc8-content">' +
        '<section class="mc8-title"><small>حضور ميدلايف</small><h2>ميدلايف في سوريا</h2><p>تعرّف على توزع فرقنا وتواصل مع الفريق الأقرب إليك.</p></section>' +
        '<section class="mc8-main">' +
          '<article class="mc8-card mc8-contact-card">' +
            '<div class="mc8-card-head"><img src="' + BRAND + '" alt="MedLife"><div><h3>معلومات التواصل</h3><p>المكتب الرئيسي والقنوات الرسمية</p></div></div>' +
            '<div class="mc8-contact-list">' +
              '<div class="mc8-item"><span class="mc8-icon"><i class="fa-solid fa-building"></i></span><div><strong>المكتب الرئيسي — طرطوس</strong><small>المحكمة — خلف شركة الأعلاف</small><a href="tel:+963182222568">+963 182 222 568</a></div></div>' +
              '<div class="mc8-item"><span class="mc8-icon"><i class="fa-solid fa-phone"></i></span><div><strong>الهاتف</strong><a href="tel:+963998942124">+963 998 942 124</a></div></div>' +
              '<div class="mc8-item"><span class="mc8-icon"><i class="fa-solid fa-envelope"></i></span><div><strong>البريد الإلكتروني</strong><a href="mailto:info@medlifesy.org">info@medlifesy.org</a></div></div>' +
              '<div class="mc8-item"><span class="mc8-icon"><i class="fa-brands fa-telegram"></i></span><div><strong>الاستشارات الطبية</strong><small>بوت الاستشارات الطبية</small><a href="https://t.me/Medlife2024bot" target="_blank" rel="noopener noreferrer">فتح البوت مباشرة ↗</a></div></div>' +
            '</div>' +
            '<div class="mc8-actions">' +
              '<a class="mc8-action" href="/support.html">صندوق الدعم</a>' +
              '<a class="mc8-action" href="/join-options.html">الانضمام إلى ميدلايف</a>' +
              '<a class="mc8-action" href="mailto:info@medlifesy.org?subject=تعاون%20مع%20ميدلايف">التعاون والشراكات</a>' +
              '<a class="mc8-action" href="/forum-v3.html">زيارة المنتدى</a>' +
            '</div>' +
          '</article>' +
          '<article class="mc8-card mc8-map-card">' +
            '<div class="mc8-card-head"><img src="' + BRAND + '" alt="MedLife"><div><h3>خريطة فرق ميدلايف</h3><p>المواقع الميدانية في المحافظات</p></div></div>' +
            '<div class="mc8-map" id="syriaMap" aria-label="خريطة توزع فرق ميدلايف في سوريا"></div>' +
            '<div class="mc8-team-list">' + locations.map(function(item,index){ return '<button type="button" data-team="' + index + '">' + item[0].replace('ميدلايف ','') + '</button>'; }).join('') + '</div>' +
          '</article>' +
        '</section>' +
        '<section class="mc8-forum">' +
          '<div class="mc8-forum-head"><span class="mc8-forum-icon"><i class="fa-solid fa-graduation-cap"></i></span><div><h3>منتدى ميدلايف — طرطوس</h3><p>مساحة للتعلم والتدريب والأنشطة والفعاليات.</p></div></div>' +
          '<div class="mc7-forum-details">' +
            '<div class="mc7-forum-row"><i class="fa-solid fa-location-dot"></i><div><strong>العنوان</strong><span>الجمعية — خلف مستوصف السل — جنوب الفقاسة، طرطوس</span></div></div>' +
            '<div class="mc7-forum-row"><i class="fa-solid fa-phone"></i><div><strong>الهاتف</strong><a href="tel:+963182220555">+963 182 220 555</a></div></div>' +
            '<div class="mc7-forum-row"><i class="fa-solid fa-mobile-screen-button"></i><div><strong>الموبايل</strong><a href="tel:+963989913713">+963 989 913 713</a></div></div>' +
            '<div class="mc7-forum-row"><i class="fa-solid fa-envelope"></i><div><strong>البريد الإلكتروني</strong><a href="mailto:Forum@medlifesy.org">Forum@medlifesy.org</a></div></div>' +
          '</div>' +
          '<div class="mc10-forum-social"><a href="/forum-v3.html"><i class="fa-solid fa-arrow-up-right-from-square"></i> زيارة المنتدى</a><a href="https://www.facebook.com/Medlifesyforum" target="_blank" rel="noopener noreferrer"><i class="fa-brands fa-facebook"></i> Facebook المنتدى</a><a href="https://www.instagram.com/medlifesy_forum/" target="_blank" rel="noopener noreferrer"><i class="fa-brands fa-instagram"></i> Instagram المنتدى</a></div>' +
        '</section>' +
        '<section class="mc8-lower">' +
          '<article class="mc8-lower-card"><h3>كيف يمكننا مساعدتك؟</h3><p>للدعم أو الاستفسار أو الشراكات أو الانضمام، اختر المسار المناسب.</p><div class="mc8-lower-links"><a href="/support-request.html">طلب مساعدة</a><a href="mailto:info@medlifesy.org">استفسار عام</a></div></article>' +
          '<article class="mc8-lower-card"><h3>المنصات الرسمية</h3><p>تابع آخر المبادرات والأنشطة والمحتوى الطبي عبر حسابات ميدلايف.</p><div class="mc8-lower-links"><a href="https://www.facebook.com/Medlifesy" target="_blank" rel="noopener noreferrer">Facebook</a><a href="https://www.instagram.com/medlifesy/" target="_blank" rel="noopener noreferrer">Instagram</a><a href="https://www.instagram.com/medlifesy_trends/" target="_blank" rel="noopener noreferrer">MedLife Trends</a></div></article>' +
        '</section>' +
        '<section class="mc11-social"><div class="mc11-social-head"><span>قنوات ميدلايف الرسمية</span><h3>تابع ميدلايف أينما كنت</h3><p>أخبار المؤسسة وأنشطتها ومبادراتها ومحتواها الطبي عبر قنواتها الرقمية.</p></div><div class="mc7-social-grid">' +
          socialLinks.map(function(item){ return '<a class="mc7-social-card" href="' + item[2] + '" target="_blank" rel="noopener noreferrer"><span class="mc7-social-icon"><i class="fa-brands ' + item[3] + '"></i></span><span><strong>' + item[0] + '</strong><small>' + item[1] + '</small></span></a>'; }).join('') +
        '</div></section>' +
      '</main>' +
      '<footer class="mc11-footer"><div class="mc11-footer-inner"><div class="mc11-footer-top">' +
        '<a class="mc11-footer-brand" href="/index.html"><img src="' + BRAND + '" alt="شعار ميدلايف"><span><strong>مؤسسة ميدلايف الطبية الخيرية التطوعية</strong><small>طرطوس — سوريا</small></span></a>' +
        '<nav class="mc11-footer-links" aria-label="روابط سريعة"><a href="/about-medlife.html">عن ميدلايف</a><a href="/forum-v3.html">المنتدى</a><a href="/support.html">صندوق الدعم</a><a href="/join-options.html">الانضمام</a><a href="/contact.html">تواصل معنا</a></nav>' +
      '</div><div class="mc11-footer-bottom"><span>© مؤسسة ميدلايف الطبية الخيرية التطوعية</span><span>بالعمل التطوعي نصنع الأثر.</span></div></div></footer>';
    document.body.appendChild(page);
    return page;
  }

  function initMap(page) {
    const element = page.querySelector('#syriaMap');
    if (!element || !window.L || element.dataset.ready === '1') return;
    element.dataset.ready = '1';
    const map = window.L.map(element, {
      scrollWheelZoom: false,
      zoomControl: true,
      minZoom: 6,
      maxZoom: 10
    });
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    const icon = window.L.divIcon({
      className: 'mc8-pin-wrap',
      html: '<span class="mc8-pin"></span>',
      iconSize: [29, 29],
      iconAnchor: [14, 14],
      popupAnchor: [0, -13]
    });
    const markers = [];
    const bounds = [];
    locations.forEach(function(item,index){
      bounds.push([item[1],item[2]]);
      const marker = window.L.marker([item[1],item[2]], {
        icon: icon,
        title: item[0],
        alt: item[0]
      }).addTo(map);
      marker.bindPopup('<div dir="rtl"><strong style="display:block;color:#10182f;font-size:13px">' + item[0] + '</strong><span style="color:#69758b;font-size:10px">' + item[3] + '</span></div>');
      marker.on('click',function(){ selectTeam(index); });
      markers.push(marker);
    });
    map.fitBounds(bounds,{padding:[24,24],maxZoom:7});
    function selectTeam(index) {
      page.querySelectorAll('[data-team]').forEach(function(button,i){
        button.classList.toggle('active',i===index);
      });
      const item = locations[index];
      map.setView([item[1],item[2]],8,{animate:true,duration:.35});
      markers[index].openPopup();
    }
    page.querySelectorAll('[data-team]').forEach(function(button,index){
      button.addEventListener('click',function(){ selectTeam(index); });
    });
    window.setTimeout(function(){ map.invalidateSize(); },300);
    window.addEventListener('resize',function(){ map.invalidateSize(); },{passive:true});
  }

  function init() {
    if (!document.getElementById(ROOT_ID)) {
      document.querySelector('body > header.hero')?.remove();
      document.querySelector('body > main.wrap')?.remove();
      document.querySelector('body > .footer')?.remove();
      buildNavigation();
      const page = buildPage();
      if (page) initMap(page);
      return;
    }
    buildNavigation();
    initMap(document.getElementById(ROOT_ID));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded',init,{once:true});
  } else {
    init();
  }
  window.setTimeout(init,500);
})();