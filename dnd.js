"use strict";
/* D&D 5e character sheet (2024 rules, SRD 5.2.1). Loaded after the main script and shares its helpers
   (L, T, esc, md, fText, stepper, cur, touch, render, log, A, ui, S …). Data arrives lazily from data/dnd-data.js. */
let DND=null;
const dnd={loading:{}};
const D_AB=[{id:'str',hu:'Erő',en:'Strength'},{id:'dex',hu:'Ügyesség',en:'Dexterity'},{id:'con',hu:'Állóképesség',en:'Constitution'},{id:'int',hu:'Intelligencia',en:'Intelligence'},{id:'wis',hu:'Bölcsesség',en:'Wisdom'},{id:'cha',hu:'Karizma',en:'Charisma'}];
const D_ABM=Object.fromEntries(D_AB.map(a=>[a.id,a]));
const D_HU={Barbarian:'Barbár',Bard:'Bárd',Cleric:'Pap',Druid:'Druida',Fighter:'Harcos',Monk:'Szerzetes',Paladin:'Paplovag',Ranger:'Vadonjáró',Rogue:'Zsivány',Sorcerer:'Mágus',Warlock:'Boszorkánymester',Wizard:'Varázsló',
 Dragonborn:'Sárkányszülött',Dwarf:'Törpe',Elf:'Elf',Gnome:'Gnóm',Goliath:'Góliát',Halfling:'Félszerzet',Human:'Ember',Orc:'Ork',Tiefling:'Tiefling',Acolyte:'Akolitus',Criminal:'Bűnöző',Sage:'Bölcs',Soldier:'Katona',
 Acrobatics:'Akrobatika','Animal Handling':'Állatokkal bánás',Arcana:'Misztikum',Athletics:'Atlétika',Deception:'Megtévesztés',History:'Történelem',Insight:'Emberismeret',Intimidation:'Megfélemlítés',Investigation:'Nyomozás',Medicine:'Orvoslás',Nature:'Természetismeret',Perception:'Észlelés',Performance:'Előadás',Persuasion:'Meggyőzés',Religion:'Vallásismeret','Sleight of Hand':'Ujjügyesség',Stealth:'Lopakodás',Survival:'Túlélés',
 Blinded:'Megvakult',Charmed:'Elbűvölt',Deafened:'Megsüketült',Exhaustion:'Kimerültség',Frightened:'Megrémült',Grappled:'Megragadott',Incapacitated:'Cselekvőképtelen',Invisible:'Láthatatlan',Paralyzed:'Bénult',Petrified:'Megkövült',Poisoned:'Mérgezett',Prone:'Földön fekvő',Restrained:'Lefogott',Stunned:'Kábult',Unconscious:'Eszméletlen'};
const D_COL={barbarian:['#9c3a2e','#5a4636'],bard:['#8a3f8f','#b0457f'],cleric:['#8d680c','#5f6b7a'],druid:['#2c754b','#6b5a2a'],fighter:['#6b3b2a','#4a5568'],monk:['#2f6f8f','#2c754b'],paladin:['#a8873a','#2c5c9c'],ranger:['#2f6b3f','#5a4a2f'],rogue:['#33384d','#5b4a6f'],sorcerer:['#a5313b','#6a4ba3'],warlock:['#4a2f6f','#2b2d55'],wizard:['#2c5c9c','#6a4ba3']};
const dT=n=>D_HU[n]?T(D_HU[n],esc(n)):esc(n);
const dP=n=>(lang==='hu'&&D_HU[n])||n;
const dOpt=n=>lang==='hu'&&D_HU[n]?`${D_HU[n]} (${n})`:n;
const dMod=s=>Math.floor((s-10)/2);
const PB_COST={8:0,9:1,10:2,11:3,12:4,13:5,14:7,15:9};
const D_TABS=[['sheet',b('Karakterlap','Sheet')],['play',b('Játék','Play')],['spells',b('Varázslatok','Spells')],['gear',b('Felszerelés','Gear')],['level',b('Fejlődés','Progress')],['journal',b('Napló','Journal')],['notes',b('Jegyzetek','Notes')],['rules',b('Szabályok','Rules')]];

function dInit(){const s=window.DND_SRD;if(!s||DND)return;const by=a=>Object.fromEntries(a.map(x=>[x.id,x]));
 DND=Object.assign({},s,{cls:by(s.classes),sp:by(s.species),bg:by(s.backgrounds),ft:by(s.feats),sk:by(s.skills),spl:by(s.spells),wp:by(s.weapons),ar:by(s.armor)})}
/** true when the lazily loaded file is there; otherwise starts loading it and re-renders when it arrives */
function dNeed(kind){const have=kind==='data'?window.DND_SRD:window.DND_RULES;if(have){if(kind==='data')dInit();return true}
 if(!dnd.loading[kind])dnd.loading[kind]=loadScript('data/dnd-'+kind+'.js').then(()=>{if(kind==='data')dInit();dnd.loading[kind]='ok';render()},()=>{dnd.loading[kind]='err';render()});return false}
const dLoading=kind=>`<div class="panel">${dnd.loading[kind]==='err'?`<p class="note d">${L('A D&D-adatok betöltése nem sikerült. Ellenőrizd az internetkapcsolatot, és töltsd újra az oldalt.','Could not load the D&D data. Check your connection and reload.')}</p>`:`<p class="muted">${L('D&D-adatok betöltése…','Loading D&D data…')}</p>`}</div>`;

function dNewChar(){const t=Date.now();return {id:'c-'+uid6(),game:'dnd',createdAt:t,updatedAt:t,creating:0,name:'',pronouns:'',classId:'fighter',level:1,speciesId:'human',lineageId:'',bgId:'soldier',alignment:'',
 abil:{str:15,dex:14,con:13,int:12,wis:10,cha:8},bgBonus:{},asi:[],skills:{},hp:null,temp:0,hdUsed:0,ds:{s:0,f:0},armorId:'',shield:false,weapons:[],spells:[],slotsUsed:[0,0,0,0,0,0,0,0,0],
 items:[],coins:{cp:0,sp:0,ep:0,gp:0,pp:0},conds:[],exhaustion:0,insp:false,counters:[],mods:{ac:0,hp:0,init:0,speed:0},profNotes:'',
 desc:'',background:'',connections:'',notes:[{id:uid6(),title:L('Általános','General'),body:''}],sessions:[],activeSession:null,rolls:[]}}
function dNormalize(c){const d=dNewChar();for(const k in d)if(c[k]==null&&k!=='hp'&&k!=='creating'&&k!=='id')c[k]=d[k];if(c.creating===undefined)c.creating=null;return c}

