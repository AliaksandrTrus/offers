(() => {
  'use strict';
  const snapshot=window.OFFER_SNAPSHOT;
  const main=document.getElementById('main'),bar=document.getElementById('selection-bar');
  if(!snapshot?.offers?.length){main.textContent='Не удалось загрузить данные офферов. / Offer data could not be loaded.';return;}
  const offers=snapshot.offers,known=new Set(offers.map(o=>o.id));
  const KEY='personal-offers:unified:v1';
  let language='ru',currency='AED',district='',selected=new Set(),memoryOnly=false,invalidSaved=false;
  let projectId=offers[0].id,unitChoice={},pickerOpen=false,mounted=null,catalogDistrict='all';
  const words={
    ru:{brand:'Дубай · Недвижимость',catalog:'Проекты',lead:'Выберите проекты и сравните представленные квартиры.',area:'Район',all:'Все районы',projects:'Проектов',units:'Квартир в оффере',handover:'Плановая сдача',developer:'Застройщик',missing:'Не указано в данных оффера',offer:'Полный оффер ↗',add:'Добавить к сравнению',chosen:'✓ В сравнении',cancel:'Убрать из сравнения',remove:'Убрать',compare:'Сравнить',comparison:'Сравнение проектов',comparisonLead:'Район, срок сдачи и условия по каждой представленной квартире.',back:'← Каталог проектов',clear:'Очистить',selection:'Выбор проектов',selectionHint:'Выбор остаётся в этом браузере',emptyTitle:'Список сравнения пуст',emptyText:'Добавьте проекты в каталоге — они появятся здесь.',choose:'Выбрать проекты',none:'В этом районе пока нет проектов.',price:'Стоимость квартиры',initial:'На старте, со сборами',represented:'Представленные квартиры',rendering:'Визуализация проекта',source:'Данные из опубликованных офферов · 21.10.2026',saved:'Выбор сохраняется в этом браузере. В ссылку он не включается.',storage:'Сохранение в браузере недоступно. Выбор работает в текущей вкладке, но не сохранится после перезагрузки или закрытия.',invalid:'Сохранённый список не удалось прочитать. Выбор начат заново.',note:'Цены относятся только к перечисленным квартирам, а не ко всему проекту. Краткие условия не заменяют полный график; актуальность цены и наличия уточняется перед бронированием.',language:'Язык',currency:'Валюта',added:'Проект добавлен к сравнению',removed:'Проект убран из сравнения',cleared:'Список сравнения очищен'},
    en:{brand:'Dubai · Real estate',catalog:'Projects',lead:'Select projects and compare the featured apartments.',area:'District',all:'All districts',projects:'Projects',units:'Apartments in offer',handover:'Planned handover',developer:'Developer',missing:'Not provided in offer data',offer:'Full offer ↗',add:'Add to comparison',chosen:'✓ Selected',cancel:'Remove from comparison',remove:'Remove',compare:'Compare',comparison:'Project comparison',comparisonLead:'District, planned handover and terms for each featured apartment.',back:'← Project catalog',clear:'Clear',selection:'Project selection',selectionHint:'Your selection stays in this browser',emptyTitle:'Your comparison is empty',emptyText:'Add projects from the catalog to see them here.',choose:'Choose projects',none:'There are no projects in this district yet.',price:'Apartment price',initial:'Initial payment, including fees',represented:'Featured apartments',rendering:'Project rendering',source:'Data from published offers · 21 Oct 2026',saved:'Your selection is saved in this browser. It is not included in the URL.',storage:'Browser storage is unavailable. You can compare projects in this tab, but the selection will not survive a reload or closing the tab.',invalid:'The saved list could not be read. Your selection has been reset.',note:'Prices apply only to the apartments listed, not to the entire project. Brief terms do not replace the full schedule; prices and availability must be reconfirmed before reservation.',language:'Language',currency:'Currency',added:'Project added to comparison',removed:'Project removed from comparison',cleared:'Comparison cleared'}
  };
  Object.assign(words.ru,{home:'Главная',catalog:'Проекты',back:'← Проекты',emptyText:'Добавьте проекты к сравнению на странице проекта.',choose:'Выбрать проекты',areas:'Районы',projectLabel:'Проекты',chooseProject:'Выбрать район и проект',homeTitle:'Обо мне',homeText:'Здесь будет фотография и короткая информация об Александре. Содержание этого раздела пока не заполнено.',profile:'Александр',homeBroker:'Недвижимость в Дубае'});
  Object.assign(words.en,{home:'Home',catalog:'Projects',back:'← Projects',emptyText:'Add projects to comparison from a project page.',choose:'Choose projects',areas:'Districts',projectLabel:'Projects',chooseProject:'Choose district and project',homeTitle:'About me',homeText:'A photograph and a short introduction to Alexander will go here. This section has not been filled in yet.',profile:'Alexander',homeBroker:'Dubai real estate'});
  Object.assign(words.ru,{catalog:'Все проекты',catalogTitle:'Проекты в Дубае',catalogLead:'Выберите проект — планировки, стоимость и условия оплаты внутри.',openProject:'Смотреть квартиры →',unitCount:'Квартир в подборке',unknownProject:'Проект по этой ссылке не найден. Выберите один из доступных проектов.',back:'← Все проекты'});
  Object.assign(words.en,{catalog:'All projects',catalogTitle:'Projects in Dubai',catalogLead:'Choose a project to explore floor plans, prices and payment terms.',openProject:'View apartments →',unitCount:'Apartments in this offer',unknownProject:'The project in this link was not found. Choose an available project below.',back:'← All projects'});
  const t=k=>words[language][k];
  const local=v=>typeof v==='string'?v:(v?.[language]??'');
  const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const districtValue=o=>({ru:localIn(o.data.project.location,'ru').split(' · ')[0],en:localIn(o.data.project.location,'en').split(' · ')[0]});
  function localIn(v,lang){return typeof v==='string'?v:(v?.[lang]??'');}
  const districtKey=o=>districtValue(o).en;
  const districtNames=new Map(offers.map(o=>[districtKey(o),districtValue(o)]));
  district=districtKey(offers[0]);
  function money(amount){
    if(typeof amount!=='number'||!Number.isFinite(amount))return escape(t('missing'));
    const value=currency==='USD'?Math.round(Math.round(amount*100)/366):amount;
    const formatted=new Intl.NumberFormat(language==='ru'?'ru-RU':'en-US',{minimumFractionDigits:0,maximumFractionDigits:currency==='USD'?0:2}).format(value);
    return `<span class="money" data-aed="${amount}" data-currency-value="${currency}">${escape(formatted)} <small>${currency}</small></span>`;
  }
  function rich(value){if(Array.isArray(value))return value.map(p=>Object.hasOwn(p,'amount')?money(p.amount):escape(local(p.text??p))).join('');return escape(local(value));}
  function readSaved(){
    try{
      const raw=window.localStorage.getItem(KEY);if(!raw)return;
      let saved;try{saved=JSON.parse(raw);}catch{invalidSaved=true;return;}
      if(!saved||saved.version!==2||!Array.isArray(saved.selected)){invalidSaved=true;return;}
      selected=new Set(saved.selected.filter(id=>typeof id==='string'&&known.has(id)));
      if(['ru','en'].includes(saved.language))language=saved.language;
      if(['AED','USD'].includes(saved.currency))currency=saved.currency;
      if(known.has(saved.projectId))projectId=saved.projectId;
      district=districtKey(offers.find(o=>o.id===projectId));
      for(const [id,unit]of Object.entries(saved.unitChoice||{}))if(offers.find(o=>o.id===id)?.data.units.some(u=>u.id===unit))unitChoice[id]=unit;
    }catch{memoryOnly=true;}
  }
  function persist(){
    invalidSaved=false;if(memoryOnly)return;
    try{window.localStorage.setItem(KEY,JSON.stringify({version:2,selected:[...selected],language,currency,projectId,unitChoice}));}
    catch{memoryOnly=true;}
  }
  const projectName=o=>o.label||o.data.project.name;
  const handover=o=>local(o.data.project.handover?.value);
  const offerLink=o=>`<a class="button" data-offer="${o.id}" href="#project=${o.id}">${t('offer')}</a>`;
  function picker(){const available=offers.filter(o=>districtKey(o)===district);return `<details class="project-picker"${pickerOpen?' open':''}><summary class="picker-summary"><span class="picker-label">${t('chooseProject')}</span><span class="picker-mark" aria-hidden="true">+</span></summary><div class="picker-content"><div class="picker-row"><span class="picker-row-label">${t('areas')}</span><div class="picker-options" role="group" aria-label="${t('areas')}">${[...districtNames].map(([key,name])=>`<button class="picker-option" data-district="${escape(key)}" aria-pressed="${key===district}">${escape(local(name))}</button>`).join('')}</div></div><div class="picker-row"><span class="picker-row-label">${t('projectLabel')}</span><div class="picker-options" role="group" aria-label="${t('projectLabel')}">${available.length>1?available.map(o=>`<button class="picker-option" data-project-choice="${o.id}" aria-pressed="${o.id===projectId}">${escape(projectName(o))}</button>`).join(''):`<span class="picker-only">${escape(projectName(available[0]))}</span>`}</div></div></details>`;}
  function catalogView(){const visible=offers.filter(o=>catalogDistrict==='all'||districtKey(o)===catalogDistrict);return `<section class="intro overview-intro"><h1>${t('catalogTitle')}</h1><p>${t('catalogLead')}</p></section><div class="overview-filters" role="group" aria-label="${t('areas')}"><button class="picker-option" data-catalog-district="all" aria-pressed="${catalogDistrict==='all'}">${t('all')}</button>${[...districtNames].map(([key,name])=>`<button class="picker-option" data-catalog-district="${escape(key)}" aria-pressed="${catalogDistrict===key}">${escape(local(name))}</button>`).join('')}</div><section class="overview-grid" aria-label="${t('catalog')}">${visible.map(o=>`<article class="overview-card${selected.has(o.id)?' is-selected':''}" data-overview-project="${o.id}"><a class="overview-main" href="#project=${o.id}"><div class="overview-image"><img src="${escape(o.image)}" alt="${escape(projectName(o)+' · '+t('rendering'))}" width="760" height="430"><span>${escape(local(districtValue(o)))}</span></div><div class="overview-body"><h2>${escape(projectName(o))}</h2><div class="overview-facts"><span>${t('handover')}: ${escape(handover(o))}</span><span>${t('unitCount')}: ${o.data.units.length}</span></div><p class="overview-units">${o.data.units.map(u=>escape(u.id)).join(' · ')}</p><span class="overview-open">${t('openProject')}</span></div></a><button class="overview-compare button" data-select="${o.id}" aria-pressed="${selected.has(o.id)}">${selected.has(o.id)?t('chosen'):t('add')}</button></article>`).join('')}</section>`;}
  function projectView(){return '<a class="back" href="#projects">'+t('back')+'</a>'+picker()+`<div class="project-region"><div class="selected-project-tools"><button class="button" data-select="${projectId}" aria-pressed="${selected.has(projectId)}">${selected.has(projectId)?(language==='ru'?'✓ В сравнении':'✓ Selected'):(language==='ru'?'В сравнение':'Compare')}</button></div><div id="active-offer" class="offer-host" role="region" aria-label="${escape(projectName(offers.find(o=>o.id===projectId)))}"></div></div>`;}
  function homeView(){return `<section class="home-placeholder"><p class="home-label">${t('home')}</p><h1>${t('homeTitle')}</h1><div class="profile-slot">${language==='ru'?'Фотография':'Photograph'}</div><p>${t('homeText')}</p><a class="button primary" href="#projects">${t('catalog')}</a></section>`;}

  const compareMedia=window.matchMedia('(max-width:760px)');
  const categories=[['minimum_price','Минимальная цена','Minimum price'],['value_per_m2','Выгодный метр','Best area value'],['premium','Премиум','Premium']];
  const categoryName=key=>{const c=categories.find(x=>x[0]===key);return c?.[language==='ru'?1:2]||t('missing');};
  function metricValue(u){
    const sqft=u.selection?.totalAreaSqft,m2=u.selection?.totalAreaM2;
    const valid=Number.isFinite(sqft)&&sqft>0&&Number.isFinite(m2)&&m2>0&&Number.isFinite(u.price);
    if(!valid)return {area:t('missing'),rate:t('missing')};
    const fmt=n=>new Intl.NumberFormat(language==='ru'?'ru-RU':'en-GB',{minimumFractionDigits:1,maximumFractionDigits:1}).format(n);
    return {area:fmt(currency==='AED'?sqft:m2)+' '+(currency==='AED'?'sq ft':language==='ru'?'м²':'m²'),rate:fmt(currency==='AED'?u.price/sqft:u.price/3.66/m2)+' '+currency+'/'+(currency==='AED'?'sq ft':language==='ru'?'м²':'m²')};
  }
  function compactPlan(u,o){
    const p=u.payments,s=p?.stages;
    if(!Array.isArray(s)||!s.length)return [t('missing')];
    const first=local(s[0].label),last=s.at(-1),after=local(last.subtitle),title=local(last.title);
    const monthly=(last.schedule||p.schedule||[]).find(r=>/ежемесячно|monthly/iu.test(local(r.note)));
    const handoverText=localIn(o?.data.project.handover?.value,'en');
    const months=['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
    const quarter=handoverText.match(/Q([1-4])\s+(20\d{2})/u),month=handoverText.match(/([A-Za-z]+)\s+(20\d{2})/u);
    const monthIndex=month?months.indexOf(month[1].slice(0,3).toLowerCase()):-1;
    const handoverEnd=quarter?Date.UTC(+quarter[2],+quarter[1]*3,0):monthIndex>=0?Date.UTC(+month[2],monthIndex+1,0):NaN;
    const date=localIn(monthly?.label,'en').match(/(\d{1,2})\s+([A-Za-z]+)\s+(20\d{2})/u),startMonth=date?months.indexOf(date[2].slice(0,3).toLowerCase()):-1;
    const datedAfter=Number.isFinite(handoverEnd)&&startMonth>=0&&Date.UTC(+date[3],startMonth,+date[1])>handoverEnd;
    const lines=[];
    // Derive percentages, dates and frequencies from the same offer-data used by the full offer.
    const purchase=language==='ru'?'при покупке':'on purchase';
    lines.push(first+' '+(/первый взнос|бронирован|down payment|booking|reservation|initial/iu.test(local(s[0].subtitle)+' '+local(s[0].title))?purchase:local(s[0].subtitle)||t('missing')));
    if(s.length===3&&(/после сдачи|after handover/iu.test(after)||datedAfter)){
      const middle=s[1],note=local(middle.note);
      if(/30\s*(дней|days)/iu.test(note)){
        for(const r of middle.rows||[]){
          const label=local(r.label),share=label.match(/\d+(?:[.,]\d+)?\s*%/u)?.[0];
          if(/30\s*(дней|days)/iu.test(label))lines.push(share+' · '+(language==='ru'?'через 30 дн.':'in 30 days'));
          else {const compact=label.replace(/Сентябрь|September/iu,'09.').replace(/Май|May/iu,'05.').replace(/декабрь|December/iu,'12.').replace(/(09\.|05\.|12\.)\s+(20\d\d)/u,'$1$2');lines.push(compact);}
        }
      }else lines.push(local(middle.label)+' '+(language==='ru'?'до / при сдаче':'before / on handover'));
      const share=title.match(/(\d+(?:[.,]\d+)?)\s*%/u)?.[1];
      if(share&&/раз в полгода|every six months/iu.test(title))lines.push((last.rows||[]).length+' × '+share+'% '+(language==='ru'?'раз в полгода после сдачи':'every 6 months after handover'));
      else if(share&&/раз в год|once a year/iu.test(title))lines.push((last.rows||[]).length+' × '+share+'% '+(language==='ru'?'ежегодно после сдачи':'annually after handover'));
      else {
        const count=local(monthly?.note).match(/(\d+)\s*(платеж|payment)/iu)?.[1];
        const monthlyShare=local(monthly?.share).match(/(\d+(?:[.,]\d+)?)\s*%/u)?.[1];
        if(count&&monthlyShare)lines.push(count+' × '+monthlyShare+'% '+(language==='ru'?'после сдачи':'after handover'));
        else lines.push(local(last.label)+' · '+after+' · '+title);
      }
    }else for(const stage of s.slice(1))lines.push(local(stage.label)+' · '+local(stage.subtitle));
    return lines;
  }
  function comparison(){
    const chosen=offers.filter(o=>selected.has(o.id)),mobile=compareMedia.matches;
    const count=chosen.length,n=mobile?1:3;
    const ru=language==='ru';
    const intro=`<a class="back" href="#projects">${t('back')}</a><section class="intro matrix-intro"><div><h1>${ru?'Сравнение':'Comparison'} <span>· ${count}</span></h1><p>${ru?'Проекты сверху · категории слева':'Projects across · categories down'}</p></div>${count?`<button class="text-button matrix-clear" data-clear>${t('clear')}</button>`:''}</section>`;
    if(!count)return intro+`<section class="empty"><h2>${t('emptyTitle')}</h2><p>${t('emptyText')}</p><a class="button primary" href="#projects">${t('choose')}</a></section>`;
    const metricHeaders=[ru?'Цена':'Price',ru?'Площадь':'Area',ru?'Ставка':'Rate'];
    const categoryHeader=ru?'Категория':'Category';
    const head=`<thead><tr><th scope="col" class="matrix-category" rowspan="${mobile?1:2}">${categoryHeader}</th>${chosen.map(o=>`<th scope="colgroup" colspan="${n}" class="matrix-project"><a class="matrix-project-link" data-compare-project-link="${o.id}" href="#project=${encodeURIComponent(o.id)}">${escape(projectName(o))}</a><span class="matrix-district">${escape(local(districtValue(o)))}</span><button class="matrix-remove" type="button" data-remove="${o.id}" aria-label="${escape(t('remove')+' · '+projectName(o))}">×</button></th>`).join('')}</tr>${mobile?'':`<tr class="matrix-subheads">${chosen.map(()=>metricHeaders.map(h=>`<th scope="col">${h}</th>`).join('')).join('')}</tr>`}</thead>`;
    const priceCell=(o,u)=>`<a class="matrix-price-link${currency==='AED'&&!Number.isInteger(u.price)?' has-decimals':''}" data-compare-offer="${o.id}" data-compare-unit="${escape(u.id)}" href="#project=${encodeURIComponent(o.id)}&unit=${encodeURIComponent(u.id)}" aria-label="${escape((ru?'Открыть квартиру ':'Open apartment ')+u.id+' · '+projectName(o))}">${money(u.price)}</a>`;
    const body=categories.map(([key])=>`<tr class="matrix-unit-row" data-category="${key}"><th scope="row" class="matrix-category">${categoryName(key)}</th>${chosen.map(o=>{const u=o.data.units.find(x=>x.selection?.category===key);if(!u)return `<td colspan="${n}" class="matrix-missing">${t('missing')}</td>`;const m=metricValue(u);return mobile?`<td class="matrix-values" data-matrix-project="${o.id}" data-matrix-unit="${escape(u.id)}">${priceCell(o,u)}<span class="matrix-area">${escape(m.area)}</span><span class="matrix-rate">${escape(m.rate)}</span></td>`:`<td class="matrix-price" data-matrix-project="${o.id}" data-matrix-unit="${escape(u.id)}">${priceCell(o,u)}</td><td class="matrix-area-cell"><span class="matrix-area">${escape(m.area)}</span></td><td class="matrix-rate-cell"><span class="matrix-rate">${escape(m.rate)}</span></td>`;}).join('')}</tr>`).join('');
    const payment=`<tr class="matrix-payment-row"><th scope="row" class="matrix-category">${ru?'План оплаты':'Payment plan'}</th>${chosen.map(o=>{const plans=o.data.units.map(u=>({u,lines:compactPlan(u,o)})),shared=plans.every(p=>JSON.stringify(p.lines)===JSON.stringify(plans[0].lines));return `<td colspan="${n}" class="matrix-payment" data-payment-project="${o.id}">${shared?plans[0].lines.map(s=>`<span>${escape(s)}</span>`).join(''):plans.map(p=>`<div><strong>${escape(categoryName(p.u.selection?.category))}</strong>${p.lines.map(s=>`<span>${escape(s)}</span>`).join('')}</div>`).join('')}</td>`;}).join('')}</tr>`;
    return intro+`<div class="matrix-scroll${mobile&&count>3?' is-wide':''}" tabindex="0" aria-label="${ru?'Таблица сравнения проектов':'Project comparison table'}"><table class="comparison-matrix ${mobile?'is-mobile':'is-desktop'}" data-project-count="${count}" style="--project-count:${count}"><colgroup><col class="matrix-category-col">${chosen.map(()=>mobile?'<col class="matrix-project-col">':'<col class="matrix-price-col"><col class="matrix-area-col"><col class="matrix-rate-col">').join('')}</colgroup>${head}<tbody>${body}${payment}</tbody></table></div>${mobile&&count>3?`<p class="matrix-swipe-hint">${ru?'← Листайте проекты; категории закреплены →':'← Scroll projects; categories stay fixed →'}</p>`:''}<p class="matrix-note">${ru?'Нажмите проект или цену. Сборы — дополнительно. Полный график — в оффере.':'Select a project or price. Fees are additional. Full schedule is in the offer.'}</p>`;
  }
  compareMedia.addEventListener('change',()=>{if(location.hash==='#compare')render();});

  function syncContact(page){window.OfferContact?.update({page,language,project_id:page==='projects'?projectId:page==='compare'?'comparison':'catalog',projectName:page==='projects'?projectName(offers.find(o=>o.id===projectId)):'',unit_id:page==='projects'?(unitChoice[projectId]||offers.find(o=>o.id===projectId).data.units[0].id):'',selectedProjects:offers.filter(o=>selected.has(o.id)).map(o=>({id:o.id,name:projectName(o)}))});}
  let pendingCompareSelection=null;
  function projectRoute(){
    if(!location.hash.startsWith('#project='))return {project:null,unit:null};
    const values=new URLSearchParams(location.hash.slice(1));return {project:values.get('project'),unit:values.get('unit')};
  }
  function focusRouteUnit(){
    const r=projectRoute();if(!r.unit||!offers.find(o=>o.id===r.project)?.data.units.some(u=>u.id===r.unit))return;
    const summary=mounted?.root.querySelector('#unit-summary');if(!summary)return;
    const heading=summary.querySelector('h2,h3')||summary;heading.setAttribute('tabindex','-1');
    summary.scrollIntoView({block:'start',behavior:'instant'});heading.focus({preventScroll:true});
  }
  document.addEventListener('click',event=>{
    const link=event.target.closest('a[data-compare-unit]');if(!link||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
    pendingCompareSelection={project_id:link.dataset.compareOffer,unit_id:link.dataset.compareUnit};
  });
  function render(){
    // A plain shared URL always opens all projects, regardless of a saved selection.
    if(['#home','#catalog'].includes(location.hash))history.replaceState(null,'','#projects');
    const route=projectRoute(),target=route.project;
    const unknownUnit=known.has(target)&&route.unit!==null&&!offers.find(o=>o.id===target).data.units.some(u=>u.id===route.unit);
    if(known.has(target)&&route.unit!==null&&!unknownUnit)unitChoice[target]=route.unit;
    const unknownProject=target!==null&&!known.has(target);
    if(known.has(target)){projectId=target;district=districtKey(offers.find(o=>o.id===projectId));persist();}
    const page=location.hash==='#compare'?'compare':known.has(target)?'projects':'catalog';
    document.documentElement.lang=language;document.body.dataset.screen=page;
    const active=offers.find(o=>o.id===projectId);
    document.querySelector('.brand').innerHTML=`<strong>${t('profile')}</strong><span>${t('homeBroker')}</span>`;
    document.querySelector('.brand').setAttribute('aria-label',t('catalog'));
    document.querySelectorAll('[data-language]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.language===language)));
    document.querySelectorAll('[data-currency]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.currency===currency)));
    document.querySelector('[data-language]').parentElement.setAttribute('aria-label',t('language'));document.querySelector('[data-currency]').parentElement.setAttribute('aria-label',t('currency'));
    document.getElementById('primary-nav').innerHTML=[['projects',t('catalog')],['compare',(language==='ru'?'Сравнение':'Compare')+' · '+selected.size]].map(([key,label])=>`<a href="#${key}"${(key===page||key==='projects'&&page==='catalog')?' aria-current="page"':''}>${label}</a>`).join('');
    if(page==='projects'&&mounted?.id===projectId&&main.querySelector('#active-offer')){
      main.querySelector('.project-picker').outerHTML=picker();
      const b=main.querySelector('.selected-project-tools button');b.dataset.select=projectId;b.setAttribute('aria-pressed',String(selected.has(projectId)));b.textContent=selected.has(projectId)?(language==='ru'?'✓ В сравнении':'✓ Selected'):(language==='ru'?'В сравнение':'Compare');
      mounted.sync(language,currency,unitChoice[projectId]);
    }else{
      mounted?.dispose();mounted=null;
      main.innerHTML=page==='projects'?projectView():page==='compare'?`<div class="comparison">${comparison()}</div>`:catalogView();
      if(page==='projects'){
        mounted=window.mountLocalOffer({host:document.getElementById('active-offer'),offer:active,language,currency,unitId:unitChoice[projectId],onCurrency:code=>{const position={top:window.scrollY,left:window.scrollX,behavior:"instant"};currency=code;persist();render();mounted.root.querySelector(`.unit-price-currency [data-currency-choice="${code}"]`)?.focus({preventScroll:true});mounted.root.querySelector("#unit-summary").getBoundingClientRect();window.scrollTo(position);},onUnit:(id,meta)=>{unitChoice[projectId]=id;persist();if(meta?.userInitiated)history.replaceState(null,'','#project='+encodeURIComponent(projectId)+'&unit='+encodeURIComponent(id));window.OfferContact?.unit(id);}});mounted.id=projectId;
      }
    }
    bar.hidden=page==='home';bar.setAttribute('aria-label',t('selection'));
    bar.innerHTML=`<div class="selection-text"><strong>${t('projects')}: ${selected.size}</strong><span>${memoryOnly?(language==='ru'?'В текущей вкладке':'In this tab'):t('selectionHint')}</span></div><div class="bar-actions"><button class="button contact-trigger" type="button" data-contact-open aria-haspopup="dialog" aria-controls="contact-dialog"><span class="contact-desktop-label">${language==='ru'?'Задать вопрос':'Ask a question'}</span><span class="contact-mobile-label">${language==='ru'?'Задать вопрос':'Ask a question'}</span></button>${selected.size?`<button class="text-button" data-clear>${t('clear')}</button>`:''}<a class="button primary" data-compare href="#compare">${t('compare')} · ${selected.size}</a></div>`;
    const notice=document.getElementById('storage-notice');notice.textContent=unknownProject?t('unknownProject'):unknownUnit?(language==='ru'?'Квартира по этой ссылке не найдена. Проверьте номер или выберите квартиру ниже.':'The apartment in this link was not found. Check the number or choose an apartment below.'):memoryOnly?t('storage'):invalidSaved?t('invalid'):t('saved');notice.classList.toggle('warning',memoryOnly||invalidSaved||unknownProject||unknownUnit);
    document.getElementById('source-note').textContent=(language==='ru'?'Данные из проверенных офферов · ':'Verified offer data · ')+snapshot.verifiedDate;
    document.title=(page==='projects'?projectName(active):page==='catalog'?t('catalogTitle'):t('comparison'))+' · '+t('profile');
    window.OfferAnalytics?.view({page,project_id:page==='catalog'?'catalog':projectId,unit_id:page==='projects'?(unitChoice[projectId]||active.data.units[0].id):'',title:page==='projects'?projectName(active)+' · Project':page==='catalog'?'All projects':'Project comparison',language});
    window.OfferAnalytics?.observe(page==='projects'?mounted.root:null);
    syncContact(page);
    if(pendingCompareSelection){
      const action=pendingCompareSelection;pendingCompareSelection=null;
      if(page==='projects'&&action.project_id===projectId&&action.unit_id===unitChoice[projectId]){
        window.OfferAnalytics?.unit(action.unit_id);
        window.OfferAnalytics?.event('unit_select',{...action,section_id:'apartments',action:'select'});
      }
    }
  }

  function navigateProject(id){if(!known.has(id))return;const hash='#project='+id;if(location.hash===hash)render();else location.hash=hash;}
  function announce(key){document.getElementById('announcement').textContent=t(key);}
  document.addEventListener('click',event=>{
    const b=event.target.closest('button');if(!b)return;
    if(b.dataset.catalogDistrict){catalogDistrict=b.dataset.catalogDistrict;render();}
    else if(b.dataset.district){district=b.dataset.district;projectId=offers.find(o=>districtKey(o)===district).id;persist();navigateProject(projectId);}
    else if(b.dataset.projectChoice){projectId=b.dataset.projectChoice;district=districtKey(offers.find(o=>o.id===projectId));persist();navigateProject(projectId);}
    else if(b.dataset.language){language=b.dataset.language;persist();render();document.querySelector(`[data-language="${language}"]`).focus();}
    else if(b.dataset.currency){currency=b.dataset.currency;persist();render();document.querySelector(`[data-currency="${currency}"]`).focus();}
    else if(b.dataset.select){const id=b.dataset.select;if(!known.has(id))return;const removed=selected.delete(id);if(!removed)selected.add(id);persist();render();window.OfferAnalytics?.event('comparison_change',{project_id:id,section_id:'comparison',action:removed?'remove':'add',comparison_count:selected.size});announce(removed?'removed':'added');document.querySelector(`[data-select="${id}"]`)?.focus();}
    else if(b.dataset.remove){const id=b.dataset.remove;selected.delete(id);persist();render();window.OfferAnalytics?.event('comparison_change',{project_id:id,section_id:'comparison',action:'remove',comparison_count:selected.size});announce('removed');main.querySelector('h1')?.setAttribute('tabindex','-1');main.querySelector('h1')?.focus({preventScroll:true});}
    else if(b.hasAttribute('data-clear')){if(selected.size)window.OfferAnalytics?.event('comparison_change',{project_id:'comparison',section_id:'comparison',action:'clear',comparison_count:selected.size});selected.clear();persist();render();announce('cleared');}
  });
  main.addEventListener('toggle',event=>{if(event.target.matches('details.project-picker')&&event.target.isConnected){pickerOpen=event.target.open;}},true);
  window.addEventListener('hashchange',()=>{render();if(projectRoute().unit)focusRouteUnit();else{main.focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});}});
  readSaved();render();focusRouteUnit();
})();
