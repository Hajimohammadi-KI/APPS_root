"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  Activity, ArrowRight, AudioLines, BookMarked, BookOpen, CircleHelp,
  Download, Flame, Folder, GraduationCap, Home, LockKeyhole, Menu,
  MessageSquareText, Settings, SlidersHorizontal, Sparkles, X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const navigation = [
  { section: "Daily Practice", subtitle: "Practice and speak today", items: [
    { label: "Home", href: "/", icon: Home },
    { label: "Today’s Practice", href: "/practice", icon: Flame },
    { label: "Conversation Studio", href: "/conversation", icon: MessageSquareText },
  ]},
  { section: "Learning Paths", subtitle: "Grammar and English study", items: [
    { label: "Grammar Lab", href: "/grammar", icon: BookOpen },
    { label: "Learning Resources", href: "/resources", icon: Folder },
    { label: "Integrated Skills", href: "/skills", icon: GraduationCap },
  ]},
  { section: "Learning Evidence", subtitle: "Errors and recordings", items: [
    { label: "Errors and recordings", href: "/evidence", icon: Activity },
    { label: "Notebook & PDF Reader", href: "/notebook", icon: BookMarked },
    { label: "Vocabulary & Flashcards", href: "/vocabulary", icon: Folder },
  ]},
  { section: "App and Settings", subtitle: "Storage and personal options", items: [
    { label: "Settings", href: "/settings", icon: Settings },
  ]},
];

const levelMetrics = [
  { label: "Automatic topics", value: 0, total: 16, color: "#7550d8" },
  { label: "Critical errors cleared", value: 1, total: 1, color: "#10a675" },
  { label: "Speaking evidence", value: 0, total: 8, color: "#2d79ed" },
  { label: "Writing evidence", value: 0, total: 8, color: "#a855f7" },
  { label: "Transfer evidence", value: 0, total: 8, color: "#f59e0b" },
];

function ActivityChart({ values }: { values: number[] }) {
  const points = values.map((value, index) => `${24 + index * 98},${148 - value * 30}`).join(" ");
  const area = `24,148 ${points} 612,148`;

  return (
    <div className="modern-activity-chart">
      <svg viewBox="0 0 636 172" role="img" aria-label="Activity over the last seven days">
        <defs><linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#7754dd" stopOpacity=".28"/><stop offset="1" stopColor="#7754dd" stopOpacity="0"/></linearGradient></defs>
        {[28, 68, 108, 148].map((y) => <line key={y} x1="24" x2="612" y1={y} y2={y} className="chart-grid-line" />)}
        <polygon points={area} fill="url(#activityFill)" />
        <polyline points={points} className="activity-line" />
        {values.map((value, index) => <circle key={index} cx={24 + index * 98} cy={148 - value * 30} r="5" className="activity-point" />)}
      </svg>
      <div className="chart-days">{["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((day) => <span key={day}>{day}</span>)}</div>
    </div>
  );
}

function LevelProgressChart() {
  const completion = 20;

  return (
    <div className="level-chart">
      <div className="level-donut" style={{ "--level-progress": `${completion * 3.6}deg` } as React.CSSProperties}><div><strong>{completion}%</strong><small>A1 progress</small></div></div>
      <div className="level-bars">
        {levelMetrics.map(({ label, value, total, color }) => (
          <div className="level-bar" key={label}>
            <div><span>{label}</span><strong>{value}/{total}</strong></div>
            <div className="level-track"><i style={{ width: `${Math.max(value / total * 100, 2)}%`, background: color }} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}

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
  const pathname = usePathname();

  return (
    <>
      <button className={cn("sidebar-scrim", open && "visible")} aria-label="Close navigation" onClick={onClose} />
      <aside className={cn("sidebar", open && "open")} aria-label="Primary navigation">
        <div className="brand"><span className="brand-icon"><Sparkles /></span><div><strong>English Automaticity</strong><small>Measured daily language practice</small></div><button className="close-nav" onClick={onClose} aria-label="Close navigation"><X /></button></div>
        <nav>
          {navigation.map((group) => {
            const groupIsActive = group.items.some((item) => item.href === pathname);
            return (
            <section className={cn("nav-group", groupIsActive && "expanded")} key={group.section}>
              <div className="nav-section"><strong>{group.section}</strong><small>{group.subtitle}</small></div>
              {group.items.map(({ label, href, icon: Icon }) => <Link href={href} key={href} onClick={onClose} className={cn("nav-item", pathname === href && "active")} aria-current={pathname === href ? "page" : undefined}><Icon />{label}</Link>)}
            </section>
          )})}
        </nav>
        <div className="profile-orb">N</div>
      </aside>
    </>
  );
}

function Header({ onMenu, onRuler, title, subtitle }: { onMenu: () => void; onRuler: () => void; title: string; subtitle: string }) {
  return (
    <header className="topbar">
      <div className="page-title"><Button variant="ghost" size="icon" className="mobile-menu" onClick={onMenu} aria-label="Open menu"><Menu /></Button><span className="home-icon"><Home /></span><div><h1>{title}</h1><p>{subtitle}</p></div></div>
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

export function Dashboard({ children, title = "Home", subtitle = "Progress and next step" }: { children?: ReactNode; title?: string; subtitle?: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [ruler, setRuler] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const chart = progress ? [0, 0, 1, 1, 2, 2, 3] : [0, 0, 0, 0, 0, 0, 0];

  const notify = (text: string) => { setMessage(text); window.setTimeout(() => setMessage(""), 2500); };
  const startPath = () => { setProgress((value) => Math.min(100, value + 20)); notify("Today’s learning path has started."); };

  return (
    <div className="app-shell">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="main-shell">
        <Header title={title} subtitle={subtitle} onMenu={() => setMenuOpen(true)} onRuler={() => setRuler((value) => !value)} />
        {ruler && <div className="reading-ruler" aria-hidden="true" />}
        {children ? <main className="dashboard workspace-dashboard">{children}</main> : <main className="dashboard">
          <section className="top-grid" aria-label="Daily overview">
            <Card className="hero-card">
              <div className="hero-copy">
                <Badge className="hero-badge"><Sparkles />Your daily route is automatic English</Badge>
                <h2>Use English<br/>confidently and<br/>automatically</h2>
                <p>Turn rule knowledge into natural usage in writing, conversation, error repair, and real-life transfer.</p>
                <div className="hero-actions"><Button onClick={startPath}>Start today’s path <ArrowRight /></Button></div>
              </div>
              <HeroArt />
            </Card>
          </section>

          <section className="middle-grid simplified" aria-label="Learning progress">
            <Card className="activity-card modern-chart-card"><CardHeader><div><Activity/><strong>Activity in the last 7 days</strong></div><small>Real saved learning activity, shown as a weekly trend.</small></CardHeader><CardContent><ActivityChart values={chart}/><p className="chart-caption">{progress ? "Your learning curve is now beginning to form." : "Start today’s path to create your first activity point."}</p></CardContent></Card>
            <Card className="gate-card modern-chart-card"><CardHeader><div><LockKeyhole/><strong>Level progress</strong><Badge>A1</Badge></div><small>Your verified progress across the five level requirements.</small></CardHeader><CardContent><LevelProgressChart /></CardContent></Card>
          </section>
        </main>}
      </div>
      <div className={cn("toast", message && "show")} role="status" aria-live="polite">{message}</div>
    </div>
  );
}