/* ---------- derived numbers ---------- */
function dDerive(c){if(!DND)return null;const cls=DND.cls[c.classId]||DND.classes[0],lvl=clamp(+c.level||1,1,20),pb=2+Math.floor((lvl-1)/4),sp=DND.sp[c.speciesId]||DND.species[0],bg=DND.bg[c.bgId]||DND.backgrounds[0];
 const lin=sp.sub.find(x=>x.id===c.lineageId)||null,row=cls.levels[lvl-1],cs=row.cs||{};
 const sum=arr=>({v:arr.reduce((q,p)=>q+p[1],0),why:arr.filter(p=>p[1]).map(p=>`${p[0]} ${sgn(p[1])}`).join(' · ')});
 const asi=c.asi.filter(x=>x.level<=lvl),hasFeat=id=>bg.featId===id||asi.some(x=>x.feat===id)||(c.fstyle===id);
 const sc={},mod={};for(const a of D_AB){let v=(+c.abil[a.id]||0)+(+c.bgBonus[a.id]||0);for(const x of asi)v+=(x.a&&+x.a[a.id])||0;sc[a.id]=Math.min(v,30);mod[a.id]=dMod(sc[a.id])}
 const save={};for(const a of D_AB)save[a.id]=mod[a.id]+(cls.saves.includes(a.id)?pb:0);
 const skill={};for(const k of DND.skills){const p=dProf(c,bg,k.id);skill[k.id]=mod[k.abil]+(p?pb*p:c.classId==='bard'&&lvl>=2?Math.floor(pb/2):0)}
 const armor=DND.ar[c.armorId]||null,heavy=armor&&armor.cat==='heavy',unarm=L('páncél nélkül','unarmored');
 const hpMax=sum([[dP(cls.name),cls.hd+(lvl-1)*(cls.hd/2+1)],[dP('Constitution')||'CON',mod.con*lvl],['Dwarven Toughness',c.speciesId==='dwarf'?lvl:0],['Draconic Resilience',c.classId==='sorcerer'&&lvl>=3?lvl:0],[L('egyéni','manual'),+c.mods.hp||0]]);hpMax.v=Math.max(1,hpMax.v);
 let acP;const dx=[L('Ügy.','Dex'),mod.dex];
 if(armor)acP=[[armor.name,armor.base],[dx[0],armor.dex?(armor.max!=null?Math.min(mod.dex,armor.max):mod.dex):0]];
 else if(c.classId==='barbarian')acP=[[unarm,10],dx,[L('Áll.','Con'),mod.con]];
 else if(c.classId==='monk'&&!c.shield)acP=[[unarm,10],dx,[L('Bölcs.','Wis'),mod.wis]];
 else if(c.classId==='sorcerer'&&lvl>=3)acP=[['Draconic Resilience',10],dx,[L('Kar.','Cha'),mod.cha]];
 else acP=[[unarm,10],dx];
 acP.push([L('pajzs','shield'),c.shield?2:0],['Defense',armor&&hasFeat('defense')?1:0],[L('egyéni','manual'),+c.mods.ac||0]);
 const ac=sum(acP),init=sum([[L('Ügy.','Dex'),mod.dex],['Alert',hasFeat('alert')?pb:0],[L('egyéni','manual'),+c.mods.init||0]]);
 const speed=sum([[dP(sp.name),sp.speed],['Wood Elf',/wood-elf/.test(c.lineageId)?5:0],['Fast Movement',c.classId==='barbarian'&&lvl>=5&&!heavy?10:0],['Unarmored Movement',c.classId==='monk'&&!armor&&!c.shield?(cs.unarmored_movement_bonus||0):0],[L('kimerültség','exhaustion'),-5*(+c.exhaustion||0)],[L('egyéni','manual'),+c.mods.speed||0]]);
 const feats=[];cls.levels.slice(0,lvl).forEach((x,i)=>x.f.forEach(f=>feats.push({n:f.n,d:f.d,l:i+1})));
 const subF=cls.sub&&lvl>=3?cls.sub.features.filter(f=>f.level<=lvl):[];
 const asiLv=[];cls.levels.forEach((x,i)=>{if(i<lvl&&x.f.some(f=>f.n==='Ability Score Improvement'||f.n==='Epic Boon'))asiLv.push(i+1)});
 const spell=cls.spell&&row.sc?{ab:cls.spell,dc:8+pb+mod[cls.spell],atk:pb+mod[cls.spell],slots:row.sc.s,cantrips:row.sc.c,prepared:row.sc.p,maxLvl:row.sc.s.reduce((m,n,i)=>n?i+1:m,0)}:null;
 const hp=c.hp==null?hpMax.v:clamp(+c.hp,0,hpMax.v);
 return {game:'dnd',cls,lvl,pb,sp,lin,bg,cs,sc,mod,save,skill,armor,hpMax,hp,ac,init,speed,feats,subF,asiLv,spell,hasFeat,pp:10+skill.perception,d20pen:-2*(+c.exhaustion||0)}}
function dWeapon(c,d,w){const fin=w.props.includes('Finesse')||(c.classId==='monk'&&!w.props.includes('Heavy')&&!w.ranged);const ab=w.ranged?'dex':fin?(d.mod.dex>d.mod.str?'dex':'str'):'str';
 const pr=d.cls.profs.join(' ').toLowerCase(),prof=w.martial?/martial weapons/.test(pr)||pr.includes(w.name.toLowerCase()):/simple weapons|martial weapons/.test(pr);
 return {ab,prof,hit:d.mod[ab]+(prof?d.pb:0)+(w.ranged&&d.hasFeat('archery')?2:0),dmg:d.mod[ab]}}
// background skills are always at least proficient
const dProf=(c,bg,id)=>Math.max(+c.skills[id]||0,bg&&bg.skills.includes(id)?1:0);
const dDice=(dice,m)=>dice+(m?sgn(m).replace('−','-'):'');

/* ---------- small builders ---------- */
const dFeat=(src,n,d)=>`<details class="dfeat"><summary><b>${esc(n)}</b> <span class="small muted" style="font-family:var(--body);font-weight:400">${src}</span></summary><div class="ctext">${md(d)}</div></details>`;
const dSel=(id,chg,opts,val,extra)=>`<select id="${id}" data-chg="${chg}" ${extra||''}>${opts.map(o=>`<option value="${esc(o[0])}" ${String(o[0])===String(val)?'selected':''}>${esc(o[1])}</option>`).join('')}</select>`;
function dPips(path,max,on,cls){let h='';for(let i=0;i<max;i++)h+=`<button type="button" class="pip ${cls||''} ${i<on?'on':''}" data-act="dPip" data-p="${path}" data-i="${i}" aria-label="${i+1}"></button>`;return `<div class="pips">${h}</div>`}

/* ---------- hero + vitals ---------- */
function dVitals(c,d){const col=D_COL[c.classId]||D_COL.fighter;
 return `<div class="hero" style="--c1:${col[0]};--c2:${col[1]}">
  <label class="portrait" title="${L('Profilkép feltöltése','Upload a portrait')}">${c.portrait?`<img src="${c.portrait}" alt="">`:`<span>${esc((c.name||'?').trim()[0]||'?')}</span>`}<input type="file" accept="image/*" data-chg="portrait" hidden></label>
  <div class="grow"><div class="nm">${esc(c.name||L('Névtelen hős','Unnamed hero'))}</div><div class="sub">${dT(d.sp.name)}${d.lin?' ('+esc(d.lin.name.replace(/^.*?: /,''))+')':''} · ${dT(d.cls.name)}${d.lvl>=3&&d.cls.sub?' · '+esc(d.cls.sub.name):''} · ${dT(d.bg.name)}${c.pronouns?' · '+esc(c.pronouns):''}</div>
   <div class="row" style="margin-top:6px;gap:6px"><span class="tag">D&amp;D 5e · SRD 5.2</span>${c.insp?`<span class="tag">${T('Hősi ihlet','Heroic Inspiration')}</span>`:''}${c.conds.map(k=>`<span class="tag cond">${esc(dP(k))}</span>`).join('')}${+c.exhaustion?`<span class="tag cond">${dP('Exhaustion')} ${c.exhaustion}</span>`:''}</div></div>
  <div class="lvl"><span>${L('SZINT','LEVEL')}</span><b class="num">${d.lvl}</b></div></div>
 <div class="vitals">
  <div class="vital"><div class="lbl"><span>${T('Életpont','Hit Points')}</span><span class="num">${d.hp}/${d.hpMax.v}${+c.temp?` +${c.temp}`:''}</span></div>
   <div class="hpbar"><i style="width:${Math.round(100*d.hp/d.hpMax.v)}%"></i></div>
   <div class="row" style="margin-top:6px;gap:6px"><input type="number" id="dHpAmt" data-ui="dhp" value="${esc(ui.dhp||'')}" min="0" placeholder="0" style="width:4.6em"><button class="btn sm warn" data-act="dHp" data-k="dmg">${L('Sebzés','Damage')}</button><button class="btn sm" data-act="dHp" data-k="heal">${L('Gyógyítás','Heal')}</button><button class="btn sm" data-act="dHp" data-k="temp">${L('Ideiglenes','Temp')}</button></div></div>
  <div class="vital"><div class="badges"><div class="badge"><span class="shield num">${d.ac.v}</span><span class="lbl">${T('Páncélosztály','Armor Class')}</span></div><div class="badge"><span class="shield arm num">${sgn(d.init.v)}</span><span class="lbl">${T('Kezdeményezés','Initiative')}</span></div><div class="badge"><span class="shield arm num" style="font-size:1.15rem">${d.speed.v}</span><span class="lbl">${T('Sebesség (láb)','Speed (ft)')}</span></div></div></div>
  <div class="vital"><div class="badges"><div class="badge"><span class="profbox"><b class="num">${sgn(d.pb)}</b></span><span class="lbl">${T('Jártassági bónusz','Proficiency Bonus')}</span></div><div class="badge"><span class="profbox"><b class="num">${d.pp}</b></span><span class="lbl">${T('Passzív észlelés','Passive Perception')}</span></div><div class="badge"><span class="profbox"><b class="num">${d.lvl-c.hdUsed}<small>/${d.lvl}</small></b></span><span class="lbl">${T('Életkocka','Hit Dice')} d${d.cls.hd}</span></div></div></div>
  ${d.hp<=0?`<div class="vital" style="grid-column:1/-1"><div class="note d row"><b class="grow">${T('0 Életpont – halálmentők','0 Hit Points – death saving throws')}</b><span>${L('Siker','Successes')}</span>${dPips('ds.s',3,c.ds.s,'hope')}<span>${L('Kudarc','Failures')}</span>${dPips('ds.f',3,c.ds.f,'')}<button class="btn sm" data-act="dDeathSave">${L('Halálmentő dobás','Roll death save')}</button></div></div>`:''}
 </div>`}

