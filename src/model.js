export const DAY=86400000;
export const date=n=>new Date(Date.UTC(2027,1,1)+n*DAY).toISOString().slice(0,10);
export const day=s=>(Date.parse(s+'T00:00:00Z')-Date.UTC(2027,1,1))/DAY;
export const seed=()=>({footprints:[
 {id:'FP-001',name:'Domestic apron works',color:'#e89c39',points:[[340,245],[540,245],[565,355],[360,375]]},
 {id:'FP-002',name:'Taxiway service corridor',color:'#7771d9',points:[[475,315],[680,300],[705,380],[490,405]]},
 {id:'FP-003',name:'Terminal forecourt',color:'#459d9d',points:[[325,430],[480,415],[510,485],[350,510]]},
 {id:'FP-004',name:'Northern drainage upgrade',color:'#5c8bce',points:[[650,120],[775,135],[755,235],[630,215]]}
],activities:[
 {id:'BAC-101',name:'Apron pavement rehabilitation',footprint:'FP-001',start:'2027-02-04',finish:'2027-02-19'},
 {id:'BAC-204',name:'Service corridor installation',footprint:'FP-002',start:'2027-02-12',finish:'2027-02-25'},
 {id:'BAC-310',name:'Forecourt enabling works',footprint:'FP-003',start:'2027-02-07',finish:'2027-02-23'},
 {id:'BAC-402',name:'Drainage & civil works',footprint:'FP-004',start:'2027-02-18',finish:'2027-03-04'}
]});
const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
export const area=p=>Math.abs(p.reduce((s,a,i)=>{const b=p[(i+1)%p.length];return s+a[0]*b[1]-b[0]*a[1]},0)/2);
const signed=p=>p.reduce((s,a,i)=>{const b=p[(i+1)%p.length];return s+a[0]*b[1]-b[0]*a[1]},0);
function triangles(poly){
 const p=poly.map(a=>[...a]);if(signed(p)<0)p.reverse();const out=[];let guard=0;
 while(p.length>3&&guard++<1000){let found=false;for(let i=0;i<p.length;i++){
  const a=p[(i+p.length-1)%p.length],b=p[i],c=p[(i+1)%p.length];if(cross(a,b,c)<=1e-8)continue;
  if(p.some(v=>v!==a&&v!==b&&v!==c&&cross(a,b,v)>=0&&cross(b,c,v)>=0&&cross(c,a,v)>=0))continue;
  out.push([a,b,c]);p.splice(i,1);found=true;break;
 }if(!found)throw Error('Use a simple polygon without crossing edges.');}
 if(p.length===3)out.push(p);return out;
}
function clip(subject,clipper){let result=subject;for(let i=0;i<clipper.length;i++){
 const a=clipper[i],b=clipper[(i+1)%clipper.length],input=result;result=[];if(!input.length)break;
 for(let j=0;j<input.length;j++){const p=input[j],q=input[(j+1)%input.length],cp=cross(a,b,p),cq=cross(a,b,q);
  if(cp>=0)result.push(p);if((cp>=0)!==(cq>=0)){const t=cp/(cp-cq);result.push([p[0]+t*(q[0]-p[0]),p[1]+t*(q[1]-p[1])]);}
 }}return result;}
export function intersection(a,b){const result=[];for(const x of triangles(a))for(const y of triangles(b)){const p=clip(x,y);if(p.length>=3&&area(p)>0.001)result.push(p)}return result;}
export function clashes(model){const out=[];for(let i=0;i<model.activities.length;i++)for(let j=i+1;j<model.activities.length;j++){
 const a=model.activities[i],b=model.activities[j],start=a.start>b.start?a.start:b.start,finish=a.finish<b.finish?a.finish:b.finish;
 if(start>finish)continue;const fa=model.footprints.find(f=>f.id===a.footprint),fb=model.footprints.find(f=>f.id===b.footprint);if(!fa||!fb)continue;
 const polygons=intersection(fa.points,fb.points);if(polygons.length)out.push({a,b,start,finish,days:Math.round((Date.parse(finish)-Date.parse(start))/DAY)+1,polygons});
 }return out;}
export function validPolygon(points){
 if(!Array.isArray(points)||points.length<3||points.length>100||points.some(p=>!Array.isArray(p)||p.length!==2||p.some(v=>!Number.isFinite(v)||v<0||v>1000)))return false;
 if(area(points)<10)return false;
 for(let i=0;i<points.length;i++)for(let j=i+1;j<points.length;j++){
  if(j===i+1||(i===0&&j===points.length-1))continue;
  const a=points[i],b=points[(i+1)%points.length],c=points[j],d=points[(j+1)%points.length];
  if(cross(a,b,c)*cross(a,b,d)<=0&&cross(c,d,a)*cross(c,d,b)<=0&&Math.max(a[0],b[0])>=Math.min(c[0],d[0])&&Math.max(c[0],d[0])>=Math.min(a[0],b[0])&&Math.max(a[1],b[1])>=Math.min(c[1],d[1])&&Math.max(c[1],d[1])>=Math.min(a[1],b[1]))return false;
 }try{triangles(points);return true}catch{return false}
}
export function validateRows(rows,footprints){
 if(!rows.length||rows.length>500)throw Error('Import between 1 and 500 activities.');const ids=new Set();
 return rows.map((r,i)=>{const id=String(r.activity_id??'').trim(),name=String(r.name??'').trim(),footprint=String(r.footprint_id??'').trim(),start=String(r.start??'').slice(0,10),finish=String(r.finish??'').slice(0,10);
 const valid=s=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;
 if(!/^[A-Za-z0-9_.-]+$/.test(id)||ids.has(id)||!name||!valid(start)||!valid(finish)||start>finish||!footprints.some(f=>f.id===footprint))throw Error(`Row ${i+2}: use a unique activity_id, name, valid YYYY-MM-DD dates and an existing footprint_id.`);
 ids.add(id);return {id,name,footprint,start,finish};});
}
export function parseCSV(text){const rows=[];let row=[],value='',quoted=false;for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){value+='"';i++}else quoted=!quoted;}else if(c===','&&!quoted){row.push(value);value=''}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(value);if(row.some(v=>v.trim()))rows.push(row);row=[];value=''}else value+=c;}if(quoted)throw Error('Unclosed quotation in CSV.');row.push(value);if(row.some(v=>v.trim()))rows.push(row);const headers=(rows.shift()||[]).map(h=>h.replace(/^\uFEFF/,'').trim().toLowerCase());return rows.map(r=>Object.fromEntries(headers.map((h,i)=>[h,r[i]??''])));}
