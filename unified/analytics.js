// Basic consent: no Google script, cookies or analytics requests before opt-in.
(() => {
  'use strict';
  if(window.OfferAnalytics)return;
  const ID='G-X1ENMR8LBG',KEY='personal-offers:analytics-consent:v1',TTL=180*86400000;
  const surface=document.querySelector('meta[name="offer-surface"]')?.content==='standalone'?'standalone':'unified';
  const canonical=document.querySelector('link[rel="canonical"]')?.href||document.querySelector('meta[property="og:url"]')?.content||document.querySelector('meta[name="offer-contact-url"]')?.content;
  const base=surface==='standalone'?canonical:'https://aliaksandrtrus.github.io/offers/unified/';
  if(!base||!base.startsWith('https://'))return;
  const campaigns=new URLSearchParams();
  for(const k of ['utm_source','utm_medium','utm_campaign','utm_content']){
    const v=new URL(location.href).searchParams.get(k);
    if(v&&/^[a-z][a-z0-9_-]{0,63}$/.test(v))campaigns.set(k,v);
  }
  const debug=new URL(location.href).searchParams.get('ga_debug')==='1';
  let choice=null,loaded=false,context=null,lastView='',previousLocation='',sectionKey='',language='ru';
  let io=null,mo=null,observedRoot=null,refreshTimer=0;
  const timers=new Map(),seen=new Set();
  window['ga-disable-'+ID]=true;
  function read(){try{const x=JSON.parse(localStorage.getItem(KEY));return x?.version===1&&Date.now()-x.at<TTL&&['granted','denied'].includes(x.choice)?x.choice:null;}catch{return null;}}
  choice=read();
  function remember(value){try{localStorage.setItem(KEY,JSON.stringify({version:1,choice:value,at:Date.now()}));return true;}catch{return false;}}
  function safeRef(raw){try{const u=new URL(raw);return /^https?:$/.test(u.protocol)?u.origin+'/':'';}catch{return '';}}
  function pageURL(ctx){const u=new URL(base);u.search=campaigns.toString();u.hash=surface==='standalone'?'':ctx.page==='compare'?'compare':ctx.page==='catalog'?'projects':'project='+ctx.project_id;return u.href;}
  function params(extra={}){
    const p={project_id:context?.page==='projects'?context.project_id:context?.page==='catalog'?'catalog':'comparison',unit_id:context?.unit_id||'',section_id:'',action:'',...extra,offer_surface:surface};
    // All custom values originate in confirmed IDs or a fixed action vocabulary.
    return Object.fromEntries(Object.entries(p).filter(([k,v])=>['project_id','unit_id','section_id','action','photo_index','view_context','plan_type','comparison_count','channel','contact_placement','contact_intent','offer_surface'].includes(k)&&['string','number'].includes(typeof v)));
  }
  function emit(name,extra){if(choice!=='granted'||!loaded)return;window.gtag('event',name,{...params(extra),send_to:ID,...(debug?{debug_mode:true}:{})});}
  function boot(){
    if(loaded||choice!=='granted')return;
    // Consolidate old unified-only cookies before loading Google, preserving their values.
    for(const name of ['_ga','_ga_X1ENMR8LBG']){
      const item=document.cookie.split('; ').find(c=>c.startsWith(name+'='));
      if(item)document.cookie=item+'; Path=/offers/; Max-Age=15552000; SameSite=Lax; Secure';
      for(const domain of ['',location.hostname,'.'+location.hostname])document.cookie=name+'=; Max-Age=0; Path=/offers/unified/'+(domain?'; Domain='+domain:'')+'; SameSite=Lax';
    }
    loaded=true;window['ga-disable-'+ID]=false;
    window.dataLayer=window.dataLayer||[];
    window.gtag=function(){window.dataLayer.push(arguments);};
    window.gtag('consent','default',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
    window.gtag('js',new Date());
    window.gtag('set',{offer_surface:surface});
    const initial=context?{page_location:pageURL(context),page_title:context.title,page_referrer:safeRef(document.referrer)}:{};
    window.gtag('config',ID,{send_page_view:false,allow_google_signals:false,allow_ad_personalization_signals:false,ads_data_redaction:true,cookie_domain:'none',cookie_path:'/offers/',offer_surface:surface,cookie_expires:15552000,...initial});
    const script=document.createElement('script');script.async=true;script.id='offer-ga-tag';script.src='https://www.googletagmanager.com/gtag/js?id='+ID;document.head.append(script);
    lastView='';sendView();refreshSections();
  }
  function sendView(){
    if(choice!=='granted'||!loaded||!context)return;
    const key=surface==='standalone'?'standalone:'+context.project_id:context.page==='compare'?'compare':context.page==='catalog'?'catalog':'projects:'+context.project_id;
    if(lastView===key)return;
    const url=pageURL(context),ref=previousLocation||safeRef(document.referrer);
    window.gtag('set',{page_location:url,page_title:context.title,page_referrer:ref});
    window.gtag('event','page_view',{...params({section_id:context.page==='compare'?'comparison':context.page==='catalog'?'catalog':'project',action:'view'}),page_location:url,page_title:context.title,page_referrer:ref,send_to:ID,...(debug?{debug_mode:true}:{})});
    lastView=key;previousLocation=url;
  }
  function cancelTimers(){for(const h of timers.values())clearTimeout(h);timers.clear();}
  function stopSections(){cancelTimers();io?.disconnect();mo?.disconnect();io=mo=null;observedRoot=null;clearTimeout(refreshTimer);}
  function visible(el){if(document.visibilityState!=='visible'||!el.isConnected||observedRoot?.querySelector('dialog[open]')||document.querySelector('#viewer[open],#contact-dialog[open]'))return false;const r=el.getBoundingClientRect();return r.width>0&&r.height>0&&r.bottom>0&&r.top<innerHeight&&r.right>0&&r.left<innerWidth;}
  function refreshSections(){
    cancelTimers();io?.disconnect();io=null;
    if(!observedRoot||choice!=='granted'||context?.page!=='projects')return;
    const root=observedRoot;
    io=new IntersectionObserver(entries=>{
      for(const e of entries){const id=e.target.dataset.analyticsSection;if(seen.has(id))continue;
        if(!e.isIntersecting||!visible(e.target)){if(timers.has(id))clearTimeout(timers.get(id));timers.delete(id);continue;}
        if(timers.has(id))continue;
        const viewKey=sectionKey;
        timers.set(id,setTimeout(()=>{timers.delete(id);if(viewKey!==sectionKey||seen.has(id)||!visible(e.target)||choice!=='granted')return;seen.add(id);emit('section_view',{section_id:id,action:'view'});},1000));
      }
    },{threshold:0});
    for(const [id,selector]of [['photos','#photos'],['description','.project-aside'],['apartments','#apartments'],['payments','#payments'],['map','#location']]){
      const el=root.querySelector(selector);if(el&&!seen.has(id)){el.dataset.analyticsSection=id;io.observe(el);}
    }
  }
  function observe(root){
    if(observedRoot===root)return;
    stopSections();if(!root)return;observedRoot=root;
    mo=new MutationObserver(()=>{clearTimeout(refreshTimer);refreshTimer=setTimeout(refreshSections,0);});
    mo.observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['open']});refreshSections();
  }
  function view(ctx){
    language=ctx.language||language;
    const key=ctx.page==='compare'?'compare':ctx.page==='catalog'?'catalog':'projects:'+ctx.project_id;
    if(key!==sectionKey){sectionKey=key;seen.clear();cancelTimers();}
    context=ctx;updateConsentText();sendView();
    if(choice==='granted'&&!loaded)boot();
  }
  function eraseCookies(){
    for(const name of ['_ga','_ga_X1ENMR8LBG'])for(const p of new Set(['/','/offers/','/offers/unified/',new URL(base).pathname,location.pathname]))for(const domain of ['',location.hostname,'.'+location.hostname])document.cookie=name+'=; Max-Age=0; path='+p+(domain?'; domain='+domain:'')+'; SameSite=Lax';
  }
  function decide(value){
    const wasLoaded=loaded;choice=value;const saved=remember(value);document.getElementById('analytics-consent').hidden=true;
    document.getElementById('analytics-storage-warning').hidden=saved;
    if(value==='granted'){boot();return;}
    window['ga-disable-'+ID]=true;stopSections();eraseCookies();
    // A loaded tag cannot be unloaded reliably. Reload after withdrawal, without
    // a consent-update ping, to stop its timers as well as our event handlers.
    if(wasLoaded){if(!saved){try{sessionStorage.setItem(KEY,'denied');}catch{}}location.reload();}
  }
  const words={ru:{title:'Аналитика посещений',body:'Разрешить Google Analytics использовать аналитические cookies для статистики посещений и действий? Имена и контакты не передаются. Можно отказаться — офферы останутся доступны.',yes:'Разрешить',no:'Отказаться',settings:'Настройки аналитики',status:'Решение сохранено',warning:'Браузер не сохраняет настройку. В текущей вкладке ваш выбор действует; после нового открытия согласие может понадобиться снова.'},en:{title:'Visit analytics',body:'Allow Google Analytics to use analytics cookies for visitor and interaction statistics? Names and contact details are not sent. You can decline and continue viewing all offers.',yes:'Allow',no:'Decline',settings:'Analytics settings',status:'Preference saved',warning:'Your browser cannot save this preference. It applies in this tab; you may be asked again on a new visit.'}};
  function updateConsentText(){const w=words[language]||words.ru;for(const [id,key]of [['analytics-consent-title','title'],['analytics-consent-text','body'],['analytics-allow','yes'],['analytics-decline','no'],['analytics-settings','settings'],['analytics-storage-warning','warning']]){const el=document.getElementById(id);if(el)el.textContent=w[key];}}
  const panel=document.createElement('section');panel.id='analytics-consent';panel.className='analytics-consent';panel.setAttribute('role','region');panel.setAttribute('aria-labelledby','analytics-consent-title');panel.innerHTML='<div><strong id="analytics-consent-title"></strong><p id="analytics-consent-text"></p></div><div class="analytics-consent-actions"><button id="analytics-allow" type="button"></button><button id="analytics-decline" type="button"></button></div>';
  panel.hidden=choice!==null;document.body.append(panel);
  const footer=document.querySelector('footer')||document.body.appendChild(document.createElement('footer'));footer.classList.add('analytics-footer');
  const settings=document.createElement('button');settings.type='button';settings.id='analytics-settings';settings.className='text-button';footer.append(settings);
  const warning=document.createElement('p');warning.id='analytics-storage-warning';warning.className='analytics-storage-warning';warning.hidden=true;footer.append(warning);
  settings.addEventListener('click',()=>{panel.hidden=false;document.getElementById('analytics-decline').focus({preventScroll:true});});
  document.getElementById('analytics-allow').addEventListener('click',()=>decide('granted'));
  document.getElementById('analytics-decline').addEventListener('click',()=>decide('denied'));
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState!=='visible')cancelTimers();else refreshSections();});
  window.addEventListener('storage',event=>{if(event.key===KEY){const latest=read();if(choice==='granted'&&latest!=='granted'){window['ga-disable-'+ID]=true;location.reload();}else{choice=latest;panel.hidden=choice!==null;if(choice==='granted')boot();else{stopSections();eraseCookies();}}}});
  try{if(sessionStorage.getItem(KEY)==='denied'){sessionStorage.removeItem(KEY);choice='denied';panel.hidden=true;}}catch{}
  document.addEventListener('offer:overlay-change',refreshSections);
  window.OfferAnalytics={view,observe,event:emit,unit(id){if(context?.page==='projects')context.unit_id=id;}};updateConsentText();
})();