/* ---------- editors (wizard + sheet) ---------- */
function dEdIdentity(c,d){return `<div class="grid g2">${lab(L('Név','Name'),fText('name',L('A hősöd neve','Your hero\'s name'),'data-re'))}${lab(L('Névmások','Pronouns'),fText('pronouns',''))}
 ${lab(T('Osztály','Class'),dSel('d_cls','dSet',DND.classes.map(x=>[x.id,dOpt(x.name)]),c.classId,'data-k="classId"'))}${lab(T('Jellem','Alignment'),fText('alignment',''))}</div>
 <p class="small muted" style="margin-top:8px">${T('Életkocka','Hit Point Die')} <b>d${d.cls.hd}</b> · ${T('Elsődleges tulajdonság','Primary ability')}: <b>${esc(d.cls.primary)}</b> · ${T('Mentődobások','Saving throws')}: <b>${d.cls.saves.map(a=>dP(D_ABM[a].en)).join(', ')}</b> · ${T('Jártasságok','Proficiencies')}: ${esc(d.cls.profs.join(', '))}${d.cls.choices.length?' · '+esc(d.cls.choices.join('; ')):''}</p>
 <div class="row" style="margin-top:8px">${c.portrait?`<img src="${c.portrait}" alt="" style="width:40px;height:50px;object-fit:cover;border-radius:6px">`:''}<label class="btn sm">${c.portrait?L('Profilkép cseréje','Change portrait'):L('Profilkép feltöltése','Upload a portrait')}<input type="file" accept="image/*" data-chg="portrait" hidden></label>${c.portrait?`<button class="btn sm warn" data-act="portraitDel">${L('Kép törlése','Remove portrait')}</button>`:''}</div>`}
function dEdOrigin(c,d){const tot=d.bg.abil.reduce((q,a)=>q+(+c.bgBonus[a]||0),0),mx=Math.max(0,...d.bg.abil.map(a=>+c.bgBonus[a]||0)),ok=tot===3&&mx<=2;
 return `<div class="grid g2">${lab(T('Háttér','Background'),dSel('d_bg','dSet',DND.backgrounds.map(x=>[x.id,dOpt(x.name)]),c.bgId,'data-k="bgId"'))}${lab(T('Faj','Species'),dSel('d_sp','dSet',DND.species.map(x=>[x.id,dOpt(x.name)]),c.speciesId,'data-k="speciesId"'))}
  ${d.sp.sub.length?lab(T('Vérvonal / örökség','Lineage / ancestry'),dSel('d_lin','dSet',[['','—'],...d.sp.sub.map(x=>[x.id,x.name])],c.lineageId,'data-k="lineageId"')):''}</div>
 <h3 style="margin-top:12px">${dT(d.bg.name)}</h3><p class="small">${T('Jártasságok','Skills')}: <b>${d.bg.skills.map(k=>dP(DND.sk[k].name)).join(', ')}</b>${d.bg.tools.length?' · '+esc(d.bg.tools.join(', ')):''} · ${T('Kiindulási feat','Origin feat')}: <b>${esc(d.bg.feat)}</b></p><p class="small muted">${esc(d.bg.equip.join(' '))}</p>
 <p class="small" style="margin-top:8px">${L('A háttér tulajdonságbónusza: +2 és +1, vagy +1 mindháromra.','Background ability bonus: +2 and +1, or +1 to all three.')}</p>
 <div class="row" style="margin-top:4px">${d.bg.abil.map(a=>`<label class="chk">${dP(D_ABM[a].en)} ${dSel('d_bb_'+a,'dBgBonus',[[0,'+0'],[1,'+1'],[2,'+2']],+c.bgBonus[a]||0,`data-a="${a}" style="width:auto"`)}</label>`).join('')}<span class="tag ${ok?'g':'d'}">${ok?L('rendben','valid'):L('összesen +3 kell (legfeljebb +2)','must total +3 (max +2)')}</span></div>
 <h3 style="margin-top:12px">${dT(d.sp.name)} <span class="small muted" style="font-family:var(--body);font-weight:400">${esc(d.sp.size)} · ${d.sp.speed} ${L('láb','ft')}</span></h3>${d.sp.traits.map(t=>dFeat('',t.n,t.d)).join('')}${d.lin?d.lin.traits.map(t=>dFeat(esc(d.lin.name),t.n,t.d||t.n)).join(''):''}`}
function dEdAbil(c,d){const base=D_AB.map(a=>+c.abil[a.id]||0),std=base.slice().sort((x,y)=>y-x).join()==='15,14,13,12,10,8',pbv=base.every(v=>PB_COST[v]!=null)?base.reduce((q,v)=>q+PB_COST[v],0):null;
 return `<p class="small muted">${L('Alapértékek a háttér és a szintek bónuszai nélkül. Standard tömb: 15, 14, 13, 12, 10, 8 – vagy pontvásárlás 27 pontból (8–15 között).','Base scores before background and level bonuses. Standard array: 15, 14, 13, 12, 10, 8 – or point buy with 27 points (scores 8–15).')}</p>
 <div class="grid g6" style="margin-top:8px">${D_AB.map(a=>`<div class="trait"><span class="tn">${N(a)}</span>${stepper('abil.'+a.id,3,18)}<span class="small muted">${L('végső','final')}: <b>${d.sc[a.id]}</b> (${sgn(d.mod[a.id])})</span></div>`).join('')}</div>
 <div class="row" style="margin-top:8px"><span class="tag ${std?'g':''}">${L('Standard tömb','Standard array')}: ${std?'✓':'—'}</span><span class="tag ${pbv!=null&&pbv<=27?'g':pbv!=null?'d':''}">${L('Pontvásárlás','Point buy')}: ${pbv!=null?pbv+'/27':'—'}</span><button class="btn sm" data-act="dStdArray">${L('Standard tömb az osztályhoz igazítva','Standard array fitted to the class')}</button></div>`}
function dEdSkills(c,d){const chosen=DND.skills.filter(k=>(+c.skills[k.id]||0)>0&&!d.bg.skills.includes(k.id)).length,over=chosen>d.cls.skillN;
 return `<p class="small muted">${L(`Az osztályod ${d.cls.skillN} jártasságot ad a listájáról; a háttér kettőt fixen. Kattints a pöttyre: jártas → szakértő (Expertise) → nincs.`,`Your class grants ${d.cls.skillN} skills from its list; the background gives two fixed ones. Click the dot: proficient → Expertise → none.`)} <b class="${over?'tag d':''}">${L('Választva','Chosen')}: ${chosen}/${d.cls.skillN}</b></p>
 <div class="skills" style="margin-top:8px">${DND.skills.map(k=>{const p=+c.skills[k.id]||0,fromC=d.cls.skillFrom.includes(k.id),fromB=d.bg.skills.includes(k.id);
  return `<div class="skill ${fromC||fromB?'':'off'}"><button type="button" class="dot p${dProf(c,d.bg,k.id)}" data-act="dSkill" data-k="${k.id}" title="${L('Jártasság váltása','Toggle proficiency')}"></button><button type="button" class="sk" data-act="dRollQ" data-t="skill" data-k="${k.id}"><b class="num">${sgn(d.skill[k.id])}</b> ${dT(k.name)} <span class="small muted">${dP(D_ABM[k.abil].en).slice(0,3)}</span></button>${fromB?`<span class="tag h">${L('háttér','bg')}</span>`:fromC?`<span class="tag">${L('osztály','class')}</span>`:''}</div>`}).join('')}</div>`}
function dEdGear(c,d){const arm=DND.armor.filter(a=>a.cat!=='shield');
 return `<div class="grid g2">${lab(T('Páncél','Armor'),dSel('d_arm','dSet',[['',L('— páncél nélkül —','— unarmored —')],...arm.map(a=>[a.id,`${a.name} · AC ${a.base}${a.dex?(a.max!=null?' + Dex (max '+a.max+')':' + Dex'):''} · ${a.cat}`])],c.armorId,'data-k="armorId"'))}
  <label class="chk" style="align-self:end"><input type="checkbox" id="d_sh" data-bind="shield" data-re ${c.shield?'checked':''}>${T('Pajzs (+2 PO)','Shield (+2 AC)')}</label></div>
 ${d.armor&&d.armor.stealth?`<p class="small">${L('Ez a páncél hátrányt ad a Lopakodásra.','This armor gives Disadvantage on Stealth.')}</p>`:''}${d.armor&&d.armor.str>d.sc.str?`<p class="note d">${L(`Ehhez a páncélhoz ${d.armor.str} Erő kell; a Sebességed 10 lábbal csökken.`,`This armor needs Strength ${d.armor.str}; your Speed is reduced by 10 feet.`)}</p>`:''}
 <p class="small muted" style="margin-top:4px">${T('Páncélosztály','Armor Class')} <b>${d.ac.v}</b>: ${d.ac.why}</p>
 <h3 style="margin-top:12px">${T('Fegyverek','Weapons')}</h3><div class="list">${c.weapons.map((id,i)=>{const w=DND.wp[id];if(!w)return '';const a=dWeapon(c,d,w);return `<div class="li"><b class="grow">${esc(w.name)}</b><span class="tag num">${sgn(a.hit)} ${L('találat','to hit')}</span><span class="tag h num">${dDice(w.dice,a.dmg)} ${esc(w.dtype)}</span>${w.mastery?`<span class="tag" title="${esc(DND.masteries[w.mastery]||'')}">${esc(w.mastery)}</span>`:''}<button class="btn sm warn" data-act="dWeaponDel" data-i="${i}">×</button><div class="small muted" style="flex-basis:100%">${esc(w.props.join(', '))}${w.range&&w.range.long?` · ${w.range.normal}/${w.range.long} ${L('láb','ft')}`:''}${a.prof?'':' · '+L('nem jártas','not proficient')}</div></div>`}).join('')}</div>
 <div style="margin-top:6px">${lab(L('Fegyver hozzáadása','Add a weapon'),dSel('d_wadd','dWeaponAdd',[['',L('— válassz —','— choose —')],...DND.weapons.map(w=>[w.id,`${w.name} · ${w.dice} ${w.dtype} · ${w.martial?'martial':'simple'}${w.ranged?' ranged':''}`])],''))}</div>
 <p class="small muted" style="margin-top:8px">${L('Kezdőfelszerelés','Starting equipment')}: ${esc(d.cls.equip.join(' '))}</p>`}

