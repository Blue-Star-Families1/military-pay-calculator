const pptx = require('pptxgenjs');
const p = new pptx();
p.layout = 'LAYOUT_WIDE';           // 13.3 x 7.5
p.author = 'Blue Star Families';
p.title  = 'Military Take-Home Pay Estimator — User Guide';

const NAVY='1F3162', BLUE='0474BB', RED='B31F36', ICE='B9D6F0',
      WHITE='FFFFFF', INK='1F2A37', MUTE='5B6B7B', BG='EEF3F8', LINE='D3E0EE';
const H='Cambria', B='Calibri';
const URL='blue-star-families1.github.io/military-pay-calculator';

const W=13.3, HH=7.5, M=0.7;

// ---------- helpers (fresh objects each call) ----------
function star(s,x,y,size,color){
  s.addShape(p.ShapeType.star5,{x,y,w:size,h:size,fill:{color}});
}
function titleBar(s,kicker,title){
  s.addText(kicker,{x:M,y:0.42,w:W-2*M,h:0.28,fontFace:B,fontSize:12,bold:true,
    color:BLUE,charSpacing:1.2});
  // valign top so a two-line title grows downward instead of overlapping the kicker
  s.addText(title,{x:M,y:0.72,w:W-2*M,h:1.0,valign:'top',fontFace:H,fontSize:32,bold:true,color:NAVY,margin:0});
}
function numCircle(s,x,y,d,n,fill){
  s.addShape(p.ShapeType.ellipse,{x,y,w:d,h:d,fill:{color:fill}});
  s.addText(String(n),{x,y,w:d,h:d,align:'center',valign:'middle',
    fontFace:B,fontSize:14,bold:true,color:WHITE});
}
function card(s,x,y,w,h,fill){
  s.addShape(p.ShapeType.roundRect,{x,y,w,h,rectRadius:0.08,fill:{color:fill||WHITE},
    line:{color:LINE,width:1}});
}
function footer(s,n){
  s.addText(URL,{x:M,y:HH-0.5,w:6.5,h:0.3,fontFace:B,fontSize:9,color:MUTE});
  s.addText(String(n),{x:W-M-0.5,y:HH-0.5,w:0.5,h:0.3,align:'right',fontFace:B,fontSize:9,color:MUTE});
}
function bg(s){ s.background={color:BG}; }

/* ============ 1. TITLE ============ */
(()=>{ const s=p.addSlide(); s.background={color:NAVY};
  star(s,M,0.85,0.62,WHITE);
  s.addText('BLUE STAR FAMILIES',{x:M+0.8,y:0.95,w:6,h:0.4,fontFace:H,fontSize:17,bold:true,color:WHITE});
  s.addText('Military Take-Home\nPay Estimator',{x:M,y:2.0,w:8.4,h:1.9,fontFace:H,fontSize:46,bold:true,color:WHITE,lineSpacing:52});
  s.addText('What your paycheck actually looks like after taxes —\nand how it changes when you move.',
    {x:M,y:3.95,w:8.4,h:0.9,fontFace:B,fontSize:17,color:ICE,lineSpacing:26});
  s.addShape(p.ShapeType.roundRect,{x:M,y:5.15,w:2.5,h:0.46,rectRadius:0.23,fill:{color:RED}});
  s.addText('2026 RATES',{x:M,y:5.15,w:2.5,h:0.46,align:'center',valign:'middle',fontFace:B,fontSize:13,bold:true,color:WHITE});
  s.addText('Free  ·  Private  ·  No sign-in',{x:M+2.75,y:5.15,w:4,h:0.46,valign:'middle',fontFace:B,fontSize:13,color:ICE});
  card(s,9.5,2.0,3.1,3.6,'FFFFFF');
  s.addText('A guide for\nreviewers',{x:9.75,y:2.25,w:2.6,h:0.8,fontFace:H,fontSize:19,bold:true,color:NAVY,lineSpacing:24});
  s.addText([
    {text:'What it does',options:{bullet:true,breakLine:true}},
    {text:'What every setting means',options:{bullet:true,breakLine:true}},
    {text:'How to read results',options:{bullet:true,breakLine:true}},
    {text:'How accurate it is',options:{bullet:true,breakLine:true}},
    {text:'What we need from you',options:{bullet:true}}
  ],{x:9.75,y:3.15,w:2.6,h:2.2,fontFace:B,fontSize:12,color:INK,paraSpaceAfter:7});
  s.addText(URL,{x:M,y:6.5,w:9,h:0.3,fontFace:B,fontSize:12,color:ICE});
  s.addNotes('Open with the problem, not the tool. Most calculators show gross pay only.');
})();

