"use client";

import { useState } from "react";
import {
  Activity, AlertTriangle, ArrowRight, AudioLines, BookOpen, CalendarDays,
  Check, CheckCircle2, CircleHelp, Download, Flame, Gauge, Home,
  LockKeyhole, Menu, MessageSquareText, Mic2, RefreshCw, ShieldCheck,
  SlidersHorizontal, Sparkles, Target, Trophy, X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const navigation = [
  { section: "Daily Practice", subtitle: "Practice and speak today", items: [
    { label: "Home", icon: Home }, { label: "Today’s Practice", icon: Flame }, { label: "Conversation Studio", icon: MessageSquareText },
  ]},
  { section: "Learning Paths", subtitle: "Grammar and English study", items: [] },
  { section: "Learning Evidence", subtitle: "Errors and recordings", items: [] },
  { section: "App and Settings", subtitle: "Storage and personal options", items: [] },
];

const statusCards = [
  { label: "Automated", value: "0", note: "All evidence gates passed", icon: CheckCircle2, tone: "cyan" },
  { label: "Unstable", value: "1", note: "Needs more retrieval cycles", icon: AlertTriangle, tone: "amber" },
  { label: "Due now", value: "0", note: "Reviews and repairs", icon: RefreshCw, tone: "blue" },
  { label: "Weekly momentum", value: "0%", note: "Active days in last 7", icon: Gauge, tone: "purple" },
];

const gateRows = [
  ["Automatic topics 0/16", "Open"], ["Active critical errors 0", "Done"],
  ["Speaking evidence 0/8", "Open"], ["Writing evidence 0/8", "Open"], ["Transfer evidence 0/8", "Open"],
];

function HeroArt() {
  return (
    <svg className="hero-art" viewBox="0 0 640 350" role="img" aria-label="Two learners practising English with a microphone">
      <defs>
        <linearGradient id="portal" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff4c8"/><stop offset="1" stopColor="#ef896f"/></linearGradient>
        <linearGradient id="shirt" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#20aab0"/><stop offset="1" stopColor="#086c86"/></linearGradient>
      </defs>
      <circle cx="489" cy="67" r="24" fill="#84a9ce" opacity=".24"/>
      <path d="M450 62 618 12v295H450Z" fill="url(#portal)" opacity=".98"/>
      <path d="M428 70c-61 61-62 166-7 229" fill="none" stroke="#8ab2da" strokeWidth="3" opacity=".8"/>
      <path d="M413 84c-30 58-29 137 7 193" fill="none" stroke="#6e99c8" strokeWidth="1.5"/>
      <ellipse cx="470" cy="315" rx="161" ry="28" fill="#071d48" opacity=".55"/>
      <path d="M305 300c40-83 122-83 173 2" fill="#143c67" opacity=".8"/>
      <g transform="translate(477 92)">
        <circle cx="40" cy="32" r="22" fill="#8a553d"/><path d="M23 25c3-22 38-30 47-3-14-7-28-6-47 3Z" fill="#16213e"/>
        <path d="M23 56c8-12 33-12 40 0l8 100H17Z" fill="url(#shirt)"/>
        <path d="M18 67-8 98m78-29 32 18" fill="none" stroke="#d39a78" strokeWidth="11" strokeLinecap="round"/>
        <path d="M28 155v81m29-81 9 81" stroke="#f1dec8" strokeWidth="15" strokeLinecap="round"/>
      </g>
      <g transform="translate(291 183)">
        <circle cx="59" cy="28" r="23" fill="#a3694c"/><path d="M35 30c0-32 47-35 50-2-9-15-34-16-50 2Z" fill="#171b31"/>
        <path d="M35 53c15-12 45-10 54 5l18 80H19Z" fill="url(#shirt)"/>
        <path d="M26 70-5 95m101-24 38 18" fill="none" stroke="#c98f6c" strokeWidth="12" strokeLinecap="round"/>
      </g>
      <g transform="translate(412 239)"><rect x="0" y="0" width="29" height="64" rx="14" fill="#c9d8e1" stroke="#e4edf3" strokeWidth="4"/><path d="M-7 34c0 23 43 23 43 0M15 57v25m-20 0h40" fill="none" stroke="#9bb0bf" strokeWidth="4"/></g>
      <g fontFamily="system-ui" fontWeight="700" fill="white">
        <path d="M247 99h86a18 18 0 0 1 18 18v22a18 18 0 0 1-18 18h-18l-12 15-1-15h-55a18 18 0 0 1-18-18v-22a18 18 0 0 1 18-18Z" fill="#0e8e90"/><text x="266" y="133" fontSize="28">•••</text>
        <path d="M346 74h84a18 18 0 0 1 18 18v21a18 18 0 0 1-18 18h-24l-9 14-3-14h-48a18 18 0 0 1-18-18V92a18 18 0 0 1 18-18Z" fill="#ef754b"/><text x="365" y="106" fontSize="28">•••</text>
      </g>
    </svg>
  );
}

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <>
      <button className={cn("sidebar-scrim", open && "visible")} aria-label="Close navigation" onClick={onClose} />
      <aside className={cn("sidebar", open && "open")} aria-label="Primary navigation">
        <div className="brand"><span className="brand-icon"><Sparkles /></span><div><strong>English Automaticity</strong><small>Measured daily language practice</small></div><button className="close-nav" onClick={onClose} aria-label="Close navigation"><X /></button></div>
        <nav>
          {navigation.map((group, index) => (
            <section className={cn("nav-group", index === 0 && "expanded")} key={group.section}>
              <div className="nav-section"><strong>{group.section}</strong><small>{group.subtitle}</small></div>
              {group.items.map(({ label, icon: Icon }) => <button key={label} className={cn("nav-item", label === "Home" && "active")}><Icon />{label}</button>)}
            </section>
          ))}
        </nav>
        <div className="profile-orb">N</div>
      </aside>
    </>
  );
}