/* ---------- wizard ---------- */
const D_WSTEPS=[b('Osztály','Class'),b('Eredet','Origin'),b('Tulajdonságok','Abilities'),b('Jártasságok','Skills'),b('Felszerelés','Equipment'),b('Varázslatok','Spells'),b('Háttértörténet','Details')];
function dWizard(c,d){const s=c.creating;let body='';
 if(s===0)body=dEdIdentity(c,d)+`<div style="margin-top:10px">${d.cls.levels[0].f.map(f=>dFeat(L('1. szint','level 1'),f.n,f.d)).join('')}</div>`;
 if(s===1)body=dEdOrigin(c,d);if(s===2)body=dEdAbil(c,d);if(s===3)body=dEdSkills(c,d);if(s===4)body=dEdGear(c,d);
 if(s===5)body=d.spell?dSpellPicker(c,d):`<p class="muted">${L('Ez az osztály 1. szinten nem varázsol. Faji vagy featből származó varázslatot később a Varázslatok fülön vehetsz fel.','This class does not cast spells at level 1. Spells from a species or feat can be added later on the Spells tab.')}</p>`;
 if(s===6)body=`<div class="stack">${lab(L('Külső, megjelenés','Description, appearance'),fArea('desc','',3))}${lab(L('Háttértörténet','Backstory'),fArea('background','',4))}${lab(L('Kapcsolatok, szövetségesek','Connections, allies'),fArea('connections','',3))}</div>`;
 return `<section class="blk"><div class="row"><h2 class="grow">${L('Karakteralkotás','Character creation')} · D&amp;D 5e</h2><div class="steps">${D_WSTEPS.map((x,i)=>`<span class="${i===s?'cur':''}">${i+1}. ${P(x)}</span>`).join('')}</div></div>
 <div class="panel"><h3>${s+1}. ${N(D_WSTEPS[s])}</h3>${body}</div>
 <div class="row"><button class="btn" data-act="wiz" data-d="-1" ${s===0?'disabled':''}>← ${L('Vissza','Back')}</button><span class="grow"></span><button class="btn warn" data-act="delChar">${ui.confirm==='del'?L('Biztosan törlöd?','Really delete?'):L('Elvetés','Discard')}</button>
 ${s<6?`<button class="btn pri" data-act="wiz" data-d="1">${L('Tovább','Next')} →</button>`:`<button class="btn pri" data-act="dWizDone">${L('Kész – irány a kaland!','Done – on to adventure!')}</button>`}</div></section>`}

/* ---------- tabs ---------- */
function dSheet(c,d){
 const abil=D_AB.map(a=>`<div class="trait ${d.cls.saves.includes(a.id)?'marked':''}"><span class="v shield num">${sgn(d.mod[a.id])}</span><span class="tn">${N(a)}</span><span class="small muted num">${d.sc[a.id]}</span><div class="row" style="gap:4px;justify-content:center"><button class="btn sm" data-act="dRollQ" data-t="check" data-k="${a.id}">${L('Próba','Check')}</button><button class="btn sm" data-act="dRollQ" data-t="save" data-k="${a.id}" title="${T('Mentődobás','Saving throw')}">${L('Mentő','Save')} ${sgn(d.save[a.id])}</button></div></div>`).join('');
 const stat=(n,v,why,p)=>`<div class="stat"><span class="v num">${v}</span><div class="grow"><b>${n}</b><div class="why">${why}</div></div>${p?stepper('mods.'+p,-20,60):''}</div>`;
 const csKeys=Object.entries(d.cs).map(([k,v])=>`<span class="tag h">${esc(k.replace(/_/g,' '))}: <b>${typeof v==='object'?`${v.dice_count}d${v.dice_value}`:v}</b></span>`).join(' ');
 return `<section class="blk"><div class="grid g6">${abil}</div>
 <div class="grid g2"><div class="panel"><h2>${T('Jártasságok','Skills')}</h2>${dEdSkills(c,d)}</div>
  <div class="stack"><div class="panel"><h2>${T('Támadások','Attacks')}</h2><div class="list">${c.weapons.map((id,i)=>{const w=DND.wp[id];if(!w)return '';const a=dWeapon(c,d,w);return `<div class="li"><b class="grow">${esc(w.name)}</b><span class="tag num">${sgn(a.hit)}</span><span class="tag h num">${dDice(w.dice,a.dmg)}</span><button class="btn sm pri" data-act="dAttack" data-i="${i}">${L('Támadás','Attack')}</button><button class="btn sm" data-act="dDamage" data-i="${i}">${L('Sebzés','Damage')}</button></div>`}).join('')||`<span class="muted">${L('Nincs fegyver – a Felszerelés fülön adhatsz hozzá.','No weapons – add some on the Gear tab.')}</span>`}</div>
   ${d.spell?`<p class="small" style="margin-top:8px">${T('Varázslat mentő NF','Spell save DC')} <b>${d.spell.dc}</b> · ${T('Varázstámadás','Spell attack')} <b>${sgn(d.spell.atk)}</b> · ${dP(D_ABM[d.spell.ab].en)}</p>`:''}</div>
  <div class="panel"><h2>${L('Számított értékek','Calculated values')}</h2>${stat(T('Páncélosztály','Armor Class'),d.ac.v,d.ac.why,'ac')}${stat(T('Életpont-maximum','Hit Point maximum'),d.hpMax.v,d.hpMax.why,'hp')}${stat(T('Kezdeményezés','Initiative'),sgn(d.init.v),d.init.why||'—','init')}${stat(T('Sebesség','Speed'),d.speed.v,d.speed.why,'speed')}</div>
  <div class="panel"><h2>${T('Állapotok','Conditions')}</h2><div class="row">${DND.conditions.filter(k=>k.name!=='Exhaustion').map(k=>`<button class="btn sm ${c.conds.includes(k.name)?'fear':''}" data-act="dCond" data-k="${esc(k.name)}" title="${esc(k.d.replace(/\*\*/g,''))}">${esc(dP(k.name))}</button>`).join('')}</div>
   <div class="row" style="margin-top:8px"><span>${T('Kimerültség','Exhaustion')}:</span>${stepper('exhaustion',0,6)}${+c.exhaustion?`<span class="small muted">${L(`d20-próbák ${d.d20pen}, Sebesség −${5*c.exhaustion} láb`,`D20 Tests ${d.d20pen}, Speed −${5*c.exhaustion} ft`)}</span>`:''}<label class="chk"><input type="checkbox" id="d_insp" data-bind="insp" data-re ${c.insp?'checked':''}>${T('Hősi ihlet','Heroic Inspiration')}</label></div>
   ${c.conds.map(k=>{const x=DND.conditions.find(q=>q.name===k);return x?`<div class="ctext small" style="margin-top:6px"><b>${esc(dP(k))}</b>${md(x.d)}</div>`:''}).join('')}
   <h3 style="margin-top:12px">${L('Számlálók','Counters')}</h3><div class="list" style="margin-top:6px">${c.counters.map((k,i)=>`<div class="li"><span class="grow">${fText('counters.'+i+'.name',L('Megnevezés','Name'))}</span>${stepper('counters.'+i+'.val',0,99)}<button class="btn sm warn" data-act="delCounter" data-i="${i}">×</button></div>`).join('')}<div><button class="btn sm" data-act="addCounter">+ ${L('Számláló','Counter')}</button></div></div></div></div></div>
 <div class="grid g2"><div class="panel"><h2>${T('Osztályképességek','Class features')} – ${dT(d.cls.name)}</h2>${csKeys?`<div class="row" style="margin-bottom:8px;gap:6px">${csKeys}</div>`:''}${d.feats.map(f=>dFeat(`${f.l}. ${L('szint','level')}`,f.n,f.d)).join('')}
   ${d.cls.sub?`<h3 style="margin-top:12px">${T('Alosztály','Subclass')}: ${esc(d.cls.sub.name)}</h3>${d.lvl<3?`<p class="small muted">${L('3. szinttől érhető el.','Available from level 3.')} ${esc(d.cls.sub.summary)}</p>`:`<p class="small muted">${esc(d.cls.sub.desc)}</p>`+d.subF.map(f=>dFeat(`${f.level}. ${L('szint','level')}`,f.n,f.d)).join('')}`:''}</div>
  <div class="panel"><h2>${T('Eredet','Origin')}</h2>${d.sp.traits.map(t=>dFeat(esc(dP(d.sp.name)),t.n,t.d)).join('')}${d.lin?d.lin.traits.map(t=>dFeat(esc(d.lin.name),t.n,t.d||t.n)).join(''):''}
   ${(()=>{const f=DND.ft[d.bg.featId];return f?dFeat(`${esc(dP(d.bg.name))} · ${L('kiindulási feat','origin feat')}`,d.bg.feat,f.d):''})()}
   ${c.asi.filter(x=>x.level<=d.lvl&&x.feat&&DND.ft[x.feat]).map(x=>dFeat(`${x.level}. ${L('szint','level')} · feat`,DND.ft[x.feat].name,DND.ft[x.feat].d)).join('')}${c.fstyle&&DND.ft[c.fstyle]?dFeat('Fighting Style',DND.ft[c.fstyle].name,DND.ft[c.fstyle].d):''}
   <h3 style="margin-top:12px">${L('Egyéb jártasságok, nyelvek','Other proficiencies, languages')}</h3><p class="small muted">${esc(d.cls.profs.join(', '))}${d.bg.tools.length?', '+esc(d.bg.tools.join(', ')):''}</p>${fArea('profNotes',L('Nyelvek, eszközök, választott jártasságok…','Languages, tools, chosen proficiencies…'),2)}</div></div>
 <details class="panel"><summary>${L('Alapadatok szerkesztése (név, osztály, eredet, tulajdonságok)','Edit basics (name, class, origin, abilities)')}</summary><div class="stack">${dEdIdentity(c,d)}<hr>${dEdOrigin(c,d)}<hr>${dEdAbil(c,d)}
  <div class="row"><button class="btn warn" data-act="delChar">${ui.confirm==='del'?L('Biztosan törlöd? Kattints újra.','Really delete? Click again.'):L('Karakter törlése','Delete character')}</button></div></div></details></section>`}