/* ============ 2. WHY ============ */
(()=>{ const s=p.addSlide(); bg(s);
  titleBar(s,'THE PROBLEM','Signing leases without knowing the real pay');
  const items=[
    ['66%','of military families live off-base and rent on the local market.'],
    ['4+','things change at once when you PCS: housing allowance, state taxes, special pays, sometimes rank.'],
    ['0','common calculators show what actually lands in your bank account. They stop at gross pay.']
  ];
  let y=1.75;
  items.forEach(([n,t])=>{
    card(s,M,y,W-2*M,1.25);
    s.addText(n,{x:M+0.25,y:y+0.12,w:1.5,h:1.0,align:'center',valign:'middle',
      fontFace:H,fontSize:38,bold:true,color:RED});
    s.addText(t,{x:M+1.9,y:y+0.12,w:W-2*M-2.2,h:1.0,valign:'middle',fontFace:B,fontSize:15,color:INK});
    y+=1.45;
  });
  s.addText('This tool answers the question families are actually asking: "If we move there, what does our paycheck look like?"',
    {x:M,y:6.05,w:W-2*M,h:0.4,fontFace:B,fontSize:14,italic:true,color:NAVY});
  s.addText('Roughly two-thirds of active-duty families rely on the civilian housing market (Blue Star Families Military Family Lifestyle Survey; Bipartisan Policy Center).',
    {x:M,y:6.45,w:W-2*M,h:0.3,fontFace:B,fontSize:9.5,color:MUTE});
  footer(s,2);
})();

/* ============ 3. HOW IT WORKS ============ */
(()=>{ const s=p.addSlide(); bg(s);
  titleBar(s,'THE IDEA IN ONE PICTURE','It shows the whole paycheck, step by step');
  const steps=[
    ['1','You enter','Rank, years of service, duty station, home state, deductions',BLUE],
    ['2','It adds up','Basic pay + housing (BAH) + food (BAS) + special pays = gross',NAVY],
    ['3','It subtracts','Federal tax, Social Security, Medicare, state tax, TSP, SGLI',RED],
    ['4','You see','Take-home per month and per year — for two locations side by side',BLUE]
  ];
  let x=M;
  const cw=(W-2*M-0.45)/4;
  steps.forEach(([n,head,body,col])=>{
    card(s,x,1.8,cw,2.9);
    numCircle(s,x+0.3,2.05,0.55,n,col);
    s.addText(head,{x:x+0.25,y:2.75,w:cw-0.5,h:0.4,fontFace:H,fontSize:17,bold:true,color:NAVY});
    s.addText(body,{x:x+0.25,y:3.2,w:cw-0.5,h:1.3,fontFace:B,fontSize:12.5,color:INK});
    x+=cw+0.15;
  });
  card(s,M,4.95,W-2*M,1.05,'FFFFFF');
  s.addText('Nothing you type ever leaves your browser.',
    {x:M+0.3,y:5.05,w:6.5,h:0.4,fontFace:H,fontSize:16,bold:true,color:NAVY});
  s.addText('No account, no server, no tracking. Close the tab and it is gone.',
    {x:M+0.3,y:5.45,w:8,h:0.4,fontFace:B,fontSize:13,color:MUTE});
  footer(s,3);
})();

