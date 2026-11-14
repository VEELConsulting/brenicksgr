/* How We Think — living thought map with a sleeve reveal. The Brenicks Group. */
(()=>{
/* ═════════════ Content: values and how we think ═════════════ */
const TAG='The Brenicks Group';
const SANS='Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif';
const C={ink:'#1E1E1E',graphite:'#2C2C2C',ivory:'#F7F5F0',gold:'#A88447',paper:'#FFFFFF',bg:'#F5F5F5',line:'#757575',author:'rgba(30,30,30,0.58)'};
const ST={blue:'#A8DAFB',yellow:'#FFE499',green:'#B3EFBD',orange:'#FFC9A6',violet:'#DCCBFF',pink:'#FFC3E5',teal:'#A6EDE6'};

const SECTIONS=[
 {id:'listen',  n:'01',name:'Listen',  x:0,    y:0,    w:900,h:760},
 {id:'simplify',n:'02',name:'Simplify',x:1150, y:-80,  w:900,h:760},
 {id:'design',  n:'03',name:'Design',  x:2300, y:0,    w:900,h:760},
 {id:'build',   n:'04',name:'Build',   x:2300, y:1610, w:900,h:760},
 {id:'partner', n:'05',name:'Partner', x:1150, y:1690, w:900,h:760},
 {id:'compound',n:'06',name:'Compound',x:0,    y:1610, w:900,h:760},
];

const TILES=[
 {id:'hero',type:'sticky',hero:true,x:1330,y:860,w:540,h:540,color:ST.blue,title:'How we think',motif:'hero'},

 {id:'s1',s:'listen',type:'sticky',x:50,y:120,w:240,h:240,color:ST.yellow,title:'Start with the business, not the software.',motif:'temple'},
 {id:'s2',s:'listen',type:'sticky',x:330,y:120,w:240,h:240,color:ST.orange,title:'Ask what slows the team down on a Tuesday.',motif:'astrolabe'},
 {id:'s3',s:'listen',type:'card',x:615,y:110,w:255,h:330,label:'QUESTION',title:'What changes if this works?',
   body:'We agree on the win before we touch a tool.',motif:'spiral'},
 {id:'s4',s:'listen',type:'sticky',x:190,y:440,w:250,h:250,color:ST.green,title:'Plain words over jargon.',motif:'rose'},

 {id:'i1',s:'simplify',type:'list',x:40,y:110,w:350,h:340,title:'Before we build',
   items:['What is the real problem?','Who uses it every day?','What is the smallest useful version?','How will we know it worked?'],motif:'column'},
 {id:'i2',s:'simplify',type:'quote',x:425,y:110,w:445,h:250,title:'Simple is harder. We do the hard part.',by:'How we work',motif:'arch'},
 {id:'i3',s:'simplify',type:'sticky',x:470,y:420,w:250,h:250,color:ST.pink,title:'If it needs a manual, it isn’t finished.',motif:'vitruvian'},

 {id:'b1',s:'design',type:'diagram',x:40,y:110,w:470,h:320,title:'How a good system flows',
   nodes:['Ask','Automate','Record','Decide'],body:'People make the calls. Software carries the rest.',motif:'meander'},
 {id:'b2',s:'design',type:'card',x:545,y:110,w:320,h:290,label:'RULE',title:'Beautiful and useful. Never one without the other.',
   body:'',motif:'haussmann'},
 {id:'b3',s:'design',type:'sticky',x:110,y:470,w:240,h:240,color:ST.blue,title:'Every screen earns its place.',motif:'guilloche'},
 {id:'b4',s:'design',type:'sticky',x:420,y:470,w:240,h:240,color:ST.yellow,title:'Designed for the phone first.',motif:'eiffel'},

 {id:'u1',s:'build',type:'card',x:40,y:110,w:360,h:280,label:'BELIEF',title:'We build the AI we run on.',
   body:'What we hand you, we have lived with ourselves first.',motif:'temple'},
 {id:'u2',s:'build',type:'sticky',x:460,y:110,w:250,h:250,color:ST.violet,title:'Small, steady releases beat big launches.',motif:'spiral'},
 {id:'u3',s:'build',type:'list',x:40,y:430,w:380,h:280,title:'Before anything ships',
   items:['It works on a phone','Someone else can run it','It is written down'],motif:'rose'},
 {id:'u4',s:'build',type:'sticky',x:490,y:430,w:250,h:250,color:ST.green,title:'Your data stays yours.',motif:'arch'},

 {id:'p1',s:'partner',type:'sticky',x:50,y:120,w:250,h:250,color:ST.orange,title:'Honest answers, even the short ones.',motif:'column'},
 {id:'p2',s:'partner',type:'card',x:340,y:110,w:380,h:290,label:'MEASURE',title:'Judged by what changes for you.',
   body:'Hours saved, deals closed, customers kept.',motif:'astrolabe'},
 {id:'p3',s:'partner',type:'sticky',x:110,y:440,w:250,h:250,color:ST.yellow,title:'Teach the team. Never trap the team.',motif:'haussmann'},
 {id:'p4',s:'partner',type:'sticky',x:440,y:450,w:250,h:250,color:ST.teal,title:'Grow with the client, not around them.',motif:'guilloche'},

 {id:'c1',s:'compound',type:'quote',x:50,y:110,w:450,h:260,title:'Every system should make the next one easier.',by:'How we work',motif:'eiffel'},
 {id:'c2',s:'compound',type:'sticky',x:560,y:110,w:250,h:250,color:ST.green,title:'Write it down. Knowledge compounds.',motif:'spiral'},
 {id:'c3',s:'compound',type:'card',x:70,y:420,w:400,h:290,label:'HORIZON',title:'Think in decades, act in days.',
   body:'The long view sets direction. Today’s work sets the pace.',motif:'vitruvian'},
 {id:'c4',s:'compound',type:'sticky',x:540,y:430,w:260,h:260,color:ST.violet,title:'Craft is in the details no one asked for.',motif:'rose'},
];

const EDGES=[
 ['s1','s2'],['s2','s4'],['s2','s3'],['s3','i1'],['i1','i2'],['i2','i3'],
 ['i3','b1'],['b1','b2'],['b1','b3'],['b3','b4'],['b4','u2'],['u2','u1'],['u1','u3'],['u2','u4'],
 ['u3','p2'],['p2','p1'],['p1','p3'],['p2','p4'],['p3','c4'],['c4','c2'],['c2','c1'],['c1','c3'],
 ['hero','s4'],['hero','i1'],['hero','b1'],['hero','u1'],['hero','p2'],['hero','c3'],
];

/* ═════════════ Setup ═════════════ */
const secById={};SECTIONS.forEach(s=>secById[s.id]=s);
const tById={};
TILES.forEach(t=>{if(t.s){const s=secById[t.s];t.x+=s.x;t.y+=s.y;}t.cx=t.x+t.w/2;t.cy=t.y+t.h/2;tById[t.id]=t;});

const $=id=>document.getElementById('hwt-'+id);
const root=$('root');if(!root)return;
const cv=$('c'),ctx=cv.getContext('2d'),mc=document.createElement('canvas').getContext('2d');
const zoomEl=$('zoom'),cap=$('caption'),capSec=$('capSec'),capTtl=$('capTtl'),playBtn=$('play');
const stage=$('stage'),paperEl=$('paper'),ghost=$('ghost'),sf=$('sleeveFront'),sb=$('sleeveBack'),topEl=$('top'),botEl=$('bottom'),reveal=$('track'),shadowEl=$('shadow');
let W=0,H=0,DPR=1,S=1,hudTop=60,hudBot=110;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=(a,b,v)=>{const t=clamp((v-a)/(b-a),0,1);return t*t*(3-2*t);};
const font=(size,weight=400,style='normal')=>`${style} ${weight} ${size}px ${SANS}`;

function block(text,size,weight,style,maxW,lh){
  const f=font(size,weight,style);mc.font=f;const lines=[],widths=[];
  text.split('\n').forEach(par=>{let cur='';par.split(' ').forEach(w=>{const t=cur?cur+' '+w:w;if(mc.measureText(t).width>maxW&&cur){lines.push(cur);cur=w;}else cur=t;});lines.push(cur);});
  lines.forEach(l=>widths.push(mc.measureText(l).width));lh=lh||size*1.25;
  return {lines,widths,size,lh,font:f,h:lines.length*lh};
}
function layout(){
  TILES.forEach(t=>{const L={};
    if(t.type==='sticky'){const k=t.w/240*(t.hero?0.62:1);L.title=block(t.title,22*k,400,'normal',t.w*0.83,29*k);L.by=block(TAG,14*k,400,'normal',t.w);}
    if(t.type==='card'){L.label=block(t.label,11.5,700,'normal',200);L.title=block(t.title,25,600,'normal',t.w-50,32);L.body=block(t.body||' ',15.5,400,'normal',t.w*0.5,23);}
    if(t.type==='quote'){L.title=block(t.title,27,500,'normal',t.w*0.58,35);L.by=block('— '+t.by,13,600,'normal',t.w);}
    if(t.type==='list'){L.title=block(t.title,23,600,'normal',t.w-50,30);L.items=t.items.map(i=>block(i,16,500,'normal',t.w-86,22));}
    if(t.type==='diagram'){L.title=block(t.title,24,600,'normal',t.w*0.62,30);L.body=block(t.body,14.5,400,'normal',t.w-50,21);L.nodes=t.nodes.map(n=>block(n,13,600,'normal',200));}
    t.L=L;});
  SECTIONS.forEach(s=>{s.Ln=block(s.n,15,700,'normal',200);s.Lt=block(s.name,30,600,'normal',800);});
}

/* ═════════════ Gold lacing: engraved geometry, precomputed as vector paths ═════════════ */
const PHI=(1+Math.sqrt(5))/2,TAU=Math.PI*2;
const G={
 L(P,a,b,c,d){P.moveTo(a,b);P.lineTo(c,d);},
 O(P,x,y,r){P.moveTo(x+r,y);P.arc(x,y,r,0,TAU);},
 A(P,x,y,r,a0,a1){P.moveTo(x+r*Math.cos(a0),y+r*Math.sin(a0));P.arc(x,y,r,a0,a1);},
 R(P,x,y,w,h){P.rect(x,y,w,h);},
 poly(P,pts,close){P.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)P.lineTo(pts[i][0],pts[i][1]);if(close)P.closePath();},
};
function fit(bx,by,bw,bh,aspect){ // aspect = w/h; returns centred box
  let w=bw,h=bw/aspect;if(h>bh){h=bh;w=bh*aspect;}return {x:bx+(bw-w)/2,y:by+(bh-h)/2,w,h};
}
const M={
 // Greek temple front, laid out on golden-section proportions
 temple(P,b){const f=fit(b.x,b.y,b.w,b.h,1.3),x=f.x,y=f.y,w=f.w,h=f.h,by=y+h;
   const st=h*0.035;for(let i=0;i<3;i++)G.R(P,x+i*w*0.02,by-(i+1)*st,w-i*w*0.04,st);
   const base=by-3*st,top=base-h*0.5,n=6,x0=x+w*0.12,x1=x+w*0.88,sp=(x1-x0)/(n-1),cw=sp*0.44;
   for(let i=0;i<n;i++){const c=x0+i*sp;
     P.moveTo(c-cw/2,base);P.quadraticCurveTo(c-cw*0.56,(base+top)/2,c-cw*0.42,top);
     P.moveTo(c+cw/2,base);P.quadraticCurveTo(c+cw*0.56,(base+top)/2,c+cw*0.42,top);
     for(let k=1;k<4;k++){const fx=-0.3+k*0.15;G.L(P,c+cw*fx*1.05,base-h*0.02,c+cw*fx*0.85,top+h*0.02);}
     G.R(P,c-cw*0.56,base-h*0.02,cw*1.12,h*0.02);
     P.moveTo(c-cw*0.42,top);P.quadraticCurveTo(c-cw*0.62,top-h*0.025,c-cw*0.62,top-h*0.035);
     P.moveTo(c+cw*0.42,top);P.quadraticCurveTo(c+cw*0.62,top-h*0.025,c+cw*0.62,top-h*0.035);
     G.R(P,c-cw*0.66,top-h*0.05,cw*1.32,h*0.015);}
   const ea=top-h*0.05,eh=h*0.07;G.R(P,x+w*0.06,ea-eh,w*0.88,eh);G.L(P,x+w*0.06,ea-eh*0.5,x+w*0.94,ea-eh*0.5);
   const fr=ea-eh,fh=h*0.075;G.R(P,x+w*0.06,fr-fh,w*0.88,fh);
   for(let i=0;i<2*n-1;i++){const c=x0+i*sp/2;if(i%2===0){for(let k=-1;k<=1;k++)G.L(P,c+k*cw*0.12,fr-fh*0.9,c+k*cw*0.12,fr-fh*0.1);}else G.O(P,c,fr-fh/2,fh*0.25);}
   const pb=fr-fh-h*0.015,ph=w*0.44*Math.tan(13*Math.PI/180);G.L(P,x+w*0.04,pb+h*0.015,x+w*0.96,pb+h*0.015);
   G.poly(P,[[x+w*0.04,pb],[x+w/2,pb-ph],[x+w*0.96,pb]],true);
   G.poly(P,[[x+w*0.12,pb-h*0.012],[x+w/2,pb-ph+h*0.035],[x+w*0.88,pb-h*0.012]],true);
   const rr=ph*0.22,rc=pb-ph*0.38;G.O(P,x+w/2,rc,rr);G.O(P,x+w/2,rc,rr*0.4);
   for(let k=0;k<12;k++){const a=k*TAU/12;G.L(P,x+w/2+Math.cos(a)*rr*0.4,rc+Math.sin(a)*rr*0.4,x+w/2+Math.cos(a)*rr,rc+Math.sin(a)*rr);}
   G.poly(P,[[x+w/2-h*0.02,pb-ph],[x+w/2,pb-ph-h*0.05],[x+w/2+h*0.02,pb-ph]]);},
 // Golden rectangle, Fibonacci squares and the spiral that runs through them
 spiral(P,b){const f=fit(b.x,b.y,b.w,b.h,PHI);let X=f.x,Y=f.y,Wd=f.w,Ht=f.h;
   G.R(P,X,Y,Wd,Ht);G.L(P,X,Y+Ht,X+Wd,Y);G.L(P,X,Y,X+Wd*(1/PHI),Y+Ht);
   for(let i=0;i<11;i++){const d=i%4;let s;
     if(d===0){s=Ht;G.R(P,X,Y,s,s);G.A(P,X+s,Y+s,s,Math.PI,1.5*Math.PI);G.A(P,X+s,Y+s,s*0.96,Math.PI,1.5*Math.PI);X+=s;Wd-=s;}
     else if(d===1){s=Wd;G.R(P,X,Y,s,s);G.A(P,X,Y+s,s,1.5*Math.PI,TAU);G.A(P,X,Y+s,s*0.96,1.5*Math.PI,TAU);Y+=s;Ht-=s;}
     else if(d===2){s=Ht;G.R(P,X+Wd-s,Y,s,s);G.A(P,X+Wd-s,Y,s,0,0.5*Math.PI);G.A(P,X+Wd-s,Y,s*0.96,0,0.5*Math.PI);Wd-=s;}
     else{s=Wd;G.R(P,X,Y+Ht-s,s,s);G.A(P,X+s,Y+Ht-s,s,0.5*Math.PI,Math.PI);G.A(P,X+s,Y+Ht-s,s*0.96,0.5*Math.PI,Math.PI);Ht-=s;}
     if(s<0.6)break;}
   G.O(P,X+Wd/2,Y+Ht/2,f.h*0.012);
   for(let k=1;k<8;k++){const tx=f.x+k*f.w/8;G.L(P,tx,f.y+f.h,tx,f.y+f.h+f.h*0.03);}},
 // Gothic rose window (Notre-Dame), twelve-fold
 rose(P,b){const R=Math.min(b.w,b.h)/2,cx=b.x+b.w/2,cy=b.y+b.h/2;
   [1,0.94,0.42,0.17,0.08].forEach(k=>G.O(P,cx,cy,R*k));
   for(let k=0;k<12;k++){const a=k*TAU/12,a2=a+Math.PI/12;
     G.O(P,cx+Math.cos(a)*R*0.66,cy+Math.sin(a)*R*0.66,R*0.255);
     G.O(P,cx+Math.cos(a)*R*0.66,cy+Math.sin(a)*R*0.66,R*0.11);
     G.L(P,cx+Math.cos(a2)*R*0.42,cy+Math.sin(a2)*R*0.42,cx+Math.cos(a2)*R*0.94,cy+Math.sin(a2)*R*0.94);
     G.O(P,cx+Math.cos(a2)*R*0.88,cy+Math.sin(a2)*R*0.88,R*0.045);
     G.L(P,cx+Math.cos(a)*R*0.17,cy+Math.sin(a)*R*0.17,cx+Math.cos(a)*R*0.42,cy+Math.sin(a)*R*0.42);}
   for(let k=0;k<6;k++){const a=k*TAU/6;G.O(P,cx+Math.cos(a)*R*0.17,cy+Math.sin(a)*R*0.17,R*0.17);}
   for(let k=0;k<96;k++){const a=k*TAU/96;G.L(P,cx+Math.cos(a)*R*0.97,cy+Math.sin(a)*R*0.97,cx+Math.cos(a)*R,cy+Math.sin(a)*R);}},
 // Banknote guilloche rosette
 guilloche(P,b){const R=Math.min(b.w,b.h)/2,cx=b.x+b.w/2,cy=b.y+b.h/2;
   [[0.92,11,0.27,0],[0.92,11,0.27,Math.PI/11],[0.62,13,0.3,0],[0.38,7,0.35,0]].forEach(([r,m,q,ph])=>{
     const a=r*R*(1-q),bb=r*R*q,N=900;
     for(let i=0;i<=N;i++){const t=i/N*TAU,x=cx+a*Math.cos(t)+bb*Math.cos(m*t+ph),y=cy+a*Math.sin(t)-bb*Math.sin(m*t+ph);i?P.lineTo(x,y):P.moveTo(x,y);}});
   G.O(P,cx,cy,R);G.O(P,cx,cy,R*1.04);
   for(let k=0;k<60;k++){const a=k*TAU/60;G.L(P,cx+Math.cos(a)*R,cy+Math.sin(a)*R,cx+Math.cos(a)*R*1.04,cy+Math.sin(a)*R*1.04);}},
 // Parisian Haussmann façade
 haussmann(P,b){const f=fit(b.x,b.y,b.w,b.h,0.86),x=f.x,y=f.y,w=f.w,h=f.h,by=y+h;
   const fl=[0.2,0.15,0.14,0.13,0.12],cols=5,cw=w/cols;let yy=by;
   G.R(P,x,by-h*0.82,w,h*0.82);
   for(let i=0;i<fl.length;i++){const fh=h*fl[i],ty=yy-fh;
     if(i===0){for(let r=1;r<6;r++)G.L(P,x,yy-r*fh/6,x+w,yy-r*fh/6);
       for(let c=0;c<cols;c++){const cx=x+c*cw+cw/2,aw=cw*0.5;P.moveTo(cx-aw/2,yy);P.lineTo(cx-aw/2,ty+fh*0.42);P.arc(cx,ty+fh*0.42,aw/2,Math.PI,TAU);P.lineTo(cx+aw/2,yy);}}
     else{for(let c=0;c<cols;c++){const cx=x+c*cw+cw/2,ww=cw*0.42,wh=fh*0.62,wy=ty+fh*0.24;
         G.R(P,cx-ww/2,wy,ww,wh);G.L(P,cx,wy,cx,wy+wh);G.L(P,cx-ww/2,wy+wh*0.38,cx+ww/2,wy+wh*0.38);
         if(i===1){if(c%2===0)G.poly(P,[[cx-ww*0.7,wy-fh*0.04],[cx,wy-fh*0.16],[cx+ww*0.7,wy-fh*0.04]],true);else G.A(P,cx,wy-fh*0.03,ww*0.66,Math.PI,TAU);}
         else G.L(P,cx-ww*0.65,wy-fh*0.05,cx+ww*0.65,wy-fh*0.05);}
       if(i===1||i===4){const ry=yy-fh*0.02;G.L(P,x-w*0.02,ry-fh*0.2,x+w*1.02,ry-fh*0.2);G.L(P,x-w*0.02,ry,x+w*1.02,ry);
         for(let k=0;k<=60;k++){const bx=x-w*0.02+k*w*1.04/60;G.L(P,bx,ry,bx,ry-fh*0.2);}}}
     G.L(P,x-w*0.03,ty,x+w*1.03,ty);G.L(P,x-w*0.03,ty+h*0.008,x+w*1.03,ty+h*0.008);yy=ty;}
   const mt=yy,mh=h*0.18;P.moveTo(x,mt);P.quadraticCurveTo(x+w*0.02,mt-mh*0.7,x+w*0.1,mt-mh);P.lineTo(x+w*0.9,mt-mh);P.quadraticCurveTo(x+w*0.98,mt-mh*0.7,x+w,mt);
   for(let c=0;c<cols;c++){const cx=x+c*cw+cw/2,dw=cw*0.32;P.moveTo(cx-dw/2,mt-mh*0.12);P.lineTo(cx-dw/2,mt-mh*0.55);P.arc(cx,mt-mh*0.55,dw/2,Math.PI,TAU);P.lineTo(cx+dw/2,mt-mh*0.12);}
   G.R(P,x+w*0.2,mt-mh*1.25,w*0.06,mh*0.25);G.R(P,x+w*0.72,mt-mh*1.25,w*0.06,mh*0.25);},
 // Triumphal arch with coffered vault
 arch(P,b){const f=fit(b.x,b.y,b.w,b.h,0.92),x=f.x,y=f.y,w=f.w,h=f.h,by=y+h;
   G.R(P,x,y+h*0.16,w,h*0.84);G.R(P,x-w*0.02,y,w*1.04,h*0.16);for(let k=1;k<4;k++)G.L(P,x+w*0.1,y+k*h*0.04,x+w*0.9,y+k*h*0.04);
   G.L(P,x-w*0.03,y+h*0.16,x+w*1.03,y+h*0.16);G.L(P,x-w*0.03,y+h*0.18,x+w*1.03,y+h*0.18);
   const aw=w*0.4,ax=x+w/2,spring=by-h*0.5,r=aw/2;
   P.moveTo(ax-r,by);P.lineTo(ax-r,spring);P.arc(ax,spring,r,Math.PI,TAU);P.lineTo(ax+r,by);
   G.A(P,ax,spring,r*1.16,Math.PI,TAU);
   for(let k=0;k<=16;k++){const a=Math.PI+k*Math.PI/16;G.L(P,ax+Math.cos(a)*r,spring+Math.sin(a)*r,ax+Math.cos(a)*r*1.16,spring+Math.sin(a)*r*1.16);}
   for(let j=1;j<4;j++)G.A(P,ax,spring,r*(1-j*0.2),Math.PI,TAU);
   for(let k=1;k<8;k++){const a=Math.PI+k*Math.PI/8;G.L(P,ax+Math.cos(a)*r*0.4,spring+Math.sin(a)*r*0.4,ax+Math.cos(a)*r,spring+Math.sin(a)*r);}
   [x+w*0.05,x+w*0.72].forEach(px=>{G.R(P,px,by-h*0.62,w*0.23,h*0.3);G.R(P,px+w*0.02,by-h*0.6,w*0.19,h*0.26);G.R(P,px,by-h*0.25,w*0.23,h*0.2);});
   G.L(P,x-w*0.03,by,x+w*1.03,by);},
 // Wrought-iron lattice tower (Eiffel)
 eiffel(P,b){const f=fit(b.x,b.y,b.w,b.h,0.5),cx=f.x+f.w/2,H=f.h,by=f.y+H,B=f.w;
   const hw=t=>B/2*Math.pow(1-t,2.3)+B*0.02,Y=t=>by-t*H*0.92;
   const side=(sgn,k)=>{const pts=[];for(let i=0;i<=40;i++){const t=i/40;pts.push([cx+sgn*hw(t)*k,Y(t)]);}G.poly(P,pts);};
   side(-1,1);side(1,1);side(-1,0.55);side(1,0.55);
   const lv=[0.14,0.38,0.8];lv.forEach(t=>{const w=hw(t)*1.12;G.R(P,cx-w,Y(t)-H*0.012,2*w,H*0.024);for(let k=-6;k<=6;k++)G.L(P,cx+k*w/6,Y(t)-H*0.012,cx+k*w/6,Y(t)-H*0.03);});
   for(let i=0;i<24;i++){const t0=i/24*0.8,t1=(i+1)/24*0.8;
     [-1,1].forEach(s=>{const kin=t0<0.38?0.55:0;
       G.L(P,cx+s*hw(t0),Y(t0),cx+s*hw(t1)*(kin||0.001),Y(t1));G.L(P,cx+s*hw(t0)*(kin||0.001),Y(t0),cx+s*hw(t1),Y(t1));});}
   const r=hw(0.1)*0.42;P.moveTo(cx-hw(0)*0.55,by);P.quadraticCurveTo(cx,Y(0.18),cx+hw(0)*0.55,by);
   G.L(P,cx,Y(0.8),cx,by-H);G.O(P,cx,by-H*0.95,B*0.012);G.L(P,f.x,by,f.x+f.w,by);},
 // Vitruvian square and circle, vesica, flower of life and cubit marks
 vitruvian(P,b){const s=Math.min(b.w,b.h)*0.78,cx=b.x+b.w/2,cy=b.y+b.h/2+s*0.05,x=cx-s/2,y=cy-s/2;
   G.R(P,x,y,s,s);const rc=s*0.61,ny=y+s-rc;G.O(P,cx,ny,rc);
   for(let k=1;k<8;k++){G.L(P,x+k*s/8,y+s,x+k*s/8,y+s-s*0.025);G.L(P,x,y+k*s/8,x+s*0.025,y+k*s/8);}
   G.L(P,x,y,x+s,y+s);G.L(P,x+s,y,x,y+s);
   const fr=s*0.11;G.O(P,cx,ny,fr);for(let k=0;k<6;k++){const a=k*TAU/6;G.O(P,cx+Math.cos(a)*fr,ny+Math.sin(a)*fr,fr);}
   G.O(P,cx,ny,fr*2);
   const pr=rc*0.82;for(let k=0;k<5;k++){const a=-Math.PI/2+k*TAU*2/5,a2=-Math.PI/2+(k+1)*TAU*2/5;G.L(P,cx+Math.cos(a)*pr,ny+Math.sin(a)*pr,cx+Math.cos(a2)*pr,ny+Math.sin(a2)*pr);}},
 // Astrolabe: graduated limb, zodiac ring, rete and alidade
 astrolabe(P,b){const R=Math.min(b.w,b.h)/2,cx=b.x+b.w/2,cy=b.y+b.h/2;
   [1,0.95,0.86,0.79,0.5,0.06].forEach(k=>G.O(P,cx,cy,R*k));
   for(let k=0;k<72;k++){const a=k*TAU/72,l=k%6===0?0.89:0.95;G.L(P,cx+Math.cos(a)*R*l,cy+Math.sin(a)*R*l,cx+Math.cos(a)*R,cy+Math.sin(a)*R);}
   for(let k=0;k<12;k++){const a=k*TAU/12;G.L(P,cx+Math.cos(a)*R*0.79,cy+Math.sin(a)*R*0.79,cx+Math.cos(a)*R*0.86,cy+Math.sin(a)*R*0.86);}
   G.O(P,cx,cy-R*0.16,R*0.58);G.O(P,cx,cy+R*0.2,R*0.36);
   for(let k=0;k<7;k++){const a=k*TAU/7+0.3,px=cx+Math.cos(a)*R*0.68,py=cy+Math.sin(a)*R*0.68;G.poly(P,[[px,py],[px+Math.cos(a+2.7)*R*0.1,py+Math.sin(a+2.7)*R*0.1],[px+Math.cos(a-2.7)*R*0.1,py+Math.sin(a-2.7)*R*0.1]],true);}
   const a=-0.6;G.L(P,cx-Math.cos(a)*R*0.98,cy-Math.sin(a)*R*0.98,cx+Math.cos(a)*R*0.98,cy+Math.sin(a)*R*0.98);
   G.L(P,cx-Math.cos(a+0.03)*R*0.98,cy-Math.sin(a+0.03)*R*0.98,cx+Math.cos(a-0.03)*R*0.98,cy+Math.sin(a-0.03)*R*0.98);},
 // Ionic column at 1:9 module with volutes and a scale of diameters
 column(P,b){const H=b.h,D=H/9.6,cx=b.x+b.w*0.42,by=b.y+H,top=b.y+H*0.12;
   P.ellipse(cx,by-D*0.14,D*0.78,D*0.14,0,0,TAU);P.ellipse(cx,by-D*0.42,D*0.68,D*0.12,0,0,TAU);
   P.moveTo(cx-D/2,by-D*0.55);P.quadraticCurveTo(cx-D*0.56,(by+top)/2,cx-D*0.42,top);
   P.moveTo(cx+D/2,by-D*0.55);P.quadraticCurveTo(cx+D*0.56,(by+top)/2,cx+D*0.42,top);
   for(let k=1;k<6;k++){const fx=-0.5+k/6;G.L(P,cx+D*fx,by-D*0.6,cx+D*fx*0.84,top+D*0.05);}
   G.R(P,cx-D*0.95,top-D*0.42,D*1.9,D*0.12);G.L(P,cx-D*0.6,top-D*0.05,cx+D*0.6,top-D*0.05);
   for(let k=-2;k<=2;k++)G.A(P,cx+k*D*0.2,top-D*0.12,D*0.08,0,Math.PI);
   [-1,1].forEach(s=>{const vx=cx+s*D*0.72,vy=top-D*0.12;let first=true;
     for(let i=0;i<=120;i++){const t=i/120*TAU*2.5,r=D*0.26*(1-i/140),x=vx+s*Math.cos(t)*r,y=vy+Math.sin(t)*r;first?P.moveTo(x,y):P.lineTo(x,y);first=false;}});
   const sx=b.x+b.w*0.86;G.L(P,sx,top,sx,by);for(let k=0;k<=9;k++){const yy=by-k*(by-top)/9;G.L(P,sx-D*0.18,yy,sx+D*0.18,yy);}
   G.L(P,sx-D*0.3,top,sx+D*0.3,top);G.L(P,sx-D*0.3,by,sx+D*0.3,by);},
 // Greek key band
 meander(P,b){const g=b.h/5,u=5*g,n=Math.floor(b.w/u),x0=b.x+(b.w-n*u)/2,y=b.y+g*0.5;
   G.L(P,x0,b.y,x0+n*u,b.y);G.L(P,x0,b.y+b.h,x0+n*u,b.y+b.h);
   const pat=[[0,4],[0,0],[4,0],[4,3],[2,3],[2,2],[3,2],[3,1],[1,1],[1,4],[5,4]];
   P.moveTo(x0,y+4*g*0.8);for(let i=0;i<n;i++)pat.forEach(([px,py])=>P.lineTo(x0+i*u+px*g,y+py*g*0.8));},
};
M.hero=(P,b)=>{M.temple(P,{x:b.x,y:b.y,w:b.w*0.62,h:b.h*0.62});M.spiral(P,{x:b.x+b.w*0.3,y:b.y+b.h*0.6,w:b.w*0.7,h:b.h*0.4});M.rose(P,{x:b.x+b.w*0.66,y:b.y,w:b.w*0.34,h:b.w*0.34});};

function frame4(P,t){ // binding: double rule, corner rosettes, book-spine bands
  const k=t.w/240,i1=7*k,i2=10*k,{x,y,w,h}=t;
  G.R(P,x+i1,y+i1,w-2*i1,h-2*i1);G.R(P,x+i2,y+i2,w-2*i2,h-2*i2);
  [[x+i2,y+i2,0],[x+w-i2,y+i2,0.5],[x+w-i2,y+h-i2,1],[x+i2,y+h-i2,1.5]].forEach(([cx,cy,q])=>{
    const a0=q*Math.PI;G.A(P,cx,cy,9*k,a0,a0+Math.PI/2);G.A(P,cx,cy,6*k,a0,a0+Math.PI/2);G.O(P,cx,cy,1.8*k);});
}
function regionFor(t){const{x,y,w,h}=t;
  if(t.hero)return {x:x+w*0.12,y:y+h*0.24,w:w*0.8,h:h*0.6};
  if(t.type==='sticky')return {x:x+w*0.44,y:y+h*0.4,w:w*0.48,h:h*0.5};
  if(t.type==='card')return {x:x+w*0.58,y:y+h*0.5,w:w*0.36,h:h*0.42};
  if(t.type==='quote')return {x:x+w*0.66,y:y+h*0.14,w:w*0.3,h:h*0.72};
  if(t.type==='list')return {x:x+w*0.64,y:y+h*0.08,w:w*0.3,h:h*0.42};
  if(t.type==='diagram')return {x:x+25,y:y+h-30,w:w-50,h:16};
  return {x,y,w,h};}
function buildLacing(){TILES.forEach(t=>{const P=new Path2D();frame4(P,t);(M[t.motif]||M.spiral)(P,regionFor(t));t.lace=P;});}

/* ═════════════ Drawing ═════════════ */
function rr(x,y,w,h,r){r=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
function lines(b,x,y,color,align){
  if(b.size*S<3.4){ctx.fillStyle=color;const ga=ctx.globalAlpha;ctx.globalAlpha=ga*0.22;
    b.lines.forEach((l,i)=>{const w=b.widths[i],lx=align==='center'?x-w/2:x;rr(lx,y+i*b.lh+b.size*0.28,w,b.size*0.55,b.size*0.27);ctx.fill();});ctx.globalAlpha=ga;return b.h;}
  ctx.font=b.font;ctx.fillStyle=color;ctx.textBaseline='top';ctx.textAlign=align||'left';
  b.lines.forEach((l,i)=>ctx.fillText(l,x,y+i*b.lh));ctx.textAlign='left';return b.h;}
function shadow(x,y,w,h,r,k=1){ctx.fillStyle='rgba(12,17,23,0.05)';rr(x,y+6*k,w,h,r);ctx.fill();ctx.fillStyle='rgba(12,17,23,0.06)';rr(x,y+1.5*k,w,h,r);ctx.fill();}
function diamond(x,y,s,color){ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(x,y-s);ctx.lineTo(x+s,y);ctx.lineTo(x,y+s);ctx.lineTo(x-s,y);ctx.closePath();ctx.fill();}

function lacingColor(t,a){return t.type==='quote'?`rgba(214,190,135,${a})`:t.type==='sticky'?`rgba(138,116,70,${a})`:`rgba(168,140,88,${a})`;}
function drawLace(t,vis){ if(vis<=0.01)return;
  ctx.strokeStyle=lacingColor(t,(t.type==='sticky'?0.5:0.6)*vis);ctx.lineWidth=Math.max(0.55,0.75/S);ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke(t.lace);}

function drawTile(t,vis){
  const {x,y,w,h,L}=t;
  if(t.type==='sticky'){const p=t.w*0.085;
    if(w*S>110){ctx.save();ctx.shadowColor='rgba(0,0,0,0.16)';ctx.shadowBlur=clamp(16*S,1,40)*DPR;ctx.shadowOffsetY=clamp(4*S,0.5,10)*DPR;ctx.fillStyle=t.color;ctx.fillRect(x,y,w,h);ctx.restore();}
    else{ctx.fillStyle='rgba(0,0,0,0.07)';ctx.fillRect(x,y+3,w,h);ctx.fillStyle=t.color;ctx.fillRect(x,y,w,h);}
    drawLace(t,vis);
    lines(L.title,x+p,y+p*1.05,C.ink);lines(L.by,x+p,y+h-p-L.by.size*1.1,C.author);}
  else if(t.type==='card'){shadow(x,y,w,h,10);ctx.fillStyle=C.paper;rr(x,y,w,h,10);ctx.fill();ctx.strokeStyle='rgba(12,17,23,0.07)';ctx.lineWidth=1/S;ctx.stroke();
    drawLace(t,vis);
    lines(L.label,x+25,y+26,'rgba(30,30,30,0.5)');const th=lines(L.title,x+25,y+56,C.ink);lines(L.body,x+25,y+56+th+18,'rgba(32,37,44,0.78)');}
  else if(t.type==='quote'){shadow(x,y,w,h,10,1.4);ctx.fillStyle=C.ink;rr(x,y,w,h,10);ctx.fill();drawLace(t,vis);
    if(S*80>3.4){ctx.font=font(80,600);ctx.fillStyle=C.gold;ctx.textBaseline='top';ctx.fillText('“',x+30,y+18);}
    lines(L.title,x+33,y+88,C.ivory);lines(L.by,x+33,y+h-46,'rgba(247,245,240,0.6)');}
  else if(t.type==='list'){shadow(x,y,w,h,10);ctx.fillStyle=C.paper;rr(x,y,w,h,10);ctx.fill();ctx.strokeStyle='rgba(12,17,23,0.07)';ctx.lineWidth=1/S;ctx.stroke();
    drawLace(t,vis);
    let yy=y+28+lines(L.title,x+25,y+28,C.ink)+20;
    L.items.forEach((b,i)=>{ctx.strokeStyle='rgba(32,37,44,0.45)';ctx.lineWidth=1.5;rr(x+26,yy+2,18,18,4);ctx.stroke();
      if(S*16>3.4){ctx.font=font(12,700);ctx.fillStyle='rgba(30,30,30,0.55)';ctx.textBaseline='top';ctx.textAlign='center';ctx.fillText(String(i+1),x+35,yy+5.5);ctx.textAlign='left';}
      yy+=lines(b,x+58,yy,C.graphite)+16;});}
  else if(t.type==='diagram'){shadow(x,y,w,h,10);ctx.fillStyle=C.paper;rr(x,y,w,h,10);ctx.fill();ctx.strokeStyle='rgba(12,17,23,0.07)';ctx.lineWidth=1/S;ctx.stroke();
    drawLace(t,vis);lines(L.title,x+25,y+28,C.ink);
    const n=L.nodes.length,nw=90,nh=50,gap=(w-50-n*nw)/(n-1),ny=y+120;
    for(let i=0;i<n;i++){const nx=x+25+i*(nw+gap),last=i===n-1;
      if(i<n-1){const ax=nx+nw+6,bx=nx+nw+gap-6,ay=ny+nh/2;ctx.strokeStyle=C.line;ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(bx-2,ay);ctx.stroke();
        ctx.fillStyle=C.line;ctx.beginPath();ctx.moveTo(bx,ay);ctx.lineTo(bx-8,ay-5);ctx.lineTo(bx-8,ay+5);ctx.closePath();ctx.fill();}
      ctx.fillStyle=last?C.ink:'#A8DAFB';rr(nx,ny,nw,nh,8);ctx.fill();lines(L.nodes[i],nx+nw/2,ny+nh/2-8,last?C.ivory:C.ink,'center');}
    lines(L.body,x+25,ny+nh+30,'rgba(32,37,44,0.78)');}
  // glass: a clean top-light across the surface, only up close
  if(vis>0.02){const g=ctx.createLinearGradient(x,y,x+w*0.6,y+h);
    g.addColorStop(0,`rgba(255,255,255,${0.30*vis})`);g.addColorStop(0.38,'rgba(255,255,255,0)');g.addColorStop(0.8,'rgba(255,255,255,0)');g.addColorStop(1,`rgba(255,255,255,${0.12*vis})`);
    ctx.fillStyle=g;if(t.type==='sticky')ctx.fillRect(x,y,w,h);else{rr(x,y,w,h,10);ctx.fill();}
    ctx.strokeStyle=`rgba(255,255,255,${0.55*vis})`;ctx.lineWidth=1.2/S;ctx.beginPath();ctx.moveTo(x+2/S,y+h-2/S);ctx.lineTo(x+2/S,y+2/S);ctx.lineTo(x+w-2/S,y+2/S);ctx.stroke();}
}

// The polish: a diagonal sweep of light, the gold catching it, a turning glint
let shine=null;const SHINE_MS=1500;
function drawShine(now){
  if(!shine)return false;const t=tById[shine.id],q=(now-shine.t0)/SHINE_MS;if(q>=1){shine=null;return true;}
  const e=q<.5?2*q*q:1-Math.pow(-2*q+2,2)/2,c=-0.25+e*1.5,{x,y,w,h}=t;
  ctx.save();if(t.type==='sticky'){ctx.beginPath();ctx.rect(x,y,w,h);}else rr(x,y,w,h,10);ctx.clip();
  const g=ctx.createLinearGradient(x,y,x+w,y+h),st=(o,col)=>g.addColorStop(clamp(c+o,0,1),col);
  st(-0.2,'rgba(255,255,255,0)');st(-0.04,'rgba(255,255,255,0.35)');st(0,'rgba(255,255,255,0.75)');st(0.015,'rgba(255,255,255,0.35)');st(0.12,'rgba(255,255,255,0)');
  ctx.globalCompositeOperation='lighter';ctx.globalAlpha=0.55;ctx.fillStyle=g;ctx.fillRect(x,y,w,h);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
  // gold glint inside the band
  const vx=w,vy=h,len2=vx*vx+vy*vy,s1=c-0.07,s2=c+0.05,px=-vy,py=vx;
  const P1=[x+vx*s1,y+vy*s1],P2=[x+vx*s2,y+vy*s2];
  ctx.beginPath();ctx.moveTo(P1[0]-px,P1[1]-py);ctx.lineTo(P1[0]+px,P1[1]+py);ctx.lineTo(P2[0]+px,P2[1]+py);ctx.lineTo(P2[0]-px,P2[1]-py);ctx.closePath();ctx.clip();
  ctx.strokeStyle=t.type==='quote'?'rgba(255,232,170,0.95)':'rgba(196,156,72,0.95)';ctx.lineWidth=Math.max(0.9,1.3/S);ctx.stroke(t.lace);
  ctx.restore();
  // the turning star where the light crosses
  const sx=x+w*clamp(c,0,1),sy=y+h*clamp(c,0,1),amp=Math.sin(Math.PI*clamp(q*1.1,0,1)),r=Math.min(w,h)*0.07*amp,rot=q*Math.PI*1.5;
  if(r>0.5){ctx.save();ctx.translate(sx,sy);ctx.rotate(rot);ctx.fillStyle=`rgba(255,250,235,${0.9*amp})`;ctx.beginPath();
    for(let i=0;i<8;i++){const a=i*Math.PI/4,rad=i%2?r*0.18:r;ctx.lineTo(Math.cos(a)*rad,Math.sin(a)*rad);}ctx.closePath();ctx.fill();ctx.restore();}
  return true;
}

let cam=[0,0,1000];
const toScreen=(wx,wy)=>[W/2+(wx-cam[0])*S,H/2+(wy-cam[1])*S];
// Dot grid drawn as cached repeating patterns (2 fills per frame instead of thousands of rects)
const dotCache=new Map();
function dotPattern(n,aq,rr){const key=n+'|'+aq+'|'+rr;let pat=dotCache.get(key);if(pat)return pat;
  if(dotCache.size>160)dotCache.clear();
  const c=document.createElement('canvas');c.width=n;c.height=n;const d=c.getContext('2d');d.fillStyle=`rgba(0,0,0,${aq/20*0.55})`;
  d.fillRect(0,0,rr,rr);d.fillRect(n-rr,0,rr,rr);d.fillRect(0,n-rr,rr,rr);d.fillRect(n-rr,n-rr,rr,rr);
  pat=ctx.createPattern(c,'repeat');dotCache.set(key,pat);return pat;}
function dotPass(sp,a,r,ox,oy){if(a<=0.02)return;
  const n=Math.max(2,Math.round(sp*DPR)),aq=Math.round(a*20),rr=Math.max(1,Math.round(r*DPR)),pat=dotPattern(n,aq,rr),k=sp*DPR/n;
  pat.setTransform(new DOMMatrix([k,0,0,k,(((ox%sp)+sp)%sp)*DPR,(((oy%sp)+sp)%sp)*DPR]));
  ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle=pat;ctx.fillRect(0,0,cv.width,cv.height);}
function drawDots(){let g=32,gs=g*S;while(gs<18){g*=2;gs*=2;}
  const r=clamp(1.15*Math.sqrt(Math.min(S,1.6)),0.85,1.6),ox=W/2-cam[0]*S,oy=H/2-cam[1]*S;
  dotPass(gs,0.42,r,ox,oy);dotPass(gs/2,0.42*clamp((gs/2-9)/9,0,1),r,ox,oy);}
function edgePath(a,b){const dx=b.cx-a.cx,dy=b.cy-a.cy,g=14,R=18;let p;
  if(Math.abs(dx)>=Math.abs(dy)){const sx=dx>0?1:-1,x0=a.cx+sx*(a.w/2+g),x3=b.cx-sx*(b.w/2+g),mx=(x0+x3)/2;p=[[x0,a.cy],[mx,a.cy],[mx,b.cy],[x3,b.cy]];}
  else{const sy=dy>0?1:-1,y0=a.cy+sy*(a.h/2+g),y3=b.cy-sy*(b.h/2+g),my=(y0+y3)/2;p=[[a.cx,y0],[a.cx,my],[b.cx,my],[b.cx,y3]];}
  const len=(u,v)=>Math.hypot(v[0]-u[0],v[1]-u[1]);if(len(p[0],p[3])<70)return false;
  ctx.beginPath();ctx.moveTo(p[0][0],p[0][1]);
  for(let i=1;i<3;i++){const r=Math.min(R,len(p[i-1],p[i])/2,len(p[i],p[i+1])/2);if(r<0.5)ctx.lineTo(p[i][0],p[i][1]);else ctx.arcTo(p[i][0],p[i][1],p[i+1][0],p[i+1][1],r);}
  ctx.lineTo(p[3][0],p[3][1]);return true;}

function draw(now){
  S=W/cam[2];drawnOnce=true;
  ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle=C.bg;ctx.fillRect(0,0,cv.width,cv.height);drawDots();
  ctx.setTransform(DPR*S,0,0,DPR*S,DPR*(W/2-cam[0]*S),DPR*(H/2-cam[1]*S));ctx.globalAlpha=1;
  const far=clamp((0.75-S)/0.55,0,1),mapA=clamp((15-30*S)/6,0,1);
  SECTIONS.forEach(s=>{ctx.fillStyle=`rgba(255,255,255,${0.55-0.15*far})`;rr(s.x,s.y,s.w,s.h,16);ctx.fill();
    ctx.strokeStyle=`rgba(12,17,23,${0.07+0.06*far})`;ctx.lineWidth=(1+far)/S;ctx.stroke();
    if(mapA<0.99){ctx.globalAlpha=1-mapA;lines(s.Ln,s.x+30,s.y+36,'rgba(30,30,30,0.4)');lines(s.Lt,s.x+62,s.y+29,C.ink);ctx.globalAlpha=1;}});
  const lw=Math.max(5*S,clamp(1.6*Math.pow(0.7/S,0.62),1.4,6.5));ctx.lineCap='butt';ctx.lineJoin='round';
  if(far>0.02){ctx.strokeStyle=`rgba(255,255,255,${0.95*far})`;ctx.lineWidth=(lw+5*far)/S;EDGES.forEach(([a,b])=>{if(edgePath(tById[a],tById[b]))ctx.stroke();});}
  const cv1=Math.round(117-35*far);ctx.strokeStyle=`rgb(${cv1},${cv1},${cv1})`;ctx.lineWidth=lw/S;
  EDGES.forEach(([a,b])=>{if(edgePath(tById[a],tById[b]))ctx.stroke();});
  const vx0=cam[0]-W/2/S,vx1=cam[0]+W/2/S,vy0=cam[1]-H/2/S,vy1=cam[1]+H/2/S;
  const mn=Math.min(W,H);
  TILES.forEach(t=>{if(t.x>vx1+40||t.x+t.w<vx0-40||t.y>vy1+40||t.y+t.h<vy0-40)return;drawTile(t,smooth(0.3,0.55,t.w*S/mn));}); // gold lacing shows only when a tile fills the eye
  const shining=drawShine(now);
  if(mapA>0.01){ctx.setTransform(DPR,0,0,DPR,0,0);ctx.globalAlpha=mapA;ctx.font=font(11,700);ctx.textBaseline='middle';
    SECTIONS.forEach(s=>{const [px,py]=toScreen(s.x+s.w/2,s.y+s.h/2),label=s.n+'  '+s.name.toUpperCase().split('').join(' '),tw=ctx.measureText(label).width,pw=tw+34,ph=24;
      ctx.fillStyle='rgba(12,17,23,0.12)';rr(px-pw/2,py-ph/2+2,pw,ph,12);ctx.fill();ctx.fillStyle=C.paper;rr(px-pw/2,py-ph/2,pw,ph,12);ctx.fill();
      diamond(px-pw/2+13,py,3.6,C.gold);ctx.fillStyle=C.ink;ctx.fillText(label,px-pw/2+22,py+0.5);});ctx.globalAlpha=1;}
  zoomEl.textContent=Math.round(S*100)+'%';
  return shining;
}

/* ═════════════ Camera ═════════════ */
const RHO=1.55,R2=RHO*RHO,R4=R2*R2;
function interpZoom(p0,p1){const [ux0,uy0,w0]=p0,[ux1,uy1,w1]=p1,dx=ux1-ux0,dy=uy1-uy0,d2=dx*dx+dy*dy;let i,Sx;
  if(d2<1e-6){Sx=Math.log(w1/w0)/RHO;i=t=>[ux0+t*dx,uy0+t*dy,w0*Math.exp(RHO*t*Sx)];}
  else{const d1=Math.sqrt(d2),b0=(w1*w1-w0*w0+R4*d2)/(2*w0*R2*d1),b1=(w1*w1-w0*w0-R4*d2)/(2*w1*R2*d1),r0=Math.log(Math.sqrt(b0*b0+1)-b0),r1=Math.log(Math.sqrt(b1*b1+1)-b1);Sx=(r1-r0)/RHO;
    i=t=>{const s=t*Sx,c0=Math.cosh(r0),u=w0/(R2*d1)*(c0*Math.tanh(RHO*s+r0)-Math.sinh(r0));return [ux0+u*dx,uy0+u*dy,w0*c0/Math.cosh(RHO*s+r0)];};}
  return {i,S:Math.abs(Sx)};}
const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
function viewFor(x,y,w,h,pad,maxS){const ah=Math.max(120,H-hudTop-hudBot);let s=Math.min(W/(w*pad),ah/(h*pad));if(maxS)s=Math.min(s,maxS);return [x+w/2,y+h/2-(hudTop-hudBot)/(2*s),W/s];}
function bounds(){let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;SECTIONS.concat(TILES).forEach(r=>{x0=Math.min(x0,r.x);y0=Math.min(y0,r.y);x1=Math.max(x1,r.x+r.w);y1=Math.max(y1,r.y+r.h);});return {x:x0,y:y0,w:x1-x0,h:y1-y0};}
function viewOf(tg){if(tg.kind==='overview'){const b=bounds();return viewFor(b.x,b.y,b.w,b.h,1.05);}
  if(tg.kind==='section'){const s=secById[tg.id];return viewFor(s.x,s.y,s.w,s.h,1.06);}
  const t=tById[tg.id],big=Math.max(W,H)>900;return viewFor(t.x,t.y,t.w,t.h,big?1.5:1.14,t.hero?(big?1.3:1.1):(big?2.1:3));}

let drawnOnce=false,flight=null,holdUntil=0,playing=false,current={kind:'overview'},dirty=true,extendedHold=false,bag=[],hop=0,lastId=null;
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]];}return a;};
function pickNext(){hop++;if(hop===1)return {kind:'tile',id:'hero'};if(hop%5===0)return {kind:'overview'};
  if(hop%5===3&&current.kind==='tile'&&tById[current.id].s)return {kind:'section',id:tById[current.id].s};
  if(!bag.length)bag=shuffle(TILES.map(t=>t.id).filter(id=>id!==lastId&&id!=='hero'));const id=bag.pop();lastId=id;return {kind:'tile',id};}
