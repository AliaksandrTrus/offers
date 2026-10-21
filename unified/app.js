(() => {
  'use strict';
  const snapshot=window.OFFER_SNAPSHOT;
  const main=document.getElementById('main'),bar=document.getElementById('selection-bar');
  if(!snapshot?.offers?.length){main.textContent='Не удалось загрузить данные офферов. / Offer data could not be loaded.';return;}
  const offers=snapshot.offers,known=new Set(offers.map(o=>o.id));
  const KEY='personal-offers:unified:v1';
  let language='ru',currency='AED',district='',selected=new Set(),memoryOnly=false,invalidSaved=false;
  let projectId=offers[0].id,unitChoice={},pickerOpen=false,mounted=null;
  const words={
    ru:{brand:'Дубай · Недвижимость',catalog:'Проекты',lead:'Выберите проекты и сравните представленные квартиры.',area:'Район',all:'Все районы',projects:'Проектов',units:'Квартир в оффере',handover:'Плановая сдача',developer:'Застройщик',missing:'Не указано в данных оффера',offer:'Полный оффер ↗',add:'Добавить к сравнению',chosen:'✓ В сравнении',cancel:'Убрать из сравнения',remove:'Убрать',compare:'Сравнить',comparison:'Сравнение проектов',comparisonLead:'Район, срок сдачи и условия по каждой представленной квартире.',back:'← Каталог проектов',clear:'Очистить',selection:'Выбор проектов',selectionHint:'Выбор остаётся в этом браузере',emptyTitle:'Список сравнения пуст',emptyText:'Добавьте проекты в каталоге — они появятся здесь.',choose:'Выбрать проекты',none:'В этом районе пока нет проектов.',price:'Стоимость квартиры',initial:'На старте, со сборами',represented:'Представленные квартиры',rendering:'Визуализация проекта',source:'Данные из опубликованных офферов · 21.10.2026',saved:'Выбор сохраняется в этом браузере. В ссылку он не включается.',storage:'Сохранение в браузере недоступно. Выбор работает в текущей вкладке, но не сохранится после перезагрузки или закрытия.',invalid:'Сохранённый список не удалось прочитать. Выбор начат заново.',note:'Цены относятся только к перечисленным квартирам, а не ко всему проекту. Краткие условия не заменяют полный график; актуальность цены и наличия уточняется перед бронированием.',language:'Язык',currency:'Валюта',added:'Проект добавлен к сравнению',removed:'Проект убран из сравнения',cleared:'Список сравнения очищен'},
    en:{brand:'Dubai · Real estate',catalog:'Projects',lead:'Select projects and compare the featured apartments.',area:'District',all:'All districts',projects:'Projects',units:'Apartments in offer',handover:'Planned handover',developer:'Developer',missing:'Not provided in offer data',offer:'Full offer ↗',add:'Add to comparison',chosen:'✓ Selected',cancel:'Remove from comparison',remove:'Remove',compare:'Compare',comparison:'Project comparison',comparisonLead:'District, planned handover and terms for each featured apartment.',back:'← Project catalog',clear:'Clear',selection:'Project selection',selectionHint:'Your selection stays in this browser',emptyTitle:'Your comparison is empty',emptyText:'Add projects from the catalog to see them here.',choose:'Choose projects',none:'There are no projects in this district yet.',price:'Apartment price',initial:'Initial payment, including fees',represented:'Featured apartments',rendering:'Project rendering',source:'Data from published offers · 21 Oct 2026',saved:'Your selection is saved in this browser. It is not included in the URL.',storage:'Browser storage is unavailable. You can compare projects in this tab, but the selection will not survive a reload or closing the tab.',invalid:'The saved list could not be read. Your selection has been reset.',note:'Prices apply only to the apartments listed, not to the entire project. Brief terms do not replace the full schedule; prices and availability must be reconfirmed before reservation.',language:'Language',currency:'Currency',added:'Project added to comparison',removed:'Project removed from comparison',cleared:'Comparison cleared'}
  };
  Object.assign(words.ru,{home:'Главная',catalog:'Проекты',back:'← Проекты',emptyText:'Добавьте проекты к сравнению на странице проекта.',choose:'Выбрать проекты',areas:'Районы',projectLabel:'Проекты',chooseProject:'Выбрать район и проект',homeTitle:'Обо мне',homeText:'Здесь будет фотография и короткая информация об Александре. Содержание этого раздела пока не заполнено.',profile:'Александр',homeBroker:'Недвижимость в Дубае'});
  Object.assign(words.en,{home:'Home',catalog:'Projects',back:'← Projects',emptyText:'Add projects to comparison from a project page.',choose:'Choose projects',areas:'Districts',projectLabel:'Projects',chooseProject:'Choose district and project',homeTitle:'About me',homeText:'A photograph and a short introduction to Alexander will go here. This section has not been filled in yet.',profile:'Alexander',homeBroker:'Dubai real estate'});
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
  function projectView(){return picker()+`<div class="project-region"><div class="selected-project-tools"><button class="button" data-select="${projectId}" aria-pressed="${selected.has(projectId)}">${selected.has(projectId)?(language==='ru'?'✓ В сравнении':'✓ Selected'):(language==='ru'?'В сравнение':'Compare')}</button></div><div id="active-offer" class="offer-host" role="region" aria-label="${escape(projectName(offers.find(o=>o.id===projectId)))}"></div></div>`;}
  function homeView(){return `<section class="home-placeholder"><p class="home-label">${t('home')}</p><h1>${t('homeTitle')}</h1><div class="profile-slot">${language==='ru'?'Фотография':'Photograph'}</div><p>${t('homeText')}</p><a class="button primary" href="#projects">${t('catalog')}</a></section>`;}

  function fact(label,value){return `<div><dt>${escape(label)}</dt><dd${value?'':' class="missing"'}>${escape(value||t('missing'))}</dd></div>`;}
  function unit(u){
    const p=u.payments,stages=p?.stages??[],start=stages[0];
    return `<section class="unit-card" data-unit="${escape(u.id)}"><div class="unit-heading"><h3>${escape(local(u.title)||u.id)}</h3><span class="area">${escape(local(u.choiceArea)||t('missing'))}</span></div>
    <div class="unit-layout">${escape(local(u.choiceSubtitle)||t('missing'))}</div><div class="price-label">${t('price')}</div><p class="unit-price">${money(u.price)}</p>
    <p class="payment-summary">${escape(local(p?.summary)||t('missing'))}</p>
    ${stages.length?`<ul class="stages">${stages.map(s=>`<li><b>${escape(local(s.label))}</b><span>${escape(local(s.subtitle))}</span></li>`).join('')}</ul>`:''}
    ${start?`<div class="initial">${t('initial')}${money(start.amount)}</div>`:`<p class="missing">${t('initial')}: ${t('missing')}</p>`}
    ${p?.extra&&rich(p.extra)?`<p class="extra">${rich(p.extra)}</p>`:''}</section>`;
  }
  function comparisonCard(o){const p=o.data.project;return `<article class="project-card compare-card" data-compare-project="${o.id}"><div class="compare-overview">
    <img class="project-image compare-image" src="${escape(o.image)}" alt="${escape(projectName(o)+' · '+t('rendering'))}" width="760" height="330"><p class="image-note">${t('rendering')}</p>
    <div class="compare-header"><h2>${escape(projectName(o))}</h2><button class="text-button" data-remove="${o.id}" aria-label="${escape(t('cancel')+' · '+projectName(o))}">${t('remove')} ×</button></div>
    <dl class="compare-facts">${fact(t('area'),local(districtValue(o)))}${fact(t('developer'),local(p.developer))}${fact(t('handover'),handover(o))}</dl></div>
    <div class="compare-units"><p class="units-heading">${t('represented')} · ${o.data.units.length}</p><div class="units">${o.data.units.map(unit).join('')}</div></div><div class="offer-bottom">${offerLink(o)}</div></article>`;}
  function comparison(){const chosen=offers.filter(o=>selected.has(o.id));return `<a class="back" href="#projects">${t('back')}</a><section class="intro compare-intro"><h1>${t('comparison')} · ${chosen.length}</h1><p>${t('comparisonLead')}</p></section>
    ${chosen.length?`<section class="compare-grid" data-count="${chosen.length}" aria-label="${t('comparison')}">${chosen.map(comparisonCard).join('')}</section><p class="comparison-note">${t('note')}</p>`:`<section class="empty"><h2>${t('emptyTitle')}</h2><p>${t('emptyText')}</p><a class="button primary" href="#projects">${t('choose')}</a></section>`}`;}
  function render(){
    // The unfinished profile is temporarily hidden, including previously saved links.
    if(location.hash==='#home')history.replaceState(null,'','#projects');
    const target=location.hash.startsWith('#project=')?decodeURIComponent(location.hash.slice(9)):null;
    if(known.has(target)){projectId=target;district=districtKey(offers.find(o=>o.id===projectId));persist();history.replaceState(null,'','#projects');}
    const page=location.hash==='#compare'?'compare':location.hash==='#home'?'home':'projects';
    document.documentElement.lang=language;
    const active=offers.find(o=>o.id===projectId);
    document.querySelector('.brand').innerHTML=`<strong>${t('profile')}</strong><span>${t('homeBroker')}</span>`;
    document.querySelector('.brand').setAttribute('aria-label',t('catalog'));
    document.querySelectorAll('[data-language]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.language===language)));
    document.querySelectorAll('[data-currency]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.currency===currency)));
    document.querySelector('[data-language]').parentElement.setAttribute('aria-label',t('language'));document.querySelector('[data-currency]').parentElement.setAttribute('aria-label',t('currency'));
    document.getElementById('primary-nav').innerHTML=[['projects',t('catalog')],['compare',(language==='ru'?'Сравнение':'Compare')+' · '+selected.size]].map(([key,label])=>`<a href="#${key}"${key===page?' aria-current="page"':''}>${label}</a>`).join('');
    if(page==='projects'&&mounted?.id===projectId&&main.querySelector('#active-offer')){
      main.querySelector('.project-picker').outerHTML=picker();
      const b=main.querySelector('.selected-project-tools button');b.dataset.select=projectId;b.setAttribute('aria-pressed',String(selected.has(projectId)));b.textContent=selected.has(projectId)?(language==='ru'?'✓ В сравнении':'✓ Selected'):(language==='ru'?'В сравнение':'Compare');
      mounted.sync(language,currency,unitChoice[projectId]);
    }else{
      mounted?.dispose();mounted=null;
      main.innerHTML=page==='projects'?projectView():page==='compare'?`<div class="comparison">${comparison()}</div>`:homeView();
      if(page==='projects'){
        mounted=window.mountLocalOffer({host:document.getElementById('active-offer'),offer:active,language,currency,unitId:unitChoice[projectId],onUnit:id=>{unitChoice[projectId]=id;persist();}});mounted.id=projectId;
      }
    }
    bar.hidden=page==='home';bar.setAttribute('aria-label',t('selection'));
    bar.innerHTML=`<div class="selection-text"><strong>${t('projects')}: ${selected.size}</strong><span>${memoryOnly?(language==='ru'?'В текущей вкладке':'In this tab'):t('selectionHint')}</span></div><div class="bar-actions"><button class="text-button" data-clear${selected.size?'':' disabled'}>${t('clear')}</button><a class="button primary" data-compare href="#compare">${t('compare')} · ${selected.size}</a></div>`;
    const notice=document.getElementById('storage-notice');notice.textContent=memoryOnly?t('storage'):invalidSaved?t('invalid'):t('saved');notice.classList.toggle('warning',memoryOnly||invalidSaved);
    document.getElementById('source-note').textContent=(language==='ru'?'Данные из проверенных офферов · ':'Verified offer data · ')+snapshot.verifiedDate;
    document.title=(page==='projects'?projectName(active):page==='home'?t('home'):t('comparison'))+' · '+t('profile');
  }

  function announce(key){document.getElementById('announcement').textContent=t(key);}
  document.addEventListener('click',event=>{
    const b=event.target.closest('button');if(!b)return;
    if(b.dataset.district){district=b.dataset.district;projectId=offers.find(o=>districtKey(o)===district).id;persist();render();}
    else if(b.dataset.projectChoice){projectId=b.dataset.projectChoice;district=districtKey(offers.find(o=>o.id===projectId));persist();render();main.querySelector('[data-project-choice="'+projectId+'"]')?.focus({preventScroll:true});}
    else if(b.dataset.language){language=b.dataset.language;persist();render();document.querySelector(`[data-language="${language}"]`).focus();}
    else if(b.dataset.currency){currency=b.dataset.currency;persist();render();document.querySelector(`[data-currency="${currency}"]`).focus();}
    else if(b.dataset.select){const id=b.dataset.select;if(!known.has(id))return;const removed=selected.delete(id);if(!removed)selected.add(id);persist();render();announce(removed?'removed':'added');document.querySelector(`[data-select="${id}"]`)?.focus();}
    else if(b.dataset.remove){selected.delete(b.dataset.remove);persist();render();announce('removed');main.querySelector('h1')?.setAttribute('tabindex','-1');main.querySelector('h1')?.focus({preventScroll:true});}
    else if(b.hasAttribute('data-clear')){selected.clear();persist();render();announce('cleared');}
  });
  main.addEventListener('toggle',event=>{if(event.target.matches('details.project-picker')&&event.target.isConnected){pickerOpen=event.target.open;}},true);
  window.addEventListener('hashchange',()=>{render();main.focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});});
  readSaved();render();
})();