/* ============ 4. SECTION MAP ============ */
(()=>{ const s=p.addSlide(); bg(s);
  titleBar(s,'THE SCREEN','Four sections, top to bottom');
  const rows=[
    ['1','Service member profile','Who you are: rank, years in, filing status, dependents, TSP, SGLI. Set once — applies to both locations.'],
    ['2','Special & incentive pays','Twelve optional pays: sea, flight, jump, dive, hazard, family separation and more.'],
    ['3','Compare two duty stations','The heart of it. Pick two locations and see them side by side.'],
    ['4','Estimated pay','The full breakdown, the difference between locations, print and share buttons.']
  ];
  let y=1.8;
  rows.forEach(([n,head,body])=>{
    card(s,M,y,W-2*M,1.1);
    numCircle(s,M+0.28,y+0.28,0.55,n,NAVY);
    s.addText(head,{x:M+1.05,y:y+0.16,w:3.6,h:0.4,fontFace:H,fontSize:16,bold:true,color:NAVY});
    s.addText(body,{x:M+4.75,y:y+0.16,w:W-2*M-5.0,h:0.8,valign:'middle',fontFace:B,fontSize:12.5,color:INK});
    y+=1.18;
  });
  s.addText('Results update instantly as you type — there is no "calculate" button to press.',
    {x:M,y:6.6,w:W-2*M,h:0.4,fontFace:B,fontSize:13,italic:true,color:NAVY});
  footer(s,4);
})();

/* ============ 5. PROFILE SETTINGS ============ */
(()=>{ const s=p.addSlide(); bg(s);
  titleBar(s,'SECTION 1 · SERVICE MEMBER PROFILE','What each setting does');
  const L=[
    ['Pay grade / rank','All grades E-1 to O-10, including prior-enlisted officers (O-1E/2E/3E) and the lower first-4-months E-1 rate.'],
    ['Years of service','Pay jumps at set milestones (2, 3, 4, 6, 8 years...), not gradually.'],
    ['Federal filing status','Single, married filing jointly, or head of household. Changes the tax brackets used.'],
    ['Dependents','Switches the entire housing allowance table. With-dependents rates are notably higher.']
  ];
  const R=[
    ['TSP contribution','Your retirement savings percentage. Comes out of your paycheck.'],
    ['TSP type','Traditional lowers your taxable income. Roth does not. Same deduction, different tax result.'],
    ['SGLI','Life insurance premium, from $500,000 coverage down to declined.'],
    ['Other deductions','Anything else recurring — allotments, dental, AFRH.'],
    ['Combat zone','Removes federal income tax. Social Security and Medicare are still taken out.']
  ];
  // scope line sits above the cards so nothing gets squeezed
  card(s,M,1.42,W-2*M,0.62,'FFFFFF');
  s.addText('Who it is for:',{x:M+0.28,y:1.42,w:1.45,h:0.62,valign:'middle',fontFace:B,fontSize:12.5,bold:true,color:NAVY,margin:0});
  s.addText('Active duty, plus Guard and Reserve mobilised on Title 10 orders — not weekend drill or annual training pay.',
    {x:M+1.7,y:1.42,w:10.0,h:0.62,valign:'middle',fontFace:B,fontSize:12.5,color:INK,margin:0});
  function col(list,x,w){
    let y=2.32;
    list.forEach(([h,t])=>{
      s.addText(h,{x,y,w,h:0.28,fontFace:H,fontSize:14,bold:true,color:NAVY,margin:0});
      s.addText(t,{x,y:y+0.28,w,h:0.56,fontFace:B,fontSize:11.5,color:INK,margin:0});
      y+=0.85;
    });
  }
  card(s,M,2.18,5.85,4.55);
  card(s,M+6.15,2.18,5.85,4.55);
  col(L,M+0.3,5.25); col(R,M+6.45,5.25);
  footer(s,5);
})();