function go(tg){const it=interpZoom(cam,viewOf(tg));flight={it:it.i,t0:performance.now(),dur:clamp(it.S*780,1300,3400)};current=tg;cap.classList.add('hide');}
function onArrive(now){let sec,ttl;
  if(current.kind==='overview'){sec='Bird’s-eye view';ttl='Six rooms, one way of thinking.';}
  else if(current.kind==='section'){const s=secById[current.id];sec=s.n+' · Room';ttl=s.name;}
  else{const t=tById[current.id];sec=t.s?secById[t.s].n+' · '+secById[t.s].name:'The Brenicks Group';ttl=t.title;shine={id:t.id,t0:now+120};}
  capSec.textContent=sec;capTtl.textContent=ttl;cap.classList.remove('hide');
  holdUntil=now+(extendedHold?9000:current.kind==='tile'?4200:2600);extendedHold=false;}

/* ═════════════ The sleeve reveal, driven by scroll (transform + opacity only) ═════════════ */
const STICKY_OK=!!(window.CSS&&CSS.supports('overflow-x','clip')&&CSS.supports('selector(:has(*))'));
if(!STICKY_OK)root.classList.add('no-sticky');
let navOver=false,navH=72,lastP=-1,started=false,startedAt=0,geo=null,isFull=false,hudOn=false,pin='',active=false,raf=0,sizeKey='',pS=-1,lastT=0,autoA=0,autoDir=-1;
const AUTO_MS=1700;
// Phones report scroll position in uneven steps (and in bursts during momentum), which made the sleeve shake.
// The reveal now follows the scroll through a short critically-damped glide, snaps to whole device pixels,
// skips the 3D tilt on touch screens, and keeps the canvas still until the map has fully landed.
const TOUCH=!!(window.matchMedia&&matchMedia('(pointer:coarse)').matches),
      CALM=!!(window.matchMedia&&matchMedia('(prefers-reduced-motion:reduce)').matches);