function dPlay(c,d){const r=ui.droll||(ui.droll={t:'check',k:'str',adv:0,mod:0,dc:''}),l=ui.dlast,dm=ui.dmg;
 const opts=[['check',L('Tulajdonságpróba','Ability check')],['save',L('Mentődobás','Saving throw')],['skill',L('Jártasságpróba','Skill check')],['flat',L('Sima d20','Plain d20')]];
 const keys=r.t==='skill'?DND.skills.map(k=>[k.id,`${dP(k.name)} ${sgn(d.skill[k.id])}`]):r.t==='flat'?[['','—']]:D_AB.map(a=>[a.id,`${P(a)} ${sgn(r.t==='save'?d.save[a.id]:d.mod[a.id])}`]);
 const rs=ui.drest;
 return `<section class="blk"><div class="grid g2"><div class="panel"><h2>${T('d20-próba','D20 Test')}</h2>
  <div class="grid g3">${lab(L('Típus','Type'),dSel('dr_t','dRollSet',opts,r.t,'data-k="t"'))}${lab(L('Mire','What'),dSel('dr_k','dRollSet',keys,r.k,'data-k="k"'))}${lab(L('Egyéb módosító','Other modifier'),`<input type="number" id="dr_mod" data-ui="droll.mod" value="${esc(r.mod)}">`)}</div>
  <div class="row" style="margin-top:8px">${[[1,T('Előny','Advantage')],[0,L('Sima','Normal')],[-1,T('Hátrány','Disadvantage')]].map(a=>`<button class="btn sm ${r.adv===a[0]?'fear':''}" data-act="dRollAdv" data-v="${a[0]}">${a[1]}</button>`).join('')}<label class="chk">${T('Nehézségi fok','DC')} <input type="number" id="dr_dc" data-ui="droll.dc" value="${esc(r.dc)}" style="width:4.5em"></label></div>
  <div class="row" style="margin-top:10px"><button class="btn pri" data-act="dRoll">${L('Dobás: d20','Roll d20')}</button>${r.label?`<span class="tag">${esc(r.label)}</span><button class="btn sm" data-act="dRollClear">×</button>`:''}${d.d20pen?`<span class="small muted">${L('kimerültség','exhaustion')} ${d.d20pen}</span>`:''}</div>
  ${l?`<div class="note ${l.nat===20?'g':l.nat===1?'d':''}" style="margin-top:10px"><div class="dice">${l.dice.map((x,i)=>`<span class="die ${l.dice.length>1&&x!==l.nat?'x':'h'} num">${x}</span>`).join('')}<span class="muted num">${sgn(l.bonus)}</span><span class="total num">= ${l.total}</span></div><p style="margin-top:6px"><b>${esc(l.label)}</b>${l.nat===20?' · '+L('természetes 20!','natural 20!'):l.nat===1?' · '+L('természetes 1','natural 1'):''}${l.verdict?' · <b>'+l.verdict+'</b>':''}</p>${l.weapon!=null?`<div class="row" style="margin-top:6px"><button class="btn pri sm" data-act="dDamage" data-i="${l.weapon}" data-crit="${l.nat===20?1:0}">${l.nat===20?L('Kritikus sebzés','Critical damage'):L('Sebzés dobása','Roll damage')}</button></div>`:''}</div>`:''}
  <div class="row" style="margin-top:12px"><span class="grow">${lab(L('Szabad dobás (pl. 8d6)','Free roll (e.g. 8d6)'),`<input type="text" id="free" data-ui="free" value="${esc(ui.free||'')}" placeholder="1d20">`)}</span><button class="btn" data-act="freeRoll" style="align-self:flex-end">${L('Dob','Roll')}</button></div>
  ${dm?`<div class="note" style="margin-top:8px"><span class="total num">${dm.total}</span> <b>${esc(dm.label)}</b><div class="small num">${esc(dm.detail)}</div></div>`:''}</div>
 <div class="stack"><div class="panel"><h2>${T('Pihenő','Rest')}</h2><div class="row"><button class="btn" data-act="dRest" data-t="short">${T('Rövid pihenő','Short Rest')}</button><button class="btn" data-act="dRest" data-t="long">${T('Hosszú pihenő','Long Rest')}</button></div>
   ${rs==='short'?`<div class="note" style="margin-top:8px"><b>${T('Rövid pihenő','Short Rest')}</b> – ${L('költs Életkockát gyógyulásra','spend Hit Dice to heal')}: d${d.cls.hd}${sgn(d.mod.con)} · ${L('maradt','left')} <b>${d.lvl-c.hdUsed}</b><div class="row" style="margin-top:6px"><button class="btn sm pri" data-act="dHitDie" ${d.lvl-c.hdUsed<1||d.hp>=d.hpMax.v?'disabled':''}>${L('Életkocka elköltése','Spend a Hit Die')}</button><button class="btn sm" data-act="dRestEnd">${L('Pihenő vége','Finish rest')}</button></div>${c.classId==='warlock'?`<p class="small muted">${L('A Paktummágia varázshelyei visszatérnek.','Pact Magic slots are restored.')}</p>`:''}</div>`:''}
   <p class="small muted" style="margin-top:8px">${L('Hosszú pihenő: minden Életpont, Életkocka és varázshely visszatér, a Kimerültség eggyel csökken.','Long Rest: regain all Hit Points, Hit Dice and spell slots; Exhaustion drops by 1.')}</p></div>
  <div class="panel"><h2>${L('Eseménynapló','Event log')}</h2><div class="hist">${c.rolls.length?c.rolls.map(e=>`<div><time>${hhmm(e.t)}</time>${esc(e.x)}</div>`).join(''):`<span class="muted">${L('Itt jelennek meg a dobások és a lap változásai.','Rolls and sheet changes appear here.')}</span>`}</div></div></div></div></section>`}