/* ============ 6. SPECIAL PAYS ============ */
(()=>{ const s=p.addSlide(); bg(s);
  titleBar(s,'SECTION 2 · SPECIAL & INCENTIVE PAYS','Tick what applies — amounts are editable');
  const pays=[['Career sea pay','$805'],['Aviation / flight (ACIP)','$1,000'],
    ['Hostile fire / imminent danger','$225'],['Hazardous duty','$150'],
    ['Parachute (jump)','$150'],['HALO parachute','$225'],['Diving duty','$340'],
    ['Submarine duty','$175'],['Hardship duty','$150'],['Special duty (SDAP)','$450'],
    ['Family separation (FSA)','$250'],['Other (you name it)','—']];
  let x=M,y=1.72,i=0;
  const cw=(W-2*M-0.4)/3;
  pays.forEach(([n,amt])=>{
    const cx=M+(i%3)*(cw+0.2), cy=1.72+Math.floor(i/3)*0.82;
    card(s,cx,cy,cw,0.68);
    s.addText(n,{x:cx+0.18,y:cy+0.06,w:cw-1.1,h:0.56,valign:'middle',fontFace:B,fontSize:11.5,color:INK,margin:0});
    s.addText(amt,{x:cx+cw-1.0,y:cy+0.06,w:0.85,h:0.56,align:'right',valign:'middle',
      fontFace:B,fontSize:12,bold:true,color:BLUE,margin:0});
    i++;
  });
  card(s,M,5.2,W-2*M,1.0,'FFFFFF');
  s.addShape(p.ShapeType.ellipse,{x:M+0.25,y:5.42,w:0.55,h:0.55,fill:{color:RED}});
  s.addText('!',{x:M+0.25,y:5.42,w:0.55,h:0.55,align:'center',valign:'middle',fontFace:B,fontSize:20,bold:true,color:WHITE});
  s.addText('Family Separation Allowance is the only one that is NOT taxed.',
    {x:M+1.0,y:5.32,w:9.5,h:0.35,fontFace:H,fontSize:15,bold:true,color:NAVY,margin:0});
  s.addText('The tool handles that correctly — it raises your gross pay without raising your tax.',
    {x:M+1.0,y:5.68,w:10,h:0.35,fontFace:B,fontSize:12.5,color:MUTE,margin:0});
  footer(s,6);
})();

/* ============ 7. COMPARE STATIONS ============ */
(()=>{ const s=p.addSlide(); bg(s);
  titleBar(s,'SECTION 3 · COMPARE TWO DUTY STATIONS','The main event');
  const f=[
    ['Label','Name it "Fort Bragg" so the results read plainly instead of "Scenario A".'],
    ['Duty station or ZIP','Pick a station, or switch to ZIP if you live away from your duty station.'],
    ['Monthly BAH','Filled in for you — but you can type over it if you know your exact figure.'],
    ['State of legal residence','Where you pay state tax. Usually NOT the state you are stationed in.']
  ];
  let y=1.72;
  f.forEach(([h,t])=>{
    card(s,M,y,7.4,0.95);
    s.addText(h,{x:M+0.25,y:y+0.1,w:2.6,h:0.75,valign:'middle',fontFace:H,fontSize:14,bold:true,color:NAVY,margin:0});
    s.addText(t,{x:M+2.95,y:y+0.1,w:4.3,h:0.75,valign:'middle',fontFace:B,fontSize:11.5,color:INK,margin:0});
    y+=1.05;
  });
  card(s,M+7.7,1.72,W-M-(M+7.7),4.2,'FFFFFF');
  s.addText('Three kinds of state',{x:M+7.95,y:1.9,w:4.3,h:0.35,fontFace:H,fontSize:16,bold:true,color:NAVY});
  const st=[['No income tax','TX, FL, WA and 6 more. Nothing owed.',BLUE],
            ['Exempts military pay','AZ, KY, MI, MN and 9 more. Ticked for you.',BLUE],
            ['Conditional','CA, NY, OH, PA and 5 more. Tax-free ONLY if you are stationed outside that state.',RED]];
  let sy=2.35;
  st.forEach(([h,t,c])=>{
    s.addShape(p.ShapeType.ellipse,{x:M+7.95,y:sy+0.04,w:0.22,h:0.22,fill:{color:c}});
    s.addText(h,{x:M+8.3,y:sy-0.02,w:3.9,h:0.3,fontFace:B,fontSize:12.5,bold:true,color:NAVY,margin:0});
    s.addText(t,{x:M+8.3,y:sy+0.26,w:3.9,h:0.75,fontFace:B,fontSize:11,color:MUTE,margin:0});
    sy+=1.15;
  });
  s.addText('Tip: your legal residence usually does not change just because you PCS (SCRA / MSRRA).',
    {x:M,y:6.1,w:W-2*M,h:0.4,fontFace:B,fontSize:13,italic:true,color:NAVY});
  footer(s,7);
})();