const px=v=>(Math.round(v*DPR)/DPR).toFixed(2);
const lerp=(a,b,t)=>a+(b-a)*t,eio=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
function measureReveal(){
  const s0=Math.min(0.62,600/W),pw=W*s0,ph=H*s0,sw=pw*1.1,sh=ph*1.09,notch=Math.max(18,sw*0.07);
  geo={s0,ph,sw,sh};root.style.setProperty('--hwt-s0',s0.toFixed(5));
  [sf,sb].forEach(el=>{el.style.width=sw+'px';el.style.height=sh+'px';el.style.setProperty('--notch',notch+'px');});sf.style.setProperty('--sw',sw+'px');
}
function layoutReveal(p){
  const {s0,ph,sw,sh}=geo,pull=eio(smooth(0.1,0.52,p)),grow=eio(smooth(0.52,0.8,p));
  const restY=H/2+ph*0.03,outY=restY-ph*0.32,cy=lerp(lerp(restY,outY,pull),H/2,grow),s=lerp(s0,1,grow);
  const tilt=TOUCH?0:(1-grow)*pull*(1-pull)*4*-3;
  const tf=`translate3d(0,${px(cy-H/2)}px,0) scale(${s.toFixed(5)})`+(TOUCH?'':` rotateX(${tilt.toFixed(3)}deg)`);
  paperEl.style.transform=tf;shadowEl.style.transform=tf;shadowEl.style.opacity=(1-grow).toFixed(3);
  const full=grow>0.999;if(full!==isFull){isFull=full;paperEl.classList.toggle('is-full',full);}
  ghost.style.opacity=lerp(0.55,0,smooth(0.05,0.5,p)).toFixed(3);
  const sy=H/2-sh/2+ph*0.04+pull*(H*0.55+sh*0.5),st=`translate3d(${px(W/2-sw/2)}px,${px(sy)}px,0)`;
  sf.style.transform=st;sb.style.transform=st;
  sf.style.opacity=(1-smooth(0.4,0.6,p)).toFixed(3);sb.style.opacity=(1-smooth(0.35,0.55,p)).toFixed(3);
  const hud=p>=0.8;if(hud!==hudOn){hudOn=hud;topEl.classList.toggle('off',!hud);botEl.classList.toggle('off',!hud);}
  // the tour starts only once the map has fully landed, so the canvas never repaints mid-transition
  if(p>=0.8&&!started){started=true;startedAt=performance.now();setPlaying(true);holdUntil=performance.now()+500;}
  if(p<0.78&&started){started=false;setPlaying(false);flight=null;current={kind:'overview'};cam=viewOf(current);shine=null;cap.classList.add('hide');dirty=true;}
}
function pinFallback(r){const st=r.top>0?'before':(r.bottom<H?'after':'fixed');if(st!==pin){pin=st;stage.dataset.pin=st;}}

