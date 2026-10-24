// Isolated local presentation of verified offer renderers. No cross-project DOM or styles.
window.mountLocalOffer=function({host,offer,language,currency,unitId,onUnit,onCurrency}){
  const shell=window.OFFER_SHELLS.find(s=>s.id===offer.id),shadow=host.attachShadow({mode:'open'}),listeners=[];
  if(!shell)throw Error('Offer shell is missing');
  const data=structuredClone(offer.data);
  function relocate(v){if(Array.isArray(v))v.forEach(relocate);else if(v&&typeof v==='object')for(const k of Object.keys(v)){if(k==='src'&&typeof v[k]==='string'&&v[k].startsWith('images/'))v[k]='offers/'+offer.id+'/'+v[k];else relocate(v[k]);}}
  relocate(data);
  const style=document.createElement('style');style.textContent=shell.css+`\n:host{display:block;min-width:0}.page{width:100%;margin:18px 0 28px}.project-header .header-controls{display:none!important}.project-header{padding-right:160px}@media(max-width:760px){.page{width:100%;margin:14px 0 24px}.project-header{padding-right:112px}.visual-open img{height:200px}}`;
  const input=document.createElement('script');input.type='application/json';input.id='offer-data';input.textContent=JSON.stringify(data);
  shadow.append(style,input);const template=document.createElement('template');template.innerHTML=shell.body;shadow.append(template.content.cloneNode(true));
  const localDocument=new Proxy(document,{get(target,key){if(key==='getElementById'||key==='querySelector'||key==='querySelectorAll')return shadow[key].bind(shadow);if(key==='activeElement')return shadow.activeElement;const value=Reflect.get(target,key,target);return typeof value==='function'?value.bind(target):value;},set(target,key,value){if(key==='title')return true;return Reflect.set(target,key,value,target);}});
  const contact=document.createElement('div');contact.className='unit-price-contact';
  const contactButton=document.createElement('button');contactButton.type='button';contactButton.className='unit-discount-button';contactButton.setAttribute('aria-haspopup','dialog');contactButton.setAttribute('aria-controls','contact-dialog');contact.append(contactButton);

  const contactStyle=document.createElement('style');contactStyle.textContent='.unit-price-contact{margin-top:4px}.unit-discount-button{position:relative;isolation:isolate;display:inline-flex;align-items:center;justify-content:center;min-width:44px;min-height:44px;max-width:100%;padding:6px 10px;border:0;background:transparent;color:#FFFFFF;font:inherit;font-size:11px;line-height:1.4;white-space:normal;cursor:pointer}.unit-discount-button::before{content:"";position:absolute;inset:7px 0;z-index:-1;background:#B8442E;border:1px solid #B8442E}.unit-discount-button:focus-visible{outline:2px solid #273f35;outline-offset:3px}';shadow.append(contactStyle);
  contactButton.addEventListener('click',()=>window.OfferContact?.open(contactButton,'unit_price','discount'));
  let syncing=false;
  const localWindow=new Proxy(window,{get(target,key){if(key==='offerCurrencyChange')return code=>onCurrency(code);if(key==='offerAnalyticsEvent')return (action,extra)=>{if(!syncing)window.OfferAnalytics?.event(action,{project_id:offer.id,...extra});};if(key==='addEventListener')return (name,handler,options)=>{target.addEventListener(name,handler,options);listeners.push([name,handler,options]);};const value=Reflect.get(target,key,target);return typeof value==='function'?value.bind(target):value;}});
  window.OFFER_RENDERERS[offer.id](localDocument,localWindow);
  function placeContact(){const price=shadow.querySelector('#unit-summary .price');if(price&&contact.parentElement!==price)price.append(contact);}
  placeContact();const contactObserver=new MutationObserver(placeContact);contactObserver.observe(shadow,{childList:true,subtree:true});
  if(shadow.getElementById('overview').hidden)throw Error('Verified offer did not pass presentation validation');
  shadow.addEventListener('click',event=>{const b=event.target.closest('[data-unit]');if(b){onUnit(b.dataset.unit,{userInitiated:!syncing});if(!syncing)window.OfferAnalytics?.unit(b.dataset.unit);if(!syncing&&b.getAttribute('aria-pressed')!=='true')window.OfferAnalytics?.event('unit_select',{project_id:offer.id,unit_id:b.dataset.unit,section_id:'apartments',action:'select'});}
    if(syncing)return;
    const currentUnit=()=>shadow.querySelector('.unit-options [aria-pressed="true"]')?.dataset.unit||data.units[0].id;
    if(event.target.closest('.map-link'))window.OfferAnalytics?.event('map_open',{project_id:offer.id,unit_id:currentUnit(),section_id:'map',action:'open'});
    const summary=event.target.closest('details.schedule > summary');if(summary&&!summary.parentElement.open)window.OfferAnalytics?.event('payment_schedule_open',{project_id:offer.id,unit_id:currentUnit(),section_id:'payments',action:'open'});
  },true);
  function sync(lang,code,unit){contactButton.textContent=lang==='en'?'Ask about a discount':'Узнать о скидке';syncing=true;try{const langButton=shadow.querySelector(`[data-language="${lang}"]`);if(langButton?.getAttribute('aria-pressed')!=='true')langButton?.click();const currencyButton=shadow.querySelector(`[data-currency-choice="${code}"]`);if(currencyButton?.getAttribute('aria-pressed')!=='true')currencyButton?.click();if(unit){const choice=shadow.querySelector(`.unit-options [data-unit="${CSS.escape(unit)}"]`);if(choice?.getAttribute('aria-pressed')!=='true')choice?.click();}}finally{syncing=false;placeContact();}}
  sync(language,currency,unitId);
  return {root:shadow,sync,dispose(){contactObserver.disconnect();shadow.querySelector('dialog[open]')?.close();document.body.classList.remove('viewer-open');for(const [name,handler,options]of listeners)window.removeEventListener(name,handler,options);host.remove();}};
};