/* ============ 8. READING RESULTS ============ */
(()=>{ const s=p.addSlide(); bg(s);
  titleBar(s,'SECTION 4 · READING THE RESULTS','It shows the whole math, not just a total');
  card(s,M,1.7,6.0,4.35);
  s.addText('Each location card',{x:M+0.3,y:1.85,w:5.4,h:0.35,fontFace:H,fontSize:16,bold:true,color:NAVY});
  const lines=[['Basic pay','+'],['Housing allowance (BAH)','+'],['Food allowance (BAS)','+'],
    ['Special pays','+'],['GROSS PAY','='],['Federal income tax','−'],['Social Security 6.2%','−'],
    ['Medicare 1.45%','−'],['State tax','−'],['TSP, SGLI, other','−'],['TAKE-HOME','=']];
  let ly=2.3;
  lines.forEach(([t,sym])=>{
    const strong = sym==='=';
    s.addText(sym,{x:M+0.32,y:ly,w:0.3,h:0.28,fontFace:B,fontSize:12,bold:true,
      color:strong?NAVY:(sym==='−'?RED:BLUE),margin:0});
    s.addText(t,{x:M+0.68,y:ly,w:5.0,h:0.28,fontFace:B,fontSize:strong?12.5:12,
      bold:strong,color:strong?NAVY:INK,margin:0});
    ly+=0.32;
  });
  card(s,M+6.3,1.7,W-M-(M+6.3),2.0,'FFFFFF');
  s.addText('The difference banner',{x:M+6.55,y:1.85,w:5,h:0.35,fontFace:H,fontSize:16,bold:true,color:NAVY});
  s.addText('+$750 / mo',{x:M+6.55,y:2.25,w:5,h:0.6,fontFace:H,fontSize:32,bold:true,color:BLUE});
  s.addText('+$9,000 per year — the headline number for a move.',
    {x:M+6.55,y:2.9,w:5.2,h:0.6,fontFace:B,fontSize:12.5,color:MUTE});
  card(s,M+6.3,3.9,W-M-(M+6.3),2.15,'FFFFFF');
  s.addText('Two extra readouts',{x:M+6.55,y:4.05,w:5,h:0.35,fontFace:H,fontSize:16,bold:true,color:NAVY});
  s.addText([
    {text:'Effective tax rate — what share of gross goes to taxes.',options:{bullet:true,breakLine:true}},
    {text:'Take-home % of gross — what you actually keep.',options:{bullet:true}}
  ],{x:M+6.55,y:4.45,w:5.2,h:1.4,fontFace:B,fontSize:12,color:INK,paraSpaceAfter:8});
  s.addText('Buttons: Print / Save as PDF  ·  Copy shareable link (the link remembers every setting).',
    {x:M,y:6.25,w:W-2*M,h:0.4,fontFace:B,fontSize:13,italic:true,color:NAVY});
  footer(s,8);
})();

