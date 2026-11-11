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
 function topicTabs(){return topics.map((t,i)=>`<button type="button" class="d3-control d3-topic" role="tab" data-d3-scene="${i}" id="d3-topic-${i}" aria-selected="${i===slide}" aria-controls="d3-stage" tabindex="${i===slide?'0':'-1'}"><i>0${i+1}</i>${tx(t)}</button>`).join('');}
 function pin(id,num,x,y,extra='',layout='',mx=x,my=y){return `<button type="button" class="d3-pin d3-pin--${layout}${choice[slide]===id?' is-selected':''}" data-d3-object="${id}" style="--x:${x}%;--y:${y}%;--pin-mobile-x:${mx}%;--pin-mobile-y:${my}%" aria-label="${esc(name(id))}" aria-pressed="${choice[slide]===id}" aria-controls="d3-card"><i>${num}</i><span class="d3-pin-label">${esc(name(id))}${extra?`<em>${esc(extra)}</em>`:''}</span></button>`;}
 function overlay(content){return `<svg class="d3-overlay" viewBox="0 0 ${topics[slide].width} ${topics[slide].height}" aria-hidden="true"><defs><radialGradient id="d3-halo"><stop stop-color="#b8ceac" stop-opacity=".6"/><stop offset="1" stop-color="#b8ceac" stop-opacity="0"/></radialGradient></defs>${content}</svg>`;}
 function districtLabel(x,y,mx=x,my=y){return `<span class="d3-district-label" style="left:${x}%;top:${y}%;--district-mobile-x:${mx}%;--district-mobile-y:${my}%">${esc(active.name)}</span>`;}
 function terrain(){
  const s=topics[slide],pos=s.districtLabel;let marks='';
  if(s.layout==='area'){const p=s.optionPosition;marks=`<div class="d3-area-options" style="left:${p.x}%;top:${p.y}%;--options-mobile-x:${p.mobileX}%;--options-mobile-y:${p.mobileY}%">${s.objects.map((id,i)=>`<button type="button" class="d3-control d3-area-option ${choice[slide]===id?'is-selected':''}" data-d3-object="${esc(id)}" aria-pressed="${choice[slide]===id}" aria-controls="d3-card"><i>${i+1}</i>${esc(name(id))}</button>`).join('')}</div>`;}
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
   <button type="button" class="d3-control d3-choice d3-place-option${selected(id)?' is-selected':''}" data-d3-object="${esc(id)}"
    aria-label="${esc(tx(c[id].category))} · ${esc(tx(c[id].cardTitle))}" aria-pressed="${selected(id)}" aria-controls="d3-card">
    <i>${placeNumber(index)}</i>${scene.numbered ? `<strong>${esc(name(id))}</strong>` : `<span><strong>${esc(tx(c[id].category))}</strong><small>${esc(name(id))}</small></span>`}
   </button>`).join('');
  const image = new URL(scene.image,presentation.assetsBase||document.baseURI).href;
  return `<div class="d3-places-heading">${scene.numbered ? `<p class="eyebrow">${esc(tx(scene))}</p>` : ''}<h2${scene.numbered?' id="d3-place-heading"':''}>${esc(tx(scene.heading))}</h2>${scene.numbered ? '' : `<p>${esc(tx(scene.instructions))}</p>`}</div>
   <div class="d3-place-frame">
    <div class="d3-map-window d3-places-map">
     <div class="d3-places-plane" style="--d3-place-ratio:${scene.width}/${scene.height}">
      <img class="d3-places-image" src="${esc(image)}" width="${scene.width}" height="${scene.height}" alt="" draggable="false">
      ${scene.numbered ? '' : `<svg class="d3-place-leaders" viewBox="0 0 ${scene.width} ${scene.height}" aria-hidden="true">${leaders}</svg>`}
      ${labels}<div role="group" aria-label="${L('Объекты на изображении','Objects in the image')}">${pins}</div>
     </div>
     <span class="d3-visualization d3-place-visualization">${scene.numbered ? '↑ N' : L('3D-визуализация','3D visualization')}</span>
     <p class="d3-place-unavailable" hidden>${L('Карта недоступна. Выберите объект в списке ниже.','The map is unavailable. Choose a place in the list below.')}</p>
    </div>
    <div class="d3-place-caption"><span>${scene.numbered ? esc(tx(scene.instructions)) : L('Условные очертания застройки','Illustrative building outlines')}</span>
     ${scene.numbered ? '' : '<span class="d3-map-credit">© OpenStreetMap · ODbL 1.0 · openstreetmap.org/copyright</span>'}
    </div>
   </div>
   <div class="d3-place-list" role="group" aria-label="${L('Места рядом','Nearby places')}">${options}</div>`;
 }

 function placeCard(place) {
  if (topics[slide].numbered) return summaryPlaceCard(place);
  const origin = topics[slide].origin;
  const facts = place.facts.map(({label,value}) => `<div><dt>${esc(tx(label))}</dt><dd>${esc(tx(value))}</dd></div>`).join('');
  return `<div>
   <div class="d3-place-card-head">
    <span class="d3-place-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${placeIcons[place.symbol]}</svg></span>
    <div><p class="d3-place-meta">${esc(tx(place.category))} · ${esc(tx(place.area))}</p><h3 id="d3-card-title">${esc(tx(place.cardTitle))}</h3></div>
   </div>
   <p class="d3-place-description">${esc(tx(place.description))}</p><dl class="d3-place-facts">${facts}</dl>
   </div><div class="d3-place-route">
    <p class="d3-place-route-title">${L('Доступность','Access')}</p>
    <p>${esc(tx(origin.name))}</p><p>${esc(tx(place.access))}</p>
   </div>`;
 }

 function summaryPlaceCard(place) {
  const facts = place.facts.map(({label,value}) => `<div><dt>${esc(tx(label))}</dt><dd>${esc(tx(value))}</dd></div>`).join('');
  const details = [
   [L('Для жителя','For residents'),place.details.life],
   [L('Для инвестора','For investors'),place.details.demand],
   [L('Доступность','Getting there'),place.access],
   [L('Важно','Keep in mind'),place.details.limit]
  ].filter(([,value]) => value).map(([label,value]) => `<div><dt>${label}</dt><dd>${esc(tx(value))}</dd></div>`).join('');
  return `<div class="d3-summary-meta"><p class="d3-place-meta">${esc(tx(place.category))} · ${esc(tx(place.area))}</p>
   <span>${L('Работает','Open')}</span></div><h3 id="d3-card-title">${esc(tx(place.cardTitle))}</h3>
   <p class="d3-place-description">${esc(tx(place.description))}</p><dl class="d3-place-facts">${facts}</dl>
   <details class="d3-summary-details"><summary class="d3-control d3-disclosure">${L('Что учесть покупателю','What buyers should know')}</summary><dl>${details}</dl></details>`;
 }

 function marketSummary(market) {
  const facts = [
   [L('Цена продажи','Sale price'),money(market.saleAed)],
   [L('Цена за площадь','Price per area'),rate(market.saleAedPerSqFt)],
   [L('Новый договор аренды','New lease'),money(market.newLeaseAed)+' <small>'+L('в год','per year')+'</small>']
  ];
  return `<section class="d3-market-summary" aria-labelledby="d3-market-summary-title">
   <p class="eyebrow">${L('Продажи и аренда','Sales and rentals')}</p><h2 id="d3-market-summary-title">${esc(tx(market.title))}</h2>
   <dl class="d3-place-facts">${facts.map(([label,value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}</dl>
   <p class="d3-market-note">${esc(tx(market.note))}</p></section>`;
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
  const access = scene.numbered ? 'aria-labelledby="d3-place-heading"' : `role="tabpanel" aria-labelledby="d3-topic-${slide}"`;
  return `<section class="d3-stage d3-${scene.id}${places?' d3-stage--places':''}" id="d3-stage" ${access} tabindex="0">${places?placesTerrain(scene):terrain()}<article id="d3-card" class="d3-info d3-info--${c[id].kind}${c[id].compactPeriod?' d3-info--compact-period':''}" data-card="${id}" aria-live="polite" aria-atomic="true">${card(id)}</article></section>`;
 }
 function controls(){return `<div class="d3-controls"><button type="button" class="d3-control d3-arrow" data-d3-step="-1" ${slide===0?'disabled':''}>← ${L('Назад','Back')}</button><div class="d3-progress"><strong>${String(slide+1).padStart(2,'0')}</strong><span>/ ${String(topics.length).padStart(2,'0')}</span><div aria-hidden="true">${topics.map((_,i)=>`<i class="${i===slide?'is-current':''}"></i>`).join('')}</div></div><button type="button" class="d3-control d3-control--primary d3-arrow" ${slide===topics.length-1?'data-d3-projects':'data-d3-step="1"'}>${slide===topics.length-1?(presentation.embedded?L('К квартирам','Apartments'):L('К проектам','Projects')):L('Далее','Next')} →</button></div>`;}
 function overview(key,lang,code,settings={}){
  presentation=settings;active=findByKey(key);if(!active)return '';
  if(active.sceneOverview&&window.DistrictScenes)return window.DistrictScenes.overview(active,lang,code,settings);
  data=active.terrain;c=data.cards;
  // Standalone offers can briefly have an older shared stylesheet in the browser cache.
  const places=data.placeScene&&(data.marketSummary||getComputedStyle(document.documentElement).getPropertyValue('--d3-places-layout').trim()==='1');
  topics=places?[...data.slides,data.placeScene]:data.slides;
  if(!states.has(active.id))states.set(active.id,{slide:0,choice:topics.map(t=>t.objects[0])});
  const saved=states.get(active.id);slide=Math.min(saved.slide,topics.length-1);choice=saved.choice;choice[slide]??=topics[slide].objects[0];language=lang;currency=code;
  if (data.marketSummary) {
   const districtUrl = new URL('./#district='+active.id, settings.assetsBase||document.baseURI);
   return `<section class="d3-overview d3-overview--summary${settings.embedded?' d3-overview--embedded':''}" aria-labelledby="district-title">
    <div class="d3-heading"><div><p class="eyebrow">${L('Обзор района','District overview')}</p><${settings.embedded?'h2':'h1'} id="district-title">${esc(active.name)}</${settings.embedded?'h2':'h1'}></div></div>
    <p class="d3-summary-intro">${esc(tx(active.summary))}</p><div id="d3-stage-wrap">${stage()}</div>${marketSummary(data.marketSummary)}
    <div class="d3-summary-actions">${settings.embedded?`<a class="d3-control" href="${esc(districtUrl.href)}">${L('Открыть обзор района','Open district overview')}</a>`:''}
    <button type="button" class="d3-control d3-control--primary" data-d3-projects>${settings.embedded?L('К квартирам','Apartments'):L('К проектам','Projects')} →</button></div></section>`;
  }
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
 document.addEventListener('keydown',e=>{if(!e.target.closest('.d3-overview')||e.ctrlKey||e.altKey||e.metaKey||e.shiftKey)return;if(e.target.closest('[data-d3-object]')&&['ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();const ids=topics[slide].objects,i=ids.indexOf(choice[slide]);const id=ids[(i+(e.key==='ArrowDown'?1:-1)+ids.length)%ids.length];selectObject(id);root().querySelector(`[data-d3-object="${id}"]`)?.focus({preventScroll:true});return}if(topics.length<2||!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const fromTopics=e.target.closest('.d3-topics');selectSlide(e.key==='Home'?0:e.key==='End'?topics.length-1:slide+(e.key==='ArrowRight'?1:-1));const target=fromTopics?root().querySelector('[aria-selected="true"]'):document.getElementById('d3-stage');target?.focus({preventScroll:true});});
 document.addEventListener('pointerdown',e=>{if(topics.length<2||!e.target.closest('.d3-map-window')||!['touch','pen'].includes(e.pointerType)){pointer=null;return}pointer={x:e.clientX,y:e.clientY,id:e.pointerId};},{passive:true});
 document.addEventListener('pointerup',e=>{if(!pointer||pointer.id!==e.pointerId)return;const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;pointer=null;if(Math.abs(dx)>=55&&Math.abs(dx)>Math.abs(dy)*1.5){suppressClickUntil=Date.now()+450;selectSlide(slide+(dx<0?1:-1));}},{passive:true});
 document.addEventListener('pointercancel',()=>{pointer=null;},{passive:true});
 window.DistrictSlides={overview,findByKey,has:key=>!!findByKey(key),brief(id,lang){const d=find(id);return d?`<p>${esc(d.summary[lang])}</p><a href="#district=${esc(d.id)}">${lang==='ru'?'Подробнее о районе':'More about the district'} →</a>`:'';}};
})();

(() => {
 'use strict';
 const states = new Map();

 function createController(district){
 const {themes,districtPoints,marketRows,terrainImage,images,routesV04,group,nearGroups,universityIds,wideImage}=district.sceneOverview;
 const config=district.sceneOverview;
 const generic=config.format==='places-v1';
 let settings={};
 const safe = value => String(value ?? '').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let lang = 'ru';
let currencyCode = 'AED';
let activeTheme = themes[0];
let marketMode = 'sale';
let nearGroup = 'errands';
let mapObserver;
const selections = new Map();
const labelShifts = Array.from({length:21},(_,i)=>(i-10)*4);
const labelOffsets = labelShifts.flatMap(dx=>labelShifts.map(dy=>[dx,dy]))
  .sort(([ax,ay],[bx,by])=>ax*ax+ay*ay-bx*bx-by*by);
const T = (ru,en) => lang==='ru'?ru:en;
const label = value => typeof value==='string'?value:value?.[lang]??'';
const fmt = (value, digits=0) => new Intl.NumberFormat(T('ru-RU','en-GB'),{minimumFractionDigits:digits,maximumFractionDigits:digits}).format(value);
const amount = aed => fmt(currencyCode==='AED'?aed:aed/district.terrain.rate)+' '+currencyCode;
const unitRate = rate => currencyCode==='AED'?fmt(rate,1)+' AED / sq ft':fmt(rate/(district.terrain.rate*0.09290304),1)+' USD / m²';
const mapNote = () => T('Авторская 3D-визуализация. Здания обобщены.','Original 3D illustration. Buildings are generalized.');
const chosenThemeKey = () => activeTheme.id+'-'+(activeTheme.id==='everyday'?nearGroup:'district');
const isEducation = () => activeTheme.id==='everyday' && nearGroup==='schools';

function mapScene(){
  const id=activeTheme.id;
  if(generic){const spec=config.mapScenes[id];return {frame:spec.map,...config.maps[spec.map],ids:id==='everyday'?nearGroups[nearGroup]:activeTheme.objects||[]};}
  if(id==='transport'||id==='everyday'){
    const ids=id==='transport'?['junction','bus','red','rail','gold-17']:nearGroups[nearGroup];
    return {frame:'wide',...wideImage,...images.widePhoto,ids};
  }
  return {frame:'district',...terrainImage,...images.terrain,ids:id==='economy'?['zone','in5']:[],crop:terrainImage.crops[id]};
}
function cropPoint([x,y],[left,top,right,bottom]){
  return [(x-left)/(right-left)*100,(y-top)/(bottom-top)*100];
}
function activePlace(scene){
  return selections.get(chosenThemeKey()) ?? scene.ids[0];
}
function buttons(values,attr,selected){
  return values.map(([id,text])=>'<button type="button" class="d3-control d3-topic" data-'+attr+'="'+id+'" aria-pressed="'+(id===selected)+'">'+safe(text)+'</button>').join('');
}
const iconPaths = {
 'beach':'<path d="M3 12a9 9 0 0 1 18 0H3zm9-9v17a2 2 0 0 0 4 0M7 12c0-4 2-8 5-9 3 1 5 5 5 9"/>',
 'airport':'<path d="m3 10 7 2V4a2 2 0 0 1 4 0v8l7-2v3l-7 3v4l3 1v1l-5-1-5 1v-1l3-1v-4-0l-7-3z"/>',
 'port':'<path d="M12 4v14M6 9H3c0 7 3 11 9 12 6-1 9-5 9-12h-3M7 15l5 6 5-6M7 7h10"/><circle cx="12" cy="4" r="2"/>',
 'park':'<path d="m12 3-7 9h4l-5 6h7v4m1-19 7 9h-4l5 6h-8"/>',
 'area':'<path d="M4 19V9h6v10M10 5h10v14M2 19h20M13 9h4m-4 4h4"/>',
 'media':'<rect x="3" y="5" width="13" height="14" rx="2"/><path d="m16 10 5-3v10l-5-3"/>',
 'road':'<path d="m8 3-4 18m12-18 4 18M12 3v4m0 3v4m0 3v4"/>',
 'bus':'<rect x="5" y="3" width="14" height="15" rx="3"/><path d="M5 11h14M7 18v3m10-3v3M8.5 14h.01m7 0h.01"/>',
 'train':'<rect x="5" y="3" width="14" height="14" rx="4"/><path d="M5 10h14m-7-7v7M9 14h.01m6 0h.01M9 17l-3 4m9-4 3 4"/>',
 'metro':'<path d="M4 19V5l8 8 8-8v14"/>',
 'mall':'<path d="M5 8h14l2 13H3zM9 9V6a3 3 0 0 1 6 0v3"/>',
 'clinic':'<path d="M9 4h6v5h5v6h-5v5H9v-5H4V9h5z"/>',
 'school':'<path d="m2 9 10-5 10 5-10 5-10-5zM6 11v6c4 3 8 3 12 0v-6m4-2v7"/>',
 'golf':'<path d="M7 19V4l12 4-12 4m4 6c2 .4 3 1 3 1.5S11.5 21 8 21s-6-.7-6-1.5c0-.6 1.6-1.2 3-1.4"/>',
 'nursery':'<rect x="3" y="12" width="8" height="8" rx="1"/><rect x="13" y="12" width="8" height="8" rx="1"/><path d="m8 10 4-6 4 6z"/>',
 'university':'<path d="m2 9 10-5 10 5zM3 20h18M6 9v11m6-11v11m6-11v11"/>',
 'football':'<rect x="2" y="5" width="20" height="14" rx="1"/><path d="M12 5v14M2 9h4v6H2m20-6h-4v6h4"/><circle cx="12" cy="12" r="2.5"/>',
 'fitness':'<path d="M2 12h3m14 0h3M8 12h8M5 8h3v8H5zm11 0h3v8h-3z"/>',
 'stadium':'<ellipse cx="12" cy="13" rx="9" ry="5"/><path d="M3 13v3c0 2.8 4 5 9 5s9-2.2 9-5v-3M12 7V2l5 2-5 2"/>'
};
const iconsByPlace = {
 zone:'area',in5:'media',junction:'road',bus:'bus',rail:'train',red:'metro','gold-17':'metro',
 'city-centre-meaisem':'mall',clinic:'clinic','sunmarke-school':'school',arcadia:'school',victory:'school',dwight:'school',
 'kids-kingdom':'nursery','kinder-castle':'nursery',dibber:'nursery',middlesex:'university',wollongong:'university',
 els:'golf',earth:'golf',fire:'golf','isd-football':'football',fitrepublik:'fitness','cricket-stadium':'stadium'
};
const pinIcon = id => '<span class="place-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" focusable="false">'+iconPaths[(generic?districtPoints[id]?.icon:iconsByPlace[id])||'area']+'</svg></span>';
function transferLine(scene){
  if(generic||activeTheme.id!=='transport')return '';
  const [metroX,metroY]=scene.anchors.red;
  const [railX,railY]=scene.anchors.rail;
  return '<svg class="transfer-line" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M '+metroX+' '+metroY+' L '+railX+' '+railY+'" /></svg>';
}
function mapMarkup(scene){
  const crop = scene.crop??[0,0,100,100];
  const [left,top,right,bottom]=crop;
  const cropWidth=(right-left)/100,cropHeight=(bottom-top)/100;
  const imageStyle='--img-x:'+(-left/cropWidth)+'%;--img-y:'+(-top/cropHeight)+'%;--img-w:'+(100/cropWidth)+'%;--img-h:'+(100/cropHeight)+'%';
  const ratio=scene.width*cropWidth/(scene.height*cropHeight);
  const points = scene.ids.map(id=>{
    const place = districtPoints[id];
    const [x,y] = cropPoint(scene.anchors[id],crop);
    return {id,place,x,y};
  });
  const pins = points.map(({id,place,x,y})=>'<button class="pin'+(place.future?' pin--future':'')+'" type="button" data-place="'+id+'" data-x="'+x+'" data-y="'+y+'" style="--x:'+x+'%;--y:'+y+'%" aria-label="'+safe(place.name)+'" aria-controls="detail-card" aria-pressed="'+(activePlace(scene)===id)+'">'+pinIcon(id)+'<span class="pin-name d3-pin-label" aria-hidden="true">'+safe(id==='zone'?district.name:place.name)+'</span></button>').join('');
  const anchors = points.map(({x,y,place})=>'<span class="map-anchor'+(place.approximate?' map-anchor--approximate':'')+'" style="left:'+x+'%;top:'+y+'%" aria-hidden="true"></span>').join('');
  const areas = scene.areas.map(([name,x,y])=>[name,...cropPoint([x,y],crop)])
   .filter(([name,x,y])=>x>7&&x<92&&y>8&&y<92&&(activeTheme.id!=='economy'||name!=='IMPZ'))
   .map(([name,x,y])=>'<span class="map-area map-area--terrain '+((generic?name===district.name:name==='IMPZ')?'d3-district-label':'d3-pin-label')+'" data-area-x="'+x+'" data-area-y="'+y+'" style="left:'+x+'%;top:'+y+'%" aria-hidden="true">'+safe(name)+'</span>').join('');
  return '<figure class="map-figure"><div class="map" data-scene="'+scene.frame+'" style="--map-ratio:'+ratio+'"><img src="' +safe(new URL(scene.image,settings.assetsBase||document.baseURI).href)+'" width="'+scene.width+'" height="'+scene.height+'" style="'+imageStyle+'" alt="" />'+
   '<div class="map-overlay">'+transferLine(scene)+'<svg class="leaders" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"></svg>'+anchors+areas+
   '<span class="compass" aria-hidden="true">↑ N</span><span class="d3-visualization" title="'+safe(mapNote())+'">'+T('3D-визуализация','3D visualization')+'</span>'+
   '<div class="pins" role="group" aria-label="'+T('Объекты на карте','Map landmarks')+'">'+pins+'</div></div>'+
   '<p class="map-fallback" hidden>'+(points.length
    ?T('Карта недоступна. Выберите объект из списка.','The map is unavailable. Choose a landmark from the list.')
    :T('3D-визуализация недоступна.','The 3D view is unavailable.'))+'</p></div>'+
   '<figcaption class="d3-place-caption"><span>'+T('Здания обобщены','Buildings generalized')+'</span>'+
   (scene.credit?'<span class="d3-map-credit">'+safe(label(scene.credit))+'</span>':((generic||scene.frame==='wide')?'<span class="d3-map-credit">© OpenStreetMap · ODbL 1.0 · openstreetmap.org/copyright</span>':''))+
   '</figcaption></figure>';
}
function spreadPins(map){
 const w=map.clientWidth,h=map.clientHeight;
 if(w<60||h<60||map.classList.contains('is-missing'))return;
 const {left,top}=map.getBoundingClientRect();
 const badges=[...map.querySelectorAll('.compass,.d3-visualization')].map(el=>{
  const box=el.getBoundingClientRect();
  return [box.left-left,box.top-top,box.right-left,box.bottom-top];
 });
 const used=[],lines=[];
 const pins=[...map.querySelectorAll('.pin')];
 for(const pin of pins){
  const ax=+pin.dataset.x*w/100,ay=+pin.dataset.y*h/100;
  const clamp=(v,limit)=>Math.max(25,Math.min(limit-25,v));
  const px=clamp(ax,w),py=clamp(ay,h);
  let options=[[px,py]];
  for(const radius of [48,65,88,116,150])for(let i=0;i<16;i++){
    const a=Math.PI*i/8;
    options.push([clamp(ax+Math.cos(a)*radius,w),clamp(ay+Math.sin(a)*radius,h)]);
  }
  const [x,y]=options.sort((a,b)=>Math.hypot(a[0]-ax,a[1]-ay)-Math.hypot(b[0]-ax,b[1]-ay))
   .find(([x,y])=>used.every(([u,v])=>Math.abs(x-u)>=46||Math.abs(y-v)>=46)&&
    badges.every(([l,t,r,b])=>x+17<l||x-17>r||y+17<t||y-17>b))??[px,py];
  used.push([x,y]);
  pin.style.setProperty('--x',x+'px'); pin.style.setProperty('--y',y+'px');
  if(Math.hypot(x-ax,y-ay)>3)lines.push('<path d="M '+pin.dataset.x+' '+pin.dataset.y+' L '+x/w*100+' '+y/h*100+'" />');
 }
 map.querySelector('.leaders').innerHTML=lines.join('');
 positionLabels(map,pins,used,badges,w,h);
}
function positionLabels(map,pins,centers,badges,width,height){
 const reserved=[...badges,...centers.map(([x,y])=>[x-17,y-17,x+17,y+17])];
 function placeLabel(label,candidates){
  const halfW=label.offsetWidth/2;
  const halfH=label.offsetHeight/2;
  const point=candidates(halfW,halfH).map(([x,y])=>[
    Math.max(halfW+3,Math.min(width-halfW-3,x)),
    Math.max(halfH+3,Math.min(height-halfH-3,y))
  ]).find(([x,y])=>reserved.every(([l,t,r,b])=>x+halfW<l||x-halfW>r||y+halfH<t||y-halfH>b));
  label.style.visibility=point?'':'hidden';
  if(point)reserved.push([point[0]-halfW,point[1]-halfH,point[0]+halfW,point[1]+halfH]);
  return point;
 }
 pins.forEach((pin,index)=>{
  const label=pin.querySelector('.pin-name');
  if(!label.offsetWidth)return;
  const [x,y]=centers[index];
  const point=placeLabel(label,(w,h)=>[[x,y+21+h],[x,y-21-h],[x+21+w,y],[x-21-w,y]]);
  if(point){
   label.style.left=(point[0]-x+pin.clientWidth/2)+'px';
   label.style.top=(point[1]-y+pin.clientHeight/2)+'px';
  }
 });
 for(const label of map.querySelectorAll('.map-area--terrain')){
  const x=Number(label.dataset.areaX)*width/100;
  const y=Number(label.dataset.areaY)*height/100;
  const point=placeLabel(label,()=>labelOffsets.map(([dx,dy])=>[x+dx,y+dy]));
  if(point){
   label.style.left=point[0]+'px';
   label.style.top=point[1]+'px';
  }
 }
}
function placeIndex(ids,title,selected,kind,note=''){
  const items=ids.map(id=>'<button type="button" class="d3-control d3-choice" data-place="'+id+'" aria-controls="detail-card" aria-pressed="'+(selected===id)+'">'+pinIcon(id)+'<span>'+safe(districtPoints[id].name)+'</span></button>');
  return '<details class="place-index '+kind+'"><summary class="d3-control d3-disclosure">'+safe(title)+'</summary>'+
   (note?'<p class="muted">'+safe(note)+'</p>':'')+
   '<div class="places" role="group" aria-label="'+safe(title)+'">'+items.join('')+'</div></details>';
}
function factCards(facts,headline=false){
  if(!facts.length)return '';
  return '<dl class="facts d3-employment-kpis'+(headline?' facts--headline':'')+'">'+facts.map(([value,caption])=>'<div><dt>'+safe(label(caption))+'</dt><dd><strong>'+safe(label(value))+'</strong></dd></div>').join('')+'</dl>';
}
function cardMarkup(){
  const id=activePlace(mapScene());
  const place=districtPoints[id];
  const headlineFacts=id==='zone';
  const facts=factCards(place.facts,headlineFacts);
  const detailLabels={life:T('Для жителя','For residents'),demand:T('Для инвестора','For investors'),access:T('Доступность','Getting there'),limit:T('Важно','Keep in mind')};
  const details=place.details?.map(([key,text])=>'<div><dt>'+detailLabels[key]+'</dt><dd>'+safe(label(text))+'</dd></div>').join('')??'';
  return '<div class="card-lead"><div class="d3-card-head"><span class="d3-index" aria-hidden="true">'+pinIcon(id)+'</span>'+
   '<div><p class="d3-kicker">'+safe(label(place.category))+
   (place.status?'<span class="place-status'+(place.future?' place-status--future':'')+'">'+safe(label(place.status))+'</span>':'')+'</p>'+
   '<h3 id="card-title">'+safe(place.name)+'</h3></div></div>'+(headlineFacts?facts:'')+
   '<p class="card-summary d3-meaning">'+safe(label(place.description))+'</p></div>'+
   (headlineFacts?'':facts)+(details?'<details><summary class="d3-control d3-disclosure">'+T('Что учесть покупателю','What buyers should know')+'</summary><dl class="detail-grid">'+details+'</dl></details>':'');
}
function routeList(){
  if(generic)return dataRouteList();
  const info = {
   toll:T('Платный участок','Toll section'),
   airport:T('Точка аэропорта; конкретная дверь высадки не подтверждена.','Airport pin; the exact drop-off door is unconfirmed.')
  };
  const rows=routesV04.map(([name,min,km,,via,note])=>{
   const qualifier=[via,info[note]].filter(Boolean).join(' · ');
   return '<tr><th scope="row">'+safe(name)+
    (qualifier?'<small>'+safe(qualifier)+'</small>':'')+'</th>'+
    '<td><strong>'+fmt(min)+' '+T('мин','min')+'</strong></td>'+
    '<td>'+fmt(km,km%1?1:0)+' '+T('км','km')+'</td></tr>';
  });
  return '<details class="driving-routes"><summary class="d3-control d3-disclosure"><span><span id="routes-title" class="driving-title">'+T('На автомобиле от City Centre Me’aisem','Driving from City Centre Me’aisem')+
   '</span><small>'+fmt(routesV04.length)+' '+T('маршрутов · время и расстояние','routes · time and distance')+'</small></span></summary>'+
   '<table aria-labelledby="routes-title"><thead><tr><th scope="col">'+T('Направление','Destination')+'</th><th scope="col">'+T('Время','Time')+
   '</th><th scope="col">'+T('Расстояние','Distance')+'</th></tr></thead><tbody>'+rows.join('')+'</tbody></table>'+
   '<p class="muted">'+
   T('10.11.2026, около 13:25. Время в пути зависит от трафика.','10 Nov 2026, around 13:25. Travel times vary with traffic.')+
   '</p></details>';
}
function economyPanel(){
 if(generic)return '';
 return '<section class="routes economy"><h3>'+T('Что работает в свободной зоне','How the free zone works')+'</h3>'+
 '<dl class="economy-grid">'+[
  [T('Какие компании здесь работают','Who operates here'),T('Xerox — технологии печати и документооборота; Reproflex3 — подготовка к флексопечати для упаковки; Dynagraph — решения для полиграфии; NDigitec — допечатная подготовка, цифровая печать и производство контента.','Xerox provides printing and document technology; Reproflex3 works in flexographic prepress for packaging; Dynagraph supplies print solutions; NDigitec works in prepress, digital printing and creative production.')],
  [T('Чем зона привлекает бизнес','Why businesses choose it'),T('В одном месте можно зарегистрировать компанию, снять склад или площадку под производство и найти подрядчиков по печати, упаковке и хранению. Для небольших медиакоманд in5 даёт доступ к студиям и оборудованию без необходимости строить собственные.','Businesses can register, lease a warehouse or production site, and find printing, packaging and storage suppliers in one district. in5 gives smaller media teams access to studios and equipment without setting up their own.')],
  [T('Выручка медиасегмента TECOM','TECOM media segment revenue'),T('421 млн AED за 2025 год по трём медиарайонам.','AED 421 million in 2025 across three media districts.')],
  [T('Что это значит для района','What this means for the district'),T('Рабочие места связаны с печатью, производством, складами и медиаконтентом. Сотрудники и подрядчики — возможная аудитория для местной аренды.','Employment is linked to print, production, warehousing and content creation. Staff and contractors are potential local renters.')]
 ].map(([h,p])=>'<div><dt>'+safe(h)+'</dt><dd>'+safe(p)+'</dd></div>').join('')+'</dl></section>';
}
function marketPanel(){
 if(generic)return dataMarketPanel();
  const sale=marketMode==='sale';
  const row=marketRows[1];
  const stats=sale?[[amount(row.sale),T('Медиана цены 1BR','Median 1BR sale price')],[unitRate(row.rate),T('Медиана цены за площадь','Median price per area')],[fmt(row.sales),T('Зарегистрировано продаж 1BR','Registered 1BR sales')]]:
   [[amount(row.lease),T('Новая аренда 1BR / год','New 1BR lease / year')],[amount(row.renewal),T('Продление 1BR / год','1BR renewal / year')],[fmt(row.contracts),T('Новые договоры и продления 1BR','1BR new leases and renewals')]];
  const columns=sale?[T('Медиана','Median'),T('За площадь','Per area'),T('Сделок','Sales')]:[T('Новые / год','New / year'),T('Продления / год','Renewals / year'),T('Договоров','Contracts')];
  return '<section class="market-box d3-info d3-info--flow" aria-labelledby="market-heading"><div class="d3-card-head"><div><p class="d3-kicker">'+T('Выборка за 12 месяцев по 02.10.2026','12 months ending 2 Oct 2026')+'</p><h3 id="market-heading">'+T('Квартиры по числу спален','Apartments by bedroom count')+'</h3></div></div>'+
   '<div class="scene-options market-options" role="group" aria-label="'+T('Тип рыночных данных','Market data type')+'">'+buttons([['sale',T('Продажи','Sales')],['rent',T('Аренда','Rent')]],'market',marketMode)+'</div>'+
   factCards(stats)+'<table><thead><tr><th scope="col">'+T('Квартира','Apartment')+'</th>'+columns.map(c=>'<th scope="col">'+c+'</th>').join('')+'</tr></thead><tbody>'+
   marketRows.map(r=>'<tr><th scope="row">'+safe(label(r.label))+'</th>'+(sale?[amount(r.sale),unitRate(r.rate),fmt(r.sales)]:[amount(r.lease),amount(r.renewal),fmt(r.contracts)]).map(v=>'<td>'+safe(v)+'</td>').join('')+'</tr>').join('')+
   '</tbody></table>'+(sale?'<p class="muted">'+T('Выборка шире границ IMPZ.','The sample extends beyond IMPZ.')+'</p>':'')+'</section>';
}
function themeMarkup(){
  if(generic)return dataThemeMarkup();
  const scene=mapScene();
  const filters=activeTheme.id==='everyday'?'<div class="scene-options filter-options" role="group" aria-label="'+T('Тип места','Place type')+'">'+buttons(Object.entries(group).map(([id,title])=>[id,label(title)]),'near',nearGroup)+'</div>':'';
  const titles={
   economy:[T('Как работает свободная зона IMPZ','How the IMPZ free zone works'),T('Производственные площадки, компании и медиаинкубатор TECOM.','Production facilities, businesses and TECOM’s media incubator.')],
   transport:[T('Что уже работает и куда можно доехать','Operating connections and where they take you'),T('Автобусы, метро и Etihad Rail уже работают. Gold Line показана отдельно как план.','Buses, the Metro and Etihad Rail already operate. Gold Line is shown separately as planned.')],
   everyday:[T('Покупки, медицина, образование и досуг','Shopping, healthcare, education and leisure'),
    T('Садик и повседневные услуги есть в IMPZ. Школы, спорт и гольф находятся в соседних районах.','IMPZ has a nursery and everyday services. Schools, sports and golf are in neighbouring communities.')]
  };
  const [title,lead]=titles[activeTheme.id]??[label(activeTheme.title),label(activeTheme.lead)];
  const bridgeNote=activeTheme.id==='transport'?
    '<p class="bridge-note muted"><span aria-hidden="true"></span>'+T('Мост между R73 и Al Yalayis · 375 м','Bridge between R73 and Al Yalayis · 375 m')+'</p>':'';
  const card=activeTheme.id==='market'?marketPanel():'<article id="detail-card" class="place-card d3-info d3-info--flow" aria-labelledby="card-title">'+cardMarkup()+'</article>';
  let more=bridgeNote+(activeTheme.id==='transport'?routeList():'');
  if(scene.ids.length){
   const selected=activePlace(scene);
   if(isEducation()){
    more+=placeIndex(universityIds,T('Университеты рядом','Nearby universities'),selected,'campus-index',
     T('Кампусы Dubai Knowledge Park за пределами 3D-кадра. Расстояния указаны в карточках.','The Dubai Knowledge Park campuses are outside this 3D view. Distances are shown in the cards.'));
   }
   more+=placeIndex(scene.ids,T('Список точек карты','List of map landmarks'),selected,'map-place-index');
  }
  const context='<div class="theme-context"><h3>'+safe(title)+'</h3><p class="muted">'+safe(lead)+'</p></div>';
  return filters+'<div class="d3-stage d3-stage--flow">'+mapMarkup(scene)+card+'</div>'+more+context+(activeTheme.id==='economy'?economyPanel():'');
}


function dataRouteList(){
 const rows=config.routes.map(r=>'<tr><th scope="row">'+safe(label(r.name))+'<small>'+safe(label(r.note||r.via))+'</small></th><td><strong>'+fmt(r.observedMinutes)+' '+T('мин','min')+'</strong></td><td>'+fmt(r.km,r.km%1?1:0)+' '+T('км','km')+'</td></tr>').join('');
 return '<details class="driving-routes"><summary class="d3-control d3-disclosure"><span><span id="routes-title" class="driving-title">'+safe(label(config.origin.title))+'</span><small>'+fmt(config.routes.length)+' '+T('направлений · время при проверке и расстояние','destinations · observed time and distance')+'</small></span></summary><table aria-labelledby="routes-title"><thead><tr><th>'+T('Направление','Destination')+'</th><th>'+T('Время','Time')+'</th><th>'+T('Км','Km')+'</th></tr></thead><tbody>'+rows+'</tbody></table><p class="muted">'+safe(label(config.origin.note))+'</p></details>';
}
function dataMarketPanel(){
 const saleAmount=row=>(row.saleApproximate?'≈ ':'')+amount(row.sale);
 const sale=marketMode==='sale',missing=T('—','—'),market=config.market;
 const columns=sale?[T('Медиана','Median'),T('За площадь','Per area'),T('Продаж','Sales')]:[T('Аренда / год','Rent / year'),T('Договоров','Contracts'),T('Валовая','Gross')];
 const stats=sale?[[fmt(marketRows.reduce((s,r)=>s+r.sales,0)),T('Продажи в четырёх типах квартир','Sales in the four apartment types')],[saleAmount(marketRows[1]),T('Медиана продажи 1BR','1BR median sale')]]:[[Number.isFinite(marketRows[1].rent)?amount(marketRows[1].rent):missing,T('Годовая аренда 1BR','1BR annual rent')],[Number.isFinite(marketRows[1].grossYield)?fmt(marketRows[1].grossYield,2)+'%':missing,T('Валовой ориентир готовых 1BR','Ready 1BR gross benchmark')]];
 const rows=marketRows.map(r=>'<tr><th scope="row">'+safe(label(r.label))+'</th>'+(sale?[saleAmount(r),unitRate(r.rate),fmt(r.sales)]:[r.rent?amount(r.rent):missing,r.rentContracts?fmt(r.rentContracts):missing,Number.isFinite(r.grossYield)?fmt(r.grossYield,2)+'%':missing]).map(x=>'<td>'+safe(x)+'</td>').join('')+'</tr>').join('');
 return '<section class="market-box d3-info d3-info--flow" aria-labelledby="market-heading"><div class="d3-card-head"><div><p class="d3-kicker">'+safe(label(market.period))+'</p><h3 id="market-heading">'+T('Квартиры по числу спален','Apartments by bedroom count')+'</h3></div></div><div class="scene-options market-options" role="group" aria-label="'+T('Рыночные показатели','Market figures')+'">'+buttons([['sale',T('Продажи','Sales')],['rent',T('Аренда','Rent')]],'market',marketMode)+'</div>'+factCards(stats)+'<table><thead><tr><th>'+T('Тип','Type')+'</th>'+columns.map(c=>'<th>'+safe(c)+'</th>').join('')+'</tr></thead><tbody>'+rows+'</tbody></table><p class="muted">'+safe(label(sale?market.saleNote:market.rentNote))+'</p></section>';
}
function dataThemeMarkup(){
 const scene=mapScene();const filters=activeTheme.id==='everyday'?'<div class="scene-options filter-options" role="group" aria-label="'+T('Тип инфраструктуры','Amenity type')+'">'+buttons(Object.entries(group).map(([id,title])=>[id,label(title)]),'near',nearGroup)+'</div>':'';
 const content=activeTheme.id==='market'?dataMarketPanel():'<article id="detail-card" class="place-card d3-info d3-info--flow" aria-labelledby="card-title">'+cardMarkup()+'</article>';
 const reserve=scene.ids.length?placeIndex(scene.ids,T('Список точек карты','Map landmarks'),activePlace(scene),'map-place-index'):'';
 return filters+'<div class="d3-stage d3-stage--flow">'+mapMarkup(scene)+content+'</div>'+(activeTheme.id==='transport'?dataRouteList():'')+reserve.replace('<details ','<details hidden ');
}

 function positionPins(root){
  const map=root?.querySelector('.map');
  if(!map?.isConnected)return;
  mapObserver?.disconnect();
  spreadPins(map);
  mapObserver=new ResizeObserver(()=>spreadPins(map));
  mapObserver.observe(map);
 }
 function tabs(){
  return themes.map(theme=>{
   const active=theme.id===activeTheme.id;
   return '<button type="button" class="d3-control d3-topic" id="tab-'+theme.id+'" role="tab" data-theme="'+theme.id+'" aria-controls="theme-panel" aria-selected="'+active+'" tabindex="'+(active?0:-1)+'">'+safe(label(theme.label))+'</button>';
  }).join('');
 }
 function render(nextLang,nextCurrency,nextSettings){
  lang=nextLang;
  currencyCode=nextCurrency;
  settings=nextSettings;
  queueMicrotask(()=>positionPins(document.querySelector('[data-scenes-for="'+district.id+'"]')));
  const heading=settings.embedded?'h2':'h1';
  const districtUrl=new URL('./#district='+district.id,settings.assetsBase||document.baseURI);
  const overviewLink=settings.embedded?'<a class="d3-control" href="'+safe(districtUrl.href)+'">'+T('Открыть обзор района','Open district overview')+'</a>':'';
  return '<section class="scene-overview'+(settings.embedded?' d3-overview--embedded':'')+'" data-scenes-for="'+safe(district.id)+'" aria-labelledby="district-title">'+
   '<header class="d3-heading"><div><p class="eyebrow">'+T('Обзор района','District overview')+'</p><'+heading+' id="district-title">'+safe(district.name)+'</'+heading+'></div>'+
   '<p id="scene-hint" class="d3-hint">'+hint()+'</p></header>'+
   '<div id="themes" class="d3-topics d3-topics--places" role="tablist" aria-label="'+T('Темы обзора','Overview topics')+'">'+tabs()+'</div>'+
   '<section id="theme-panel" class="panel" role="tabpanel" aria-labelledby="tab-'+activeTheme.id+'" tabindex="0">'+themeMarkup()+'</section>'+
   '<p class="scene-intro muted">'+safe(label(district.summary))+'</p>'+
   (settings.hideProjects?'':'<div class="scene-actions d3-summary-actions">'+overviewLink+'<button class="d3-control d3-control--primary" type="button" data-scenes-projects>'+
   (settings.embedded?T('К квартирам','Apartments'):T('К проектам','Projects'))+' →</button></div>')+
   '<p class="scene-announcement" role="status"></p></section>';
 }
 function hint(){
  return activeTheme.id==='market'?(generic?T('Квартиры · период указан в таблице','Apartments · period shown below'):T('Сделки и аренда в IMPZ','Sales and rentals in IMPZ')):T('Выберите метку на карте','Choose a marker on the map');
 }
 function updatePanel(root,focus){
  const panel=root.querySelector('#theme-panel');
  panel.setAttribute('aria-labelledby','tab-'+activeTheme.id);
  panel.innerHTML=themeMarkup();
  positionPins(root);
  if(focus)root.querySelector(focus)?.focus({preventScroll:true});
 }
 function setTheme(root,id){
  const next=themes.find(theme=>theme.id===id);
  if(!next)return;
  activeTheme=next;
  root.querySelector('#scene-hint').textContent=hint();
  root.querySelector('#themes').innerHTML=tabs();
  updatePanel(root,'#tab-'+id);
 }
 function click(root,button,pointerSelection){
  const {theme,market,place,near}=button.dataset;
  if(theme){setTheme(root,theme);return;}
  if(near&&Object.hasOwn(nearGroups,near)){nearGroup=near;updatePanel(root,'button[data-near="'+nearGroup+'"]');return;}
  if(market){
   marketMode=market;
   root.querySelector('.market-box').outerHTML=marketPanel();
   root.querySelector('button[data-market="'+marketMode+'"]')?.focus({preventScroll:true});
   return;
  }
  if(place&&(mapScene().ids.includes(place)||(isEducation()&&universityIds.includes(place)))){
   selections.set(chosenThemeKey(),place);
   const card=root.querySelector('#detail-card');
   card.innerHTML=cardMarkup();
   root.querySelectorAll('[data-place]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.place===place)));
   spreadPins(root.querySelector('.map'));
   root.querySelector('.scene-announcement').textContent=T('Карточка открыта','Card opened')+' · '+districtPoints[place].name;
   if(pointerSelection&&(matchMedia('(max-width:760px)').matches||button.closest('.place-index'))){
    card.querySelector('.card-lead').scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});
   }
   return;
  }
  if(button.hasAttribute('data-scenes-projects')){
   if(settings.onProjects){settings.onProjects();return;}
   const projects=document.getElementById('district-projects');
   projects?.scrollIntoView({block:'start',behavior:'instant'});
   projects?.focus({preventScroll:true});
  }
 }
 function keyboard(root,event){
  if(!event.target.closest('[role="tablist"]')||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
  event.preventDefault();
  const i=themes.indexOf(activeTheme);
  const next=event.key==='Home'?0:event.key==='End'?themes.length-1:(i+(event.key==='ArrowRight'?1:-1)+themes.length)%themes.length;
  setTheme(root,themes[next].id);
 }
 return {render,click,keyboard};
 }

 document.addEventListener('click',event=>{
  const button=event.target.closest('button');
  const root=button?.closest('[data-scenes-for]');
  if(root)states.get(root.dataset.scenesFor)?.click(root,button,event.detail>0);
 });
 document.addEventListener('keydown',event=>{
  const root=event.target.closest('[data-scenes-for]');
  if(root)states.get(root.dataset.scenesFor)?.keyboard(root,event);
 });
 document.addEventListener('error',event=>{
  if(!(event.target instanceof HTMLImageElement))return;
  const map=event.target.closest('[data-scenes-for] .map');
  if(!map)return;
  map.classList.add('is-missing');
  map.querySelector('.map-fallback').hidden=false;
  const placeIndex=map.closest('.panel').querySelector('.map-place-index');
  if(placeIndex){
   map.closest('figure').after(placeIndex);
   placeIndex.hidden=false;
   placeIndex.open=true;
  }
 },true);
 window.DistrictScenes={
  overview(district,lang,currency,settings){
   if(!states.has(district.id))states.set(district.id,createController(district));
   return states.get(district.id).render(lang,currency,settings);
  }
 };
})();