function Header({ onMenu, onRuler }: { onMenu: () => void; onRuler: () => void }) {
  return (
    <header className="topbar">
      <div className="page-title"><Button variant="ghost" size="icon" className="mobile-menu" onClick={onMenu} aria-label="Open menu"><Menu /></Button><span className="home-icon"><Home /></span><div><h1>Home</h1><p>Progress and next step</p></div></div>
      <div className="top-actions">
        <Badge className="service"><span />App service online</Badge>
        <Button variant="outline" className="reading" onClick={onRuler}><span className="empty-square" />Reading ruler</Button>
        <Button variant="outline" size="icon" aria-label="Audio settings"><AudioLines /></Button>
        <Button variant="outline" size="icon" aria-label="Preferences"><SlidersHorizontal /></Button>
        <Button variant="outline" className="help"><CircleHelp />Help</Button>
        <Button><Download />Install app</Button>
      </div>
    </header>
  );
}

export function Dashboard() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [ruler, setRuler] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [missions, setMissions] = useState<boolean[]>([false, false, false, false]);
  const completed = missions.filter(Boolean).length;
  const chart = progress ? [0, 0, 1, 1, 2, 2, 3] : [0, 0, 0, 0, 0, 0, 0];

  const notify = (text: string) => { setMessage(text); window.setTimeout(() => setMessage(""), 2500); };
  const startPath = () => { setProgress((value) => Math.min(100, value + 20)); notify("Today’s learning path has started."); };
  const toggleMission = (index: number) => setMissions((items) => items.map((item, itemIndex) => itemIndex === index ? !item : item));

  return (
    <div className="app-shell">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="main-shell">
        <Header onMenu={() => setMenuOpen(true)} onRuler={() => setRuler((value) => !value)} />
        {ruler && <div className="reading-ruler" aria-hidden="true" />}
        <main className="dashboard">
          <section className="top-grid" aria-label="Daily overview">
            <Card className="hero-card">
              <div className="hero-copy">
                <Badge className="hero-badge"><Sparkles />Your daily route is automatic English</Badge>
                <h2>Use English<br/>confidently and<br/>automatically</h2>
                <p>Turn rule knowledge into natural usage in writing, conversation, error repair, and real-life transfer.</p>
                <div className="hero-actions"><Button onClick={startPath}>Start today’s path <ArrowRight /></Button><Button variant="outline" onClick={() => notify("Conversation Studio opened.")}>Open Conversation Studio</Button></div>
                <div className="hero-tags"><Badge>A1 selected level</Badge><Badge>— verified level</Badge><Badge>112 grammar units</Badge><Badge>72 conversation topics</Badge><Badge>3 daily tries</Badge></div>
              </div>
              <HeroArt />
              <div className="practice-float"><div className="practice-head"><strong>Today’s Practice</strong><Badge>A1</Badge></div><div className="practice-main"><div className="mini-ring">{progress}%</div><div><strong>Verb be: am/is/are</strong><small>{Math.round(progress / 34)} of 3 steps complete · 15 minutes</small></div></div><Progress value={progress} label="Today's practice progress"/><Button onClick={startPath}>Start 15-minute practice <ArrowRight /></Button></div>
            </Card>

            <div className="overview-column">
              <Card className="onboarding"><CardContent><div className="onboarding-title"><Badge>New here?</Badge><strong>Start confidently in three steps</strong></div><div className="steps">{[["Start daily path", "Your daily path gives one clear practice order for today."], ["Speak and repair", "Speak or type, review the correction, and improve."], ["Review due errors", "Open the error workshop for today’s target scope."]].map(([title, note], index) => <div className="step" key={title}><span>{index + 1}</span><div><strong>{title}</strong><small>{note}</small></div></div>)}<Button onClick={startPath}>Start Step 1 <ArrowRight /></Button></div></CardContent></Card>
              <div className="section-label"><strong>Live Learning Status</strong><small>Your dashboard</small></div>
              <div className="status-grid">{statusCards.map(({ label, value, note, icon: Icon, tone }) => <Card className="status-card" key={label}><span className={`status-icon ${tone}`}><Icon /></span><div><small>{label}</small><strong>{label === "Weekly momentum" ? (progress ? `${Math.min(100, progress)}%` : value) : value}</strong><p>{note}</p></div></Card>)}</div>
            </div>
          </section>

          <section className="middle-grid" aria-label="Learning evidence">
            <Card className="competency"><CardHeader><div><Target/><strong>Competency profile</strong></div><small>Content seen, securely learned, and used without help.</small></CardHeader><CardContent><div className="large-ring" style={{ "--ring-value": `${progress * 3.6}deg` } as React.CSSProperties}><strong>{progress}%</strong><small>Overall profile</small></div><div className="legend">{[["Coverage", progress, "blue"], ["Mastery", Math.round(progress * .6), "purple"], ["Automaticity", Math.round(progress * .35), "orange"]].map(([label, value, color]) => <div key={String(label)}><span className={String(color)} />{label}<strong>{value}%</strong></div>)}</div></CardContent></Card>
            <Card className="activity-card"><CardHeader><div><Activity/><strong>Activity in the last 7 days</strong></div><small>Only learning activity that was actually saved is shown.</small></CardHeader><CardContent><div className="chart" aria-label="Seven day activity chart">{chart.map((value, index) => <div className="chart-day" key={index}><span style={{ height: `${Math.max(2, value * 20)}%` }} /><i>{["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][index]}</i></div>)}</div><p className="empty-note">{progress ? "Your real learning curve is beginning to appear." : "No activity has been saved yet. Your real learning curve will appear after the first exercise."}</p></CardContent></Card>
            <div className="stacked-cards"><Card className="skill-card"><CardHeader><div><Trophy/><strong>Market-style skill balance</strong></div><small>Strong writing cannot replace verified speaking.</small></CardHeader><CardContent><div className="risk"><span><strong>0</strong>Speaking risk</span><span><strong>0</strong>Writing risk</span></div></CardContent></Card><Card className="errors-card"><CardHeader><div><AlertTriangle/><strong>Top recurring errors</strong></div><small>Prioritized from active repair loops.</small></CardHeader><CardContent><p>No active recurring errors. New corrections will be added automatically.</p></CardContent></Card></div>
            <Card className="gate-card"><CardHeader><div><LockKeyhole/><strong>Level progress gate</strong><Badge>A1</Badge></div><small>A level is verified only when all automaticity requirements are complete.</small></CardHeader><CardContent>{gateRows.map(([label, status]) => <div className="gate-row" key={label}><CheckCircle2/><span>{label}</span><Badge className={status === "Done" ? "done" : "open"}>{status}</Badge></div>)}</CardContent></Card>
          </section>

          <section className="evidence-row">
            <Card className="evidence-card"><CardHeader><div><ShieldCheck/><strong>Evidence over streaks alone</strong></div><small>These privacy-friendly app metrics show practice and change over time, but they do not replace an independent CEFR certificate.</small></CardHeader><CardContent>{[["Active days this week", `${completed}/5`], ["Productive samples", progress ? "1" : "0"], ["Outcome change", progress ? "Baseline started" : "Missing baseline"], ["Independent rating", "Not captured"]].map(([label, value]) => <div className="mini-metric" key={label}><small>{label}</small><strong>{value}</strong></div>)}</CardContent></Card>
            <Card className="balanced"><CardHeader><Badge>Adaptive session · 3 of 3 steps</Badge><strong>Balanced plan</strong></CardHeader><CardContent><p>Use all three steps: Grammar, Read aloud, and Coach conversation.</p><Button onClick={startPath}>Start recommended session <ArrowRight /></Button></CardContent></Card>
            <Card className="protocol"><CardHeader><Badge>Adaptive 15/30/45/60-minute daily protocol</Badge><strong>Scientific pacing for automaticity</strong></CardHeader><CardContent>{[["Grammar", "8–15 min"], ["Read aloud", "10–15 min"], ["Coach conversation", "15–30 min"]].map(([title, time], index) => <div key={title}><strong>{title}<small>{time}</small></strong><Badge>{["First","Second","Third"][index]}</Badge></div>)}</CardContent></Card>
          </section>

          <section className="bottom-grid">
            <Card className="missions"><CardHeader><div><CalendarDays/><strong>Weekly mission board</strong></div><small>Keep your pace with short, market-style missions.</small></CardHeader><CardContent><div className="mission-progress"><Badge>{Math.round(completed / 4 * 100)}%</Badge><Progress value={completed / 4 * 100} label="Weekly mission progress"/></div><div className="mission-list">{["Finish one grammar checkpoint", "Record one spoken answer", "Clear due reviews", "Reach 80% weekly activity"].map((label, index) => <button className={cn("mission", missions[index] && "complete")} key={label} onClick={() => toggleMission(index)}><span>{missions[index] ? <Check/> : index === 1 ? <Mic2/> : <BookOpen/>}</span>{label}<Badge>{index === 2 ? "Priority" : index === 3 ? "Weekly" : "Daily"}</Badge></button>)}</div></CardContent></Card>
            <Card className="quick"><CardHeader><div><Sparkles/><strong>Quick launch</strong></div><small>Recommended flow used by top language apps.</small></CardHeader><CardContent>{[[BookOpen, "Open grammar lab", "Recall and controlled practice"], [Mic2, "Open conversation studio", "Target grammar in natural speech"], [RefreshCw, "Open error workshop", "Repair recurring mistakes"]].map(([Icon, title, note]) => { const LaunchIcon = Icon as typeof BookOpen; return <button key={String(title)} onClick={() => notify(`${title} selected.`)}><LaunchIcon/><span><strong>{title as string}</strong><small>{note as string}</small></span><ArrowRight/></button> })}<div className="badges"><strong>Achievement badges</strong><span><Trophy/>Consistency Starter</span><span><Trophy/>Automaticity Builder</span><span><Trophy/>Review Zero</span></div></CardContent></Card>
            <Card className="visible-progress"><CardHeader><div><Badge>Your visible progress</Badge><strong>From recall to confident speaking</strong></div><span><strong>{progress}%</strong><small>completed today</small></span></CardHeader><CardContent>{[["Grammar", "Write a personal sentence from a real situation."], ["Read Aloud", "Read the corrected sentence aloud to build speaking memory."], ["Coach Conversation", "Use the structure in a short coached conversation."]].map(([title, note], index) => <article key={title}><div className={`progress-art art-${index + 1}`}><span>{index + 1}</span><BookOpen/><MessageSquareText/><Trophy/></div><strong>{title}</strong><p>{note}</p><Badge>{index === 0 ? "In progress" : "Next"}</Badge></article>)}</CardContent></Card>
          </section>
        </main>
      </div>
      <div className={cn("toast", message && "show")} role="status" aria-live="polite">{message}</div>
    </div>
  );
}