/* ============ 9. WORKED EXAMPLE ============ */
(()=>{ const s=p.addSlide(); bg(s);
  titleBar(s,'A REAL EXAMPLE  ·  E-5, 10 YEARS, TEXAS LEGAL RESIDENCE','With family: Fort Bragg → JBLM');
  const A=['Fort Bragg, NC','$4,395','$1,806','$477','$6,678','$5,942'];
  const Bv=['JBLM / Tacoma, WA','$4,395','$2,556','$477','$7,428','$6,692'];
  const rows=['Location','Basic pay','Housing (BAH)','Food (BAS)','Gross pay','Take-home'];
  card(s,M,1.7,W-2*M,3.5);
  const c0=M+0.3, c1=M+4.6, c2=M+8.3;
  s.addText('',{x:0,y:0,w:0.1,h:0.1});
  rows.forEach((label,i)=>{
    const yy=1.95+i*0.53;
    const last = i===rows.length-1;
    s.addText(label,{x:c0,y:yy,w:4.0,h:0.4,valign:'middle',fontFace:B,fontSize:13,
      bold:last||i===0,color:last?NAVY:INK,margin:0});
    s.addText(A[i],{x:c1,y:yy,w:3.4,h:0.4,valign:'middle',align:'right',fontFace:B,
      fontSize:last?16:13,bold:last||i===0,color:last?NAVY:INK,margin:0});
    s.addText(Bv[i],{x:c2,y:yy,w:3.4,h:0.4,valign:'middle',align:'right',fontFace:B,
      fontSize:last?16:13,bold:last||i===0,color:last?BLUE:INK,margin:0});
  });
  card(s,M,5.4,W-2*M,1.15,'FFFFFF');
  s.addText('+$750 / month',{x:M+0.35,y:5.55,w:3.4,h:0.5,valign:'middle',fontFace:H,fontSize:26,bold:true,color:BLUE});
  s.addText('= +$9,000 a year. Same rank, same job, same family — only the city changed.',
    {x:M+4.0,y:5.55,w:7.6,h:0.5,valign:'middle',fontFace:B,fontSize:14,color:INK});
  footer(s,9);
  s.addNotes('This is the slide to linger on. It makes the value obvious in one line.');
})();

/* ============ 10. ACCURACY ============ */
(()=>{ const s=p.addSlide(); bg(s);
  titleBar(s,'HOW ACCURATE IS IT?','What is exact, what is estimated, what is missing');
  const cols=[
    ['Dollar-accurate',BLUE,['Basic pay (DFAS tables)','Housing allowance (official DoD rates)','Food allowance','Social Security & Medicare']],
    ['Close estimate',NAVY,['Federal income tax','State income tax','','Modelled as yearly tax ÷ 12 — not your exact paycheck withholding.']],
    ['Not included',RED,['Weekend drill / annual training pay','Spouse income','Child tax credits','Itemised deductions','Local city taxes (except Maryland)','Overseas (OHA) locations']]
  ];
  let x=M; const cw=(W-2*M-0.5)/3;
  cols.forEach(([h,c,items])=>{
    card(s,x,1.72,cw,3.6);
    s.addShape(p.ShapeType.roundRect,{x:x+0.25,y:1.95,w:cw-0.5,h:0.45,rectRadius:0.1,fill:{color:c}});
    s.addText(h,{x:x+0.25,y:1.95,w:cw-0.5,h:0.45,align:'center',valign:'middle',fontFace:B,fontSize:13.5,bold:true,color:WHITE});
    const txt=items.filter(Boolean).map((t,i,arr)=>({text:t,options:{bullet:t.indexOf('Modelled')<0,breakLine:i<arr.length-1,
      italic:t.indexOf('Modelled')>=0, fontSize:t.indexOf('Modelled')>=0?10.5:12,
      color:t.indexOf('Modelled')>=0?MUTE:INK}}));
    s.addText(txt,{x:x+0.3,y:2.5,w:cw-0.6,h:2.6,valign:'top',fontFace:B,fontSize:12,color:INK,paraSpaceAfter:7});
    x+=cw+0.25;
  });
  card(s,M,5.5,W-2*M,1.05,'FFFFFF');
  s.addText('The comparison between two places is more reliable than either single number —',
    {x:M+0.3,y:5.6,w:11.6,h:0.35,fontFace:H,fontSize:14.5,bold:true,color:NAVY,margin:0});
  s.addText('most sources of error apply to both sides equally, so they cancel out in the difference.',
    {x:M+0.3,y:5.95,w:11.6,h:0.35,fontFace:B,fontSize:13,color:MUTE,margin:0});
  footer(s,10);
})();

