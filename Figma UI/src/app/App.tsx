/**
 * SmartKinetoFit — Full Design System
 * Cover · Design System · Mobile Patient (15 screens) · Mobile Trainer (6 screens)
 * Web Patient (2) · Web Trainer (2) · Web Admin (1) · Components · Flows
 * Visual: Solana Summit editorial — dark (P) + cream/light (L) variants
 */
import { useState } from "react";
import {
  Activity, AlertTriangle, ArrowLeft, Battery, Bell, Brain,
  CheckCircle, ChevronRight, ChevronDown, Clock, Cpu,
  Dumbbell, FileText, Home, Layers, LogOut, MessageCircle,
  Mic, Pause, Play, Plus, Search, SkipForward, Square,
  TrendingUp, Trash2, User, Users, Volume2, XCircle, Zap,
} from "lucide-react";
import {
  AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

// ── Palettes ────────────────────────────────────────────────
const P = {
  bg:"#0C0C18", card:"#111120", lift:"#18182A",
  border:"rgba(200,200,255,0.08)", dim:"rgba(200,200,255,0.035)",
  lime:"#D4FF00", text:"#E0E0EE", muted:"#6C6C88", faint:"#28283C",
  ok:"#00E87A", warn:"#FF9000", danger:"#FF3535",
} as const;
const L = {
  bg:"#EDE8DF", card:"#E4DFDA", surf:"#D9D3C9",
  border:"rgba(0,0,0,0.08)", dim:"rgba(0,0,0,0.04)",
  lime:"#D4FF00", text:"#0A0A0A", muted:"#5C5C5C", faint:"#AAAAAA",
} as const;

const DISP:React.CSSProperties = { fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, textTransform:"uppercase", letterSpacing:"-0.015em" };
const MONO:React.CSSProperties = { fontFamily:"JetBrains Mono,monospace", letterSpacing:"0.07em" };
const BODY:React.CSSProperties = { fontFamily:"Inter,sans-serif" };

// ── Data ────────────────────────────────────────────────────
const TRAJ = [
  {t:"0°",tr:0,pt:0},{t:"20°",tr:28,pt:20},{t:"40°",tr:56,pt:44},
  {t:"60°",tr:79,pt:65},{t:"75°",tr:88,pt:76},{t:"90°",tr:83,pt:71},
  {t:"110°",tr:60,pt:52},{t:"130°",tr:28,pt:24},{t:"135°",tr:8,pt:6},
];
const WEEK_ROM = [
  {d:"M",rom:62,pain:4},{d:"T",rom:67,pain:3},{d:"W",rom:65,pain:5},
  {d:"T",rom:73,pain:3},{d:"F",rom:79,pain:2},{d:"S",rom:76,pain:3},{d:"S",rom:83,pain:2},
];
const SESS_VOL = [
  {d:"M",s:58},{d:"T",s:72},{d:"W",s:65},{d:"T",s:88},{d:"F",s:94},{d:"S",s:47},{d:"S",s:39},
];
const PATIENTS = [
  {n:"01",name:"Alexandra Morgan", prog:"Shoulder Recovery",  last:"2h ago",   rom:"83°",q:86,st:"ACTIVE",  live:true},
  {n:"02",name:"Marcus Reed",      prog:"Knee Stabilisation", last:"Yesterday", rom:"67°",q:71,st:"REVIEW",  live:false},
  {n:"03",name:"Yuki Tanaka",      prog:"Lower Back Relief",  last:"3 days",    rom:"58°",q:64,st:"INACTIVE",live:false},
  {n:"04",name:"Diana Kovac",      prog:"Hip Flexor",         last:"Today",     rom:"72°",q:78,st:"ACTIVE",  live:true},
  {n:"05",name:"James Okonkwo",    prog:"Shoulder Recovery",  last:"1h ago",    rom:"79°",q:82,st:"ACTIVE",  live:true},
  {n:"06",name:"Priya Nair",       prog:"Core Stability",     last:"2 days",    rom:"74°",q:77,st:"ACTIVE",  live:false},
  {n:"07",name:"Thomas Baumann",   prog:"Knee Stabilisation", last:"Today",     rom:"61°",q:66,st:"REVIEW",  live:false},
];
const EXERCISES = [
  {n:"01",name:"Pendulum Swing",      part:"SHOULDER",diff:"EASY",  sets:3,reps:15},
  {n:"02",name:"Flexion Arc",         part:"SHOULDER",diff:"MEDIUM",sets:3,reps:12},
  {n:"03",name:"External Rotation",   part:"SHOULDER",diff:"MEDIUM",sets:2,reps:20},
  {n:"04",name:"Abduction Raise",     part:"SHOULDER",diff:"HARD",  sets:3,reps:10},
  {n:"05",name:"Scapular Retraction", part:"SHOULDER",diff:"EASY",  sets:2,reps:15},
  {n:"06",name:"Quad Sets",           part:"KNEE",    diff:"EASY",  sets:3,reps:15},
  {n:"07",name:"Terminal Knee Ext.",  part:"KNEE",    diff:"MEDIUM",sets:3,reps:12},
];
const PROGRAMS_DATA = [
  {name:"Shoulder Recovery",  weeks:8, exs:5,status:"IN_PROGRESS"},
  {name:"Knee Stabilisation", weeks:6, exs:4,status:"ACTIVE"},
  {name:"Lower Back Relief",  weeks:10,exs:6,status:"ACTIVE"},
  {name:"Hip Flexor Rehab",   weeks:8, exs:4,status:"COMPLETED"},
];

// ── Atoms ─────────────────────────────────────────────────────────────────────

function GridBg({light=false}:{light?:boolean}) {
  const c = light ? L.dim : P.dim;
  return (
    <div style={{position:"absolute",inset:0,pointerEvents:"none",zIndex:0,
      backgroundImage:`linear-gradient(${c} 1px,transparent 1px),linear-gradient(90deg,${c} 1px,transparent 1px)`,
      backgroundSize:"48px 48px"}} />
  );
}
function Cross({size=10,color=P.muted}:{size?:number;color?:string}) {
  const c=size/2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{display:"block",opacity:0.6,flexShrink:0}}>
      <line x1={c} y1="0" x2={c} y2={size} stroke={color} strokeWidth="0.8"/>
      <line x1="0" y1={c} x2={size} y2={c} stroke={color} strokeWidth="0.8"/>
    </svg>
  );
}
function Corners({color=P.lime,sz=9}:{color?:string;sz?:number}) {
  const h=sz/2;
  return (
    <>
      {([{top:-h,left:-h},{top:-h,right:-h},{bottom:-h,left:-h},{bottom:-h,right:-h}] as React.CSSProperties[]).map((s,i)=>(
        <div key={i} style={{position:"absolute",...s}}><Cross size={sz} color={color}/></div>
      ))}
    </>
  );
}
function Ticker({items,bg=P.lime,fg=P.bg}:{items:string[];bg?:string;fg?:string}) {
  const text=items.join("   ◆   ");
  return (
    <div style={{background:bg,height:26,overflow:"hidden",display:"flex",alignItems:"center",flexShrink:0}}>
      <div style={{display:"flex",animation:"ticker-scroll 24s linear infinite",whiteSpace:"nowrap"}}>
        {[0,1,2].map(k=>(
          <span key={k} style={{...MONO,fontSize:9,color:fg,fontWeight:700,paddingRight:64,flexShrink:0}}>{text}</span>
        ))}
      </div>
    </div>
  );
}
function SLabel({n,label,right,light=false}:{n:string;label:string;right?:string;light?:boolean}) {
  const bdr = light ? L.border : P.border;
  const lim = light ? "#5A4A00" : P.lime;
  const mut = light ? L.muted  : P.muted;
  return (
    <div style={{display:"flex",alignItems:"center",gap:10}}>
      <span style={{...MONO,fontSize:9,color:lim,fontWeight:700,flexShrink:0}}>{n}</span>
      <div style={{flex:1,height:1,background:bdr}}/>
      <span style={{...MONO,fontSize:9,color:mut,flexShrink:0}}>{label}</span>
      {right&&(<><div style={{width:1,height:10,background:bdr}}/><span style={{...MONO,fontSize:9,color:mut,flexShrink:0}}>{right}</span></>)}
    </div>
  );
}
function Btn({label,accent=false,fill=false,sm=false}:{label:string;accent?:boolean;fill?:boolean;sm?:boolean}) {
  return (
    <button style={{
      width:fill?"100%":"auto",background:accent?P.lime:"transparent",
      border:`1px solid ${accent?P.lime:P.border}`,borderRadius:0,
      padding:sm?"7px 14px":"12px 22px",...MONO,fontWeight:700,
      fontSize:sm?9:11,color:accent?P.bg:P.text,cursor:"pointer",
      letterSpacing:"0.1em",display:"flex",alignItems:"center",justifyContent:"center",
    }}>[ {label} ]</button>
  );
}
function Bar({value,color,h=3}:{value:number;color:string;h?:number}) {
  return (
    <div style={{height:h,background:P.faint,width:"100%",position:"relative"}}>
      <div style={{position:"absolute",inset:0,right:`${100-value}%`,background:color}}/>
    </div>
  );
}
function RepDot({ok}:{ok:boolean}) {
  return (
    <div style={{width:28,height:28,border:`1px solid ${ok?P.ok:P.danger}`,background:ok?`${P.ok}12`:`${P.danger}12`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
      {ok?<CheckCircle size={12} color={P.ok} strokeWidth={2}/>:<XCircle size={12} color={P.danger} strokeWidth={2}/>}
    </div>
  );
}
function Chip({label,active=false}:{label:string;active?:boolean}) {
  return (
    <div style={{padding:"6px 12px",border:`1px solid ${active?P.lime:P.border}`,background:active?`${P.lime}10`:P.lift,cursor:"pointer",flexShrink:0}}>
      <span style={{...MONO,fontSize:9,color:active?P.lime:P.muted,fontWeight:700}}>{label}</span>
    </div>
  );
}
function Field({label,placeholder,multiline=false}:{label:string;placeholder:string;multiline?:boolean}) {
  return (
    <div style={{marginBottom:14}}>
      <div style={{...MONO,fontSize:9,color:P.muted,letterSpacing:"0.1em",marginBottom:6}}>{label}</div>
      <div style={{background:P.lift,border:`1px solid ${P.border}`,padding:"11px 13px",
        fontFamily:"Inter,sans-serif",fontSize:14,color:P.muted,minHeight:multiline?76:undefined}}>{placeholder}</div>
    </div>
  );
}
function ScaleRow({label,value=4,color=P.lime}:{label:string;value?:number;color?:string}) {
  return (
    <div style={{marginBottom:16}}>
      <div style={{...MONO,fontSize:9,color:P.muted,marginBottom:8}}>{label}</div>
      <div style={{display:"flex",gap:3}}>
        {Array.from({length:11},(_,i)=>i).map(n=>(
          <div key={n} style={{flex:1,height:30,border:`1px solid ${n===value?color:P.border}`,background:n===value?`${color}20`:P.lift,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
            <span style={{...MONO,fontSize:8,color:n===value?color:P.muted,fontWeight:700}}>{n}</span>
          </div>
        ))}
      </div>
      <div style={{display:"flex",justifyContent:"space-between",marginTop:3}}>
        <span style={{...MONO,fontSize:7,color:P.faint}}>NONE</span>
        <span style={{...MONO,fontSize:7,color:P.faint}}>SEVERE</span>
      </div>
    </div>
  );
}

// ── Mobile shared ─────────────────────────────────────────────────────────────
function MStatus() {
  return (
    <div style={{height:44,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 18px",flexShrink:0}}>
      <span style={{...MONO,fontSize:12,color:P.text,fontWeight:600}}>9:41</span>
      <div style={{display:"flex",gap:6,alignItems:"center"}}>
        <Zap size={11} color={P.text}/><Battery size={13} color={P.text}/>
      </div>
    </div>
  );
}
function MNav({active}:{active:string}) {
  const tabs=[
    {id:"home",Icon:Home,label:"HOME"},{id:"programs",Icon:Dumbbell,label:"PROGRAMS"},
    {id:"progress",Icon:TrendingUp,label:"PROGRESS"},{id:"ai",Icon:Brain,label:"AI"},
    {id:"profile",Icon:User,label:"PROFILE"},
  ];
  return (
    <div style={{position:"absolute",bottom:0,left:0,right:0,height:72,background:P.bg,borderTop:`1px solid ${P.border}`,display:"flex",alignItems:"center",paddingBottom:8}}>
      {tabs.map(({id,Icon,label})=>(
        <div key={id} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4,cursor:"pointer"}}>
          <Icon size={18} color={id===active?P.lime:P.muted} strokeWidth={1.8}/>
          <span style={{...MONO,fontSize:7,color:id===active?P.lime:P.muted,letterSpacing:"0.1em"}}>{label}</span>
        </div>
      ))}
    </div>
  );
}
function TrainerMNav({active}:{active:string}) {
  const tabs=[
    {id:"home",Icon:Home,label:"HOME"},{id:"exercises",Icon:Dumbbell,label:"EXERCISES"},
    {id:"programs",Icon:Layers,label:"PROGRAMS"},{id:"patients",Icon:Users,label:"PATIENTS"},
    {id:"messages",Icon:MessageCircle,label:"MESSAGES"},
  ];
  return (
    <div style={{position:"absolute",bottom:0,left:0,right:0,height:72,background:P.bg,borderTop:`1px solid ${P.border}`,display:"flex",alignItems:"center",paddingBottom:8}}>
      {tabs.map(({id,Icon,label})=>(
        <div key={id} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4,cursor:"pointer"}}>
          <Icon size={18} color={id===active?P.lime:P.muted} strokeWidth={1.8}/>
          <span style={{...MONO,fontSize:7,color:id===active?P.lime:P.muted,letterSpacing:"0.1em"}}>{label}</span>
        </div>
      ))}
    </div>
  );
}
function MS({children,navActive="",role="patient",noNav=false}:{children:React.ReactNode;navActive?:string;role?:string;noNav?:boolean}) {
  return (
    <div style={{width:390,height:844,background:P.bg,position:"relative",overflow:"hidden",display:"flex",flexDirection:"column"}}>
      <GridBg/>{children}
      {!noNav&&(role==="trainer"?<TrainerMNav active={navActive}/>:<MNav active={navActive}/>)}
    </div>
  );
}

// ── Web shared ────────────────────────────────────────────────────────────────
function WebSidebar({role,active}:{role:"patient"|"trainer"|"admin";active:string}) {
  const navItems = {
    patient:["DASHBOARD","PROGRAMS","AI ASSISTANT","PROGRESS","MESSAGES","PROFILE"],
    trainer:["OVERVIEW","EXERCISES","PROGRAMS","PATIENTS","MESSAGES"],
    admin:  ["OVERVIEW","REVIEW QUEUE","USERS","NEWS & EVENTS"],
  };
  const nav = navItems[role];
  return (
    <div style={{width:200,background:P.bg,borderRight:`1px solid ${P.border}`,display:"flex",flexDirection:"column",flexShrink:0,position:"relative",zIndex:1}}>
      <div style={{padding:"22px 20px 16px",borderBottom:`1px solid ${P.border}`}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
          <Activity size={14} color={P.lime}/><span style={{...MONO,fontSize:12,color:P.text,fontWeight:700,letterSpacing:"0.12em"}}>SKF</span>
        </div>
        <div style={{...MONO,fontSize:8,color:P.muted,lineHeight:1.9}}>
          {role==="patient"?"ALEXANDRA MORGAN\nPATIENT":role==="trainer"?"DR. JAMES RIVERA\nPHYSIOTHERAPIST":"SYSTEM ADMIN"}
          <br/><span style={{color:P.faint}}>{role==="patient"?"ID #PT-00412":role==="trainer"?"ID #TR-00021":"ID #AD-00001"}</span>
        </div>
      </div>
      <div style={{flex:1,paddingTop:8}}>
        {nav.map((label,i)=>(
          <div key={label} style={{padding:"10px 20px",borderLeft:`2px solid ${label===active?P.lime:"transparent"}`,
            background:label===active?`${P.lime}08`:"transparent",cursor:"pointer",
            display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{...MONO,fontSize:10,color:label===active?P.lime:P.muted,letterSpacing:"0.08em",fontWeight:label===active?700:400}}>{label}</span>
            {label===active&&<div style={{width:4,height:4,background:P.lime}}/>}
          </div>
        ))}
      </div>
      <div style={{padding:"12px 20px",borderTop:`1px solid ${P.border}`}}>
        <div style={{...MONO,fontSize:8,color:P.faint,marginBottom:8}}>SYS STATUS</div>
        {[["BLE","UP"],["API","UP"],["AI","UP"]].map(([l,v])=>(
          <div key={l} style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
            <span style={{...MONO,fontSize:7,color:P.faint}}>{l}</span>
            <span style={{...MONO,fontSize:7,color:P.ok}}>● {v}</span>
          </div>
        ))}
        <div style={{marginTop:10,display:"flex",alignItems:"center",gap:6,cursor:"pointer"}}>
          <LogOut size={12} color={P.faint}/><span style={{...MONO,fontSize:8,color:P.faint}}>SIGN OUT</span>
        </div>
      </div>
    </div>
  );
}
function WebHeader({title,sub,actions}:{title:string;sub:string;actions?:React.ReactNode}) {
  const lines = title.split("\n");
  return (
    <div style={{padding:"0 32px",borderBottom:`1px solid ${P.border}`,flexShrink:0}}>
      <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",paddingTop:18,paddingBottom:12}}>
        <div style={{position:"relative"}}>
          <div style={{position:"absolute",top:0,left:0}}><Cross size={10} color={P.lime}/></div>
          <div style={{...MONO,fontSize:9,color:P.muted,letterSpacing:"0.14em",marginBottom:4,paddingLeft:14}}>{sub}</div>
          <div style={{...DISP,fontSize:58,lineHeight:0.86,color:P.text}}>
            {lines[0]}<br/><span style={{color:P.lime}}>{lines[1]}</span>
          </div>
        </div>
        {actions&&<div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:10,paddingBottom:4}}>{actions}</div>}
      </div>
    </div>
  );
}
function WP({role,active,children,ticker}:{role:"patient"|"trainer"|"admin";active:string;children:React.ReactNode;ticker?:string[]}) {
  return (
    <div style={{width:1440,height:900,background:P.bg,display:"flex",overflow:"hidden"}}>
      <GridBg/><WebSidebar role={role} active={active}/>
      <div style={{flex:1,overflow:"auto",display:"flex",flexDirection:"column",position:"relative",zIndex:1}}>
        {ticker&&<Ticker items={ticker}/>}{children}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// FULL-CANVAS: COVER (light/cream variant)
// ══════════════════════════════════════════════════════════════════════════════
function Cover() {
  return (
    <div style={{width:"100%",height:"100%",background:L.bg,position:"relative",overflow:"hidden",display:"flex",flexDirection:"column"}}>
      <GridBg light/>
      <div style={{padding:"18px 40px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${L.border}`,flexShrink:0,position:"relative",zIndex:1}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <Activity size={16} color={L.text}/><span style={{...MONO,fontSize:11,color:L.text,fontWeight:700,letterSpacing:"0.12em"}}>SMARTKINETOFIT</span>
        </div>
        <div style={{display:"flex",gap:6}}>
          {["MOBILE","WEB","BLE","ESP32","MPU6050"].map(t=>(
            <div key={t} style={{border:`1px solid ${L.border}`,padding:"4px 10px"}}><span style={{...MONO,fontSize:9,color:L.muted}}>{t}</span></div>
          ))}
        </div>
        <span style={{...MONO,fontSize:9,color:L.muted}}>DIPLOMA PROJECT · 2025</span>
      </div>
      <Ticker items={["PATIENT ROLE","TRAINER ROLE","ADMIN ROLE","BLE 5.0","ESP32-S3","MPU6050","ROM TRACKING","TRAJECTORY AI","REHABILITATION INTELLIGENCE"]} bg={L.text} fg={L.bg}/>
      <div style={{flex:1,display:"flex",alignItems:"center",padding:"0 40px",position:"relative",zIndex:1}}>
        <div style={{flex:1}}>
          <div style={{...MONO,fontSize:10,color:L.muted,letterSpacing:"0.14em",marginBottom:16}}>REHABILITATION INTELLIGENCE PLATFORM</div>
          <div style={{...DISP,fontSize:124,lineHeight:0.82,color:L.text,marginBottom:32}}>
            SMART<br/>KINETO<span style={{color:"#B8C900"}}>.</span><br/>FIT
          </div>
          <div style={{...BODY,fontSize:17,color:L.muted,lineHeight:1.6,maxWidth:500,marginBottom:32}}>
            A clinical rehabilitation platform powered by ESP32 + MPU6050 smart wand. Tracks ROM, repetitions, BLE status, movement trajectory, and recovery progress across patient and physiotherapist roles.
          </div>
          <div style={{display:"flex",gap:12}}>
            <div style={{border:`1px solid ${L.border}`,padding:"10px 20px",background:L.card,cursor:"pointer"}}>
              <span style={{...MONO,fontSize:10,color:L.text,fontWeight:700}}>[ VIEW DESIGN SYSTEM ]</span>
            </div>
            <div style={{border:`1px solid ${P.lime}`,padding:"10px 20px",background:P.lime,cursor:"pointer"}}>
              <span style={{...MONO,fontSize:10,color:L.text,fontWeight:700}}>[ MOBILE PATIENT ]</span>
            </div>
          </div>
        </div>
        <div style={{width:360,display:"flex",flexDirection:"column",gap:1,background:L.border}}>
          {[
            {label:"PLATFORM",   value:"iOS · Android · Web"},
            {label:"HARDWARE",   value:"ESP32-S3 + MPU6050"},
            {label:"PROTOCOL",   value:"BLE 5.0"},
            {label:"ROLES",      value:"Patient · Trainer · Admin"},
            {label:"SCREENS",    value:"30+ mobile + 15 web"},
            {label:"TRAJECTORY", value:"AI similarity matching"},
            {label:"STACK",      value:"React Native · React · Node"},
          ].map(({label,value})=>(
            <div key={label} style={{background:L.bg,padding:"11px 18px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{...MONO,fontSize:9,color:L.muted,letterSpacing:"0.1em"}}>{label}</span>
              <span style={{...MONO,fontSize:10,color:L.text,fontWeight:600}}>{value}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{padding:"12px 40px",borderTop:`1px solid ${L.border}`,display:"flex",justifyContent:"space-between",position:"relative",zIndex:1}}>
        <span style={{...MONO,fontSize:8,color:L.faint}}>SKF.DESIGN  ·  48.8°N 2.3°E</span>
        <div style={{display:"flex",gap:24}}>
          {[["30+","SCREENS"],["3","ROLES"],["2","PLATFORMS"],["1","WAND"]].map(([v,l])=>(
            <div key={l} style={{textAlign:"center"}}>
              <div style={{...DISP,fontSize:20,color:L.text}}>{v}</div>
              <div style={{...MONO,fontSize:8,color:L.muted}}>{l}</div>
            </div>
          ))}
        </div>
        <span style={{...MONO,fontSize:8,color:L.faint}}>v2.0 · FULL DESIGN SYSTEM</span>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// FULL-CANVAS: DESIGN SYSTEM
// ══════════════════════════════════════════════════════════════════════════════
function DesignSystem() {
  const palette = [
    {name:"Background",hex:"#070707",token:"P.bg"},{name:"Card",hex:"#0D0D0D",token:"P.card"},
    {name:"Lift",hex:"#161616",token:"P.lift"},{name:"Faint",hex:"#2E2E2E",token:"P.faint"},
    {name:"Muted",hex:"#7A7A7A",token:"P.muted"},{name:"Text",hex:"#F0F0F0",token:"P.text"},
    {name:"Lime",hex:"#D4FF00",token:"P.lime"},{name:"Ok",hex:"#00E87A",token:"P.ok"},
    {name:"Warn",hex:"#FF9000",token:"P.warn"},{name:"Danger",hex:"#FF3535",token:"P.danger"},
    {name:"Cream",hex:"#EDE8DF",token:"L.bg"},{name:"Cream text",hex:"#0A0A0A",token:"L.text"},
  ];
  return (
    <div style={{width:"100%",height:"100%",background:P.bg,overflowY:"auto",padding:"32px 40px"}}>
      <GridBg/>
      <div style={{position:"relative",zIndex:1}}>
        <div style={{...MONO,fontSize:11,color:P.lime,letterSpacing:"0.12em",marginBottom:8}}>01  DESIGN SYSTEM</div>
        <div style={{...DISP,fontSize:52,color:P.text,lineHeight:0.88,marginBottom:8}}>TOKENS &<br/><span style={{color:P.lime}}>TYPOGRAPHY</span></div>
        <p style={{...BODY,fontSize:15,color:P.muted,marginBottom:28}}>SmartKinetoFit visual language — dark editorial + cream light variant.</p>
        <SLabel n="01" label="COLOUR PALETTE"/>
        <div style={{marginTop:12,display:"flex",gap:10,flexWrap:"wrap",marginBottom:28}}>
          {palette.map(({name,hex,token})=>(
            <div key={hex} style={{width:108}}>
              <div style={{height:52,background:hex,border:`1px solid ${P.border}`,marginBottom:6,boxShadow:hex==="#D4FF00"?`0 0 20px #D4FF0030`:undefined}}/>
              <div style={{...BODY,fontSize:12,color:P.text,fontWeight:500,marginBottom:1}}>{name}</div>
              <div style={{...MONO,fontSize:9,color:P.muted}}>{hex}</div>
              <div style={{...MONO,fontSize:8,color:P.faint}}>{token}</div>
            </div>
          ))}
        </div>
        <SLabel n="02" label="TYPOGRAPHY SCALE"/>
        <div style={{marginTop:12,display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16,marginBottom:28}}>
          {[
            {fam:"Barlow Condensed",role:"Display / Headings",wt:"900",sample:"SHOULDER\nRECOVERY"},
            {fam:"Inter",role:"Body / UI Text",wt:"400–700",sample:"Precise, trustworthy,\nclinically accurate."},
            {fam:"JetBrains Mono",role:"Data / Sensor Labels",wt:"400–600",sample:"ROM: 68°\nBLE: CONNECTED"},
          ].map(({fam,role,wt,sample})=>(
            <div key={fam} style={{background:P.card,border:`1px solid ${P.border}`,padding:20}}>
              <div style={{...MONO,fontSize:8,color:P.lime,marginBottom:4}}>{fam.toUpperCase()}</div>
              <div style={{...MONO,fontSize:8,color:P.muted,marginBottom:10}}>{role} · {wt}</div>
              <div style={{fontFamily:`'${fam}',monospace,sans-serif`,fontSize:22,color:P.text,lineHeight:1.3,whiteSpace:"pre-line"}}>{sample}</div>
            </div>
          ))}
        </div>
        <SLabel n="03" label="COMPONENTS & TOKENS"/>
        <div style={{marginTop:12,display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16}}>
          <div style={{background:P.card,border:`1px solid ${P.border}`,padding:20}}>
            <div style={{...MONO,fontSize:9,color:P.muted,marginBottom:12}}>BUTTONS</div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              <Btn label="PRIMARY CTA" accent fill/><Btn label="SECONDARY" fill/>
              <div style={{background:P.danger,padding:"10px",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
                <span style={{...MONO,fontSize:10,color:P.text,fontWeight:700}}>[ DANGER ACTION ]</span>
              </div>
            </div>
          </div>
          <div style={{background:P.card,border:`1px solid ${P.border}`,padding:20}}>
            <div style={{...MONO,fontSize:9,color:P.muted,marginBottom:12}}>BADGES & STATUS</div>
            <div style={{display:"flex",flexDirection:"column",gap:7}}>
              {[{l:"ACTIVE",c:P.ok},{l:"IN PROGRESS",c:P.warn},{l:"CALIBRATED",c:P.lime},{l:"REVIEW",c:P.danger},{l:"INACTIVE",c:P.muted},{l:"BLE · CONNECTED",c:P.ok}].map(({l,c})=>(
                <div key={l} style={{border:`1px solid ${c}`,padding:"3px 10px",display:"inline-flex",alignSelf:"flex-start"}}>
                  <span style={{...MONO,fontSize:9,color:c,fontWeight:700}}>{l}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{background:P.card,border:`1px solid ${P.border}`,padding:20}}>
            <div style={{...MONO,fontSize:9,color:P.muted,marginBottom:12}}>PROGRESS BARS</div>
            {[{l:"TRAINER SIMILARITY",v:70,c:P.warn},{l:"TRAJECTORY QUALITY",v:75,c:P.lime},{l:"SESSION PROGRESS",v:40,c:P.ok},{l:"ROM TARGET",v:91,c:P.danger}].map(({l,v,c})=>(
              <div key={l} style={{marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                  <span style={{...MONO,fontSize:8,color:P.muted}}>{l}</span>
                  <span style={{...MONO,fontSize:8,color:c,fontWeight:700}}>{v}%</span>
                </div>
                <Bar value={v} color={c} h={3}/>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MOBILE PATIENT SCREENS
// ══════════════════════════════════════════════════════════════════════════════

function Splash() {
  return (
    <MS noNav>
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:20,position:"relative",zIndex:1}}>
        <div style={{position:"absolute",width:280,height:280,borderRadius:"50%",background:`radial-gradient(circle,${P.lime}15 0%,transparent 70%)`,top:"15%",left:"50%",transform:"translateX(-50%)"}}/>
        <div style={{...MONO,fontSize:10,color:P.muted,letterSpacing:"0.14em",position:"relative"}}>48.8°N · 2.3°E</div>
        <div style={{...DISP,fontSize:64,lineHeight:0.88,color:P.text,textAlign:"center",position:"relative"}}>
          SMART<br/>KINETO<br/><span style={{color:P.lime}}>FIT</span>
        </div>
        <div style={{...MONO,fontSize:10,color:P.muted,letterSpacing:"0.12em",position:"relative"}}>REHABILITATION INTELLIGENCE</div>
        <div style={{display:"flex",gap:8,marginTop:14,position:"relative"}}>
          {[["ESP32",true],["MPU6050",false],["BLE",false]].map(([l,ok])=>(
            <div key={String(l)} style={{display:"flex",alignItems:"center",gap:5,border:`1px solid ${P.border}`,padding:"4px 10px",background:P.card}}>
              <div style={{width:5,height:5,background:ok?P.ok:P.faint}}/><span style={{...MONO,fontSize:8,color:ok?P.ok:P.faint}}>{l}</span>
            </div>
          ))}
        </div>
        <div style={{...MONO,fontSize:9,color:P.faint,letterSpacing:"0.1em",position:"relative"}}>INITIALIZING SENSOR SUITE...</div>
      </div>
    </MS>
  );
}

function Login() {
  return (
    <MS noNav>
      <div style={{position:"absolute",width:250,height:250,borderRadius:"50%",background:`radial-gradient(circle,${P.lime}10 0%,transparent 70%)`,top:-60,right:-60,zIndex:0}}/>
      <MStatus/>
      <div style={{flex:1,overflow:"auto",padding:"16px 18px",position:"relative",zIndex:1}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:30}}>
          <Activity size={14} color={P.lime}/><span style={{...MONO,fontSize:10,color:P.text,fontWeight:700,letterSpacing:"0.12em"}}>SKF</span>
        </div>
        <div style={{...MONO,fontSize:9,color:P.muted,marginBottom:6,letterSpacing:"0.12em"}}>REHABILITATION PLATFORM</div>
        <div style={{...DISP,fontSize:48,lineHeight:0.86,color:P.text,marginBottom:8}}>WELCOME<br/><span style={{color:P.lime}}>BACK</span></div>
        <p style={{...BODY,fontSize:14,color:P.muted,marginBottom:26}}>Sign in to your rehabilitation account</p>
        <Field label="EMAIL" placeholder="alex.morgan@rehab.clinic"/>
        <Field label="PASSWORD" placeholder="••••••••••••"/>
        <div style={{display:"flex",justifyContent:"flex-end",marginBottom:18}}>
          <span style={{...MONO,fontSize:10,color:P.lime,cursor:"pointer"}}>FORGOT PASSWORD?</span>
        </div>
        <Btn label="SIGN IN" accent fill/>
        <div style={{display:"flex",alignItems:"center",gap:12,margin:"14px 0"}}>
          <div style={{flex:1,height:1,background:P.border}}/><span style={{...MONO,fontSize:9,color:P.muted}}>OR</span>
          <div style={{flex:1,height:1,background:P.border}}/>
        </div>
        <Btn label="HEALTHCARE SSO" fill/>
        <div style={{textAlign:"center",marginTop:22}}>
          <span style={{...BODY,fontSize:14,color:P.muted}}>New patient? </span>
          <span style={{...MONO,fontSize:10,color:P.lime,cursor:"pointer"}}>CREATE ACCOUNT</span>
        </div>
      </div>
    </MS>
  );
}

function Register() {
  return (
    <MS noNav>
      <MStatus/>
      <div style={{padding:"0 18px 10px",display:"flex",alignItems:"center",gap:10,borderBottom:`1px solid ${P.border}`,flexShrink:0,position:"relative",zIndex:1}}>
        <ArrowLeft size={18} color={P.muted}/>
        <span style={{...MONO,fontSize:10,color:P.muted,letterSpacing:"0.08em"}}>CREATE ACCOUNT</span>
        <div style={{flex:1}}/>
        <div style={{border:`1px solid ${P.border}`,padding:"2px 8px"}}><span style={{...MONO,fontSize:9,color:P.muted}}>STEP 2/3</span></div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"16px 18px",position:"relative",zIndex:1}}>
        <div style={{...DISP,fontSize:40,lineHeight:0.86,color:P.text,marginBottom:6}}>SELECT<br/><span style={{color:P.lime}}>ROLE</span></div>
        <p style={{...BODY,fontSize:13,color:P.muted,marginBottom:18}}>Determines your dashboard and permissions</p>
        <div style={{display:"flex",flexDirection:"column",gap:1,background:P.border,marginBottom:18}}>
          {[{id:"patient",label:"PATIENT",desc:"Track my rehabilitation journey",active:true},
            {id:"trainer",label:"TRAINER / PT",desc:"Manage patients & programs",active:false},
            {id:"admin",label:"ADMIN",desc:"Clinical oversight",active:false}].map(r=>(
            <div key={r.id} style={{background:r.active?`${P.lime}10`:P.bg,borderLeft:r.active?`2px solid ${P.lime}`:"2px solid transparent",padding:"13px 16px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                <span style={{...MONO,fontSize:11,color:r.active?P.lime:P.text,fontWeight:700}}>{r.label}</span>
                {r.active&&<div style={{border:`1px solid ${P.lime}`,padding:"1px 8px"}}><span style={{...MONO,fontSize:8,color:P.lime}}>SELECTED</span></div>}
              </div>
              <span style={{...BODY,fontSize:13,color:P.muted}}>{r.desc}</span>
            </div>
          ))}
        </div>
        <Field label="FULL NAME" placeholder="Alexandra Morgan"/>
        <Field label="EMAIL" placeholder="a.morgan@email.com"/>
        <Field label="PASSWORD" placeholder="Min 8 chars"/>
        <Btn label="CREATE ACCOUNT" accent fill/>
      </div>
    </MS>
  );
}

function PatientHome() {
  return (
    <MS navActive="home">
      <MStatus/>
      <div style={{padding:"0 18px 10px",borderBottom:`1px solid ${P.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,position:"relative",zIndex:1}}>
        <div>
          <div style={{...MONO,fontSize:9,color:P.muted,letterSpacing:"0.08em"}}>GOOD MORNING</div>
          <div style={{...DISP,fontSize:22,color:P.text}}>ALEXANDRA M.</div>
        </div>
        <div style={{width:36,height:36,borderRadius:"50%",background:`linear-gradient(135deg,${P.lime},${P.ok})`,display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
          <User size={18} color={P.bg}/>
          <div style={{position:"absolute",top:-2,right:-2,width:12,height:12,borderRadius:"50%",background:P.danger,border:`2px solid ${P.bg}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <span style={{fontSize:7,color:P.text,fontWeight:700}}>3</span>
          </div>
        </div>
      </div>
      <Ticker items={["BLE · CONNECTED","MPU6050 · ACTIVE","BATTERY · 78%","CALIBRATED","SHOULDER RECOVERY · WEEK 3/8"]}/>
      <div style={{flex:1,overflowY:"auto",position:"relative",zIndex:1}}>
        <div style={{padding:"16px 18px 12px",borderBottom:`1px solid ${P.border}`,position:"relative"}}>
          <div style={{position:"absolute",top:10,left:10}}><Cross size={10} color={P.lime}/></div>
          <div style={{position:"absolute",top:10,right:10}}><Cross size={10} color={P.lime}/></div>
          <div style={{...MONO,fontSize:8,color:P.muted,marginBottom:5}}>WEEK 03/08  ·  DR. JAMES RIVERA</div>
          <div style={{...DISP,fontSize:72,lineHeight:0.86,color:P.text,marginBottom:12}}>SHOULDER<br/><span style={{color:P.lime}}>RECOVERY</span></div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
            <div style={{border:`1px solid ${P.ok}`,padding:"2px 8px",display:"flex",alignItems:"center",gap:5}}>
              <div style={{width:5,height:5,background:P.ok}}/><span style={{...MONO,fontSize:9,color:P.ok,fontWeight:700}}>ACTIVE</span>
            </div>
            <div style={{border:`1px solid ${P.border}`,padding:"2px 8px"}}><span style={{...MONO,fontSize:9,color:P.muted}}>2/5 DONE</span></div>
            <div style={{border:`1px solid ${P.border}`,padding:"2px 8px"}}><span style={{...MONO,fontSize:9,color:P.muted}}>35 MIN</span></div>
          </div>
          <Bar value={40} color={P.lime} h={2}/>
        </div>
        <div style={{margin:"14px 18px 0",border:`1px solid ${P.border}`,padding:"14px 16px",position:"relative"}}>
          <Corners color={P.lime} sz={9}/>
          <div style={{...MONO,fontSize:9,color:P.muted,marginBottom:6}}>NEXT UP — EXERCISE 03/05</div>
          <div style={{...DISP,fontSize:24,color:P.text,marginBottom:4}}>External Rotation</div>
          <div style={{display:"flex",gap:12,marginBottom:12}}>
            <span style={{...MONO,fontSize:9,color:P.muted}}>2 × 20 REPS</span><span style={{...MONO,fontSize:9,color:P.muted}}>SHOULDER</span>
          </div>
          <Btn label="BEGIN SESSION" accent fill/>
        </div>
        <div style={{margin:"14px 18px 0"}}>
          <SLabel n="01" label="WAND · ESP32-S3"/>
          <div style={{marginTop:8,border:`1px solid ${P.border}`,padding:"10px 14px",display:"flex",flexWrap:"wrap"}}>
            {[["BLE","CONN",true],["MPU6050","ACTIVE",true],["BATT","78%",true],["FW","v2.4.1",true],["SIG","–62dBm",true]].map(([l,v,ok])=>(
              <div key={String(l)} style={{display:"flex",alignItems:"center",gap:5,paddingRight:14,paddingBottom:3}}>
                <div style={{width:5,height:5,background:ok?P.ok:P.danger,flexShrink:0}}/>
                <span style={{...MONO,fontSize:8,color:P.muted}}>{l}</span>
                <span style={{...MONO,fontSize:9,color:P.text,fontWeight:600}}>{v}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{margin:"14px 18px 0"}}>
          <SLabel n="02" label="RECOVERY METRICS"/>
          <div style={{marginTop:8,display:"flex",border:`1px solid ${P.border}`}}>
            {[{l:"AVG ROM",v:"76°",c:P.lime},{l:"QUALITY",v:"82%",c:P.ok},{l:"STREAK",v:"12d",c:P.text}].map((m,i)=>(
              <div key={m.l} style={{flex:1,padding:"12px 10px",borderRight:i<2?`1px solid ${P.border}`:"none"}}>
                <div style={{...MONO,fontSize:8,color:P.muted,marginBottom:4}}>{m.l}</div>
                <div style={{...DISP,fontSize:28,color:m.c,lineHeight:1}}>{m.v}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{margin:"14px 18px 0"}}>
          <SLabel n="03" label="EXERCISE QUEUE"/>
          <div style={{marginTop:8,border:`1px solid ${P.border}`}}>
            {[["01","Pendulum Swing","3×15",true,false],["02","Flexion Arc","3×12",true,false],
              ["03","External Rotation","2×20",false,true],["04","Abduction Raise","3×10",false,false],
              ["05","Scapular Retraction","2×15",false,false]].map(([n,name,sets,done,active],i)=>(
              <div key={String(n)} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 14px",
                borderBottom:i<4?"1px solid rgba(255,255,255,0.04)":"none",
                borderLeft:active?`2px solid ${P.lime}`:"2px solid transparent",background:active?`${P.lime}08`:"transparent"}}>
                <span style={{...MONO,fontSize:9,fontWeight:700,width:20,flexShrink:0,color:done?P.faint:active?P.lime:P.muted}}>{n}</span>
                <div style={{flex:1}}>
                  <div style={{...BODY,fontSize:13,color:done?P.faint:P.text,textDecoration:done?"line-through":"none"}}>{String(name)}</div>
                  <div style={{...MONO,fontSize:9,color:P.muted}}>{String(sets)} REPS</div>
                </div>
                {done&&<CheckCircle size={13} color={P.ok}/>}
                {active&&<ChevronRight size={14} color={P.lime}/>}
              </div>
            ))}
          </div>
        </div>
        <div style={{margin:"14px 18px 0",paddingBottom:90}}>
          <SLabel n="04" label="ROM TREND · 7 DAYS" right="TARGET: 85°"/>
          <div style={{marginTop:8,border:`1px solid ${P.border}`,padding:"10px 6px 4px"}}>
            <ResponsiveContainer width="100%" height={80}>
              <AreaChart data={WEEK_ROM} margin={{top:2,right:4,left:-24,bottom:0}}>
                <defs>
                  <linearGradient id="gPH" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={P.lime} stopOpacity={0.28}/><stop offset="95%" stopColor={P.lime} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={P.dim} strokeDasharray="4 4"/>
                <XAxis dataKey="d" tick={{fontSize:8,fill:P.muted,fontFamily:"JetBrains Mono"}}/>
                <YAxis tick={{fontSize:8,fill:P.muted,fontFamily:"JetBrains Mono"}}/>
                <Area type="monotone" dataKey="rom" stroke={P.lime} fill="url(#gPH)" strokeWidth={1.5} dot={false}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </MS>
  );
}

function Programs() {
  return (
    <MS navActive="programs">
      <MStatus/>
      <div style={{padding:"0 18px 10px",borderBottom:`1px solid ${P.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,position:"relative",zIndex:1}}>
        <div style={{...DISP,fontSize:22,color:P.text}}>MY PROGRAMS</div><Btn label="BROWSE" sm/>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"14px 18px",paddingBottom:90,position:"relative",zIndex:1,display:"flex",flexDirection:"column",gap:1,background:P.border}}>
        {PROGRAMS_DATA.map(p=>{
          const sMeta:{[k:string]:{label:string;color:string}} = {ACTIVE:{label:"Not started",color:P.muted},IN_PROGRESS:{label:"In progress",color:P.warn},PAUSED:{label:"Paused",color:P.muted},COMPLETED:{label:"Completed",color:P.ok}};
          const sm = sMeta[p.status];
          return (
            <div key={p.name} style={{background:P.bg,borderLeft:p.status==="IN_PROGRESS"?`2px solid ${P.lime}`:"2px solid transparent",padding:"14px 16px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                <div style={{...DISP,fontSize:20,color:P.text}}>{p.name}</div>
                <div style={{border:`1px solid ${sm.color}`,padding:"2px 7px"}}><span style={{...MONO,fontSize:8,color:sm.color}}>{sm.label.toUpperCase()}</span></div>
              </div>
              <div style={{display:"flex",gap:16,marginBottom:10}}>
                <span style={{...MONO,fontSize:9,color:P.muted}}>{p.weeks} WEEKS</span>
                <span style={{...MONO,fontSize:9,color:P.muted}}>{p.exs} EXERCISES</span>
              </div>
              <Bar value={p.status==="COMPLETED"?100:p.status==="IN_PROGRESS"?45:0} color={sm.color} h={2}/>
            </div>
          );
        })}
      </div>
    </MS>
  );
}

function ProgramDetail() {
  return (
    <MS noNav>
      <MStatus/>
      <div style={{padding:"0 18px 10px",display:"flex",alignItems:"center",gap:10,borderBottom:`1px solid ${P.border}`,flexShrink:0,position:"relative",zIndex:1}}>
        <ArrowLeft size={18} color={P.muted}/><span style={{...MONO,fontSize:10,color:P.muted}}>PROGRAM DETAIL</span>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"16px 18px",position:"relative",zIndex:1}}>
        <div style={{...DISP,fontSize:40,lineHeight:0.86,color:P.text,marginBottom:6}}>SHOULDER<br/><span style={{color:P.lime}}>RECOVERY</span></div>
        <div style={{...BODY,fontSize:13,color:P.lime,fontWeight:700,marginBottom:4}}>by Dr. James Rivera</div>
        <div style={{...BODY,fontSize:13,color:P.muted,marginBottom:12}}>8-week progressive shoulder rehabilitation targeting external rotation, flexion arc, and scapular stability.</div>
        <div style={{display:"flex",gap:8,marginBottom:18}}>
          <div style={{border:`1px solid ${P.warn}`,padding:"2px 8px"}}><span style={{...MONO,fontSize:9,color:P.warn}}>IN PROGRESS</span></div>
          <div style={{border:`1px solid ${P.border}`,padding:"2px 8px"}}><span style={{...MONO,fontSize:9,color:P.muted}}>5 EXERCISES</span></div>
        </div>
        <Btn label="MARK PROGRAM COMPLETE" fill/>
        <div style={{...MONO,fontSize:10,color:P.muted,letterSpacing:"0.08em",marginTop:18,marginBottom:10}}>TAP AN EXERCISE TO START</div>
        <div style={{display:"flex",flexDirection:"column",gap:1,background:P.border}}>
          {EXERCISES.slice(0,5).map((ex,i)=>(
            <div key={ex.n} style={{background:P.bg,padding:"12px 14px",display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:22,height:22,background:P.lift,border:`1px solid ${P.border}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <span style={{...MONO,fontSize:9,color:P.muted,fontWeight:700}}>{i+1}</span>
              </div>
              <div style={{flex:1}}>
                <div style={{...BODY,fontSize:14,color:P.text,fontWeight:500}}>{ex.name}</div>
                <div style={{...MONO,fontSize:9,color:P.muted}}>{ex.sets} SETS × {ex.reps} REPS</div>
              </div>
              <Play size={20} color={P.lime}/>
            </div>
          ))}
        </div>
      </div>
    </MS>
  );
}

function ExercisePlayer() {
  return (
    <MS noNav>
      <MStatus/>
      <div style={{padding:"0 18px 10px",display:"flex",alignItems:"center",gap:10,borderBottom:`1px solid ${P.border}`,flexShrink:0,position:"relative",zIndex:1}}>
        <ArrowLeft size={18} color={P.muted}/><span style={{...MONO,fontSize:10,color:P.muted}}>EXERCISE PLAYER</span>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"16px 18px",position:"relative",zIndex:1}}>
        <div style={{width:"100%",aspectRatio:"16/9",background:P.lift,border:`1px solid ${P.border}`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10,marginBottom:16,position:"relative",overflow:"hidden"}}>
          <GridBg/>
          <div style={{width:56,height:56,borderRadius:"50%",background:`${P.lime}20`,border:`2px solid ${P.lime}50`,display:"flex",alignItems:"center",justifyContent:"center",position:"relative",zIndex:1}}>
            <Play size={26} color={P.lime} fill={P.lime}/>
          </div>
          <span style={{...MONO,fontSize:10,color:P.muted,position:"relative",zIndex:1}}>TRAINER DEMO VIDEO</span>
          <div style={{position:"absolute",top:10,right:10,border:`1px solid ${P.danger}`,padding:"2px 6px"}}>
            <span style={{...MONO,fontSize:8,color:P.danger}}>LIVE</span>
          </div>
        </div>
        <div style={{...DISP,fontSize:28,color:P.text,marginBottom:4}}>External Rotation</div>
        <div style={{display:"flex",gap:8,marginBottom:16}}>
          <div style={{border:`1px solid ${P.border}`,padding:"2px 8px"}}><span style={{...MONO,fontSize:9,color:P.muted}}>SHOULDER</span></div>
          <div style={{border:`1px solid ${P.warn}`,padding:"2px 8px"}}><span style={{...MONO,fontSize:9,color:P.warn}}>MEDIUM</span></div>
        </div>
        <SLabel n="01" label="INSTRUCTIONS"/>
        <div style={{marginTop:10,display:"flex",flexDirection:"column",gap:8}}>
          {["Stand upright, elbow bent 90° at your side","Hold wand horizontally with both hands","Rotate outward to 75° — do not shrug","Return slowly over 3 seconds"].map((s,i)=>(
            <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start"}}>
              <div style={{width:20,height:20,border:`1px solid ${P.lime}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2}}>
                <span style={{...MONO,fontSize:9,color:P.lime,fontWeight:700}}>{i+1}</span>
              </div>
              <span style={{...BODY,fontSize:13,color:P.text,lineHeight:1.5}}>{s}</span>
            </div>
          ))}
        </div>
        <div style={{marginTop:18}}><Btn label="START LIVE BLE SESSION" accent fill/></div>
      </div>
    </MS>
  );
}

function LiveSession() {
  const reps=[true,true,false,true,true,true,false];
  return (
    <MS noNav>
      <div style={{background:P.card,borderBottom:`1px solid ${P.border}`,padding:"9px 16px",display:"flex",alignItems:"center",gap:8,flexShrink:0,position:"relative",zIndex:1}}>
        <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:5,height:5,background:P.ok}}/><span style={{...MONO,fontSize:9,color:P.ok,fontWeight:700}}>BLE</span></div>
        <div style={{width:1,height:10,background:P.border}}/>
        <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:5,height:5,background:P.ok}}/><Cpu size={10} color={P.muted}/><span style={{...MONO,fontSize:9,color:P.muted}}>MPU6050</span></div>
        <div style={{width:1,height:10,background:P.border}}/>
        <Battery size={11} color={P.warn}/><span style={{...MONO,fontSize:9,color:P.warn}}>78%</span>
        <div style={{flex:1}}/>
        <div style={{border:`1px solid ${P.lime}`,padding:"1px 8px"}}><span style={{...MONO,fontSize:8,color:P.lime,fontWeight:700}}>CALIBRATED</span></div>
        <div style={{width:1,height:10,background:P.border}}/>
        <Clock size={10} color={P.muted}/><span style={{...MONO,fontSize:9,color:P.lime,fontWeight:700}}>04:32</span>
      </div>
      <Ticker items={["LIVE SESSION","SET 2 OF 3","EXTERNAL ROTATION","EXERCISE 3/5","DR. JAMES RIVERA"]}/>
      <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",position:"relative",zIndex:1}}>
        <div style={{padding:"12px 18px 10px",borderBottom:`1px solid ${P.border}`,position:"relative",flexShrink:0}}>
          <div style={{position:"absolute",top:8,left:10}}><Cross size={10} color={P.lime}/></div>
          <div style={{position:"absolute",top:8,right:10}}><Cross size={10} color={P.lime}/></div>
          <div style={{...MONO,fontSize:8,color:P.muted,marginBottom:4}}>LIVE · EXERCISE 3/5 · SET 2/3</div>
          <div style={{...DISP,fontSize:62,lineHeight:0.86,color:P.text,marginBottom:6}}>EXTERNAL<br/><span style={{color:P.lime}}>ROTATION</span></div>
        </div>
        <div style={{display:"flex",borderBottom:`1px solid ${P.border}`,flexShrink:0}}>
          <div style={{flex:1,padding:"12px 16px",borderRight:`1px solid ${P.border}`}}>
            <div style={{...MONO,fontSize:8,color:P.muted,marginBottom:3}}>REP COUNTER</div>
            <div style={{display:"flex",alignItems:"baseline",gap:5}}>
              <div style={{...DISP,fontSize:60,color:P.lime,lineHeight:1}}>07</div>
              <div><div style={{...MONO,fontSize:10,color:P.muted}}>/12</div><div style={{...MONO,fontSize:8,color:P.faint}}>TARGET</div></div>
            </div>
            <Bar value={58} color={P.lime} h={2}/>
          </div>
          <div style={{flex:1,padding:"12px 16px"}}>
            <div style={{...MONO,fontSize:8,color:P.muted,marginBottom:3}}>LIVE ROM</div>
            <div style={{display:"flex",alignItems:"baseline",gap:5}}>
              <div style={{...DISP,fontSize:60,color:P.text,lineHeight:1}}>68°</div>
              <div><div style={{...MONO,fontSize:10,color:P.muted}}>/75°</div><div style={{...MONO,fontSize:8,color:P.faint}}>TARGET</div></div>
            </div>
            <Bar value={91} color={P.warn} h={2}/>
          </div>
        </div>
        <div style={{padding:"10px 18px",borderBottom:`1px solid ${P.border}`,flexShrink:0}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
            <div style={{display:"flex",alignItems:"center",gap:7}}><span style={{...MONO,fontSize:9,color:P.lime,fontWeight:700}}>01</span><span style={{...MONO,fontSize:9,color:P.muted}}>TRAINER SIMILARITY</span></div>
            <div style={{border:`1px solid ${P.warn}`,padding:"2px 8px"}}><span style={{...MONO,fontSize:11,color:P.warn,fontWeight:700}}>70%</span></div>
          </div>
          <Bar value={70} color={P.warn} h={3}/>
          <div style={{...MONO,fontSize:8,color:P.muted,marginTop:4}}>FAIR — EXTEND ARC BY 8°</div>
        </div>
        <div style={{padding:"10px 18px",borderBottom:`1px solid ${P.border}`,flexShrink:0}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
            <div style={{display:"flex",alignItems:"center",gap:7}}><span style={{...MONO,fontSize:9,color:P.lime,fontWeight:700}}>02</span><span style={{...MONO,fontSize:9,color:P.muted}}>TRAJECTORY QUALITY</span></div>
            <div style={{border:`1px solid ${P.lime}`,padding:"2px 8px"}}><span style={{...MONO,fontSize:11,color:P.lime,fontWeight:700}}>75%</span></div>
          </div>
          <Bar value={75} color={P.lime} h={3}/>
          <div style={{...MONO,fontSize:8,color:P.muted,marginTop:4}}>GOOD — MAINTAIN CURRENT PACE</div>
        </div>
        <div style={{padding:"10px 18px 6px",borderBottom:`1px solid ${P.border}`,flexShrink:0}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
            <div style={{display:"flex",alignItems:"center",gap:7}}><span style={{...MONO,fontSize:9,color:P.lime,fontWeight:700}}>03</span><span style={{...MONO,fontSize:9,color:P.muted}}>TRAJECTORY OVERLAY</span></div>
            <div style={{display:"flex",gap:10}}>
              <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:12,height:2,background:P.lime}}/><span style={{...MONO,fontSize:7,color:P.muted}}>YOU</span></div>
              <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:12,height:0,borderTop:`1.5px dashed ${P.muted}`}}/><span style={{...MONO,fontSize:7,color:P.muted}}>TRAINER</span></div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={80}>
            <LineChart data={TRAJ} margin={{top:0,right:4,left:-22,bottom:0}}>
              <CartesianGrid stroke={P.dim} strokeDasharray="3 3"/>
              <XAxis dataKey="t" tick={{fontSize:7,fill:P.muted,fontFamily:"JetBrains Mono"}}/>
              <YAxis tick={{fontSize:7,fill:P.muted,fontFamily:"JetBrains Mono"}}/>
              <Tooltip contentStyle={{background:P.card,border:`1px solid ${P.border}`,fontFamily:"JetBrains Mono",fontSize:10,borderRadius:0}}/>
              <Line type="monotone" dataKey="tr" stroke={P.muted} strokeWidth={1.5} strokeDasharray="4 3" dot={false}/>
              <Line type="monotone" dataKey="pt" stroke={P.lime} strokeWidth={2} dot={false}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={{padding:"10px 18px",borderBottom:`1px solid ${P.border}`,flexShrink:0}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
            <span style={{...MONO,fontSize:9,color:P.muted}}>REP HISTORY</span>
            <div style={{display:"flex",gap:8}}>
              <div style={{border:`1px solid ${P.ok}`,padding:"1px 7px"}}><span style={{...MONO,fontSize:8,color:P.ok}}>5 OK</span></div>
              <div style={{border:`1px solid ${P.danger}`,padding:"1px 7px"}}><span style={{...MONO,fontSize:8,color:P.danger}}>2 ✗</span></div>
            </div>
          </div>
          <div style={{display:"flex",gap:5}}>{reps.map((ok,i)=><RepDot key={i} ok={ok}/>)}</div>
        </div>
        <div style={{padding:"9px 18px",borderBottom:`1px solid ${P.border}`,display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
          <Volume2 size={13} color={P.lime}/><span style={{...MONO,fontSize:8,color:P.muted,flex:1}}>VOICE FEEDBACK</span>
          <div style={{border:`1px solid ${P.ok}`,padding:"1px 6px"}}><span style={{...MONO,fontSize:8,color:P.ok}}>ON</span></div>
          <span style={{...MONO,fontSize:8,color:P.warn}}>Extend — 8° short</span>
        </div>
        <div style={{padding:"10px 18px",display:"flex",gap:8,flexShrink:0}}>
          <Btn label="PAUSE" fill sm/><Btn label="END" fill sm/><Btn label="SKIP →" accent fill sm/>
        </div>
      </div>
    </MS>
  );
}

function Trajectory() {
  return (
    <MS noNav>
      <MStatus/>
      <div style={{padding:"0 18px 10px",display:"flex",alignItems:"center",gap:10,borderBottom:`1px solid ${P.border}`,flexShrink:0,position:"relative",zIndex:1}}>
        <ArrowLeft size={18} color={P.muted}/><span style={{...MONO,fontSize:10,color:P.muted}}>SESSION SUMMARY</span>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"16px 18px",position:"relative",zIndex:1}}>
        <div style={{border:`1px solid ${P.lime}40`,background:`${P.lime}08`,padding:16,marginBottom:16,position:"relative"}}>
          <Corners color={P.lime} sz={9}/>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div>
              <div style={{...MONO,fontSize:9,color:P.muted,marginBottom:4}}>EXTERNAL ROTATION · SET 2</div>
              <div style={{...DISP,fontSize:28,color:P.text}}>REP ANALYSIS<br/><span style={{color:P.lime}}>COMPLETE</span></div>
            </div>
            <div style={{width:44,height:44,border:`2px solid ${P.ok}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <CheckCircle size={24} color={P.ok}/>
            </div>
          </div>
          <div style={{display:"flex",gap:12,marginTop:12}}>
            <div style={{flex:1}}><div style={{...MONO,fontSize:8,color:P.muted,marginBottom:4}}>TRAINER SIMILARITY</div><div style={{...DISP,fontSize:36,color:P.warn}}>70%</div><Bar value={70} color={P.warn} h={2}/></div>
            <div style={{flex:1}}><div style={{...MONO,fontSize:8,color:P.muted,marginBottom:4}}>TRAJECTORY QUALITY</div><div style={{...DISP,fontSize:36,color:P.lime}}>75%</div><Bar value={75} color={P.lime} h={2}/></div>
          </div>
        </div>
        <SLabel n="01" label="TRAJECTORY COMPARISON"/>
        <div style={{marginTop:8,border:`1px solid ${P.border}`,padding:"10px 6px 4px",marginBottom:16}}>
          <ResponsiveContainer width="100%" height={110}>
            <LineChart data={TRAJ} margin={{top:0,right:4,left:-22,bottom:0}}>
              <CartesianGrid stroke={P.dim} strokeDasharray="3 3"/>
              <XAxis dataKey="t" tick={{fontSize:7,fill:P.muted,fontFamily:"JetBrains Mono"}}/>
              <YAxis tick={{fontSize:7,fill:P.muted,fontFamily:"JetBrains Mono"}}/>
              <Line type="monotone" dataKey="tr" stroke={P.muted} strokeWidth={2} strokeDasharray="5 3" dot={false}/>
              <Line type="monotone" dataKey="pt" stroke={P.lime} strokeWidth={2.5} dot={false}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
        <SLabel n="02" label="METRICS"/>
        <div style={{marginTop:8,display:"grid",gridTemplateColumns:"1fr 1fr",gap:1,background:P.border,marginBottom:16}}>
          {[{l:"MAX ROM",v:"68°",c:P.warn},{l:"AVG SPEED",v:"1.2s",c:P.lime},{l:"VALID REPS",v:"5/7",c:P.ok},{l:"SMOOTHNESS",v:"82%",c:P.text}].map(m=>(
            <div key={m.l} style={{background:P.bg,padding:"12px 13px"}}>
              <div style={{...MONO,fontSize:8,color:P.muted,marginBottom:4}}>{m.l}</div>
              <div style={{...DISP,fontSize:22,color:m.c}}>{m.v}</div>
            </div>
          ))}
        </div>
        <Btn label="NEXT EXERCISE →" accent fill/>
      </div>
    </MS>
  );
}

function Progress() {
  return (
    <MS navActive="progress">
      <MStatus/>
      <div style={{padding:"0 18px 10px",borderBottom:`1px solid ${P.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,position:"relative",zIndex:1}}>
        <div style={{...DISP,fontSize:22,color:P.text}}>PROGRESS</div>
        <div style={{display:"flex",gap:6}}><Chip label="7 DAYS" active/><Chip label="30 DAYS"/></div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"14px 18px",paddingBottom:90,position:"relative",zIndex:1,display:"flex",flexDirection:"column",gap:14}}>
        <SLabel n="01" label="ROM & PAIN · 7 DAYS"/>
        <div style={{border:`1px solid ${P.border}`,padding:"10px 6px 4px"}}>
          <ResponsiveContainer width="100%" height={100}>
            <AreaChart data={WEEK_ROM} margin={{top:2,right:4,left:-24,bottom:0}}>
              <defs>
                <linearGradient id="gProg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={P.lime} stopOpacity={0.25}/><stop offset="95%" stopColor={P.lime} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid stroke={P.dim} strokeDasharray="4 4"/>
              <XAxis dataKey="d" tick={{fontSize:8,fill:P.muted,fontFamily:"JetBrains Mono"}}/>
              <YAxis tick={{fontSize:8,fill:P.muted,fontFamily:"JetBrains Mono"}}/>
              <Area type="monotone" dataKey="rom" stroke={P.lime} fill="url(#gProg)" strokeWidth={1.5} dot={false}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <SLabel n="02" label="AVERAGES"/>
        <div style={{display:"flex",border:`1px solid ${P.border}`}}>
          {[{l:"AVG PAIN",v:"3.1/10",c:P.danger},{l:"AVG MOBILITY",v:"7.4/10",c:P.ok}].map((m,i)=>(
            <div key={m.l} style={{flex:1,padding:"12px 10px",borderRight:i<1?`1px solid ${P.border}`:"none"}}>
              <div style={{...MONO,fontSize:8,color:P.muted,marginBottom:4}}>{m.l}</div>
              <div style={{...DISP,fontSize:26,color:m.c}}>{m.v}</div>
            </div>
          ))}
        </div>
        <SLabel n="03" label="RECENT CHECK-INS"/>
        <div style={{display:"flex",flexDirection:"column",gap:1,background:P.border}}>
          {[{date:"30 Jun",pain:2,mob:8,note:"Feeling much better"},{date:"28 Jun",pain:3,mob:7,note:"Slight stiffness"},{date:"26 Jun",pain:5,mob:6,note:"Gym yesterday — tender"},{date:"24 Jun",pain:3,mob:7,note:""}].map((a,i)=>(
            <div key={i} style={{background:P.bg,padding:"11px 14px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:a.note?4:0}}>
                <div style={{display:"flex",gap:14}}>
                  <span style={{...MONO,fontSize:10,color:P.text}}>Pain <b style={{color:P.danger}}>{a.pain}</b></span>
                  <span style={{...MONO,fontSize:10,color:P.text}}>Mobility <b style={{color:P.ok}}>{a.mob}</b></span>
                </div>
                <span style={{...MONO,fontSize:9,color:P.muted}}>{a.date}</span>
              </div>
              {a.note&&<span style={{...BODY,fontSize:13,color:P.muted}}>{a.note}</span>}
            </div>
          ))}
        </div>
      </div>
    </MS>
  );
}

function CheckIn() {
  return (
    <MS noNav>
      <MStatus/>
      <div style={{padding:"0 18px 10px",display:"flex",alignItems:"center",gap:10,borderBottom:`1px solid ${P.border}`,flexShrink:0,position:"relative",zIndex:1}}>
        <ArrowLeft size={18} color={P.muted}/><span style={{...MONO,fontSize:10,color:P.muted}}>DAILY CHECK-IN</span>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"16px 18px",position:"relative",zIndex:1}}>
        <div style={{...DISP,fontSize:40,lineHeight:0.86,color:P.text,marginBottom:6}}>NEW<br/><span style={{color:P.lime}}>CHECK-IN</span></div>
        <p style={{...BODY,fontSize:13,color:P.muted,marginBottom:20}}>Monday, 30 June 2025 · Log pain & mobility</p>
        <ScaleRow label="PAIN TODAY (0–10)" value={3} color={P.danger}/>
        <ScaleRow label="MOBILITY SCORE (0–10)" value={7} color={P.ok}/>
        <ScaleRow label="ENERGY LEVEL (0–10)" value={6} color={P.lime}/>
        <Field label="NOTES (OPTIONAL)" placeholder="Slight stiffness this morning..." multiline/>
        <Btn label="SUBMIT CHECK-IN" accent fill/>
      </div>
    </MS>
  );
}

function AIAssistant() {
  return (
    <MS noNav>
      <MStatus/>
      <div style={{padding:"0 18px 10px",borderBottom:`1px solid ${P.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,position:"relative",zIndex:1}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}><Brain size={16} color={P.lime}/><span style={{...DISP,fontSize:18,color:P.text}}>AI ASSISTANT</span></div>
        <Trash2 size={16} color={P.muted}/>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"14px",position:"relative",zIndex:1,display:"flex",flexDirection:"column",gap:10}}>
        <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:4}}>
          {["My right knee hurts, about 6/10","Lower back stiffness, want more mobility","Shoulder pain after the gym"].map(s=>(
            <div key={s} style={{border:`1px solid ${P.border}`,padding:"8px 12px",cursor:"pointer"}}>
              <span style={{...BODY,fontSize:13,color:P.muted}}>{s}</span>
            </div>
          ))}
        </div>
        <div style={{display:"flex",justifyContent:"flex-start"}}>
          <div style={{maxWidth:"82%",padding:"10px 13px",background:P.lift,border:`1px solid ${P.border}`}}>
            <span style={{...BODY,fontSize:13,color:P.text,lineHeight:1.5}}>Hi! I am your SmartKineto assistant. Tell me what is bothering you.</span>
          </div>
        </div>
        <div style={{display:"flex",justifyContent:"flex-end"}}>
          <div style={{maxWidth:"82%",padding:"10px 13px",background:P.lime,border:`1px solid ${P.lime}`}}>
            <span style={{...BODY,fontSize:13,color:P.bg,lineHeight:1.5}}>My shoulder has been sore. About 5/10 pain when raising my arm.</span>
          </div>
        </div>
        <div style={{border:`1px solid ${P.lime}30`,background:`${P.lime}08`,padding:14}}>
          <div style={{display:"flex",gap:8,marginBottom:8}}><div style={{border:`1px solid ${P.lime}`,padding:"2px 7px"}}><span style={{...MONO,fontSize:8,color:P.lime}}>SUGGESTED PLAN</span></div></div>
          <div style={{...DISP,fontSize:18,color:P.text,marginBottom:10}}>SHOULDER RECOVERY PLAN</div>
          {["Pendulum Swing · 3×15","External Rotation · 2×20","Scapular Retraction · 2×15"].map(e=>(
            <div key={e} style={{...BODY,fontSize:13,color:P.muted,marginBottom:4}}>· {e}</div>
          ))}
          <div style={{marginTop:10}}><Btn label="SAVE & START THIS PLAN" accent fill/></div>
        </div>
      </div>
      <div style={{padding:"10px 14px",borderTop:`1px solid ${P.border}`,background:P.card,display:"flex",gap:10,alignItems:"flex-end",position:"relative",zIndex:1}}>
        <div style={{flex:1,background:P.lift,border:`1px solid ${P.border}`,padding:"10px 13px",fontFamily:"Inter,sans-serif",fontSize:14,color:P.muted}}>Describe your symptoms…</div>
        <div style={{width:40,height:40,borderRadius:"50%",background:P.lime,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <Mic size={18} color={P.bg}/>
        </div>
      </div>
    </MS>
  );
}

function Chat() {
  return (
    <MS noNav>
      <MStatus/>
      <div style={{padding:"0 18px 10px",borderBottom:`1px solid ${P.border}`,display:"flex",alignItems:"center",gap:10,flexShrink:0,position:"relative",zIndex:1}}>
        <ArrowLeft size={18} color={P.muted}/>
        <div style={{width:32,height:32,borderRadius:"50%",background:`${P.lime}30`,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <span style={{...MONO,fontSize:12,color:P.lime,fontWeight:700}}>JR</span>
        </div>
        <div>
          <div style={{...MONO,fontSize:10,color:P.text,fontWeight:600}}>Dr. James Rivera</div>
          <div style={{...MONO,fontSize:8,color:P.ok}}>● ONLINE</div>
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"14px",position:"relative",zIndex:1,display:"flex",flexDirection:"column",gap:8}}>
        {[{mine:false,text:"Great progress today! Your external rotation improved 4° since Monday."},{mine:true,text:"Thank you! My shoulder still feels tight in the morning. Should I do the warm-up first?"},{mine:false,text:"Yes — always start with Pendulum Swing (2 min) before active exercises."},{mine:true,text:"Got it, will do tomorrow!"}].map((m,i)=>(
          <div key={i} style={{display:"flex",justifyContent:m.mine?"flex-end":"flex-start"}}>
            <div style={{maxWidth:"82%",padding:"10px 13px",background:m.mine?P.lime:P.lift,border:`1px solid ${m.mine?P.lime:P.border}`}}>
              <span style={{...BODY,fontSize:13,color:m.mine?P.bg:P.text,lineHeight:1.5}}>{m.text}</span>
            </div>
          </div>
        ))}
      </div>
      <div style={{padding:"10px 14px",borderTop:`1px solid ${P.border}`,background:P.card,display:"flex",gap:10,alignItems:"center",position:"relative",zIndex:1}}>
        <div style={{flex:1,background:P.lift,border:`1px solid ${P.border}`,padding:"10px 13px",fontFamily:"Inter,sans-serif",fontSize:14,color:P.muted}}>Message Dr. Rivera…</div>
        <div style={{width:40,height:40,borderRadius:"50%",background:P.lime,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <ChevronRight size={20} color={P.bg}/>
        </div>
      </div>
    </MS>
  );
}

function Profile() {
  return (
    <MS navActive="profile">
      <MStatus/>
      <div style={{padding:"0 18px 10px",borderBottom:`1px solid ${P.border}`,flexShrink:0,position:"relative",zIndex:1}}>
        <div style={{...DISP,fontSize:22,color:P.text}}>PROFILE</div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"20px 18px",paddingBottom:90,position:"relative",zIndex:1,display:"flex",flexDirection:"column",gap:14}}>
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
          <div style={{width:72,height:72,borderRadius:"50%",background:`linear-gradient(135deg,${P.lime},${P.ok})`,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <span style={{...DISP,fontSize:28,color:P.bg}}>AM</span>
          </div>
          <div style={{...DISP,fontSize:22,color:P.text}}>ALEXANDRA MORGAN</div>
          <div style={{...BODY,fontSize:14,color:P.muted}}>alexandra.morgan@gmail.com</div>
          <div style={{border:`1px solid ${P.ok}`,padding:"3px 10px"}}><span style={{...MONO,fontSize:9,color:P.ok}}>PATIENT · ID #PT-00412</span></div>
        </div>
        <SLabel n="01" label="MY TRAINER"/>
        <div style={{border:`1px solid ${P.border}`,padding:"13px 14px",display:"flex",alignItems:"center",gap:12,cursor:"pointer"}}>
          <div style={{width:40,height:40,borderRadius:"50%",background:`${P.lime}20`,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <span style={{...MONO,fontSize:13,color:P.lime,fontWeight:700}}>JR</span>
          </div>
          <div style={{flex:1}}>
            <div style={{...BODY,fontSize:14,color:P.text,fontWeight:600}}>Dr. James Rivera</div>
            <div style={{...MONO,fontSize:9,color:P.muted}}>PHYSIOTHERAPIST · LINKED</div>
          </div>
          <ChevronRight size={14} color={P.muted}/>
        </div>
        <SLabel n="02" label="ACCOUNT SETTINGS"/>
        <div style={{display:"flex",flexDirection:"column",gap:1,background:P.border}}>
          {["Role: Patient","Notifications: Enabled","Language: English","Dark Mode: On"].map(item=>(
            <div key={item} style={{background:P.bg,padding:"11px 14px",display:"flex",justifyContent:"space-between"}}>
              <span style={{...BODY,fontSize:13,color:P.text}}>{item.split(":")[0]}</span>
              <span style={{...MONO,fontSize:11,color:P.lime}}>{item.split(":")[1]?.trim()}</span>
            </div>
          ))}
        </div>
        <Btn label="LOG OUT" fill/>
      </div>
    </MS>
  );
}

function Notifications() {
  return (
    <MS noNav>
      <MStatus/>
      <div style={{padding:"0 18px 10px",display:"flex",alignItems:"center",gap:10,borderBottom:`1px solid ${P.border}`,flexShrink:0,position:"relative",zIndex:1}}>
        <ArrowLeft size={18} color={P.muted}/><span style={{...DISP,fontSize:20,color:P.text}}>NOTIFICATIONS</span>
      </div>
      <div style={{flex:1,overflowY:"auto",position:"relative",zIndex:1,display:"flex",flexDirection:"column",gap:1,background:P.border}}>
        {[{icon:P.ok,label:"Session complete",sub:"Shoulder Recovery · 5 exercises done",time:"2h ago"},
          {icon:P.warn,label:"Check-in reminder",sub:"Log your daily pain & mobility",time:"8h ago"},
          {icon:P.lime,label:"Trainer message",sub:"Dr. Rivera: 'Great progress today!'",time:"Yesterday"},
          {icon:P.ok,label:"ROM milestone",sub:"You reached 80° external rotation!",time:"2 days ago"},
          {icon:P.warn,label:"Rest day suggestion",sub:"AI recommends a recovery day today",time:"3 days ago"}].map((n,i)=>(
          <div key={i} style={{background:P.bg,padding:"13px 18px",display:"flex",gap:12,alignItems:"flex-start"}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:n.icon,marginTop:5,flexShrink:0}}/>
            <div style={{flex:1}}>
              <div style={{...BODY,fontSize:14,color:P.text,fontWeight:500,marginBottom:2}}>{n.label}</div>
              <div style={{...BODY,fontSize:13,color:P.muted}}>{n.sub}</div>
            </div>
            <span style={{...MONO,fontSize:9,color:P.faint,flexShrink:0}}>{n.time}</span>
          </div>
        ))}
      </div>
    </MS>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MOBILE TRAINER SCREENS
// ══════════════════════════════════════════════════════════════════════════════

function TrainerHome() {
  return (
    <MS navActive="home" role="trainer">
      <div style={{background:`linear-gradient(135deg,${P.card},${P.lift})`,borderBottom:`1px solid ${P.border}`,padding:"44px 18px 20px",position:"relative",flexShrink:0,zIndex:1}}>
        <div style={{position:"absolute",top:14,left:16}}><Cross size={12} color={P.lime}/></div>
        <div style={{...MONO,fontSize:9,color:P.muted,marginBottom:4}}>TRAINER WORKSPACE</div>
        <div style={{...DISP,fontSize:32,color:P.text}}>DR. JAMES<br/><span style={{color:P.lime}}>RIVERA</span></div>
      </div>
      <Ticker items={["23 EXERCISES","10 PROGRAMS","7 PATIENTS","3 ALERTS","1 LIVE SESSION"]}/>
      <div style={{flex:1,overflowY:"auto",padding:"14px 18px",paddingBottom:90,position:"relative",zIndex:1,display:"flex",flexDirection:"column",gap:14}}>
        <div style={{display:"flex",gap:1,background:P.border}}>
          {[{l:"EXERCISES",v:"23",c:P.lime},{l:"PROGRAMS",v:"10",c:P.text},{l:"PATIENTS",v:"7",c:P.ok}].map(s=>(
            <div key={s.l} style={{flex:1,background:P.bg,padding:"12px 10px",textAlign:"center"}}>
              <div style={{...DISP,fontSize:30,color:s.c}}>{s.v}</div>
              <div style={{...MONO,fontSize:8,color:P.muted}}>{s.l}</div>
            </div>
          ))}
        </div>
        <div style={{border:`1px solid ${P.warn}30`,background:`${P.warn}08`,padding:"12px 14px",display:"flex",gap:10,alignItems:"flex-start"}}>
          <AlertTriangle size={16} color={P.warn} style={{flexShrink:0,marginTop:2}}/>
          <div>
            <div style={{...MONO,fontSize:10,color:P.warn,fontWeight:700,marginBottom:3}}>2 PATIENTS NEED ATTENTION</div>
            <div style={{...BODY,fontSize:13,color:P.muted}}>Marcus Reed — ROM declined 12°. Yuki Tanaka — missed 3 sessions.</div>
          </div>
        </div>
        <SLabel n="01" label="QUICK ACTIONS"/>
        <div style={{display:"flex",gap:1,background:P.border}}>
          {[{l:"NEW EXERCISE",d:"Create & upload video"},{l:"NEW PROGRAM",d:"Assign exercises"}].map(a=>(
            <div key={a.l} style={{flex:1,background:P.bg,padding:"14px 12px",cursor:"pointer"}}>
              <Plus size={16} color={P.lime} style={{marginBottom:8}}/>
              <div style={{...MONO,fontSize:11,color:P.text,fontWeight:700,marginBottom:3}}>{a.l}</div>
              <div style={{...BODY,fontSize:12,color:P.muted}}>{a.d}</div>
            </div>
          ))}
        </div>
        <SLabel n="02" label="PATIENTS" right="SEE ALL"/>
        <div style={{display:"flex",flexDirection:"column",gap:1,background:P.border}}>
          {PATIENTS.slice(0,4).map(p=>(
            <div key={p.n} style={{background:p.live?`${P.lime}08`:P.bg,borderLeft:p.live?`2px solid ${P.lime}`:"2px solid transparent",padding:"11px 14px",display:"flex",alignItems:"center",gap:10}}>
              {p.live&&<div style={{width:5,height:5,background:P.ok,flexShrink:0}}/>}
              <div style={{flex:1}}>
                <div style={{...BODY,fontSize:13,color:P.text,fontWeight:500}}>{p.name}</div>
                <div style={{...MONO,fontSize:9,color:P.muted}}>{p.prog}</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{...DISP,fontSize:16,color:P.lime}}>{p.rom}</div>
                <div style={{...MONO,fontSize:8,color:p.q>=80?P.ok:p.q>=70?P.warn:P.danger}}>{p.q}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </MS>
  );
}

function ExerciseList() {
  return (
    <MS navActive="exercises" role="trainer">
      <MStatus/>
      <div style={{padding:"0 18px 10px",borderBottom:`1px solid ${P.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,position:"relative",zIndex:1}}>
        <div style={{...DISP,fontSize:22,color:P.text}}>EXERCISES</div>
        <div style={{width:32,height:32,background:P.lime,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><Plus size={18} color={P.bg}/></div>
      </div>
      <div style={{padding:"10px 18px",borderBottom:`1px solid ${P.border}`,flexShrink:0,position:"relative",zIndex:1}}>
        <div style={{display:"flex",gap:1,background:P.border,marginBottom:10}}>
          {["MY EXERCISES","LIBRARY"].map((l,i)=>(
            <div key={l} style={{flex:1,background:i===0?`${P.lime}15`:P.bg,borderBottom:i===0?`2px solid ${P.lime}`:"none",padding:"9px",textAlign:"center",cursor:"pointer"}}>
              <span style={{...MONO,fontSize:10,color:i===0?P.lime:P.muted,fontWeight:i===0?700:400}}>{l}</span>
            </div>
          ))}
        </div>
        <div style={{background:P.lift,border:`1px solid ${P.border}`,padding:"9px 12px",display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
          <Search size={14} color={P.muted}/><span style={{...BODY,fontSize:14,color:P.muted}}>Search exercises…</span>
        </div>
        <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:4}}>
          {["ALL","SHOULDER","KNEE","HIP","BACK","ELBOW"].map((f,i)=><Chip key={f} label={f} active={i===0}/>)}
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto",paddingBottom:80,position:"relative",zIndex:1,display:"flex",flexDirection:"column",gap:1,background:P.border}}>
        {EXERCISES.map(ex=>(
          <div key={ex.n} style={{background:P.bg,padding:"12px 18px",display:"flex",gap:12,alignItems:"center"}}>
            <div style={{width:44,height:44,background:P.lift,border:`1px solid ${P.border}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <Dumbbell size={20} color={P.lime}/>
            </div>
            <div style={{flex:1}}>
              <div style={{...BODY,fontSize:13,color:P.text,fontWeight:500}}>{ex.name}</div>
              <div style={{...MONO,fontSize:9,color:P.lime,fontWeight:700,marginBottom:2}}>by Dr. James Rivera</div>
              <div style={{display:"flex",gap:6}}>
                <div style={{border:`1px solid ${P.border}`,padding:"1px 6px"}}><span style={{...MONO,fontSize:8,color:P.muted}}>{ex.part}</span></div>
                <div style={{border:`1px solid ${ex.diff==="EASY"?P.ok:ex.diff==="MEDIUM"?P.warn:P.danger}`,padding:"1px 6px"}}>
                  <span style={{...MONO,fontSize:8,color:ex.diff==="EASY"?P.ok:ex.diff==="MEDIUM"?P.warn:P.danger}}>{ex.diff}</span>
                </div>
              </div>
            </div>
            <ChevronRight size={14} color={P.muted}/>
          </div>
        ))}
      </div>
    </MS>
  );
}

function CreateExercise() {
  return (
    <MS noNav role="trainer">
      <MStatus/>
      <div style={{padding:"0 18px 10px",display:"flex",alignItems:"center",gap:10,borderBottom:`1px solid ${P.border}`,flexShrink:0,position:"relative",zIndex:1}}>
        <ArrowLeft size={18} color={P.muted}/><span style={{...DISP,fontSize:20,color:P.text}}>NEW EXERCISE</span>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"16px 18px",position:"relative",zIndex:1}}>
        <Field label="TITLE" placeholder="Shoulder external rotation"/>
        <Field label="DESCRIPTION" placeholder="Cues, tempo, notes…" multiline/>
        <div style={{...MONO,fontSize:9,color:P.muted,marginBottom:8}}>BODY PART</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:16}}>
          {["SHOULDER","ELBOW","WRIST","HIP","KNEE","ANKLE","BACK","NECK"].map((b,i)=><Chip key={b} label={b} active={i===0}/>)}
        </div>
        <div style={{...MONO,fontSize:9,color:P.muted,marginBottom:8}}>DIFFICULTY</div>
        <div style={{display:"flex",gap:6,marginBottom:18}}>
          {[["EASY",P.ok],["MEDIUM",P.warn],["HARD",P.danger]].map(([d,c])=>(
            <div key={d} style={{flex:1,border:`1px solid ${d==="MEDIUM"?c:P.border}`,background:d==="MEDIUM"?`${c}15`:P.lift,padding:"9px",textAlign:"center",cursor:"pointer"}}>
              <span style={{...MONO,fontSize:10,color:d==="MEDIUM"?String(c):P.muted,fontWeight:700}}>{d}</span>
            </div>
          ))}
        </div>
        <div style={{...MONO,fontSize:9,color:P.muted,marginBottom:8}}>DEMONSTRATION VIDEO</div>
        <div style={{border:`1px solid ${P.lime}30`,background:`${P.lime}08`,padding:"16px 14px",display:"flex",gap:12,alignItems:"center",marginBottom:12,cursor:"pointer"}}>
          <Play size={20} color={P.lime}/>
          <div><div style={{...BODY,fontSize:14,color:P.text,fontWeight:500}}>Record trainer demo</div><div style={{...MONO,fontSize:10,color:P.muted}}>Pose detection processes the video</div></div>
        </div>
        <div style={{border:`1px solid ${P.border}`,padding:"16px 14px",display:"flex",gap:12,alignItems:"center",marginBottom:20,cursor:"pointer"}}>
          <FileText size={20} color={P.muted}/>
          <div><div style={{...BODY,fontSize:14,color:P.text,fontWeight:500}}>Upload from library</div><div style={{...MONO,fontSize:10,color:P.muted}}>Pick a file from your device</div></div>
        </div>
        <Btn label="SAVE EXERCISE" accent fill/>
      </div>
    </MS>
  );
}

function TrainerPatients() {
  return (
    <MS navActive="patients" role="trainer">
      <MStatus/>
      <div style={{padding:"0 18px 10px",borderBottom:`1px solid ${P.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,position:"relative",zIndex:1}}>
        <div style={{...DISP,fontSize:22,color:P.text}}>PATIENTS</div><Btn label="FIND & ADD" sm/>
      </div>
      <div style={{padding:"10px 18px",borderBottom:`1px solid ${P.border}`,flexShrink:0,position:"relative",zIndex:1}}>
        <div style={{background:P.lift,border:`1px solid ${P.border}`,padding:"9px 12px",display:"flex",alignItems:"center",gap:8}}>
          <Search size={14} color={P.muted}/><span style={{...BODY,fontSize:14,color:P.muted}}>Search patients…</span>
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto",paddingBottom:80,position:"relative",zIndex:1,display:"flex",flexDirection:"column",gap:1,background:P.border}}>
        {PATIENTS.map(p=>(
          <div key={p.n} style={{background:p.st==="REVIEW"?`${P.danger}05`:P.bg,borderLeft:p.live?`2px solid ${P.lime}`:p.st==="REVIEW"?`2px solid ${P.danger}`:"2px solid transparent",padding:"13px 18px",display:"flex",gap:12,alignItems:"center"}}>
            <div style={{width:40,height:40,borderRadius:"50%",background:`${P.lime}20`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <span style={{...MONO,fontSize:13,color:P.lime,fontWeight:700}}>{p.name.split(" ").map((n:string)=>n[0]).join("").slice(0,2)}</span>
            </div>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <span style={{...BODY,fontSize:14,color:P.text,fontWeight:500}}>{p.name}</span>
                {p.live&&<div style={{width:5,height:5,borderRadius:"50%",background:P.ok}}/>}
              </div>
              <div style={{...MONO,fontSize:9,color:P.muted}}>{p.prog} · {p.last}</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{...DISP,fontSize:16,color:P.lime}}>{p.rom}</div>
              <div style={{...MONO,fontSize:8,color:p.q>=80?P.ok:p.q>=70?P.warn:P.danger}}>{p.q}%</div>
            </div>
          </div>
        ))}
      </div>
    </MS>
  );
}

function AssignProgram() {
  return (
    <MS noNav role="trainer">
      <MStatus/>
      <div style={{padding:"0 18px 10px",display:"flex",alignItems:"center",gap:10,borderBottom:`1px solid ${P.border}`,flexShrink:0,position:"relative",zIndex:1}}>
        <ArrowLeft size={18} color={P.muted}/><span style={{...DISP,fontSize:20,color:P.text}}>ASSIGN PROGRAM</span>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"16px 18px",position:"relative",zIndex:1}}>
        <SLabel n="01" label="PATIENT"/>
        <div style={{marginTop:8,border:`1px solid ${P.lime}`,background:`${P.lime}08`,padding:"13px 14px",display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
          <div style={{width:36,height:36,borderRadius:"50%",background:`${P.lime}20`,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{...MONO,fontSize:12,color:P.lime,fontWeight:700}}>AM</span></div>
          <div><div style={{...BODY,fontSize:14,color:P.text,fontWeight:500}}>Alexandra Morgan</div><div style={{...MONO,fontSize:9,color:P.ok}}>SELECTED</div></div>
        </div>
        <SLabel n="02" label="SELECT PROGRAM"/>
        <div style={{marginTop:8,display:"flex",flexDirection:"column",gap:1,background:P.border,marginBottom:16}}>
          {PROGRAMS_DATA.map((p,i)=>(
            <div key={p.name} style={{background:i===0?`${P.lime}08`:P.bg,borderLeft:i===0?`2px solid ${P.lime}`:"2px solid transparent",padding:"12px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}}>
              <div>
                <div style={{...BODY,fontSize:13,color:P.text,fontWeight:500}}>{p.name}</div>
                <div style={{...MONO,fontSize:9,color:P.muted}}>{p.weeks} WEEKS · {p.exs} EXERCISES</div>
              </div>
              {i===0&&<CheckCircle size={16} color={P.lime}/>}
            </div>
          ))}
        </div>
        <SLabel n="03" label="START DATE"/>
        <div style={{marginTop:8,background:P.lift,border:`1px solid ${P.border}`,padding:"11px 14px",marginBottom:20}}>
          <span style={{...MONO,fontSize:12,color:P.lime}}>Monday 30 June 2025</span>
        </div>
        <Btn label="ASSIGN PROGRAM" accent fill/>
      </div>
    </MS>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// WEB PATIENT: DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════

function WebPatientDash() {
  return (
    <WP role="patient" active="DASHBOARD"
      ticker={["BLE · CONNECTED","MPU6050 · ACTIVE","BATTERY · 78%","SHOULDER RECOVERY · WEEK 3/8","DR. JAMES RIVERA"]}>
      <WebHeader title={"PATIENT\nDASHBOARD"} sub="PATIENT OVERVIEW"
        actions={<>
          <span style={{...MONO,fontSize:10,color:P.muted}}>MON 30 JUN 2025  ·  WEEK 3/8</span>
          <Btn label="BEGIN SESSION" accent sm/>
        </>}
      />
      <div style={{flex:1,padding:"20px 32px",display:"grid",gridTemplateColumns:"1fr 1fr 1fr 280px",gridTemplateRows:"auto 1fr",gap:16,overflow:"auto"}}>
        {[{l:"TODAY'S PROGRAM",v:"2/5",sub:"SHOULDER RECOVERY",c:P.lime},{l:"AVG ROM",v:"76°",sub:"+4° THIS WEEK",c:P.ok},{l:"QUALITY SCORE",v:"82%",sub:"+7% VS LAST WEEK",c:P.text},{l:"STREAK",v:"12d",sub:"PERSONAL BEST",c:P.warn}].map((k,i)=>(
          <div key={k.l} style={{background:P.card,border:`1px solid ${P.border}`,padding:"14px 16px",position:"relative"}}>
            <div style={{position:"absolute",top:8,right:10,border:`1px solid ${k.c}`,padding:"1px 6px"}}><span style={{...MONO,fontSize:8,color:k.c}}>{k.v}</span></div>
            <div style={{...MONO,fontSize:8,color:P.muted,marginBottom:4}}>{k.l}</div>
            <div style={{...DISP,fontSize:36,color:k.c,lineHeight:1}}>{k.v}</div>
            <div style={{...MONO,fontSize:8,color:P.faint,marginTop:4}}>{k.sub}</div>
          </div>
        ))}
        <div style={{gridColumn:"1/4",background:P.card,border:`1px solid ${P.border}`,padding:"16px 20px"}}>
          <div style={{...MONO,fontSize:9,color:P.muted,marginBottom:12}}>ROM TREND · 7 DAYS</div>
          <ResponsiveContainer width="100%" height={170}>
            <AreaChart data={WEEK_ROM} margin={{top:2,right:8,left:-10,bottom:0}}>
              <defs>
                <linearGradient id="gWPD" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={P.lime} stopOpacity={0.25}/><stop offset="95%" stopColor={P.lime} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid stroke={P.dim} strokeDasharray="4 4"/>
              <XAxis dataKey="d" tick={{fontSize:10,fill:P.muted,fontFamily:"JetBrains Mono"}}/>
              <YAxis tick={{fontSize:10,fill:P.muted,fontFamily:"JetBrains Mono"}}/>
              <Tooltip contentStyle={{background:P.card,border:`1px solid ${P.border}`,fontFamily:"JetBrains Mono",fontSize:10,borderRadius:0}}/>
              <Area type="monotone" dataKey="rom" stroke={P.lime} fill="url(#gWPD)" strokeWidth={2} dot={false}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={{gridColumn:"4/5",gridRow:"2/3",background:P.card,border:`1px solid ${P.border}`,padding:"16px",display:"flex",flexDirection:"column",gap:10}}>
          <div style={{...MONO,fontSize:9,color:P.muted}}>TODAY'S QUEUE</div>
          <div style={{display:"flex",flexDirection:"column",gap:1,background:P.border,flex:1}}>
            {[["01","Pendulum Swing","3×15",true,false],["02","Flexion Arc","3×12",true,false],["03","External Rotation","2×20",false,true],["04","Abduction Raise","3×10",false,false],["05","Scapular Retraction","2×15",false,false]].map(([n,name,sets,done,active])=>(
              <div key={String(n)} style={{background:active?`${P.lime}08`:P.card,borderLeft:active?`2px solid ${P.lime}`:"2px solid transparent",padding:"9px 12px",display:"flex",gap:8,alignItems:"center"}}>
                <span style={{...MONO,fontSize:9,color:done?P.faint:active?P.lime:P.muted,width:18}}>{n}</span>
                <div style={{flex:1}}>
                  <div style={{...BODY,fontSize:12,color:done?P.faint:P.text,fontWeight:500,textDecoration:done?"line-through":"none"}}>{String(name)}</div>
                  <div style={{...MONO,fontSize:8,color:P.muted}}>{String(sets)}</div>
                </div>
                {done&&<CheckCircle size={11} color={P.ok}/>}
              </div>
            ))}
          </div>
          <Btn label="CONTINUE SESSION" accent fill sm/>
        </div>
      </div>
    </WP>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// WEB TRAINER: DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════

function WebTrainerDash() {
  return (
    <WP role="trainer" active="OVERVIEW"
      ticker={["LIVE: ALEXANDRA M · EXT ROTATION · ROM 68° · QUAL 75%","LIVE: JAMES O · 82%","⚠ MARCUS REED — ROM DECLINED 12°","⚠ YUKI TANAKA — 3 MISSED SESSIONS"]}>
      <WebHeader title={"TRAINER\nDASHBOARD"} sub="TRAINER OVERVIEW"
        actions={<>
          <span style={{...MONO,fontSize:10,color:P.muted}}>MON 30 JUN 2026  ·  24 PATIENTS  ·  3 LIVE</span>
          <div style={{display:"flex",gap:8}}><Btn label="+ EXERCISE" sm/><Btn label="+ PROGRAM" sm/><Btn label="ASSIGN →" sm accent/></div>
        </>}
      />
      <div style={{flex:1,padding:"20px 32px",display:"grid",gridTemplateColumns:"1fr 316px",gap:20,overflow:"auto"}}>
        <div style={{display:"flex",flexDirection:"column",gap:20}}>
          <div style={{display:"flex",border:`1px solid ${P.border}`}}>
            {[{l:"ACTIVE PATIENTS",v:"24",sub:"+2 THIS WEEK",c:P.lime},{l:"SESSIONS TODAY",v:"08",sub:"3 IN PROGRESS",c:P.text},{l:"AVG QUALITY",v:"74%",sub:"+3% THIS WEEK",c:P.ok},{l:"ALERTS",v:"03",sub:"2 NEED REVIEW",c:P.danger}].map((k,i)=>(
              <div key={k.l} style={{flex:1,padding:"14px 18px",borderRight:i<3?`1px solid ${P.border}`:"none",position:"relative"}}>
                <div style={{position:"absolute",top:10,right:12,border:`1px solid ${k.c}`,padding:"1px 7px"}}><span style={{...MONO,fontSize:9,color:k.c,fontWeight:700}}>{k.v}</span></div>
                <div style={{...MONO,fontSize:8,color:P.muted,marginBottom:4}}>{k.l}</div>
                <div style={{...DISP,fontSize:40,color:k.c,lineHeight:1}}>{k.v}</div>
                <div style={{...MONO,fontSize:8,color:P.faint,marginTop:4}}>{k.sub}</div>
              </div>
            ))}
          </div>
          <div style={{flex:1}}>
            <SLabel n="02" label="PATIENT ROSTER" right={`${PATIENTS.length} RECORDS`}/>
            <div style={{marginTop:10,border:`1px solid ${P.border}`}}>
              <div style={{display:"grid",gridTemplateColumns:"36px 190px 1fr 80px 52px 52px 80px",padding:"8px 14px",borderBottom:`1px solid ${P.border}`,background:P.card}}>
                {["#","PATIENT","PROGRAM","LAST","ROM","QUAL","STATUS"].map(h=>(
                  <span key={h} style={{...MONO,fontSize:8,color:P.faint,letterSpacing:"0.1em"}}>{h}</span>
                ))}
              </div>
              {PATIENTS.map((p,i)=>(
                <div key={p.n} style={{display:"grid",gridTemplateColumns:"36px 190px 1fr 80px 52px 52px 80px",padding:"10px 14px",
                  borderBottom:i<PATIENTS.length-1?"1px solid rgba(255,255,255,0.04)":"none",
                  borderLeft:p.live?`2px solid ${P.lime}`:p.st==="REVIEW"?`2px solid ${P.danger}`:"2px solid transparent",
                  background:p.st==="REVIEW"?`${P.danger}05`:"transparent",alignItems:"center",cursor:"pointer"}}>
                  <span style={{...MONO,fontSize:9,color:P.faint}}>{p.n}</span>
                  <div style={{display:"flex",alignItems:"center",gap:7}}>
                    {p.live&&<div style={{width:5,height:5,background:P.ok,flexShrink:0}}/>}
                    <span style={{...BODY,fontSize:13,color:P.text,fontWeight:500}}>{p.name}</span>
                  </div>
                  <span style={{...MONO,fontSize:10,color:P.muted}}>{p.prog}</span>
                  <span style={{...MONO,fontSize:10,color:P.muted}}>{p.last}</span>
                  <span style={{...DISP,fontSize:15,color:P.lime}}>{p.rom}</span>
                  <span style={{...DISP,fontSize:15,color:p.q>=80?P.ok:p.q>=70?P.warn:P.danger}}>{p.q}%</span>
                  <div style={{border:`1px solid ${p.st==="ACTIVE"?P.ok:p.st==="REVIEW"?P.danger:P.faint}`,padding:"2px 6px",display:"inline-flex",justifyContent:"center"}}>
                    <span style={{...MONO,fontSize:8,color:p.st==="ACTIVE"?P.ok:p.st==="REVIEW"?P.danger:P.faint}}>{p.st}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:20}}>
          <div>
            <SLabel n="03" label="LIVE SESSIONS" right="3 ACTIVE"/>
            <div style={{marginTop:10,border:`1px solid ${P.border}`}}>
              {[{p:"Alexandra M.",ex:"External Rotation",rom:"68°",q:75,t:"04:32"},{p:"Diana K.",ex:"Flexion Arc",rom:"72°",q:78,t:"07:44"},{p:"James O.",ex:"Pendulum Swing",rom:"79°",q:82,t:"02:15"}].map((s,i)=>(
                <div key={s.p} style={{padding:"11px 14px",borderBottom:i<2?"1px solid rgba(255,255,255,0.04)":"none",borderLeft:`2px solid ${P.lime}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                    <div style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:5,height:5,background:P.ok}}/><span style={{...BODY,fontSize:13,color:P.text,fontWeight:600}}>{s.p}</span></div>
                    <span style={{...MONO,fontSize:10,color:P.lime}}>{s.t}</span>
                  </div>
                  <div style={{...MONO,fontSize:9,color:P.muted,marginBottom:7}}>{s.ex}</div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{display:"flex",gap:12}}>
                      <span><span style={{...MONO,fontSize:8,color:P.muted}}>ROM </span><span style={{...DISP,fontSize:15,color:P.text}}>{s.rom}</span></span>
                      <span><span style={{...MONO,fontSize:8,color:P.muted}}>QUAL </span><span style={{...DISP,fontSize:15,color:s.q>=80?P.ok:P.warn}}>{s.q}%</span></span>
                    </div>
                    <Btn label="VIEW" sm/>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <SLabel n="04" label="SESSION VOLUME · 7D"/>
            <div style={{marginTop:10,border:`1px solid ${P.border}`,padding:"12px 8px 6px"}}>
              <ResponsiveContainer width="100%" height={100}>
                <AreaChart data={SESS_VOL} margin={{top:0,right:4,left:-22,bottom:0}}>
                  <defs>
                    <linearGradient id="gSV2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={P.lime} stopOpacity={0.3}/><stop offset="95%" stopColor={P.lime} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={P.dim} strokeDasharray="4 4"/>
                  <XAxis dataKey="d" tick={{fontSize:9,fill:P.muted,fontFamily:"JetBrains Mono"}}/>
                  <YAxis tick={{fontSize:9,fill:P.muted,fontFamily:"JetBrains Mono"}}/>
                  <Area type="monotone" dataKey="s" stroke={P.lime} fill="url(#gSV2)" strokeWidth={1.5} dot={false}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div>
            <SLabel n="05" label="ALERTS" right="3 OPEN"/>
            <div style={{marginTop:10,border:`1px solid ${P.border}`}}>
              {[{p:"Marcus Reed",issue:"ROM –12° over 3 sessions",urg:"HIGH",c:P.danger},{p:"Yuki Tanaka",issue:"Missed 3 consecutive days",urg:"HIGH",c:P.danger},{p:"T. Baumann",issue:"Quality below 65%",urg:"MED",c:P.warn}].map((a,i)=>(
                <div key={a.p} style={{padding:"10px 14px",borderBottom:i<2?"1px solid rgba(255,255,255,0.04)":"none",borderLeft:`2px solid ${a.c}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div><div style={{...BODY,fontSize:12,color:P.text,fontWeight:500,marginBottom:2}}>{a.p}</div><div style={{...MONO,fontSize:9,color:P.muted}}>{a.issue}</div></div>
                  <div style={{border:`1px solid ${a.c}`,padding:"2px 7px"}}><span style={{...MONO,fontSize:8,color:a.c}}>{a.urg}</span></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </WP>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// WEB ADMIN: OVERVIEW
// ══════════════════════════════════════════════════════════════════════════════

function WebAdmin() {
  return (
    <WP role="admin" active="OVERVIEW"
      ticker={["1,284 ACTIVE USERS","347 SESSIONS TODAY","23 PENDING REVIEW","ALL SYSTEMS OPERATIONAL"]}>
      <WebHeader title={"ADMIN\nOVERVIEW"} sub="PLATFORM INTELLIGENCE"
        actions={<><span style={{...MONO,fontSize:10,color:P.muted}}>MON 30 JUN 2026  ·  v2.4.1</span><Btn label="EXPORT REPORT" sm/></>}
      />
      <div style={{flex:1,padding:"20px 32px",display:"flex",flexDirection:"column",gap:20,overflow:"auto"}}>
        <div style={{display:"flex",border:`1px solid ${P.border}`}}>
          {[{l:"TOTAL USERS",v:"1,284",sub:"+48 MONTH",c:P.lime},{l:"SESSIONS TODAY",v:"347",sub:"PEAK",c:P.ok},{l:"PENDING REVIEW",v:"23",sub:"3 URGENT",c:P.warn},{l:"SYSTEM HEALTH",v:"99.4%",sub:"ALL UP",c:P.ok}].map((k,i)=>(
            <div key={k.l} style={{flex:1,padding:"14px 18px",borderRight:i<3?`1px solid ${P.border}`:"none",position:"relative"}}>
              <div style={{position:"absolute",top:10,right:12,border:`1px solid ${k.c}`,padding:"1px 7px"}}><span style={{...MONO,fontSize:9,color:k.c,fontWeight:700}}>{k.v}</span></div>
              <div style={{...MONO,fontSize:8,color:P.muted,marginBottom:4}}>{k.l}</div>
              <div style={{...DISP,fontSize:38,color:k.c,lineHeight:1}}>{k.v}</div>
              <div style={{...MONO,fontSize:8,color:P.faint,marginTop:4}}>{k.sub}</div>
            </div>
          ))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:20}}>
          <div style={{background:P.card,border:`1px solid ${P.border}`,padding:"16px 20px"}}>
            <SLabel n="01" label="PLATFORM ACTIVITY · 7D"/>
            <div style={{marginTop:12}}>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={SESS_VOL} margin={{top:0,right:8,left:-10,bottom:0}}>
                  <defs>
                    <linearGradient id="gADM" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={P.lime} stopOpacity={0.25}/><stop offset="95%" stopColor={P.lime} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={P.dim} strokeDasharray="4 4"/>
                  <XAxis dataKey="d" tick={{fontSize:11,fill:P.muted,fontFamily:"JetBrains Mono"}}/>
                  <YAxis tick={{fontSize:11,fill:P.muted,fontFamily:"JetBrains Mono"}}/>
                  <Tooltip contentStyle={{background:P.card,border:`1px solid ${P.border}`,fontFamily:"JetBrains Mono",fontSize:10,borderRadius:0}}/>
                  <Area type="monotone" dataKey="s" stroke={P.lime} fill="url(#gADM)" strokeWidth={2} dot={false}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{background:P.card,border:`1px solid ${P.border}`,padding:"16px"}}>
            <SLabel n="02" label="REVIEW QUEUE"/>
            <div style={{marginTop:10,display:"flex",flexDirection:"column",gap:1,background:P.border}}>
              {[{p:"Marcus Reed",type:"ROM Decline",urg:"HIGH",c:P.danger},{p:"Yuki Tanaka",type:"Session Gap",urg:"HIGH",c:P.danger},{p:"T. Osei (new)",type:"Trainer Verify",urg:"MED",c:P.warn},{p:"Program v2.3",type:"Content Review",urg:"LOW",c:P.muted}].map((r,i)=>(
                <div key={i} style={{background:P.bg,padding:"10px 12px",borderLeft:`2px solid ${r.c}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div><div style={{...BODY,fontSize:12,color:P.text,fontWeight:500,marginBottom:1}}>{r.p}</div><div style={{...MONO,fontSize:9,color:P.muted}}>{r.type}</div></div>
                  <div style={{border:`1px solid ${r.c}`,padding:"1px 6px"}}><span style={{...MONO,fontSize:8,color:r.c}}>{r.urg}</span></div>
                </div>
              ))}
              <div style={{background:P.bg,padding:"10px 12px"}}><Btn label="VIEW ALL 23 →" sm fill/></div>
            </div>
          </div>
        </div>
        <div style={{background:P.card,border:`1px solid ${P.border}`,padding:"16px 20px"}}>
          <SLabel n="03" label="RECENT USERS"/>
          <table style={{width:"100%",borderCollapse:"collapse",marginTop:12}}>
            <thead>
              <tr>{["USER","ROLE","JOINED","CLINIC","STATUS","SESSIONS"].map(h=>(
                <th key={h} style={{...MONO,fontSize:8,color:P.faint,letterSpacing:"0.1em",textAlign:"left",padding:"0 0 8px",borderBottom:`1px solid ${P.border}`}}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {[{name:"Alexandra Morgan",role:"PATIENT",joined:"14 Apr 2025",clinic:"Meridian Sports",st:"ACTIVE",s:47},{name:"Dr. James Rivera",role:"TRAINER",joined:"02 Jan 2025",clinic:"Meridian Sports",st:"ACTIVE",s:312},{name:"Marcus Reed",role:"PATIENT",joined:"28 May 2025",clinic:"CityRehab",st:"ALERT",s:22},{name:"Yuki Tanaka",role:"PATIENT",joined:"10 Jun 2025",clinic:"Meridian Sports",st:"INACTIVE",s:9}].map(u=>(
                <tr key={u.name} style={{borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
                  <td style={{padding:"10px 0"}}><span style={{...BODY,fontSize:13,color:P.text,fontWeight:500}}>{u.name}</span></td>
                  <td style={{padding:"10px 0"}}><div style={{border:`1px solid ${u.role==="TRAINER"?P.lime:P.muted}`,padding:"1px 6px",display:"inline-flex"}}><span style={{...MONO,fontSize:8,color:u.role==="TRAINER"?P.lime:P.muted}}>{u.role}</span></div></td>
                  <td style={{padding:"10px 0",...MONO,fontSize:10,color:P.muted}}>{u.joined}</td>
                  <td style={{padding:"10px 0",...BODY,fontSize:13,color:P.muted}}>{u.clinic}</td>
                  <td style={{padding:"10px 0"}}><div style={{border:`1px solid ${u.st==="ACTIVE"?P.ok:u.st==="ALERT"?P.warn:P.faint}`,padding:"1px 6px",display:"inline-flex"}}><span style={{...MONO,fontSize:8,color:u.st==="ACTIVE"?P.ok:u.st==="ALERT"?P.warn:P.faint}}>{u.st}</span></div></td>
                  <td style={{padding:"10px 0",...DISP,fontSize:14,color:P.text}}>{u.s}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </WP>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// FULL-CANVAS: COMPONENTS
// ══════════════════════════════════════════════════════════════════════════════

function Components() {
  return (
    <div style={{width:"100%",height:"100%",background:P.bg,overflowY:"auto",padding:"32px 40px"}}>
      <GridBg/>
      <div style={{position:"relative",zIndex:1}}>
        <div style={{...MONO,fontSize:11,color:P.lime,letterSpacing:"0.12em",marginBottom:8}}>07  COMPONENTS</div>
        <div style={{...DISP,fontSize:52,color:P.text,lineHeight:0.88,marginBottom:8}}>COMPONENT<br/><span style={{color:P.lime}}>LIBRARY</span></div>
        <p style={{...BODY,fontSize:15,color:P.muted,marginBottom:28}}>Reusable primitives — buttons, badges, bars, inputs, charts, empty states.</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:20}}>
          <div style={{background:P.card,border:`1px solid ${P.border}`,padding:20}}>
            <div style={{...MONO,fontSize:9,color:P.muted,marginBottom:12}}>BUTTON VARIANTS</div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              <Btn label="PRIMARY — ACCENT" accent fill/><Btn label="SECONDARY" fill/>
              <div style={{background:P.danger,padding:"10px",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
                <span style={{...MONO,fontSize:10,color:P.text,fontWeight:700}}>[ DANGER ACTION ]</span>
              </div>
              <div style={{background:P.ok,padding:"10px",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
                <span style={{...MONO,fontSize:10,color:P.bg,fontWeight:700}}>[ SUCCESS ]</span>
              </div>
            </div>
          </div>
          <div style={{background:P.card,border:`1px solid ${P.border}`,padding:20}}>
            <div style={{...MONO,fontSize:9,color:P.muted,marginBottom:12}}>STATUS BADGES</div>
            <div style={{display:"flex",flexDirection:"column",gap:7}}>
              {[{l:"ACTIVE",c:P.ok},{l:"IN PROGRESS",c:P.warn},{l:"CALIBRATED",c:P.lime},{l:"REVIEW NEEDED",c:P.danger},{l:"BLE · CONNECTED",c:P.ok},{l:"LIVE SESSION",c:P.danger},{l:"COMPLETED",c:P.ok},{l:"INACTIVE",c:P.muted}].map(({l,c})=>(
                <div key={l} style={{border:`1px solid ${c}`,padding:"3px 10px",display:"inline-flex",alignSelf:"flex-start"}}>
                  <span style={{...MONO,fontSize:9,color:c,fontWeight:700}}>{l}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{background:P.card,border:`1px solid ${P.border}`,padding:20}}>
            <div style={{...MONO,fontSize:9,color:P.muted,marginBottom:12}}>REP VALIDATION</div>
            <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:12}}>
              {[true,true,false,true,true,true,false,true].map((ok,i)=><RepDot key={i} ok={ok}/>)}
            </div>
            <div style={{display:"flex",gap:8,marginBottom:14}}>
              <div style={{border:`1px solid ${P.ok}`,padding:"1px 8px"}}><span style={{...MONO,fontSize:9,color:P.ok}}>6 OK</span></div>
              <div style={{border:`1px solid ${P.danger}`,padding:"1px 8px"}}><span style={{...MONO,fontSize:9,color:P.danger}}>2 ✗</span></div>
            </div>
            <div style={{...MONO,fontSize:9,color:P.muted,marginBottom:8}}>PROGRESS BARS</div>
            {[{l:"TRAINER SIMILARITY",v:70,c:P.warn},{l:"TRAJECTORY QUALITY",v:75,c:P.lime},{l:"SESSION PROGRESS",v:40,c:P.ok}].map(({l,v,c})=>(
              <div key={l} style={{marginBottom:9}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                  <span style={{...MONO,fontSize:8,color:P.muted}}>{l}</span>
                  <span style={{...MONO,fontSize:8,color:c,fontWeight:700}}>{v}%</span>
                </div>
                <Bar value={v} color={c} h={3}/>
              </div>
            ))}
          </div>
          <div style={{background:P.card,border:`1px solid ${P.border}`,padding:20}}>
            <div style={{...MONO,fontSize:9,color:P.muted,marginBottom:12}}>INPUT STATES</div>
            {[{l:"DEFAULT",pl:"Enter value...",border:P.border},{l:"FOCUSED",pl:"Typing...",border:P.lime},{l:"ERROR",pl:"Invalid format",border:P.danger},{l:"SUCCESS",pl:"✓ Validated",border:P.ok}].map(({l,pl,border})=>(
              <div key={l} style={{marginBottom:9}}>
                <div style={{...MONO,fontSize:8,color:P.muted,marginBottom:4}}>{l}</div>
                <div style={{background:P.lift,border:`1px solid ${border}`,padding:"9px 12px",fontFamily:"Inter,sans-serif",fontSize:13,color:P.muted}}>{pl}</div>
              </div>
            ))}
          </div>
          <div style={{background:P.card,border:`1px solid ${P.border}`,padding:20}}>
            <div style={{...MONO,fontSize:9,color:P.muted,marginBottom:12}}>SENSOR STATUS STRIP</div>
            <div style={{background:P.lift,border:`1px solid ${P.border}`,padding:"9px 14px",marginBottom:12,display:"flex",flexWrap:"wrap",gap:0}}>
              {[["BLE","CONN",true],["MPU6050","ACTIVE",true],["BATT","78%",true],["SIG","–62dBm",true],["TEMP","37°C",false]].map(([l,v,ok])=>(
                <div key={String(l)} style={{display:"flex",alignItems:"center",gap:5,paddingRight:12,paddingBottom:3}}>
                  <div style={{width:5,height:5,background:ok?P.ok:P.danger}}/><span style={{...MONO,fontSize:8,color:P.muted}}>{l}</span>
                  <span style={{...MONO,fontSize:9,color:ok?P.text:P.danger,fontWeight:600}}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{...MONO,fontSize:9,color:P.muted,marginBottom:8}}>EMPTY / LOADING STATES</div>
            <div style={{background:P.lift,border:`1px solid ${P.border}`,padding:"14px 12px",display:"flex",flexDirection:"column",alignItems:"center",gap:6,marginBottom:8}}>
              <Activity size={20} color={`${P.muted}60`}/>
              <span style={{...MONO,fontSize:9,color:P.muted}}>NO DATA AVAILABLE</span>
              <span style={{...BODY,fontSize:12,color:P.faint,textAlign:"center"}}>Connect wand and complete a session</span>
            </div>
            <div style={{background:`${P.warn}08`,border:`1px solid ${P.warn}30`,padding:"10px 12px",display:"flex",gap:8,alignItems:"center"}}>
              <AlertTriangle size={14} color={P.warn}/><span style={{...BODY,fontSize:12,color:P.warn}}>Connection lost. Reconnecting…</span>
            </div>
          </div>
          <div style={{background:P.card,border:`1px solid ${P.border}`,padding:20}}>
            <div style={{...MONO,fontSize:9,color:P.muted,marginBottom:8}}>TRAJECTORY CHART</div>
            <div style={{border:`1px solid ${P.border}`,padding:"8px 4px 4px",marginBottom:12}}>
              <ResponsiveContainer width="100%" height={80}>
                <LineChart data={TRAJ} margin={{top:0,right:4,left:-24,bottom:0}}>
                  <CartesianGrid stroke={P.dim} strokeDasharray="3 3"/>
                  <XAxis dataKey="t" tick={{fontSize:7,fill:P.muted,fontFamily:"JetBrains Mono"}}/>
                  <YAxis tick={{fontSize:7,fill:P.muted,fontFamily:"JetBrains Mono"}}/>
                  <Line type="monotone" dataKey="tr" stroke={P.muted} strokeWidth={1.5} strokeDasharray="4 3" dot={false}/>
                  <Line type="monotone" dataKey="pt" stroke={P.lime} strokeWidth={2} dot={false}/>
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{...MONO,fontSize:9,color:P.muted,marginBottom:8}}>ROM AREA CHART</div>
            <div style={{border:`1px solid ${P.border}`,padding:"8px 4px 4px"}}>
              <ResponsiveContainer width="100%" height={70}>
                <AreaChart data={WEEK_ROM} margin={{top:0,right:4,left:-24,bottom:0}}>
                  <defs>
                    <linearGradient id="gCmp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={P.lime} stopOpacity={0.28}/><stop offset="95%" stopColor={P.lime} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={P.dim} strokeDasharray="4 4"/>
                  <XAxis dataKey="d" tick={{fontSize:7,fill:P.muted,fontFamily:"JetBrains Mono"}}/>
                  <YAxis tick={{fontSize:7,fill:P.muted,fontFamily:"JetBrains Mono"}}/>
                  <Area type="monotone" dataKey="rom" stroke={P.lime} fill="url(#gCmp)" strokeWidth={1.5} dot={false}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// FULL-CANVAS: PROTOTYPE FLOWS
// ══════════════════════════════════════════════════════════════════════════════

function Flows() {
  const flows=[
    {n:"01",title:"Patient Onboarding",color:P.lime,steps:["Splash","Login / Register","Role Selection","Pick Trainer","Patient Home"]},
    {n:"02",title:"Live BLE Session",color:P.warn,steps:["Patient Home","Program Detail","Exercise Player","Wand Calibration","Live Session","Trajectory Result","Session Summary"]},
    {n:"03",title:"AI Assistant Flow",color:P.ok,steps:["Assistant Screen","Describe Symptom","AI Proposal","Save & Start Plan","Program Detail","Exercise Player"]},
    {n:"04",title:"Trainer Workflow",color:P.text,steps:["Trainer Login","Dashboard","Create Exercise","Create Program","Patients","Assign Program"]},
    {n:"05",title:"Web Admin Review",color:P.danger,steps:["Admin Login","Overview Dashboard","Review Queue","Flag / Approve","User Management"]},
  ];
  return (
    <div style={{width:"100%",height:"100%",background:P.bg,overflowY:"auto",padding:"32px 40px"}}>
      <GridBg/>
      <div style={{position:"relative",zIndex:1}}>
        <div style={{...MONO,fontSize:11,color:P.lime,letterSpacing:"0.12em",marginBottom:8}}>08  PROTOTYPE FLOWS</div>
        <div style={{...DISP,fontSize:52,color:P.text,lineHeight:0.88,marginBottom:8}}>NAVIGATION<br/><span style={{color:P.lime}}>FLOWS</span></div>
        <p style={{...BODY,fontSize:15,color:P.muted,marginBottom:28}}>Key user journeys across all roles and platforms.</p>
        <div style={{display:"flex",flexDirection:"column",gap:20}}>
          {flows.map(({n,title,color,steps})=>(
            <div key={n} style={{background:P.card,border:`1px solid ${P.border}`,padding:"18px 20px"}}>
              <div style={{...MONO,fontSize:10,color,fontWeight:700,letterSpacing:"0.1em",marginBottom:12}}>{n} — {title.toUpperCase()}</div>
              <div style={{display:"flex",alignItems:"center",gap:0,overflowX:"auto",paddingBottom:8}}>
                {steps.map((step,i)=>(
                  <div key={step} style={{display:"flex",alignItems:"center",flexShrink:0}}>
                    <div style={{background:`${color}12`,border:`1px solid ${color}35`,padding:"9px 14px"}}>
                      <div style={{...MONO,fontSize:8,color,marginBottom:2}}>STEP {i+1}</div>
                      <div style={{...BODY,fontSize:13,color:P.text,fontWeight:600,whiteSpace:"nowrap"}}>{step}</div>
                    </div>
                    {i<steps.length-1&&(
                      <div style={{display:"flex",alignItems:"center",padding:"0 6px",flexShrink:0}}>
                        <div style={{width:14,height:1,background:`${color}50`}}/><ChevronRight size={12} color={`${color}80`}/>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{marginTop:20,background:`${P.lime}08`,border:`1px solid ${P.lime}25`,padding:"18px 20px"}}>
          <div style={{...MONO,fontSize:10,color:P.lime,fontWeight:700,marginBottom:14}}>⚡ LIVE SESSION — BLE INTERNAL FLOW</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
            {[{l:"BLE Init",d:"Scan → Pair → Subscribe → Handshake"},{l:"Calibration",d:"6-axis zero ref → Drift correction"},{l:"Rep Detection",d:"Threshold crossing → Arc validation → AI score"},{l:"Feedback Loop",d:"ROM delta → Voice cue → Trainer notify"}].map(({l,d})=>(
              <div key={l} style={{background:P.card,border:`1px solid ${P.border}`,padding:"14px 16px"}}>
                <div style={{...MONO,fontSize:10,color:P.lime,fontWeight:700,marginBottom:6}}>{l.toUpperCase()}</div>
                <div style={{...BODY,fontSize:12,color:P.muted,lineHeight:1.6}}>{d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}



// ══════════════════════════════════════════════════════════════════════════════
// LIGHT-THEME HELPERS  (cream / L palette — onboarding & admin paths)
// ══════════════════════════════════════════════════════════════════════════════

// Light status bar
function MStatusL() {
  return (
    <div style={{height:44,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 18px",flexShrink:0}}>
      <span style={{...MONO,fontSize:12,color:L.text,fontWeight:600}}>9:41</span>
      <div style={{display:"flex",gap:6,alignItems:"center"}}>
        <Zap size={11} color={L.text}/><Battery size={13} color={L.text}/>
      </div>
    </div>
  );
}

// Light bottom nav
function MNavL({active}:{active:string}) {
  const tabs=[{id:"home",Icon:Home,label:"HOME"},{id:"programs",Icon:Dumbbell,label:"PROGRAMS"},
              {id:"progress",Icon:TrendingUp,label:"PROGRESS"},{id:"ai",Icon:Brain,label:"AI"},
              {id:"profile",Icon:User,label:"PROFILE"}];
  return (
    <div style={{position:"absolute",bottom:0,left:0,right:0,height:72,background:L.bg,borderTop:`1px solid ${L.border}`,display:"flex",alignItems:"center",paddingBottom:8}}>
      {tabs.map(({id,Icon,label})=>(
        <div key={id} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4,cursor:"pointer"}}>
          <Icon size={18} color={id===active?"#5A8A00":L.muted} strokeWidth={1.8}/>
          <span style={{...MONO,fontSize:7,color:id===active?"#5A8A00":L.muted,letterSpacing:"0.1em"}}>{label}</span>
        </div>
      ))}
    </div>
  );
}

// Light section label (number in dark-gold on cream)
function SLabelL({n,label,right}:{n:string;label:string;right?:string}) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:10}}>
      <span style={{...MONO,fontSize:9,color:"#7A5A00",fontWeight:700,flexShrink:0}}>{n}</span>
      <div style={{flex:1,height:1,background:L.border}}/>
      <span style={{...MONO,fontSize:9,color:L.muted,flexShrink:0}}>{label}</span>
      {right&&(<><div style={{width:1,height:10,background:L.border}}/><span style={{...MONO,fontSize:9,color:L.muted,flexShrink:0}}>{right}</span></>)}
    </div>
  );
}

// Light bracket button
function BtnL({label,accent=false,fill=false,sm=false}:{label:string;accent?:boolean;fill?:boolean;sm?:boolean}) {
  return (
    <button style={{width:fill?"100%":"auto",background:accent?P.lime:"transparent",
      border:`1px solid ${accent?P.lime:L.border}`,borderRadius:0,
      padding:sm?"7px 14px":"12px 22px",...MONO,fontWeight:700,
      fontSize:sm?9:11,color:accent?L.text:L.text,cursor:"pointer",
      letterSpacing:"0.1em",display:"flex",alignItems:"center",justifyContent:"center"}}>
      [ {label} ]
    </button>
  );
}

// Light field
function FieldL({label,placeholder,multiline=false}:{label:string;placeholder:string;multiline?:boolean}) {
  return (
    <div style={{marginBottom:14}}>
      <div style={{...MONO,fontSize:9,color:L.muted,letterSpacing:"0.1em",marginBottom:6}}>{label}</div>
      <div style={{background:L.card,border:`1px solid ${L.border}`,padding:"11px 13px",
        fontFamily:"Inter,sans-serif",fontSize:14,color:L.faint,minHeight:multiline?76:undefined}}>{placeholder}</div>
    </div>
  );
}

// Light mobile shell
function MSL({children,navActive="",noNav=false}:{children:React.ReactNode;navActive?:string;noNav?:boolean}) {
  return (
    <div style={{width:390,height:844,background:L.bg,position:"relative",overflow:"hidden",display:"flex",flexDirection:"column"}}>
      <GridBg light/>{children}
      {!noNav&&<MNavL active={navActive}/>}
    </div>
  );
}

// ── LIGHT SCREENS ─────────────────────────────────────────────────────────────

function LoginL() {
  return (
    <MSL noNav>
      <div style={{position:"absolute",width:280,height:280,borderRadius:"50%",background:"radial-gradient(circle,rgba(212,255,0,0.12) 0%,transparent 70%)",top:-60,right:-60,zIndex:0}}/>
      <MStatusL/>
      <div style={{flex:1,overflow:"auto",padding:"16px 18px",position:"relative",zIndex:1}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:30}}>
          <Activity size={14} color="#7A5A00"/><span style={{...MONO,fontSize:10,color:L.text,fontWeight:700,letterSpacing:"0.12em"}}>SKF</span>
        </div>
        <div style={{...MONO,fontSize:9,color:L.muted,marginBottom:6,letterSpacing:"0.12em"}}>REHABILITATION PLATFORM</div>
        <div style={{...DISP,fontSize:48,lineHeight:0.86,color:L.text,marginBottom:8}}>WELCOME<br/><span style={{color:"#5A7A00"}}>BACK</span></div>
        <p style={{...BODY,fontSize:14,color:L.muted,marginBottom:26}}>Sign in to your rehabilitation account</p>
        <FieldL label="EMAIL" placeholder="alex.morgan@rehab.clinic"/>
        <FieldL label="PASSWORD" placeholder="••••••••••••"/>
        <div style={{display:"flex",justifyContent:"flex-end",marginBottom:18}}>
          <span style={{...MONO,fontSize:10,color:"#5A7A00",cursor:"pointer"}}>FORGOT PASSWORD?</span>
        </div>
        <BtnL label="SIGN IN" accent fill/>
        <div style={{display:"flex",alignItems:"center",gap:12,margin:"14px 0"}}>
          <div style={{flex:1,height:1,background:L.border}}/><span style={{...MONO,fontSize:9,color:L.muted}}>OR</span>
          <div style={{flex:1,height:1,background:L.border}}/>
        </div>
        <BtnL label="HEALTHCARE SSO" fill/>
        <div style={{textAlign:"center",marginTop:22}}>
          <span style={{...BODY,fontSize:14,color:L.muted}}>New patient? </span>
          <span style={{...MONO,fontSize:10,color:"#5A7A00",cursor:"pointer"}}>CREATE ACCOUNT</span>
        </div>
      </div>
    </MSL>
  );
}

function RegisterL() {
  return (
    <MSL noNav>
      <MStatusL/>
      <div style={{padding:"0 18px 10px",display:"flex",alignItems:"center",gap:10,borderBottom:`1px solid ${L.border}`,flexShrink:0,position:"relative",zIndex:1}}>
        <ArrowLeft size={18} color={L.muted}/>
        <span style={{...MONO,fontSize:10,color:L.muted,letterSpacing:"0.08em"}}>CREATE ACCOUNT</span>
        <div style={{flex:1}}/>
        <div style={{border:`1px solid ${L.border}`,padding:"2px 8px"}}><span style={{...MONO,fontSize:9,color:L.muted}}>STEP 2/3</span></div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"16px 18px",position:"relative",zIndex:1}}>
        <div style={{...DISP,fontSize:40,lineHeight:0.86,color:L.text,marginBottom:6}}>SELECT<br/><span style={{color:"#5A7A00"}}>ROLE</span></div>
        <p style={{...BODY,fontSize:13,color:L.muted,marginBottom:18}}>Determines your dashboard and permissions</p>
        <div style={{display:"flex",flexDirection:"column",gap:1,background:L.border,marginBottom:18}}>
          {[{id:"patient",label:"PATIENT",desc:"Track my rehabilitation journey",active:true},
            {id:"trainer",label:"TRAINER / PT",desc:"Manage patients & programs",active:false},
            {id:"admin",label:"ADMIN",desc:"Clinical oversight",active:false}].map(r=>(
            <div key={r.id} style={{background:r.active?`rgba(90,122,0,0.08)`:L.bg,borderLeft:r.active?`2px solid #5A7A00`:"2px solid transparent",padding:"13px 16px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                <span style={{...MONO,fontSize:11,color:r.active?"#5A7A00":L.text,fontWeight:700}}>{r.label}</span>
                {r.active&&<div style={{border:"1px solid #5A7A00",padding:"1px 8px"}}><span style={{...MONO,fontSize:8,color:"#5A7A00"}}>SELECTED</span></div>}
              </div>
              <span style={{...BODY,fontSize:13,color:L.muted}}>{r.desc}</span>
            </div>
          ))}
        </div>
        <FieldL label="FULL NAME" placeholder="Alexandra Morgan"/>
        <FieldL label="EMAIL" placeholder="a.morgan@email.com"/>
        <FieldL label="PASSWORD" placeholder="Min 8 chars"/>
        <BtnL label="CREATE ACCOUNT" accent fill/>
      </div>
    </MSL>
  );
}

function ProgramsL() {
  return (
    <MSL navActive="programs">
      <MStatusL/>
      <div style={{padding:"0 18px 10px",borderBottom:`1px solid ${L.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,position:"relative",zIndex:1}}>
        <div style={{...DISP,fontSize:22,color:L.text}}>MY PROGRAMS</div><BtnL label="BROWSE" sm/>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"14px 18px",paddingBottom:90,position:"relative",zIndex:1,display:"flex",flexDirection:"column",gap:1,background:L.border}}>
        {PROGRAMS_DATA.map(p=>{
          const sMeta:{[k:string]:{label:string;color:string}} = {
            ACTIVE:{label:"Not started",color:L.muted},
            IN_PROGRESS:{label:"In progress",color:"#8A6000"},
            PAUSED:{label:"Paused",color:L.muted},
            COMPLETED:{label:"Completed",color:"#1A7A30"},
          };
          const sm = sMeta[p.status];
          const pct = p.status==="COMPLETED"?100:p.status==="IN_PROGRESS"?45:0;
          return (
            <div key={p.name} style={{background:p.status==="IN_PROGRESS"?`rgba(90,122,0,0.06)`:L.bg,borderLeft:p.status==="IN_PROGRESS"?`2px solid #7A9A00`:"2px solid transparent",padding:"14px 16px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                <div style={{...DISP,fontSize:20,color:L.text}}>{p.name}</div>
                <div style={{border:`1px solid ${sm.color}`,padding:"2px 7px"}}><span style={{...MONO,fontSize:8,color:sm.color}}>{sm.label.toUpperCase()}</span></div>
              </div>
              <div style={{display:"flex",gap:16,marginBottom:10}}>
                <span style={{...MONO,fontSize:9,color:L.muted}}>{p.weeks} WEEKS</span>
                <span style={{...MONO,fontSize:9,color:L.muted}}>{p.exs} EXERCISES</span>
              </div>
              <div style={{height:3,background:L.surf,position:"relative"}}>
                <div style={{position:"absolute",inset:0,right:`${100-pct}%`,background:sm.color}}/>
              </div>
            </div>
          );
        })}
      </div>
    </MSL>
  );
}

function CheckInL() {
  return (
    <MSL noNav>
      <MStatusL/>
      <div style={{padding:"0 18px 10px",display:"flex",alignItems:"center",gap:10,borderBottom:`1px solid ${L.border}`,flexShrink:0,position:"relative",zIndex:1}}>
        <ArrowLeft size={18} color={L.muted}/><span style={{...MONO,fontSize:10,color:L.muted}}>DAILY CHECK-IN</span>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"16px 18px",position:"relative",zIndex:1}}>
        <div style={{...DISP,fontSize:40,lineHeight:0.86,color:L.text,marginBottom:6}}>NEW<br/><span style={{color:"#5A7A00"}}>CHECK-IN</span></div>
        <p style={{...BODY,fontSize:13,color:L.muted,marginBottom:20}}>Monday, 30 June 2025 · Log pain & mobility</p>
        {[{label:"PAIN TODAY (0–10)",value:3,color:"#CC2020"},{label:"MOBILITY SCORE (0–10)",value:7,color:"#1A7A30"},{label:"ENERGY LEVEL (0–10)",value:6,color:"#7A9A00"}].map(({label,value,color})=>(
          <div key={label} style={{marginBottom:20}}>
            <div style={{...MONO,fontSize:9,color:L.muted,marginBottom:8}}>{label}</div>
            <div style={{display:"flex",gap:3}}>
              {Array.from({length:11},(_,i)=>i).map(n=>(
                <div key={n} style={{flex:1,height:30,border:`1px solid ${n===value?color:L.border}`,background:n===value?`${color}18`:L.card,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
                  <span style={{...MONO,fontSize:8,color:n===value?color:L.muted,fontWeight:700}}>{n}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
        <FieldL label="NOTES (OPTIONAL)" placeholder="Slight stiffness this morning..." multiline/>
        <BtnL label="SUBMIT CHECK-IN" accent fill/>
      </div>
    </MSL>
  );
}

function ProfileL() {
  return (
    <MSL navActive="profile">
      <MStatusL/>
      <div style={{padding:"0 18px 10px",borderBottom:`1px solid ${L.border}`,flexShrink:0,position:"relative",zIndex:1}}>
        <div style={{...DISP,fontSize:22,color:L.text}}>PROFILE</div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"20px 18px",paddingBottom:90,position:"relative",zIndex:1,display:"flex",flexDirection:"column",gap:14}}>
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
          <div style={{width:72,height:72,borderRadius:"50%",background:"linear-gradient(135deg,#7A9A00,#1A7A30)",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <span style={{...DISP,fontSize:28,color:"#fff"}}>AM</span>
          </div>
          <div style={{...DISP,fontSize:22,color:L.text}}>ALEXANDRA MORGAN</div>
          <div style={{...BODY,fontSize:14,color:L.muted}}>alexandra.morgan@gmail.com</div>
          <div style={{border:`1px solid #1A7A30`,padding:"3px 10px"}}><span style={{...MONO,fontSize:9,color:"#1A7A30"}}>PATIENT · ID #PT-00412</span></div>
        </div>
        <SLabelL n="01" label="MY TRAINER"/>
        <div style={{border:`1px solid ${L.border}`,background:L.card,padding:"13px 14px",display:"flex",alignItems:"center",gap:12,cursor:"pointer"}}>
          <div style={{width:40,height:40,borderRadius:"50%",background:"rgba(90,122,0,0.15)",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <span style={{...MONO,fontSize:13,color:"#7A9A00",fontWeight:700}}>JR</span>
          </div>
          <div style={{flex:1}}>
            <div style={{...BODY,fontSize:14,color:L.text,fontWeight:600}}>Dr. James Rivera</div>
            <div style={{...MONO,fontSize:9,color:L.muted}}>PHYSIOTHERAPIST · LINKED</div>
          </div>
          <ChevronRight size={14} color={L.muted}/>
        </div>
        <SLabelL n="02" label="ACCOUNT SETTINGS"/>
        <div style={{display:"flex",flexDirection:"column",gap:1,background:L.border}}>
          {["Role: Patient","Notifications: Enabled","Language: English","Dark Mode: Off"].map(item=>(
            <div key={item} style={{background:L.bg,padding:"11px 14px",display:"flex",justifyContent:"space-between"}}>
              <span style={{...BODY,fontSize:13,color:L.text}}>{item.split(":")[0]}</span>
              <span style={{...MONO,fontSize:11,color:"#7A9A00"}}>{item.split(":")[1]?.trim()}</span>
            </div>
          ))}
        </div>
        <div style={{background:"rgba(204,26,26,0.06)",border:"1px solid rgba(204,26,26,0.2)",padding:"12px 14px",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
          <span style={{...MONO,fontSize:11,color:"#CC1A1A",fontWeight:700}}>[ LOG OUT ]</span>
        </div>
      </div>
    </MSL>
  );
}

function NotificationsL() {
  return (
    <MSL noNav>
      <MStatusL/>
      <div style={{padding:"0 18px 10px",display:"flex",alignItems:"center",gap:10,borderBottom:`1px solid ${L.border}`,flexShrink:0,position:"relative",zIndex:1}}>
        <ArrowLeft size={18} color={L.muted}/><span style={{...DISP,fontSize:20,color:L.text}}>NOTIFICATIONS</span>
      </div>
      <div style={{flex:1,overflowY:"auto",position:"relative",zIndex:1,display:"flex",flexDirection:"column",gap:1,background:L.border}}>
        {[{color:"#1A7A30",label:"Session complete",sub:"Shoulder Recovery · 5 exercises done",time:"2h ago"},
          {color:"#8A6000",label:"Check-in reminder",sub:"Log your daily pain & mobility",time:"8h ago"},
          {color:"#7A9A00",label:"Trainer message",sub:"Dr. Rivera: 'Great progress today!'",time:"Yesterday"},
          {color:"#1A7A30",label:"ROM milestone",sub:"You reached 80° external rotation!",time:"2 days ago"},
          {color:"#8A6000",label:"Rest day suggestion",sub:"AI recommends a recovery day today",time:"3 days ago"},
          {color:"#1A7A30",label:"Weekly report ready",sub:"View your progress summary for Jun 23–30",time:"4 days ago"}].map((n,i)=>(
          <div key={i} style={{background:L.bg,padding:"13px 18px",display:"flex",gap:12,alignItems:"flex-start"}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:n.color,marginTop:5,flexShrink:0}}/>
            <div style={{flex:1}}>
              <div style={{...BODY,fontSize:14,color:L.text,fontWeight:500,marginBottom:2}}>{n.label}</div>
              <div style={{...BODY,fontSize:13,color:L.muted}}>{n.sub}</div>
            </div>
            <span style={{...MONO,fontSize:9,color:L.faint,flexShrink:0}}>{n.time}</span>
          </div>
        ))}
      </div>
    </MSL>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// HANDOFF FRAME PRIMITIVES
// ══════════════════════════════════════════════════════════════════════════════

const CANVAS = "#181828";

function Frame({
  label, w, h, children, scale = 1,
}:{ label:string; w:number; h:number; children:React.ReactNode; scale?:number }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10, flexShrink:0 }}>
      <div style={{ display:"flex", alignItems:"baseline", gap:8 }}>
        <span style={{ ...MONO, fontSize:11, color:"#F0F0F0", fontWeight:700 }}>{label}</span>
        <span style={{ ...MONO, fontSize:9,  color:"#7A7A7A" }}>{w}×{h}</span>
      </div>
      <div style={{
        width:w*scale, height:h*scale,
        position:"relative", overflow:"hidden", flexShrink:0,
        outline:"1px solid rgba(255,255,255,0.12)",
      }}>
        <div style={{
          width:w, height:h,
          transform:scale!==1?`scale(${scale})`:undefined,
          transformOrigin:"top left",
          position:"absolute", top:0, left:0,
        }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function SHead({ n, label, dim, count }:{ n:string; label:string; dim:string; count:number }) {
  return (
    <div style={{ marginBottom:24, display:"flex", alignItems:"center", gap:14 }}>
      <span style={{ fontFamily:"JetBrains Mono,monospace", fontSize:10, color:"#D4FF00", fontWeight:700, flexShrink:0 }}>{n}</span>
      <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, textTransform:"uppercase" as const, fontSize:20, color:"#F0F0F0", flexShrink:0, letterSpacing:"-0.01em" }}>{label}</span>
      <div style={{ flex:1, height:1, background:"rgba(255,255,255,0.09)" }} />
      <span style={{ fontFamily:"JetBrains Mono,monospace", fontSize:9, color:"#7A7A7A", flexShrink:0 }}>{count} SCREENS · {dim}</span>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// HANDOFF EXPORT — Clean standalone frames, no navigation
// ══════════════════════════════════════════════════════════════════════════════

export default function App() {
  const WS = 0.55; // web scale (1440×900 → 792×495 displayed)

  return (
    <div style={{
      background: CANVAS,
      minWidth:"100vw", minHeight:"100vh",
      overflowX:"auto", overflowY:"auto",
      padding:"56px 60px 100px",
      fontFamily:"Inter,sans-serif",
    }}>

      {/* ── Canvas wordmark ─────────────────────────────────── */}
      <div style={{ marginBottom:56 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
          <Activity size={15} color="#D4FF00" />
          <span style={{ fontFamily:"JetBrains Mono,monospace", fontSize:12, color:"#E0E0EE", fontWeight:700, letterSpacing:"0.14em" }}>
            SMARTKINETOFIT
          </span>
          <div style={{ width:1, height:14, background:"rgba(200,200,255,0.08)" }} />
          <span style={{ fontFamily:"JetBrains Mono,monospace", fontSize:9, color:"#6C6C88" }}>
            HANDOFF EXPORT · v2.0 · DIPLOMA PROJECT 2025
          </span>
          <div style={{ flex:1 }} />
          <span style={{ fontFamily:"JetBrains Mono,monospace", fontSize:9, color:"rgba(200,200,255,0.25)" }}>
            29 SCREENS · 5 SECTIONS · DARK + LIGHT VARIANTS
          </span>
        </div>
        <div style={{ height:1, background:"rgba(200,200,255,0.08)" }} />
      </div>

      {/* ══ SECTION 00 — COVER (light cream) ═══════════════ */}
      <SHead n="00" label="Cover" dim="Full Canvas" count={1} />
      <div style={{ display:"flex", gap:20, marginBottom:80, alignItems:"flex-start" }}>
        <Frame label="Cover" w={1200} h={680} scale={0.75}><Cover/></Frame>
      </div>

      {/* ══ SECTION 01 — MOBILE PATIENT ════════════════════ */}
      <SHead n="01" label="Mobile — Patient" dim="390×844" count={15} />
      <div style={{ display:"flex", gap:20, marginBottom:80, alignItems:"flex-start" }}>
        <Frame label="Splash"            w={390} h={844}><Splash/></Frame>
        <Frame label="Login"             w={390} h={844}><LoginL/></Frame>
        <Frame label="Register"          w={390} h={844}><RegisterL/></Frame>
        <Frame label="Patient Home"      w={390} h={844}><PatientHome/></Frame>
        <Frame label="Programs"          w={390} h={844}><ProgramsL/></Frame>
        <Frame label="Program Detail"    w={390} h={844}><ProgramDetail/></Frame>
        <Frame label="Exercise Player"   w={390} h={844}><ExercisePlayer/></Frame>
        <Frame label="Live Session"      w={390} h={844}><LiveSession/></Frame>
        <Frame label="Trajectory Result" w={390} h={844}><Trajectory/></Frame>
        <Frame label="Progress"          w={390} h={844}><Progress/></Frame>
        <Frame label="Check-in"          w={390} h={844}><CheckInL/></Frame>
        <Frame label="AI Assistant"      w={390} h={844}><AIAssistant/></Frame>
        <Frame label="Chat"              w={390} h={844}><Chat/></Frame>
        <Frame label="Profile"           w={390} h={844}><ProfileL/></Frame>
        <Frame label="Notifications"     w={390} h={844}><NotificationsL/></Frame>
      </div>

      {/* ══ SECTION 02 — MOBILE TRAINER ════════════════════ */}
      <SHead n="02" label="Mobile — Trainer" dim="390×844" count={5} />
      <div style={{ display:"flex", gap:20, marginBottom:80, alignItems:"flex-start" }}>
        <Frame label="Trainer Home"    w={390} h={844}><TrainerHome/></Frame>
        <Frame label="Exercise List"   w={390} h={844}><ExerciseList/></Frame>
        <Frame label="Create Exercise" w={390} h={844}><CreateExercise/></Frame>
        <Frame label="Patients"        w={390} h={844}><TrainerPatients/></Frame>
        <Frame label="Assign Program"  w={390} h={844}><AssignProgram/></Frame>
      </div>

      {/* ══ SECTION 03 — WEB PATIENT ════════════════════════ */}
      <SHead n="03" label="Web — Patient" dim="1440×900" count={1} />
      <div style={{ display:"flex", gap:28, marginBottom:80, alignItems:"flex-start" }}>
        <Frame label="Patient Dashboard" w={1440} h={900} scale={WS}><WebPatientDash/></Frame>
      </div>

      {/* ══ SECTION 04 — WEB TRAINER ════════════════════════ */}
      <SHead n="04" label="Web — Trainer" dim="1440×900" count={1} />
      <div style={{ display:"flex", gap:28, marginBottom:80, alignItems:"flex-start" }}>
        <Frame label="Trainer Dashboard" w={1440} h={900} scale={WS}><WebTrainerDash/></Frame>
      </div>

      {/* ══ SECTION 05 — WEB ADMIN ══════════════════════════ */}
      <SHead n="05" label="Web — Admin" dim="1440×900" count={1} />
      <div style={{ display:"flex", gap:28, marginBottom:80, alignItems:"flex-start" }}>
        <Frame label="Admin Overview"    w={1440} h={900} scale={WS}><WebAdmin/></Frame>
      </div>

      {/* ── Canvas footer ─────────────────────────────────── */}
      <div style={{ height:1, background:"rgba(200,200,255,0.08)", marginTop:20 }} />
      <div style={{ display:"flex", justifyContent:"space-between", paddingTop:20 }}>
        <span style={{ fontFamily:"JetBrains Mono,monospace", fontSize:8, color:"rgba(200,200,255,0.2)" }}>
          SOLANA SUMMIT ART DIRECTION → MEDICAL REHABILITATION · DARK #0C0C18 + CREAM #EDE8DF
        </span>
        <span style={{ fontFamily:"JetBrains Mono,monospace", fontSize:8, color:"rgba(200,200,255,0.2)" }}>
          BARLOW CONDENSED · INTER · JETBRAINS MONO · #D4FF00 ACCENT
        </span>
      </div>
    </div>
  );
}