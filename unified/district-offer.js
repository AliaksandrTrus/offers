// One district source/player for the catalog, slotted unified offers and standalone offers.
(() => {
 'use strict';
 if(window.OfferDistrict)return;
 const assetsBase=new URL('.',document.currentScript.src).href;
 function mount({host,root,data}){
  const key=(typeof data.project.location==='string'?data.project.location:data.project.location?.en||'').split(' · ')[0];
  const district=window.DistrictSlides?.findByKey(key);if(!district)return null;
  let holder=null,slot=null,signature='';
  function sync(language,currency){
   const map=root.querySelector('#location');if(!map)return;
   // The full district overview below replaces the former top-of-offer district copy.
   root.querySelectorAll('.district-copy').forEach(section=>section.remove());
   const next=district.id+'|'+language+'|'+currency;
   const slotted=root!==host;
   if(signature===next&&holder?.isConnected&&(slotted?slot?.nextElementSibling===map:holder.nextElementSibling===map))return;
   if(!holder?.isConnected){holder=document.createElement('div');holder.className='district-offer-mount';}
   if(slotted){
    holder.slot='district-overview';if(holder.parentNode!==host)host.append(holder);
    if(!slot?.isConnected){slot=document.createElement('slot');slot.name='district-overview';}
    if(slot.nextElementSibling!==map)map.before(slot);
   }else if(holder.nextElementSibling!==map)map.before(holder);
   holder.innerHTML=window.DistrictSlides.overview(key,language,currency,{embedded:true,assetsBase,onProjects(){const apartments=root.querySelector('#apartments');apartments?.scrollIntoView({block:'start',behavior:'instant'});apartments?.querySelector('.unit-option[aria-pressed="true"]')?.focus({preventScroll:true});}});
   signature=next;
  }
  return {sync,dispose(){holder?.remove();slot?.remove();}};
 }
 window.OfferDistrict={mount};
 const input=document.getElementById('offer-data'),host=document.getElementById('overview');
 if(!input||!host||host.hidden)return;
 const data=JSON.parse(input.textContent),instance=mount({host,root:host,data});if(!instance)return;
 const sync=()=>instance.sync(document.documentElement.lang==='en'?'en':'ru',host.querySelector('.project-header [data-currency-choice][aria-pressed="true"]')?.dataset.currencyChoice||'AED');
 sync();new MutationObserver(sync).observe(host,{childList:true,subtree:true});
})();