/* ============ 11. DATA SOURCES ============ */
(()=>{ const s=p.addSlide(); bg(s);
  titleBar(s,'WHERE THE NUMBERS COME FROM','Every figure traces to an official source');
  const src=[
    ['Basic pay','Defense Finance and Accounting Service (DFAS) 2026 tables'],
    ['Housing allowance (BAH)','Defense Travel Management Office — all areas, ranks, and the ZIP map'],
    ['Food allowance (BAS)','DFAS — matches DoD published figures exactly'],
    ['Federal tax','IRS 2026 brackets and standard deduction'],
    ['Social Security / Medicare','Statutory rates and wage caps'],
    ['State tax','Published 2026 state schedules, all 50 states plus DC']
  ];
  let y=1.72;
  src.forEach(([a,b])=>{
    card(s,M,y,W-2*M,0.66);
    s.addShape(p.ShapeType.ellipse,{x:M+0.28,y:y+0.19,w:0.28,h:0.28,fill:{color:BLUE}});
    s.addText(a,{x:M+0.75,y:y+0.05,w:3.6,h:0.56,valign:'middle',fontFace:B,fontSize:12.5,bold:true,color:NAVY,margin:0});
    s.addText(b,{x:M+4.5,y:y+0.05,w:W-2*M-4.8,h:0.56,valign:'middle',fontFace:B,fontSize:12,color:INK,margin:0});
    y+=0.76;
  });
  card(s,M,6.3,W-2*M,0.75,'FFFFFF');
  s.addText('Worth knowing: one widely-used public calculator is still showing 2023 food-allowance rates as if current.',
    {x:M+0.3,y:6.4,w:11.6,h:0.55,valign:'middle',fontFace:B,fontSize:12.5,italic:true,color:NAVY,margin:0});
  footer(s,11);
})();

/* ============ 12. TROUBLESHOOTING ============ */
(()=>{ const s=p.addSlide(); bg(s);
  titleBar(s,'IF SOMETHING LOOKS WRONG','Two things to check first');
  card(s,M,1.75,6.0,2.5);
  s.addShape(p.ShapeType.ellipse,{x:M+0.3,y:1.98,w:0.6,h:0.6,fill:{color:RED}});
  s.addText('1',{x:M+0.3,y:1.98,w:0.6,h:0.6,align:'center',valign:'middle',fontFace:B,fontSize:17,bold:true,color:WHITE});
  s.addText('"The page will not load"',{x:M+1.1,y:2.02,w:4.6,h:0.4,fontFace:H,fontSize:16,bold:true,color:NAVY});
  s.addText('Some antivirus software (Avast, AVG) blocks brand-new websites until they build a reputation. This is a false alarm, not a broken site.\n\nTry: mobile data instead of Wi-Fi, a different browser, or another computer.',
    {x:M+1.1,y:2.5,w:4.6,h:1.6,fontFace:B,fontSize:11.5,color:INK,margin:0});
  card(s,M+6.3,1.75,W-M-(M+6.3),2.5);
  s.addShape(p.ShapeType.ellipse,{x:M+6.6,y:1.98,w:0.6,h:0.6,fill:{color:BLUE}});
  s.addText('2',{x:M+6.6,y:1.98,w:0.6,h:0.6,align:'center',valign:'middle',fontFace:B,fontSize:17,bold:true,color:WHITE});
  s.addText('"A number looks wrong"',{x:M+7.4,y:2.02,w:4.4,h:0.4,fontFace:H,fontSize:16,bold:true,color:NAVY});
  s.addText('Check these first:\n\n• Is the state of legal residence right?\n• Is the dependents setting right?\n• Is the TSP percentage yours?\n• Did a housing figure get typed over?',
    {x:M+7.4,y:2.5,w:4.4,h:1.6,fontFace:B,fontSize:11.5,color:INK,margin:0});
  card(s,M,4.5,W-2*M,2.05,'FFFFFF');
  s.addText('Still looks off? Tell us — that is exactly what we need.',
    {x:M+0.35,y:4.65,w:11.5,h:0.4,fontFace:H,fontSize:17,bold:true,color:NAVY});
  s.addText('Use the "Share your feedback" button at the bottom of the page. It asks two questions — whether the estimate matched your actual pay, and what would make it better — plus your name and email so we can follow up.',
    {x:M+0.35,y:5.1,w:11.5,h:0.75,fontFace:B,fontSize:13,color:INK,margin:0});
  s.addText('Your name and email are never shown publicly. Please do not include account numbers or other sensitive details.',
    {x:M+0.35,y:5.9,w:11.5,h:0.35,fontFace:B,fontSize:12,italic:true,color:RED,margin:0});
  footer(s,12);
})();