function dSpellRow(x,btn){return `<div class="li top catrow"><details class="grow"><summary><span class="tag num" style="background:var(--fear);color:var(--on-accent)">${x.lvl||L('tr.','c')}</span> ${esc(x.name)} <span class="small muted" style="font-family:var(--body);font-weight:400">${esc(x.school)}${x.conc?' · '+L('koncentráció','conc.'):''}${x.rit?' · '+L('rituálé','ritual'):''}</span></summary><div class="ctext"><p class="small"><b>${L('Idő','Time')}:</b> ${esc(x.time)} · <b>${L('Táv','Range')}:</b> ${esc(x.range)} · <b>${L('Komp.','Comp.')}:</b> ${esc(x.comp)} · <b>${L('Időtartam','Duration')}:</b> ${esc(x.dur)}</p>${md(x.d)}${x.hi?`<p><b>${L('Magasabb szinten','At higher levels')}:</b> ${mdi(x.hi)}</p>`:''}</div></details>${btn}</div>`}
function dSpellPicker(c,d){const f=ui.dsp||(ui.dsp={cls:DND.cls[c.classId].spell?c.classId:'all',q:'',lvl:''});const have=new Set(c.spells.map(x=>x.id)),mx=d.spell?d.spell.maxLvl:9;
 const q=f.q.trim().toLowerCase(),list=DND.spells.filter(x=>(f.cls==='all'||x.cls.includes(f.cls))&&(f.lvl===''?x.lvl<=Math.max(mx,0)||f.cls==='all':x.lvl===+f.lvl)&&(!q||x.name.toLowerCase().includes(q))).sort((p,r)=>p.lvl-r.lvl||p.name.localeCompare(r.name));
 return `<div class="grid g3">${lab(L('Varázslista','Spell list'),dSel('dsp_c','dSpFilter',[['all',L('minden','all')],...DND.classes.filter(k=>k.spell).map(k=>[k.id,dOpt(k.name)])],f.cls,'data-k="cls"'))}${lab(L('Szint','Level'),dSel('dsp_l','dSpFilter',[['',L('elérhető szintek','castable levels')],...[0,1,2,3,4,5,6,7,8,9].map(i=>[i,i?i+'.':L('trükk (cantrip)','cantrip')])],f.lvl,'data-k="lvl"'))}${lab(L('Keresés név szerint','Search by name'),`<input type="search" id="dsp_q" data-ui="dsp.q" data-re value="${esc(f.q)}">`)}</div>
 <p class="small muted" style="margin-top:6px">${list.length} ${L('varázslat','spells')}${list.length>60?' – '+L('az első 60 látszik, szűkíts a keresővel','showing the first 60, narrow it with search'):''}</p>
 <div class="list" style="margin-top:6px">${list.slice(0,60).map(x=>dSpellRow(x,`<button class="btn sm ${have.has(x.id)?'':'pri'}" ${have.has(x.id)?'disabled':''} data-act="dSpellAdd" data-id="${x.id}">${have.has(x.id)?'✓':'+ '+L('Felvesz','Add')}</button>`)).join('')}</div>`}
function dSpells(c,d){const mine=c.spells.map((x,i)=>({s:DND.spl[x.id],x,i})).filter(o=>o.s).sort((p,r)=>p.s.lvl-r.s.lvl||p.s.name.localeCompare(r.s.name));
 const nC=mine.filter(o=>o.s.lvl===0).length,nP=mine.filter(o=>o.s.lvl>0&&o.x.prep).length;
 return `<section class="blk">${d.spell?`<div class="panel"><h2>${T('Varázshelyek','Spell slots')}</h2><p class="small">${T('Mentő NF','Save DC')} <b>${d.spell.dc}</b> · ${T('Varázstámadás','Spell attack')} <b>${sgn(d.spell.atk)}</b> · ${T('Trükkök','Cantrips')} <b>${nC}/${d.spell.cantrips}</b> · ${T('Előkészített','Prepared')} <b>${nP}/${d.spell.prepared}</b></p>
  <div class="grid g3" style="margin-top:8px">${d.spell.slots.map((n,i)=>n?`<div><div class="lbl small muted">${i+1}. ${L('szint','level')} · ${n-(c.slotsUsed[i]||0)}/${n}</div>${dPips('slotsUsed.'+i,n,c.slotsUsed[i]||0,'stress')}</div>`:'').join('')}</div><p class="small muted" style="margin-top:6px">${L('A megjelölt pötty elhasznált varázshelyet jelent.','A filled pip is a spent slot.')}</p></div>`:''}
 <div class="panel"><h2>${L('Varázslataim','My spells')} <span class="muted num">${mine.length}</span></h2><div class="list">${mine.map(o=>dSpellRow(o.s,`<div class="row" style="gap:4px">${o.s.lvl?`<button class="btn sm ${o.x.prep?'fear':''}" data-act="dSpellPrep" data-i="${o.i}">${o.x.prep?L('előkészítve','prepared'):L('előkészít','prepare')}</button><button class="btn sm pri" data-act="dCast" data-i="${o.i}">${L('Varázsol','Cast')}</button>`:''}<button class="btn sm warn" data-act="dSpellDel" data-i="${o.i}">×</button></div>`)).join('')||`<span class="muted">${L('Még nincs felvett varázslat.','No spells added yet.')}</span>`}</div></div>
 <div class="panel"><h2>${L('Varázslat felvétele','Add a spell')}</h2>${dSpellPicker(c,d)}</div></section>`}

function dGear(c,d){const coin=[['pp','PP'],['gp','GP'],['ep','EP'],['sp','SP'],['cp','CP']];
 return `<section class="blk"><div class="grid g2"><div class="panel"><h2>${T('Páncél és fegyverek','Armor and weapons')}</h2>${dEdGear(c,d)}</div>
 <div class="stack"><div class="panel"><h2>${T('Érmék','Coins')}</h2><div class="row" style="gap:14px">${coin.map(k=>`<span>${k[1]} ${stepper('coins.'+k[0],0,99999)}</span>`).join('')}</div></div>
 <div class="panel"><h2>${T('Táska','Inventory')}</h2><div class="list">${c.items.map((it,i)=>`<div class="li"><span class="grow">${fText('items.'+i+'.name',L('Tárgy','Item'))}</span>${stepper('items.'+i+'.qty',0,999)}<button class="btn sm warn" data-act="delItem" data-i="${i}">×</button>${it.desc?`<div class="small muted" style="flex-basis:100%">${mdi(it.desc)}</div>`:''}</div>`).join('')}</div>
  <div class="row" style="margin-top:8px"><button class="btn sm" data-act="addItem" data-n="">+ ${L('Tárgy','Item')}</button></div>
  <div style="margin-top:8px">${lab(L('Tárgy a szabálykönyv katalógusából','Item from the rulebook catalog'),dSel('d_gadd','dGearAdd',[['',L('— válassz —','— choose —')],...DND.gear.map((g,i)=>[i,g.name+(g.cost?' · '+g.cost:'')])],''))}</div></div></div></div></section>`}

function dLevel(c,d){const next=d.cls.levels[d.lvl];
 return `<section class="blk"><div class="panel"><div class="row"><h2 class="grow">${T('Szint','Level')} ${d.lvl} · ${T('Jártassági bónusz','Proficiency Bonus')} ${sgn(d.pb)}</h2>${d.lvl<20?`<button class="btn pri" data-act="dLevel" data-d="1">${L('Szintlépés','Level up')} → ${d.lvl+1}</button>`:''}${d.lvl>1?`<button class="btn warn" data-act="dLevel" data-d="-1">${L('Szint vissza','Level down')}</button>`:''}</div>
  <p class="small muted" style="margin-top:4px">${L(`Szintenként +${d.cls.hd/2+1} ${sgn(d.mod.con)} (Áll.) Életpont (fix érték). A lap az új szint képességeit, varázshelyeit és jártassági bónuszát magától átvezeti.`,`Each level adds ${d.cls.hd/2+1} ${sgn(d.mod.con)} (Con) Hit Points (fixed value). Features, spell slots and Proficiency Bonus update on their own.`)}</p>
  ${next?`<h3 style="margin-top:12px">${L('A következő szinten','At the next level')} (${d.lvl+1}.)</h3>${next.f.map(f=>dFeat('',f.n,f.d)).join('')||`<p class="muted small">—</p>`}${d.cls.sub?d.cls.sub.features.filter(f=>f.level===d.lvl+1).map(f=>dFeat(esc(d.cls.sub.name),f.n,f.d)).join(''):''}`:''}</div>
 <div class="panel"><h2>${T('Tulajdonságnövelések és featek','Ability Score Improvements and feats')}</h2><p class="small muted">${L('Minden „Ability Score Improvement” szinten: +2 egy tulajdonságra, +1 kettőre, vagy egy feat (20-as plafonnal).','At each Ability Score Improvement level: +2 to one ability, +1 to two, or a feat (maximum 20).')}</p>
  ${d.asiLv.map(lv=>{let x=c.asi.find(q=>q.level===lv);const a=(x&&x.a)||{},tot=Object.values(a).reduce((q,v)=>q+(+v||0),0),gen=DND.feats.filter(f=>f.type===(lv>=19?'epic-boon':'general')&&f.id!=='ability-score-improvement');
   return `<div class="opt"><b class="num" style="min-width:3.2em">${lv}. ${L('szint','lvl')}</b><div class="grow"><div class="row">${D_AB.map(k=>`<label class="chk small">${dP(k.en).slice(0,3)} ${dSel(`d_asi_${lv}_${k.id}`,'dAsi',[[0,'+0'],[1,'+1'],[2,'+2']],+a[k.id]||0,`data-l="${lv}" data-a="${k.id}" style="width:auto"`)}</label>`).join('')}</div>
   <div class="row" style="margin-top:4px"><label class="chk small">${L('vagy feat','or feat')} ${dSel('d_asif_'+lv,'dAsiFeat',[['','—'],...gen.map(f=>[f.id,f.name])],(x&&x.feat)||'',`data-l="${lv}" style="width:auto"`)}</label><span class="tag ${tot===2&&!(x&&x.feat)||tot<=1&&x&&x.feat?'g':tot===0&&!(x&&x.feat)?'':'d'}">${tot===0&&!(x&&x.feat)?L('még nincs kiosztva','not assigned yet'):tot===2&&!(x&&x.feat)||x&&x.feat&&tot<=1?L('rendben','valid'):L('összesen +2 jár','total must be +2')}</span></div></div></div>`}).join('')||`<p class="muted">${L('Az első növelés a 4. szinten jár.','The first improvement comes at level 4.')}</p>`}
  ${d.feats.some(f=>f.n==='Fighting Style')?`<div class="opt"><b style="min-width:3.2em">Fighting Style</b><div class="grow">${dSel('d_fs','dSet',[['','—'],...DND.feats.filter(f=>f.type==='fighting-style').map(f=>[f.id,f.name])],c.fstyle||'','data-k="fstyle" style="width:auto"')}</div></div>`:''}</div></section>`}

