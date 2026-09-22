(()=>{
'use strict';
const clean=v=>String(v||'').replace(/\s+/g,' ').trim();
const amount=v=>{const m=clean(v).replace(/,/g,'').match(/(?:US\$|USD\s*|CA\$|CI\$|£|€|\$)\s?(\d{1,5}(?:\.\d{1,2})?)/i);return m?Number(m[1]):null};
const duration=v=>{const m=clean(v).match(/\b(\d+(?:\.\d+)?)\s*(hours?|hrs?|minutes?|mins?)\b/i);return m?m[1]+' '+(/^h/i.test(m[2])?'hours':'minutes'):null};
const format=v=>/\bprivate\b/i.test(v)?'private':/\b(shared|public|group)\b/i.test(v)?'shared':/\b(per person|pp\b)/i.test(v)?'per-person':'';
const transaction=v=>/\b(rental|rent|hire|self[- ]drive|bareboat)\b/i.test(v)?'rental':/\b(ticket|admission|entry)\b/i.test(v)?'admission':/\b(charter)\b/i.test(v)?'charter':/\b(tour|trip|cruise|ride|lesson|class|experience|excursion)\b/i.test(v)?'tour':'';
function enrich({products=[],pages=[]}={}){
 const docs=(pages||[]).map(p=>({url:p.url||'',text:String(p.markdown||'')}));return products.map(product=>{
  const urls=product.urls||[];const named=clean(product.name).toLowerCase();let evidence=null;
  for(const doc of docs){const lower=doc.text.toLowerCase(),i=lower.indexOf(named);if(i<0&&!urls.some(u=>u&&doc.url&&u.includes(doc.url)))continue;const start=Math.max(0,i<0?0:i-220),slice=doc.text.slice(start,Math.min(doc.text.length,(i<0?0:i)+650));if(i>=0){evidence={url:doc.url,text:slice};break}}
  if(!evidence)return product;
  const text=evidence.text;return {...product,price:product.price||amount(text),duration:product.duration||duration(text),format:product.format||format(text),transactionType:product.transactionType||transaction(text),evidenceExcerpt:clean(text).slice(0,420),sourceUrl:evidence.url||product.urls?.[0]||''};
 });
}
window.GOOfferEvidence={enrich};
})();