/* ============ 13. WHAT WE NEED ============ */
(()=>{ const s=p.addSlide(); s.background={color:NAVY};
  s.addText('WHAT WE NEED FROM YOU',{x:M,y:0.75,w:11,h:0.35,fontFace:B,fontSize:12,bold:true,color:ICE,charSpacing:1.2});
  s.addText('One task, and it matters more than everything else',
    {x:M,y:1.1,w:11.5,h:0.7,fontFace:H,fontSize:31,bold:true,color:WHITE});
  card(s,M,2.15,W-2*M,1.6,'FFFFFF');
  star(s,M+0.35,2.55,0.7,RED);
  s.addText('Open your most recent LES and compare it, line by line.',
    {x:M+1.3,y:2.4,w:10.3,h:0.45,fontFace:H,fontSize:19,bold:true,color:NAVY});
  s.addText('Tell us any line that differs by more than a couple hundred dollars a month. That is the one test we cannot run ourselves.',
    {x:M+1.3,y:2.9,w:10.3,h:0.7,fontFace:B,fontSize:13.5,color:INK,margin:0});
  const asks=[['Does it load for you?','On your phone and your work computer.'],
              ['Is anything confusing?','A label, a setting, a number with no explanation.'],
              ['Would you send this to a friend who is PCSing?','If not, what is missing?']];
  let y=4.05;
  asks.forEach(([h,t],i)=>{
    s.addShape(p.ShapeType.ellipse,{x:M,y:y+0.02,w:0.4,h:0.4,fill:{color:BLUE}});
    s.addText(String(i+1),{x:M,y:y+0.02,w:0.4,h:0.4,align:'center',valign:'middle',fontFace:B,fontSize:13,bold:true,color:WHITE});
    s.addText(h,{x:M+0.6,y:y,w:6.0,h:0.35,fontFace:B,fontSize:14,bold:true,color:WHITE,margin:0});
    s.addText(t,{x:M+6.8,y:y,w:5.0,h:0.4,fontFace:B,fontSize:12.5,color:ICE,margin:0});
    y+=0.72;
  });
  s.addText(URL,{x:M,y:6.6,w:9,h:0.35,fontFace:B,fontSize:14,bold:true,color:ICE});
  s.addText('13',{x:W-M-0.5,y:6.6,w:0.5,h:0.35,align:'right',fontFace:B,fontSize:9,color:BLUE});
})();

/* ============ 14. QUICK REFERENCE ============ */
(()=>{ const s=p.addSlide(); bg(s);
  titleBar(s,'QUICK REFERENCE','Keep this slide handy');
  const qr=[
    ['Where is it?',URL],
    ['Do I need an account?','No. No sign-in, no app to install.'],
    ['Does it work on a phone?','Yes — any modern browser.'],
    ['Is my data stored?','No. Pay details stay in your browser; the feedback form is separate.'],
    ['What year are the rates?','2026, effective 1 January 2026.'],
    ['Can I save a scenario?','Yes — "Copy shareable link" saves every setting in the link.'],
    ['Can I print it?','Yes — "Print / Save as PDF".'],
    ['Who do I tell if it is wrong?','"Share your feedback" button at the bottom of the page.']
  ];
  let y=1.7;
  qr.forEach(([q,a])=>{
    card(s,M,y,W-2*M,0.58);
    s.addText(q,{x:M+0.28,y:y+0.04,w:4.0,h:0.5,valign:'middle',fontFace:B,fontSize:12.5,bold:true,color:NAVY,margin:0});
    s.addText(a,{x:M+4.4,y:y+0.04,w:W-2*M-4.7,h:0.5,valign:'middle',fontFace:B,fontSize:12.5,color:INK,margin:0});
    y+=0.61;
  });
  s.addText('A Blue Star Families tool. Independent estimate for planning; not affiliated with or endorsed by the U.S. Department of Defense or DFAS.',
    {x:M,y:6.68,w:W-2*M,h:0.32,fontFace:B,fontSize:10,color:MUTE});
  footer(s,14);
})();

p.writeFile({fileName:'Military-Pay-Estimator-Guide.pptx'}).then(f=>console.log('WROTE',f));
