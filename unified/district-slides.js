(() => {
 'use strict';
 const districts=window.DISTRICT_OVERVIEWS||[],states=new Map();let data=null,c=null,topics=[];
 let presentation={};let active=null,language='ru',currency='AED',slide=0,choice=[],pointer=null,suppressClickUntil=0;
 const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
 const L=(ru,en)=>language==='ru'?ru:en,tx=v=>typeof v==='string'?v:v?.[language]||'';
 const number=(v,d=0)=>new Intl.NumberFormat(language==='ru'?'ru-RU':'en-GB',{minimumFractionDigits:d,maximumFractionDigits:d}).format(v);
 const money=v=>`${number(currency==='USD'?v/data.rate:v)} <small>${currency}</small>`;
 const rate=v=>`${number(currency==='USD'?v/data.rate/0.09290304:v,1)} <small>${currency} / ${currency==='AED'?'sq ft':L('м²','m²')}</small>`;
 const root=()=>document.querySelector('.d3-overview');
 const findByKey=key=>districts.find(d=>d.districtKey===key),find=id=>districts.find(d=>d.id===id);
 function name(id){return tx(c[id].label);}
 function topicTabs(){return topics.map((t,i)=>`<button type="button" class="d3-topic" role="tab" data-d3-scene="${i}" id="d3-topic-${i}" aria-selected="${i===slide}" aria-controls="d3-stage" tabindex="${i===slide?'0':'-1'}"><i>0${i+1}</i>${tx(t)}</button>`).join('');}
 function pin(id,num,x,y,extra='',layout='',mx=x,my=y){return `<button type="button" class="d3-pin d3-pin--${layout}${choice[slide]===id?' is-selected':''}" data-d3-object="${id}" style="--x:${x}%;--y:${y}%;--pin-mobile-x:${mx}%;--pin-mobile-y:${my}%" aria-label="${esc(name(id))}" aria-pressed="${choice[slide]===id}" aria-controls="d3-card"><i>${num}</i><span class="d3-pin-label">${esc(name(id))}${extra?`<em>${esc(extra)}</em>`:''}</span></button>`;}
 function overlay(content){return `<svg class="d3-overlay" viewBox="0 0 ${topics[slide].width} ${topics[slide].height}" aria-hidden="true"><defs><radialGradient id="d3-halo"><stop stop-color="#b8ceac" stop-opacity=".6"/><stop offset="1" stop-color="#b8ceac" stop-opacity="0"/></radialGradient></defs>${content}</svg>`;}
 function districtLabel(x,y,mx=x,my=y){return `<span class="d3-district-label" style="left:${x}%;top:${y}%;--district-mobile-x:${mx}%;--district-mobile-y:${my}%">${esc(active.name)}</span>`;}
 function terrain(){
  const s=topics[slide],pos=s.districtLabel;let marks='';
  if(s.layout==='area'){const p=s.optionPosition;marks=`<div class="d3-area-options" style="left:${p.x}%;top:${p.y}%;--options-mobile-x:${p.mobileX}%;--options-mobile-y:${p.mobileY}%">${s.objects.map((id,i)=>`<button type="button" class="d3-area-option ${choice[slide]===id?'is-selected':''}" data-d3-object="${esc(id)}" aria-pressed="${choice[slide]===id}" aria-controls="d3-card"><i>${i+1}</i>${esc(name(id))}</button>`).join('')}</div>`;}
  else marks=s.pins.map((p,i)=>pin(p.id,i+1,p.x,p.y,tx(p.extra),p.layout,p.mobileX??p.x,p.mobileY??p.y)).join('');
  const h=s.halo;const shape=overlay(`<ellipse cx="${h.cx}" cy="${h.cy}" rx="${h.rx}" ry="${h.ry}" fill="url(#d3-halo)"/>${s.path?`<path d="${esc(s.path)}" fill="none" stroke="#fffdf5" stroke-width="12"/><path d="${esc(s.path)}" fill="none" stroke="#aa4539" stroke-width="6"/>`:''}`);
  return `<div class="d3-map-window"><div class="d3-plane"><img src="${esc(new URL(s.image,presentation.assetsBase||document.baseURI).href)}" width="${s.width}" height="${s.height}" alt="${L('Авторская 3D-визуализация окружения ','Original 3D illustration of the surroundings of ')+esc(active.name)}">${shape}${districtLabel(pos.x,pos.y,pos.mobileX,pos.mobileY)}<div class="d3-markers" role="group" aria-label="${L('Объекты на изображении','Objects in the image')}">${marks}</div></div><span class="d3-visualization">${L('3D-визуализация','3D visualization')}</span></div>`;
 }

 const placeIcons = {
  cafe: '<path d="M4 9h12v4a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zm12 1h2a2 2 0 0 1 0 4h-2M3 21h17M8 3v3m4-3v3"/>',
  school: '<path d="m2 9 10-5 10 5-10 5zM6 11v5c4 3 8 3 12 0v-5m4-2v7"/>',
  shop: '<path d="M3 4h2l3 12h10l3-8H7m3 2v4m5-4v4m-5 6h.01m7 0h.01"/>',
 };
 const placeNumber = index => String(index + 1).padStart(2,'0');
 const isPlacesScene = () => topics[slide]?.layout === 'places';

 function placesTerrain(scene) {
  const position = ([x,y]) => `left:${x/scene.width*100}%;top:${y/scene.height*100}%`;
  const selected = id => choice[slide] === id;
  const leaders = scene.pins.map(({id,anchor,position}) => {
   const [x,y] = anchor;
   const line = `M ${x} ${y} L ${position[0]} ${position[1]}`;
   return `<path class="d3-place-leader-edge" d="${line}"/><path class="d3-place-leader" d="${line}"/>
    <circle class="d3-place-anchor" data-d3-anchor="${esc(id)}" cx="${x}" cy="${y}" r="6"/>`;
  }).join('');
  const labels = scene.labels.map(label => `
   <span class="d3-place-context d3-place-context--${esc(label.kind)}" style="${position(label.position)}" aria-hidden="true">
    ${label.short ? `<b>${esc(tx(label.short))}</b> ` : ''}<span>${esc(tx(label.text))}</span>
   </span>`).join('');
  const pins = scene.pins.map((pin,index) => `
   <button type="button" class="d3-pin d3-place-pin d3-place-pin--${esc(pin.side)}${selected(pin.id)?' is-selected':''}"
    data-d3-object="${esc(pin.id)}" style="${position(pin.position)}" aria-label="${esc(tx(c[pin.id].cardTitle))}"
    aria-pressed="${selected(pin.id)}" aria-controls="d3-card">
    <i>${placeNumber(index)}</i><span class="d3-pin-label d3-place-pin-full">${esc(name(pin.id))}</span>
    <span class="d3-pin-label d3-place-pin-short">${esc(tx(c[pin.id].shortLabel))}</span>
   </button>`).join('');
  const options = scene.objects.map((id,index) => `
   <button type="button" class="d3-place-option${selected(id)?' is-selected':''}" data-d3-object="${esc(id)}"
    aria-label="${esc(tx(c[id].category))} · ${esc(tx(c[id].cardTitle))}" aria-pressed="${selected(id)}" aria-controls="d3-card">
    <i>${placeNumber(index)}</i><span><strong>${esc(tx(c[id].category))}</strong><small>${esc(name(id))}</small></span>
   </button>`).join('');
  const image = new URL(scene.image,presentation.assetsBase||document.baseURI).href;
  return `<div class="d3-places-heading"><h2>${esc(tx(scene.heading))}</h2><p>${esc(tx(scene.instructions))}</p></div>
   <div class="d3-place-frame">
    <div class="d3-map-window d3-places-map">
     <div class="d3-places-plane" style="--d3-place-ratio:${scene.width}/${scene.height}">
      <img class="d3-places-image" src="${esc(image)}" width="${scene.width}" height="${scene.height}" alt="" draggable="false">
      <svg class="d3-place-leaders" viewBox="0 0 ${scene.width} ${scene.height}" aria-hidden="true">${leaders}</svg>
      ${labels}<div role="group" aria-label="${L('Объекты на изображении','Objects in the image')}">${pins}</div>
     </div>
     <span class="d3-visualization d3-place-visualization">${L('3D-визуализация','3D visualization')}</span>
     <p class="d3-place-unavailable" hidden>${L('Карта недоступна. Выберите объект в списке ниже.','The map is unavailable. Choose a place in the list below.')}</p>
    </div>
    <div class="d3-place-caption"><span>${L('Условные очертания застройки','Illustrative building outlines')}</span>
     <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap contributors</a>
    </div>
   </div>
   <div class="d3-place-list" role="group" aria-label="${L('Места рядом','Nearby places')}">${options}</div>`;
 }

 function placeCard(place) {
  const origin = topics[slide].origin;
  const route = new URL('https://www.google.com/maps/dir/');
  route.searchParams.set('api','1');
  route.searchParams.set('origin',origin.geo.join(','));
  route.searchParams.set('destination',place.geo.join(','));
  if(place.travelMode) route.searchParams.set('travelmode',place.travelMode);
  const facts = place.facts.map(({label,value}) => `<div><dt>${esc(tx(label))}</dt><dd>${esc(tx(value))}</dd></div>`).join('');
  return `<div>
   <div class="d3-place-card-head">
    <span class="d3-place-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${placeIcons[place.symbol]}</svg></span>
    <div><p class="d3-place-meta">${esc(tx(place.category))} · ${esc(tx(place.area))}</p><h3 id="d3-card-title">${esc(tx(place.cardTitle))}</h3></div>
   </div>
   <p class="d3-place-description">${esc(tx(place.description))}</p><dl class="d3-place-facts">${facts}</dl>
   </div><div class="d3-place-route">
    <p class="d3-place-route-title">${L('Как добраться','Getting there')}</p>
    <p>${esc(tx(origin.name))}</p><p>${esc(tx(place.access))}</p>
    <a class="d3-place-route-link" href="${esc(route.href)}" target="_blank" rel="noopener noreferrer">${L('Маршрут в Google Maps','Directions in Google Maps')} <span aria-hidden="true">↗</span></a>
   </div>`;
 }

 function head(id){const v=c[id],num=topics[slide].objects.indexOf(id)+1;return `<div class="d3-card-head"><span class="d3-index">${num}</span><div><p class="d3-kicker">${esc(tx(v.kicker))}</p><h2 id="d3-card-title">${esc(tx(v.cardTitle))}</h2></div></div>${v.cardPeriod?`<p class="d3-period">${esc(tx(v.cardPeriod))}</p>`:''}`;}
 function card(id){const kind=c[id].kind;
  if(kind==='place')return placeCard(c[id]);
  if(kind==='employment')return head(id)+`<div class="d3-employment-kpis"><div><strong>${number(c[id].companies)}<em>+</em></strong><span>${L('компаний','companies')}</span></div><div><strong>${number(c[id].employees)}<em>+</em></strong><span>${L('работников','employees')}</span></div></div><p class="d3-meaning">${tx(c[id].meaning)}</p>`;
  if(kind==='capacity')return head(id)+`<p class="d3-big-number">${number(c[id].throughput,1)} <small>${L('млн TEU','million TEU')}</small></p><div class="d3-bar" role="img" aria-label="${number(c[id].throughput,1)} / ${number(c[id].capacity,1)} ${esc(c[id].unit)}"><span style="width:${c[id].throughput/c[id].capacity*100}%"></span></div><div class="d3-axis"><span>0</span><span>${number(c[id].capacity,1)} ${L('млн TEU/год · мощность','million TEU/year · capacity')}</span></div><p class="d3-meaning">${tx(c[id].meaning)}</p>`;
  if(kind==='planned'||kind==='metric'){const v=c[id];return head(id)+`<p class="d3-big-number">${number(v.value)}${v.suffix||''}</p><p class="d3-metric-label">${tx(v.unit)}</p><p class="d3-meaning">${tx(v.meaning)}</p>`;}
  if(kind==='routes')return head(id)+`<div class="d3-routes">${c[id].routes.map(r=>`<div><span>${esc(tx(r.label))}</span><strong>${r.km===null?L('не рассчитан','not calculated'):number(r.km,1)+' <small>'+L('км','km')+'</small>'}</strong></div>`).join('')}</div>`;
  if(kind==='transport')return head(id)+`<div class="d3-transport-symbol ${c[id].symbol==='M'?'is-metro':''}" aria-hidden="true">${esc(c[id].symbol)}</div><p class="d3-meaning">${tx(c[id].meaning)}</p>`;
  if(kind==='sales')return head(id)+`<div class="d3-sales-top"><div><strong>${number(c[id].metrics[0].value)}</strong><span>${L('продажи','sales')}</span></div><figure class="d3-donut"><svg viewBox="0 0 100 100" role="img" aria-label="${c[id].offPlan}% off-plan; ${100-c[id].offPlan}% ${L('остальные сделки','other sales')}"><circle cx="50" cy="50" r="39" fill="none" stroke="#dee4d7" stroke-width="10"/><circle cx="50" cy="50" r="39" fill="none" stroke="#456548" stroke-width="10" pathLength="100" stroke-dasharray="${c[id].offPlan} ${100-c[id].offPlan}" transform="rotate(-90 50 50)"/><text x="50" y="48" text-anchor="middle">${c[id].offPlan}%</text><text class="d3-donut-sub" x="50" y="63" text-anchor="middle">off-plan</text></svg><figcaption>${100-c[id].offPlan}% · ${L('остальные сделки','other sales')}</figcaption></figure></div><div class="d3-market-price"><strong>${money(c[id].metrics[1].value)}</strong><span>${L('медиана покупки 1BR','median 1BR purchase')}</span></div><div class="d3-market-rate"><strong>${rate(c[id].metrics[2].value)}</strong><span>${L('медианная ставка выборки','sample median rate')}</span></div><p class="d3-territory">${esc(tx(c[id].scopeLabel))}</p>`;
  if(kind==='rent')return head(id)+`<figure class="d3-rent-chart" aria-label="${L('Годовая аренда по форматам квартир','Annual rent by apartment type')}">${c[id].rents.map(r=>`<div class="d3-rent-row"><div><span>${esc(tx(r.label))}</span><strong>${money(r.aed)}</strong></div><div class="d3-bar"><span style="width:${r.aed/(Math.ceil(Math.max(...c[id].rents.map(v=>v.aed))/10000)*10000)*100}%"></span></div></div>`).join('')}<figcaption>${esc(active.name)} · ${L('в год','per year')}</figcaption></figure>`;
  return '';
 }
 function stage(){
  const id=choice[slide], scene=topics[slide], places=isPlacesScene();
  return `<section class="d3-stage d3-${scene.id}${places?' d3-stage--places':''}" id="d3-stage" role="tabpanel" aria-labelledby="d3-topic-${slide}" tabindex="0">${places?placesTerrain(scene):terrain()}<article id="d3-card" class="d3-info d3-info--${c[id].kind}${c[id].compactPeriod?' d3-info--compact-period':''}" data-card="${id}" aria-live="polite" aria-atomic="true">${card(id)}</article></section>`;
 }
 function controls(){return `<div class="d3-controls"><button type="button" class="button d3-arrow" data-d3-step="-1" ${slide===0?'disabled':''}>← ${L('Назад','Back')}</button><div class="d3-progress"><strong>${String(slide+1).padStart(2,'0')}</strong><span>/ ${String(topics.length).padStart(2,'0')}</span><div aria-hidden="true">${topics.map((_,i)=>`<i class="${i===slide?'is-current':''}"></i>`).join('')}</div></div><button type="button" class="button primary d3-arrow" ${slide===topics.length-1?'data-d3-projects':'data-d3-step="1"'}>${slide===topics.length-1?(presentation.embedded?L('К квартирам','Apartments'):L('К проектам','Projects')):L('Далее','Next')} →</button></div>`;}
 function overview(key,lang,code,settings={}){
  presentation=settings;active=findByKey(key);if(!active)return '';
  data=active.terrain;c=data.cards;
  // Standalone offers can briefly have an older shared stylesheet in the browser cache.
  const places=data.placeScene&&getComputedStyle(document.documentElement).getPropertyValue('--d3-places-layout').trim()==='1';
  topics=places?[...data.slides,data.placeScene]:data.slides;
  if(!states.has(active.id))states.set(active.id,{slide:0,choice:topics.map(t=>t.objects[0])});
  const saved=states.get(active.id);slide=Math.min(saved.slide,topics.length-1);choice=saved.choice;choice[slide]??=topics[slide].objects[0];language=lang;currency=code;
  return `<section class="d3-overview${settings.embedded?' d3-overview--embedded':''}" aria-labelledby="district-title"><div class="d3-heading"><div><p class="eyebrow">${L('Обзор района','District overview')}</p><${settings.embedded?'h2':'h1'} id="district-title">${esc(active.name)}</${settings.embedded?'h2':'h1'}></div><p class="d3-hint">${places?L('Выберите метку на карте','Choose a marker on the map'):L('Наведите на метку или нажмите её','Hover over a marker or tap it')}</p></div><div class="d3-topics${places?' d3-topics--places':''}" role="tablist" aria-label="${L('Темы обзора','Overview topics')}">${topicTabs()}</div><div id="d3-stage-wrap">${stage()}</div><div id="d3-controls-wrap">${controls()}</div></section>`;
 }
 function selectObject(id){if(!root()||!topics[slide].objects.includes(id)||id===choice[slide])return;choice[slide]=id;const info=document.getElementById('d3-card');info.dataset.card=id;info.className='d3-info d3-info--'+c[id].kind+(c[id].compactPeriod?' d3-info--compact-period':'');info.innerHTML=card(id);root().querySelectorAll('[data-d3-object]').forEach(b=>{const chosen=b.dataset.d3Object===id;b.setAttribute('aria-pressed',String(chosen));b.classList.toggle('is-selected',chosen);});}
 function selectSlide(i){if(!root())return;const index=Math.max(0,Math.min(topics.length-1,i));if(index===slide)return;const focus=document.activeElement,step=focus?.dataset?.d3Step,fromTopic=focus?.hasAttribute?.('data-d3-scene');slide=index;choice[slide]??=topics[slide].objects[0];states.get(active.id).slide=index;root().querySelector('.d3-topics').innerHTML=topicTabs();document.getElementById('d3-stage-wrap').innerHTML=stage();document.getElementById('d3-controls-wrap').innerHTML=controls();if(fromTopic)root().querySelector('[aria-selected="true"]')?.focus({preventScroll:true});else if(step)root().querySelector(step==='1'&&slide===topics.length-1?'[data-d3-projects]':`[data-d3-step="${step}"]:not(:disabled)`)?.focus({preventScroll:true});}
 function showProjects(){if(presentation.onProjects){presentation.onProjects();return;}const el=document.getElementById('district-projects');el?.scrollIntoView({block:'start',behavior:'instant'});el?.focus({preventScroll:true});}
 document.addEventListener('click',e=>{const b=e.target.closest('[data-d3-scene],[data-d3-object],[data-d3-step],[data-d3-projects]');if(!b||!b.closest('.d3-overview'))return;if(Date.now()<suppressClickUntil){e.preventDefault();return}if(b.hasAttribute('data-d3-scene'))selectSlide(+b.dataset.d3Scene);else if(b.dataset.d3Object)selectObject(b.dataset.d3Object);else if(b.hasAttribute('data-d3-step'))selectSlide(slide+Number(b.dataset.d3Step));else showProjects();});
 document.addEventListener('pointerover',e=>{if(e.pointerType!=='mouse'||isPlacesScene())return;const b=e.target.closest('[data-d3-object]');if(b?.closest('.d3-overview'))selectObject(b.dataset.d3Object);});
 document.addEventListener('focusin',e=>{if(isPlacesScene())return;const b=e.target.closest('[data-d3-object]');if(b?.closest('.d3-overview'))selectObject(b.dataset.d3Object);});
 document.addEventListener('error',event=>{
  const map=event.target instanceof HTMLImageElement && event.target.closest('.d3-places-map');
  if(!map)return;
  map.classList.add('d3-places-map--missing');
  map.querySelector('.d3-place-unavailable').hidden=false;
 },true);
 document.addEventListener('keydown',e=>{if(!e.target.closest('.d3-overview')||e.ctrlKey||e.altKey||e.metaKey||e.shiftKey)return;if(e.target.closest('[data-d3-object]')&&['ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();const ids=topics[slide].objects,i=ids.indexOf(choice[slide]);const id=ids[(i+(e.key==='ArrowDown'?1:-1)+ids.length)%ids.length];selectObject(id);root().querySelector(`[data-d3-object="${id}"]`)?.focus({preventScroll:true});return}if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const fromTopics=e.target.closest('.d3-topics');selectSlide(e.key==='Home'?0:e.key==='End'?topics.length-1:slide+(e.key==='ArrowRight'?1:-1));const target=fromTopics?root().querySelector('[aria-selected="true"]'):document.getElementById('d3-stage');target?.focus({preventScroll:true});});
 document.addEventListener('pointerdown',e=>{if(!e.target.closest('.d3-map-window')||!['touch','pen'].includes(e.pointerType)){pointer=null;return}pointer={x:e.clientX,y:e.clientY,id:e.pointerId};},{passive:true});
 document.addEventListener('pointerup',e=>{if(!pointer||pointer.id!==e.pointerId)return;const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;pointer=null;if(Math.abs(dx)>=55&&Math.abs(dx)>Math.abs(dy)*1.5){suppressClickUntil=Date.now()+450;selectSlide(slide+(dx<0?1:-1));}},{passive:true});
 document.addEventListener('pointercancel',()=>{pointer=null;},{passive:true});
 window.DistrictSlides={overview,findByKey,has:key=>!!findByKey(key),brief(id,lang){const d=find(id);return d?`<p>${esc(d.summary[lang])}</p><a href="#district=${esc(d.id)}">${lang==='ru'?'Подробнее о районе':'More about the district'} →</a>`:'';}};
})();
