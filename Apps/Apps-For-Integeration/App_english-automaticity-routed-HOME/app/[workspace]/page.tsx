import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Activity, BookMarked, BookOpen, Flame, Folder, GraduationCap,
  MessageSquareText, Settings, Sparkles,
} from "lucide-react";
import { Dashboard } from "@/components/dashboard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

type WorkspaceConfig = {
  title: string;
  subtitle: string;
  eyebrow: string;
  description: string;
  icon: LucideIcon;
  features: string[];
  nextHref: string;
  nextLabel: string;
};

const workspaces = {
  practice: {
    title: "Today’s Practice",
    subtitle: "Adaptive recall and automaticity",
    eyebrow: "Daily practice",
    description: "Continue today’s focused learning path and save every completed practice step.",
    icon: Flame,
    features: ["15-minute adaptive route", "Saved completion state", "Keyboard and mobile ready"],
    nextHref: "/conversation",
    nextLabel: "Continue to Conversation Studio",
  },
  conversation: {
    title: "Conversation Studio",
    subtitle: "Speak, correct, and repeat",
    eyebrow: "Speaking workspace",
    description: "Use target grammar in guided conversation and prepare recordings for backend evaluation.",
    icon: MessageSquareText,
    features: ["Real microphone workflow", "Transcript-ready interface", "Correction and replay stages"],
    nextHref: "/evidence",
    nextLabel: "Open learning evidence",
  },
  grammar: {
    title: "Grammar Lab",
    subtitle: "Controlled recall from A1 to C2",
    eyebrow: "Learning paths",
    description: "Study grammar units, complete controlled recall, and send mastered structures into speaking practice.",
    icon: BookOpen,
    features: ["112 grammar units", "CEFR level navigation", "Practice-to-speaking transfer"],
    nextHref: "/resources",
    nextLabel: "Browse learning resources",
  },
  resources: {
    title: "Learning Resources",
    subtitle: "Lessons, references, and saved material",
    eyebrow: "Resource library",
    description: "Organize the learning material connected to grammar, reading, and conversation topics.",
    icon: Folder,
    features: ["Topic-based organization", "Search-ready structure", "Saved resource state"],
    nextHref: "/skills",
    nextLabel: "Open Integrated Skills",
  },
  skills: {
    title: "Integrated Skills",
    subtitle: "Connect reading, writing, listening, and speaking",
    eyebrow: "Skill transfer",
    description: "Combine language skills in one measurable route instead of practising each skill in isolation.",
    icon: GraduationCap,
    features: ["Cross-skill practice", "Shared progress model", "Evidence-ready activities"],
    nextHref: "/practice",
    nextLabel: "Start today’s practice",
  },
  evidence: {
    title: "Errors and Recordings",
    subtitle: "Review saved learning evidence",
    eyebrow: "Learning evidence",
    description: "Review corrections, recordings, and recurring errors that will be supplied by the NestJS API.",
    icon: Activity,
    features: ["Seven-day activity", "Correction history", "Recording evidence"],
    nextHref: "/notebook",
    nextLabel: "Open Notebook & PDF Reader",
  },
  notebook: {
    title: "Notebook & PDF Reader",
    subtitle: "Read, annotate, and collect examples",
    eyebrow: "Study tools",
    description: "Keep reading material and personal language notes connected to your active learning path.",
    icon: BookMarked,
    features: ["PDF workspace", "Personal notes", "Reusable language examples"],
    nextHref: "/vocabulary",
    nextLabel: "Open Vocabulary & Flashcards",
  },
  vocabulary: {
    title: "Vocabulary & Flashcards",
    subtitle: "Remember and reuse useful language",
    eyebrow: "Memory practice",
    description: "Prepare vocabulary for spaced review and reuse it in grammar and conversation exercises.",
    icon: Sparkles,
    features: ["Flashcard-ready data", "Topic vocabulary", "Conversation transfer"],
    nextHref: "/conversation",
    nextLabel: "Practise in Conversation Studio",
  },
  settings: {
    title: "Settings",
    subtitle: "Storage and personal options",
    eyebrow: "Application settings",
    description: "Configure local preferences now and connect account, storage, and privacy settings during backend integration.",
    icon: Settings,
    features: ["Accessible preferences", "Storage controls", "API connection status"],
    nextHref: "/",
    nextLabel: "Return to Home",
  },
} satisfies Record<string, WorkspaceConfig>;

type WorkspaceKey = keyof typeof workspaces;
type WorkspacePageProps = { params: Promise<{ workspace: string }> };

function isWorkspaceKey(value: string): value is WorkspaceKey {
  return value in workspaces;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(workspaces).map((workspace) => ({ workspace }));
}

export async function generateMetadata({ params }: WorkspacePageProps): Promise<Metadata> {
  const { workspace } = await params;
  if (!isWorkspaceKey(workspace)) return {};
  return { title: `${workspaces[workspace].title} | English Automaticity` };
}

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const { workspace } = await params;
  if (!isWorkspaceKey(workspace)) notFound();

  const config = workspaces[workspace];
  const Icon = config.icon;

  return (
    <Dashboard title={config.title} subtitle={config.subtitle}>
      <section className="workspace-page" aria-labelledby="workspace-title">
        <Card className="workspace-hero">
          <CardContent>
            <span className="workspace-icon"><Icon /></span>
            <div>
              <Badge><span className="route-dot" />Route active</Badge>
              <p className="workspace-eyebrow">{config.eyebrow}</p>
              <h2 id="workspace-title">{config.title}</h2>
              <p>{config.description}</p>
              <div className="workspace-actions">
                <Link className="workspace-primary-link" href={config.nextHref}>{config.nextLabel}</Link>
                <Link className="workspace-secondary-link" href="/">View dashboard</Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="workspace-grid">
          <Card>
            <CardHeader><div><Sparkles /><strong>Frontend route ready</strong></div><small>This page is now a real Next.js App Router destination.</small></CardHeader>
            <CardContent className="feature-list">
              {config.features.map((feature) => <div key={feature}><span>✓</span>{feature}</div>)}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><div><Activity /><strong>Backend integration next</strong></div><small>NestJS and Neon will replace the temporary route state.</small></CardHeader>
            <CardContent>
              <div className="api-preview"><code>GET /learning/dashboard-state</code><Badge>Planned</Badge></div>
              <div className="api-preview"><code>POST /learning/practice/progress</code><Badge>Planned</Badge></div>
            </CardContent>
          </Card>
        </div>
      </section>
    </Dashboard>
  );
}