/* ═════════════ Loop (runs only while the section is near the screen), sizing, input ═════════════ */
// The antenna: telescopes out of the B chat button while the film plays; tap it to glide past the section
const ant=document.createElement('div');ant.className='hwt-ant';ant.setAttribute('aria-hidden','false');
ant.innerHTML='<div class="hwt-ant__mast"><span class="hwt-ant__seg hwt-ant__seg--1"></span><span class="hwt-ant__seg hwt-ant__seg--2"></span><span class="hwt-ant__seg hwt-ant__seg--3"></span>'+
  '<span class="hwt-ant__joint" style="bottom:28px"></span><span class="hwt-ant__joint" style="bottom:54px"></span><span class="hwt-ant__collar"></span>'+
  '<button type="button" class="hwt-ant__beacon" aria-label="Scroll on past the film"><span class="hwt-ant__ring"></span><span class="hwt-ant__ring"></span><span class="hwt-ant__ring"></span>'+
  '<span class="hwt-ant__orb"></span>'+
  '<svg class="hwt-ant__dial" viewBox="0 0 58 58" aria-hidden="true"><defs><linearGradient id="hwtSw" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".95"/></linearGradient></defs><g class="rim" fill="none" stroke="rgba(12,17,23,.38)" stroke-width=".45"><path d="M54.00 29.00L58.00 29.00M56.59 31.41L57.89 31.53M56.28 33.81L57.56 34.04M55.76 36.17L57.01 36.51M55.03 38.47L56.25 38.92M54.10 40.71L55.28 41.26M52.04 42.30L54.11 43.50M51.69 44.89L52.76 45.63M50.22 46.81L51.22 47.64M48.59 48.59L49.51 49.51M46.81 50.22L47.64 51.22M44.89 51.69L45.63 52.76M42.30 52.04L43.50 54.11M40.71 54.10L41.26 55.28M38.47 55.03L38.92 56.25M36.17 55.76L36.51 57.01M33.81 56.28L34.04 57.56M31.41 56.59L31.53 57.89M29.00 54.00L29.00 58.00M26.59 56.59L26.47 57.89M24.19 56.28L23.96 57.56M21.83 55.76L21.49 57.01M19.53 55.03L19.08 56.25M17.29 54.10L16.74 55.28M15.70 52.04L14.50 54.11M13.11 51.69L12.37 52.76M11.19 50.22L10.36 51.22M9.41 48.59L8.49 49.51M7.78 46.81L6.78 47.64M6.31 44.89L5.24 45.63M5.96 42.30L3.89 43.50M3.90 40.71L2.72 41.26M2.97 38.47L1.75 38.92M2.24 36.17L0.99 36.51M1.72 33.81L0.44 34.04M1.41 31.41L0.11 31.53M4.00 29.00L0.00 29.00M1.41 26.59L0.11 26.47M1.72 24.19L0.44 23.96M2.24 21.83L0.99 21.49M2.97 19.53L1.75 19.08M3.90 17.29L2.72 16.74M5.96 15.70L3.89 14.50M6.31 13.11L5.24 12.37M7.78 11.19L6.78 10.36M9.41 9.41L8.49 8.49M11.19 7.78L10.36 6.78M13.11 6.31L12.37 5.24M15.70 5.96L14.50 3.89M17.29 3.90L16.74 2.72M19.53 2.97L19.08 1.75M21.83 2.24L21.49 0.99M24.19 1.72L23.96 0.44M26.59 1.41L26.47 0.11M29.00 4.00L29.00 0.00M31.41 1.41L31.53 0.11M33.81 1.72L34.04 0.44M36.17 2.24L36.51 0.99M38.47 2.97L38.92 1.75M40.71 3.90L41.26 2.72M42.30 5.96L43.50 3.89M44.89 6.31L45.63 5.24M46.81 7.78L47.64 6.78M48.59 9.41L49.51 8.49M50.22 11.19L51.22 10.36M51.69 13.11L52.76 12.37M52.04 15.70L54.11 14.50M54.10 17.29L55.28 16.74M55.03 19.53L56.25 19.08M55.76 21.83L57.01 21.49M56.28 24.19L57.56 23.96M56.59 26.59L57.89 26.47"/></g><g fill="none" stroke="rgba(12,17,23,.2)" stroke-width=".4"><circle cx="29" cy="29" r="20"/><circle cx="29" cy="29" r="12" stroke-dasharray="1 1.6"/><path d="M29 7v8M29 43v8M7 29h8M43 29h8"/></g><g class="sweep"><path d="M29 29L29 4A25 25 0 0 1 46.7 11.3Z" fill="url(#hwtSw)" opacity=".55"/><path d="M29 29L46.7 11.3" stroke="#fff" stroke-width=".8"/></g><circle cx="29" cy="29" r="1.1" fill="rgba(12,17,23,.55)"/></svg>'+
  '<span class="hwt-ant__label">SCROLL ON</span></button></div>';