function dView(c,d){return ({sheet:dSheet,play:dPlay,spells:dSpells,gear:dGear,level:dLevel,journal:vJournal,notes:vNotes,rules:vRules}[ui.tab]||dSheet)(c,d)}

/* ---------- export ---------- */
function dSheetMd(c,d){const o=[],Tp=(hu,en)=>lang==='hu'&&hu!==en?`${hu} (${en})`:en,tbl=(h,rows)=>o.push('| '+h.join(' | ')+' |','|'+h.map(()=>' --- ').join('|')+'|',...rows.map(r=>'| '+r.join(' | ')+' |'),'');
 o.push(`# ${c.name||L('Névtelen hős','Unnamed hero')}`,'',`**${dOpt(d.sp.name)}${d.lin?' – '+d.lin.name:''} · ${dOpt(d.cls.name)}${d.lvl>=3&&d.cls.sub?' ('+d.cls.sub.name+')':''} · ${dOpt(d.bg.name)} · ${Tp('Szint','Level')} ${d.lvl}** · D&D 5e (SRD 5.2.1)${c.alignment?' · '+c.alignment:''}`,'');if(c.desc)o.push(c.desc,'');
 tbl([Tp('Páncélosztály','AC'),Tp('Életpont','HP'),Tp('Kezdeményezés','Initiative'),Tp('Sebesség','Speed'),Tp('Jártassági bónusz','Prof. Bonus'),Tp('Passzív észlelés','Passive Perception')],[[d.ac.v,`${d.hp} / ${d.hpMax.v}`,sgn(d.init.v),d.speed.v+' ft',sgn(d.pb),d.pp]]);
 tbl(['',...D_AB.map(a=>Tp(a.hu,a.en))],[[Tp('Érték','Score'),...D_AB.map(a=>d.sc[a.id])],[Tp('Módosító','Modifier'),...D_AB.map(a=>sgn(d.mod[a.id]))],[Tp('Mentő','Save'),...D_AB.map(a=>sgn(d.save[a.id])+(d.cls.saves.includes(a.id)?' ●':''))]]);
 o.push(`## ${Tp('Jártasságok','Skills')}`,'',DND.skills.map(k=>`${dP(k.name)} ${sgn(d.skill[k.id])}${dProf(c,d.bg,k.id)===2?' ●●':dProf(c,d.bg,k.id)?' ●':''}`).join(' · '),'');
 if(c.weapons.length){o.push(`## ${Tp('Támadások','Attacks')}`,'');tbl([L('Fegyver','Weapon'),L('Találat','To hit'),L('Sebzés','Damage'),L('Tulajdonságok','Properties')],c.weapons.map(id=>DND.wp[id]).filter(Boolean).map(w=>{const a=dWeapon(c,d,w);return [w.name,sgn(a.hit),`${dDice(w.dice,a.dmg)} ${w.dtype}`,[...w.props,w.mastery].filter(Boolean).join(', ')||'—']}))}
 if(d.armor||c.shield)o.push(`**${Tp('Páncél','Armor')}:** ${[d.armor&&d.armor.name,c.shield&&'Shield'].filter(Boolean).join(' + ')}`,'');
 o.push(`## ${Tp('Képességek','Features')}`,'');d.feats.forEach(f=>o.push(`#### ${f.n} — ${d.cls.name} ${f.l}`,'',f.d,''));d.subF.forEach(f=>o.push(`#### ${f.n} — ${d.cls.sub.name} ${f.level}`,'',f.d,''));
 d.sp.traits.forEach(t=>o.push(`#### ${t.n} — ${d.sp.name}`,'',t.d,''));if(d.lin)d.lin.traits.forEach(t=>o.push(`#### ${t.n} — ${d.lin.name}`,'',t.d||'',''));const bf=DND.ft[d.bg.featId];if(bf)o.push(`#### ${d.bg.feat} — ${d.bg.name}`,'',bf.d,'');
 const sp=c.spells.map(x=>({s:DND.spl[x.id],x})).filter(q=>q.s).sort((p,r)=>p.s.lvl-r.s.lvl);
 if(sp.length){o.push(`## ${Tp('Varázslatok','Spells')}`,'');if(d.spell)o.push(`${Tp('Mentő NF','Save DC')} ${d.spell.dc} · ${Tp('Varázstámadás','Spell attack')} ${sgn(d.spell.atk)} · ${Tp('Varázshelyek','Slots')}: ${d.spell.slots.map((n,i)=>n?`${i+1}: ${n}`:'').filter(Boolean).join(', ')}`,'');
  sp.forEach(q=>o.push(`#### ${q.s.name}`,'',`*${q.s.lvl?q.s.lvl+'. '+L('szint','level'):'cantrip'} · ${q.s.school} · ${q.s.time} · ${q.s.range} · ${q.s.comp} · ${q.s.dur}*`,'',q.s.d,'',q.s.hi||'',''))}
 o.push(`## ${Tp('Felszerelés','Inventory')}`,'',...c.items.map(i=>`- ${i.name}${i.qty!==1?' × '+i.qty:''}`),'',`**${Tp('Érmék','Coins')}:** ${['pp','gp','ep','sp','cp'].map(k=>`${c.coins[k]||0} ${k.toUpperCase()}`).join(', ')}`,'');
 if(c.profNotes)o.push(`**${L('Egyéb jártasságok, nyelvek','Other proficiencies, languages')}:** ${c.profNotes}`,'');
 if(c.background)o.push(`## ${L('Háttértörténet','Backstory')}`,'',c.background,'');if(c.connections)o.push(`## ${L('Kapcsolatok','Connections')}`,'',c.connections,'');
 const ns=c.notes.filter(n=>n.title||n.body);if(ns.length){o.push(`## ${L('Jegyzetek','Notes')}`,'');ns.forEach(n=>o.push(`### ${n.title||'—'}`,'',n.body,''))}
 if(c.sessions.length){o.push(`## ${L('Session-napló','Session journal')}`,'');c.sessions.forEach((x,i)=>{o.push(`### ${i+1}. ${x.title} (${x.date})`,'');if(x.summary)o.push(x.summary,'')})}
 o.push('---','','*This work includes material from the System Reference Document 5.2.1 by Wizards of the Coast LLC, licensed under CC BY 4.0.*');return o.join('\n')}

/* ---------- actions ---------- */
const dD20=(c,d,label,bonus,extra)=>{const r=ui.droll||(ui.droll={t:'check',k:'str',adv:0,mod:0,dc:''}),a=rnd(20),b2=rnd(20),dice=r.adv?[a,b2]:[a],nat=r.adv>0?Math.max(a,b2):r.adv<0?Math.min(a,b2):a,tot=nat+bonus+(+r.mod||0)+d.d20pen;
 const dc=parseInt(r.dc,10);ui.dlast=Object.assign({dice,nat,bonus:bonus+(+r.mod||0)+d.d20pen,total:tot,label,verdict:dc>0?(tot>=dc?L('Siker','Success'):L('Kudarc','Failure')):''},extra||{});
 log(`${label}: ${tot} (d20: ${dice.join('/')})${ui.dlast.verdict?' – '+ui.dlast.verdict:''}`);touch();render()};
