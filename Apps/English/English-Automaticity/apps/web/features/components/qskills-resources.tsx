"use client";

import * as React from "react";
import { BookOpen, FileText, Headphones, PlayCircle, RefreshCw } from "lucide-react";
import type { CefrLevel } from "@grammar/content";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type AssetKind = "audio" | "video" | "document";
type Asset = { kind: AssetKind; label: string; path: string };
type Catalog = {
  available: boolean;
  levels: Array<{ level: number; units: Array<{ unit: number; assets: Asset[] }> }>;
};

const initialLevel: Record<CefrLevel, number> = {
  A1: 1,
  A2: 1,
  B1: 2,
  B2: 3,
  C1: 4,
  C2: 5,
};

function resourceUrl(asset: Asset) {
  return `/api/qskills/resource?path=${encodeURIComponent(asset.path)}`;
}

const icons: Record<AssetKind, typeof Headphones> = {
  audio: Headphones,
  video: PlayCircle,
  document: FileText,
};

const assetKinds: AssetKind[] = ["audio", "video", "document"];

function unitKey(level: number, unit: number) {
  return `${level}:${unit}`;
}

export function QSkillsResources({ cefr }: { cefr: CefrLevel }) {
  const [catalog, setCatalog] = React.useState<Catalog>();
  const [loading, setLoading] = React.useState(true);
  const [selectedUnits, setSelectedUnits] = React.useState<string[]>(() => [
    unitKey(initialLevel[cefr], 1),
  ]);
  const [selectedKinds, setSelectedKinds] = React.useState<AssetKind[]>(assetKinds);
  const [unitQuery, setUnitQuery] = React.useState("");

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/qskills", { cache: "no-store" });
      setCatalog((await response.json()) as Catalog);
    } catch {
      setCatalog({ available: false, levels: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  React.useEffect(() => {
    setSelectedUnits([unitKey(initialLevel[cefr], 1)]);
  }, [cefr]);

  const selectedUnitEntries = (catalog?.levels ?? []).flatMap((candidate) =>
    candidate.units
      .filter((candidateUnit) => selectedUnits.includes(unitKey(candidate.level, candidateUnit.unit)))
      .map((candidateUnit) => ({ level: candidate.level, unit: candidateUnit })),
  );
  const assets = selectedUnitEntries.flatMap(({ level: assetLevel, unit: assetUnit }) =>
    assetUnit.assets
      .filter((asset) => selectedKinds.includes(asset.kind))
      .map((asset) => ({ ...asset, context: `Level ${assetLevel} · Unit ${assetUnit.unit}` })),
  );
  const visibleAssets = assets.slice(0, 8);
  const unitOptions = (catalog?.levels ?? []).flatMap((candidate) =>
    candidate.units.map((candidateUnit) => ({
      level: candidate.level,
      unit: candidateUnit.unit,
      label: `Level ${candidate.level} · Unit ${candidateUnit.unit}`,
    })),
  ).filter((candidate) => candidate.label.toLowerCase().includes(unitQuery.trim().toLowerCase()));

  function toggleUnit(levelNumber: number, unitNumber: number) {
    const key = unitKey(levelNumber, unitNumber);
    setSelectedUnits((current) => {
      // Keep one source selected so the companion panel never becomes an
      // ambiguous empty state after a learner closes the multi-select menu.
      if (current.includes(key)) return current.length === 1 ? current : current.filter((item) => item !== key);
      return [...current, key];
    });
  }

  function toggleKind(kind: AssetKind) {
    setSelectedKinds((current) => {
      if (current.includes(kind)) return current.length === 1 ? current : current.filter((item) => item !== kind);
      return [...current, kind];
    });
  }

  return (
    <Card className="border-sky-300 bg-sky-50/70">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BookOpen aria-hidden className="size-5 text-sky-800" /> QSkills companion material
            </CardTitle>
            <CardDescription className="mt-2 max-w-3xl">
              Your licensed local QSkills files stay on this computer. Use them for input, then save your own evidence in the mission above.
            </CardDescription>
          </div>
          <Button onClick={() => void refresh()} size="sm" variant="outline">
            <RefreshCw aria-hidden className="size-4" /> Refresh library
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? <p className="text-sm text-slate-700">Checking your local QSkills library…</p> : null}
        {!loading && !catalog?.available ? (
          <p className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
            QSkills was not found at the local course location. The automaticity mission still works, but companion audio, video, and book files are unavailable on this device.
          </p>
        ) : null}
        {!loading && catalog?.available ? (
          <>
            <details className="qskills-multiselect rounded-xl border border-sky-300 bg-white">
              <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 px-4 py-3 font-bold text-sky-950 marker:content-none">
                <span>
                  Choose companion sources
                  <span className="ml-2 rounded-full bg-sky-100 px-2 py-1 text-xs">{selectedUnits.length} units · {selectedKinds.length} file types</span>
                </span>
                <span aria-hidden>▾</span>
              </summary>
              <div className="space-y-4 border-t border-sky-200 p-4">
                {/* Source files stay in D:\\Sources. This multi-select only filters
                    the local catalog; it never copies licensed QSkills content. */}
                <label className="block text-sm font-bold text-slate-800">
                  Search level or unit
                  <input
                    className="mt-1 min-h-11 w-full rounded-lg border border-sky-200 px-3 text-base"
                    onChange={(event) => setUnitQuery(event.target.value)}
                    placeholder="For example: Level 1 or Unit 4"
                    type="search"
                    value={unitQuery}
                  />
                </label>
                <fieldset>
                  <legend className="text-sm font-bold text-slate-800">Units</legend>
                  <div className="mt-2 grid max-h-56 gap-2 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
                    {unitOptions.map((candidate) => {
                      const checked = selectedUnits.includes(unitKey(candidate.level, candidate.unit));
                      return (
                        <label className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold ${checked ? "border-sky-500 bg-sky-50" : "border-slate-200"}`} key={`${candidate.level}-${candidate.unit}`}>
                          <input checked={checked} onChange={() => toggleUnit(candidate.level, candidate.unit)} type="checkbox" />
                          {candidate.label}
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
                <fieldset>
                  <legend className="text-sm font-bold text-slate-800">File types</legend>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {assetKinds.map((kind) => {
                      const checked = selectedKinds.includes(kind);
                      return (
                        <label className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold capitalize ${checked ? "border-sky-500 bg-sky-50" : "border-slate-200"}`} key={kind}>
                          <input checked={checked} onChange={() => toggleKind(kind)} type="checkbox" />
                          {kind}
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              </div>
            </details>
            <div className="flex flex-wrap gap-2" aria-label="Available QSkills files">
              {visibleAssets.map((asset) => {
                const Icon = icons[asset.kind];
                return (
                  <a className="inline-flex max-w-full items-center gap-2 rounded-xl border border-sky-300 bg-white px-3 py-2 text-sm font-bold text-sky-950 hover:bg-sky-100" href={resourceUrl(asset)} key={asset.path} rel="noreferrer" target="_blank">
                    <Icon aria-hidden className="size-4 shrink-0" />
                    <span className="truncate">{asset.context} · {asset.label}</span>
                  </a>
                );
              })}
              {assets.length > visibleAssets.length ? <Badge variant="secondary">{assets.length - visibleAssets.length} more files in this unit</Badge> : null}
              {!assets.length ? <p className="text-sm text-slate-700">No recognised source file was found for this unit.</p> : null}
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
