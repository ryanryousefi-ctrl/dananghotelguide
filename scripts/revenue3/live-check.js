const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();let bad=0;
for(const w of [390,1280]){const c=await b.newContext({viewport:{width:w,height:900}});const p=await c.newPage();
for(const pg of ['','where-to-stay-in-da-nang.html','compare-hotels.html?h=hilton-da-nang,hyatt-regency-da-nang','best-hotels-in-da-nang.html','hyatt-vs-marriott-da-nang.html','hilton-da-nang.html','find-your-hotel.html','da-nang-3-day-itinerary.html','da-nang-tet-2027-hotels.html']){
const r=await p.goto('https://www.dananghotelguide.com/'+pg,{waitUntil:'load'});await p.waitForTimeout(500);
const o=await p.evaluate(()=>({ov:document.documentElement.scrollWidth-innerWidth,dnc:document.querySelectorAll('.dnc').length,tc:[...document.querySelectorAll('a[data-provider=tripcom]')].every(a=>/Allianceid=11013066/.test(a.href)&&/SID=333523744/.test(a.href)),n:document.querySelectorAll('a[data-provider=tripcom]').length}));
console.log(w,r.status(),pg.slice(0,40),JSON.stringify(o)); if(r.status()!==200||o.ov>1||!o.tc)bad++}
await c.close()}
await b.close();console.log('problems',bad)})();