document.body.appendChild(ant);let antUp=false;
function setAnt(up){if(up===antUp)return;antUp=up;ant.classList.toggle('is-up',up);}
ant.querySelector('.hwt-ant__beacon').addEventListener('click',()=>{setAnt(false);
  const y=root.getBoundingClientRect().bottom+scrollY-innerHeight*0.25;
  scrollTo({top:y,behavior:CALM?'auto':'smooth'});});
let playOff=0;
// keep the play/pause button vertically centred on the B chat button (horizontal position untouched)
function alignPlay(){const cb=document.getElementById('bk-chat-btn');if(!cb||!hudOn)return;
  const a=cb.getBoundingClientRect(),b=playBtn.getBoundingClientRect();if(!a.height||!b.height)return;
  const d=(a.top+a.height/2)-(b.top+b.height/2);if(Math.abs(d)>0.5){playOff+=d;playBtn.style.transform=`translateY(${playOff.toFixed(1)}px)`;}}
function antFrame(r){alignPlay();const chat=document.getElementById('bk-chat'),chatOpen=chat&&getComputedStyle(chat).display!=='none';
  setAnt(active&&started&&performance.now()>startedAt+700&&r.top<=1&&r.bottom>H*0.6&&!chatOpen);}
function frame(now){
  if(!active){raf=0;lastT=0;setAnt(false);return;}
  const r=reveal.getBoundingClientRect();if(!STICKY_OK)pinFallback(r);
  const over=r.top<=navH&&r.bottom>=navH;if(over!==navOver){navOver=over;document.body.classList.toggle('hwt-over',over);}
  const pT=clamp(-r.top/Math.max(1,r.height-H),0,1),dt=lastT?Math.min(64,now-lastT):16;lastT=now;
  // Automatic hand-off: once the visitor scrolls the file to the point where it starts leaving the sleeve,
  // the pull-out and the grow to full screen play on their own clock (not the finger), so nothing can shake.
  // Scrolling back above the start plays it in reverse.
  // One continuous film: the moment the page pins the sleeve in the centre of the screen, the pull-out,
  // the grow to full screen and then the tour all play on their own. Scrolling back up above the pin reverses it.
  if(r.top<=1)autoDir=1;else if(r.top>H*0.04)autoDir=-1;
  if(CALM)autoA=autoDir>0?1:0;else autoA=clamp(autoA+autoDir*dt/AUTO_MS,0,1);
  const p=autoA>=1?Math.max(0.8,pT):0.8*autoA;if(Math.abs(p-lastP)>1e-5){layoutReveal(p);lastP=p;}
  const moving=p>0.5&&p<0.8||(autoA>0&&autoA<1);
  antFrame(r); // paper is growing: hold the canvas still
  if(moving){}else if(flight){let t=(now-flight.t0)/flight.dur;if(t>=1)t=1;cam=flight.it(ease(t));dirty=true;if(t===1){flight=null;onArrive(now);}}
  else if(playing&&now>holdUntil)go(pickNext());
  if(shine)dirty=true;
  if(dirty&&(!moving||lastP<0)){dirty=false;draw(now);}else if(dirty&&moving&&!drawnOnce){dirty=false;draw(now);}
  raf=requestAnimationFrame(frame);}