Object.assign(A,{
 dNewChar(){const c=dNewChar();S.chars.push(c);S.cur=c.id;ui.view='char';ui.tab='sheet';touch(c);render();window.scrollTo(0,0)},
 dWizDone(){const c=cur();c.creating=null;c.hp=null;ui.tab='sheet';touch();render();window.scrollTo(0,0)},
 dSet(x,el){const c=cur();c[x.k]=el.value;if(x.k==='speciesId')c.lineageId='';if(x.k==='bgId')c.bgBonus={};if(x.k==='classId'){ui.dsp=null;c.spells=[];c.asi=[]}touch();render()},
 dBgBonus(x,el){cur().bgBonus[x.a]=+el.value;touch();render()},
 dStdArray(){const c=cur(),cls=DND.cls[c.classId],pr=cls.primary.toLowerCase(),order=D_AB.map(a=>a.id).sort((p,q)=>(pr.includes(D_ABM[q].en.toLowerCase())?1:0)-(pr.includes(D_ABM[p].en.toLowerCase())?1:0)||(q==='con')-(p==='con')||(cls.saves.includes(q)?1:0)-(cls.saves.includes(p)?1:0));
  [15,14,13,12,10,8].forEach((v,i)=>c.abil[order[i]]=v);touch();render()},
 dSkill(x){const c=cur(),bg=DND.bg[c.bgId],min=bg&&bg.skills.includes(x.k)?1:0;let n=(dProf(c,bg,x.k)+1)%3;if(n<min)n=min;c.skills[x.k]=n;touch();render()},
 dPip(x){const c=cur(),i=+x.i,v=+getP(c,x.p)||0;setP(c,x.p,v===i+1?i:i+1);touch();render()},
 dCond(x){const c=cur();c.conds=c.conds.includes(x.k)?c.conds.filter(k=>k!==x.k):[...c.conds,x.k];touch();render()},
 dHp(x){const c=cur(),d=dDerive(c),n=Math.abs(parseInt(ui.dhp,10)||0);if(!n)return;let hp=d.hp;
  if(x.k==='temp'){c.temp=Math.max(+c.temp||0,n);log(L(`${n} ideiglenes Életpont`,`${n} Temporary Hit Points`))}
  else if(x.k==='heal'){hp=Math.min(d.hpMax.v,hp+n);if(hp>0)c.ds={s:0,f:0};log(L(`Gyógyulás: +${n} ÉP → ${hp}`,`Healed ${n} HP → ${hp}`))}
  else{const t=Math.min(+c.temp||0,n);c.temp=(+c.temp||0)-t;hp=Math.max(0,hp-(n-t));log(L(`${n} sebzés → ${hp} ÉP`,`Took ${n} damage → ${hp} HP`)+(n-t>=d.hpMax.v+d.hp&&d.hp>0?L(' – azonnali halál (hatalmas sebzés)!',' – instant death (massive damage)!'):hp===0?L(' – 0 ÉP!',' – 0 HP!'):''))}
  c.hp=hp;ui.dhp='';touch();render()},
 dDeathSave(){const c=cur(),r=rnd(20);let t;if(r===20){c.hp=1;c.ds={s:0,f:0};t=L('Halálmentő: természetes 20 – 1 ÉP-vel magadhoz térsz!','Death save: natural 20 – you regain 1 HP!')}else if(r===1){c.ds.f=Math.min(3,c.ds.f+2);t=L('Halálmentő: természetes 1 – két kudarc','Death save: natural 1 – two failures')}else if(r>=10){c.ds.s=Math.min(3,c.ds.s+1);t=L(`Halálmentő: ${r} – siker`,`Death save: ${r} – success`)}else{c.ds.f=Math.min(3,c.ds.f+1);t=L(`Halálmentő: ${r} – kudarc`,`Death save: ${r} – failure`)}
  if(c.ds.f>=3)t+=L(' → a karakter meghal.',' → the character dies.');else if(c.ds.s>=3)t+=L(' → stabil.',' → stable.');log(t);ui.dmg={total:r,label:t,detail:''};touch();render()},
 dRollSet(x,el){const r=ui.droll;r[x.k]=el.value;if(x.k==='t')r.k=el.value==='skill'?'acrobatics':el.value==='flat'?'':'str';r.label='';r.weapon=null;render()},
 dRollAdv(x){ui.droll.adv=+x.v;render()},
 dRollClear(){ui.droll.label='';ui.droll.weapon=null;render()},
 dRollQ(x){ui.droll=Object.assign(ui.droll||{adv:0,mod:0,dc:''},{t:x.t,k:x.k,label:'',weapon:null});ui.tab='play';A.dRoll()},
 dRoll(){const c=cur(),d=dDerive(c),r=ui.droll;if(r.weapon!=null){const w=DND.wp[c.weapons[r.weapon]],a=dWeapon(c,d,w);return dD20(c,d,L('Támadás: ','Attack: ')+w.name,a.hit,{weapon:r.weapon})}
  if(r.t==='skill')return dD20(c,d,dP(DND.sk[r.k].name),d.skill[r.k]);if(r.t==='save')return dD20(c,d,dP(D_ABM[r.k].en)+' '+L('mentő','save'),d.save[r.k]);if(r.t==='check')return dD20(c,d,dP(D_ABM[r.k].en)+' '+L('próba','check'),d.mod[r.k]);dD20(c,d,'d20',0)},
 dAttack(x){const c=cur(),w=DND.wp[c.weapons[+x.i]];ui.droll=Object.assign(ui.droll||{adv:0,mod:0,dc:''},{weapon:+x.i,label:L('Támadás: ','Attack: ')+w.name});ui.tab='play';A.dRoll();window.scrollTo(0,0)},
 dDamage(x){const c=cur(),d=dDerive(c),w=DND.wp[c.weapons[+x.i]],a=dWeapon(c,d,w),crit=x.crit==='1',m=/(\d+)d(\d+)/.exec(w.dice)||[0,1,4],n=+m[1]*(crit?2:1);const dice=[];for(let i=0;i<n;i++)dice.push(rnd(+m[2]));
  const tot=Math.max(0,dice.reduce((q,v)=>q+v,0)+a.dmg);ui.dmg={total:tot,label:`${w.name} – ${w.dtype}${crit?' · '+L('kritikus','critical'):''}`,detail:`${n}d${m[2]}: [${dice.join(', ')}] ${sgn(a.dmg)}`};log(`${L('Sebzés','Damage')} (${w.name}): ${tot}`);ui.tab='play';touch();render()},
 dRest(x){const c=cur(),d=dDerive(c);if(x.t==='short'){ui.drest='short';if(c.classId==='warlock')c.slotsUsed=[0,0,0,0,0,0,0,0,0];log(L('Rövid pihenő','Short Rest'));touch();return render()}
  c.hp=null;c.temp=0;c.hdUsed=0;c.slotsUsed=[0,0,0,0,0,0,0,0,0];c.ds={s:0,f:0};c.exhaustion=Math.max(0,(+c.exhaustion||0)-1);ui.drest=null;log(L('Hosszú pihenő: minden ÉP, Életkocka és varázshely visszatért','Long Rest: all HP, Hit Dice and spell slots restored'));touch();render()},
 dRestEnd(){ui.drest=null;render()},
 dHitDie(){const c=cur(),d=dDerive(c),r=rnd(d.cls.hd),heal=Math.max(1,r+d.mod.con);c.hdUsed++;c.hp=Math.min(d.hpMax.v,d.hp+heal);log(L(`Életkocka: d${d.cls.hd}=${r} ${sgn(d.mod.con)} → +${heal} ÉP`,`Hit Die: d${d.cls.hd}=${r} ${sgn(d.mod.con)} → +${heal} HP`));touch();render()},
 dWeaponAdd(x,el){if(el.value){cur().weapons.push(el.value);touch();render()}},
 dWeaponDel(x){cur().weapons.splice(+x.i,1);touch();render()},
 dGearAdd(x,el){if(el.value==='')return;const g=DND.gear[+el.value];cur().items.push({name:g.name,qty:1,desc:g.desc});touch();render()},
 dSpFilter(x,el){ui.dsp[x.k]=el.value;render()},
 dSpellAdd(x){const c=cur(),s=DND.spl[x.id];c.spells.push({id:x.id,prep:s.lvl===0});touch();render()},
 dSpellDel(x){cur().spells.splice(+x.i,1);touch();render()},
 dSpellPrep(x){const s=cur().spells[+x.i];s.prep=!s.prep;touch();render()},
 dCast(x){const c=cur(),d=dDerive(c),s=DND.spl[c.spells[+x.i].id];if(!d.spell)return;let lv=-1;for(let i=s.lvl-1;i<9;i++)if(d.spell.slots[i]-(c.slotsUsed[i]||0)>0){lv=i;break}
  if(lv<0){ui.dmg={total:'–',label:L(`Nincs szabad varázshely ehhez: ${s.name}`,`No free spell slot for ${s.name}`),detail:''}}else{c.slotsUsed[lv]=(c.slotsUsed[lv]||0)+1;const t=L(`${s.name} elvarázsolva (${lv+1}. szintű hely)`,`Cast ${s.name} (level ${lv+1} slot)`)+(s.conc?L(' – koncentráció',' – concentration'):'');log(t);ui.dmg={total:lv+1,label:t,detail:''}}touch();render()},
 dLevel(x){const c=cur(),d=dDerive(c),n=clamp(d.lvl+ +x.d,1,20);if(n===d.lvl)return;const gain=d.cls.hd/2+1+d.mod.con;c.level=n;if(c.hp!=null)c.hp=Math.max(0,+c.hp+(+x.d>0?gain:-gain));c.asi=c.asi.filter(q=>q.level<=n);log(L(`Szint: ${n}`,`Level ${n}`));touch();render()},
 dAsi(x,el){const c=cur(),lv=+x.l;let e=c.asi.find(q=>q.level===lv);if(!e){e={level:lv,a:{},feat:''};c.asi.push(e)}e.a[x.a]=+el.value;touch();render()},
 dAsiFeat(x,el){const c=cur(),lv=+x.l;let e=c.asi.find(q=>q.level===lv);if(!e){e={level:lv,a:{},feat:''};c.asi.push(e)}e.feat=el.value;touch();render()}
});

boot();