function resize(force){
  const w=stage.clientWidth,h=stage.clientHeight,d=Math.min(window.devicePixelRatio||1,2),k=w+'x'+h+'@'+d;
  if(k===sizeKey&&!force)return;sizeKey=k;W=w;H=h;DPR=d;
  cv.width=Math.round(W*DPR);cv.height=Math.round(H*DPR);drawnOnce=false;
  hudTop=topEl.offsetTop+topEl.offsetHeight;hudBot=H-botEl.offsetTop;
  navH=(document.getElementById('nav')||{}).offsetHeight||72;measureReveal();if(!flight)cam=viewOf(current);dirty=true;lastP=-1;}
const ICON_PAUSE='<svg viewBox="0 0 16 16" fill="currentColor"><rect x="3" y="2" width="3.5" height="12" rx="1"/><rect x="9.5" y="2" width="3.5" height="12" rx="1"/></svg>';
const ICON_PLAY='<svg viewBox="0 0 16 16" fill="currentColor"><path d="M4 2.5v11a.8.8 0 0 0 1.2.7l9-5.5a.8.8 0 0 0 0-1.4l-9-5.5A.8.8 0 0 0 4 2.5z"/></svg>';
function setPlaying(p){playing=p;playBtn.innerHTML=p?ICON_PAUSE:ICON_PLAY;playBtn.setAttribute('aria-label',p?'Pause the tour':'Play the tour');}
playBtn.addEventListener('click',()=>{setPlaying(!playing);if(playing)holdUntil=Math.min(holdUntil,performance.now()+500);});
let down=null;
cv.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY};});
cv.addEventListener('pointerup',e=>{if(!down||Math.hypot(e.clientX-down.x,e.clientY-down.y)>8||lastP<0.8){down=null;return;}down=null;
  const rc=cv.getBoundingClientRect(),wx=cam[0]+(e.clientX-rc.left-W/2)/S,wy=cam[1]+(e.clientY-rc.top-H/2)/S;
  let hit=null;for(let i=TILES.length-1;i>=0;i--){const t=TILES[i];if(wx>=t.x&&wx<=t.x+t.w&&wy>=t.y&&wy<=t.y+t.h){hit=t;break;}}
  extendedHold=true;if(hit&&!(current.kind==='tile'&&current.id===hit.id&&!flight))go({kind:'tile',id:hit.id});else go({kind:'overview'});});
addEventListener('resize',()=>resize(false),{passive:true});
layout();buildLacing();resize(true);setPlaying(false);
const io=new IntersectionObserver(es=>{es.forEach(e=>{
  if(e.target===reveal){active=e.isIntersecting;if(!active&&navOver){navOver=false;document.body.classList.remove('hwt-over');}if(active){stage.classList.add('is-in');resize(false);if(!raf)raf=requestAnimationFrame(frame);}}
  else if(e.isIntersecting){e.target.classList.add('is-in');io.unobserve(e.target);}});},{rootMargin:'40% 0px 40% 0px'});
io.observe(reveal);root.querySelectorAll('.hwt__fade').forEach(el=>io.observe(el));
if(document.fonts&&document.fonts.load){Promise.all(['400','500','600','700'].map(w=>document.fonts.load(w+' 20px Inter'))).then(()=>{layout();dirty=true;}).catch(()=>{});}
})();
