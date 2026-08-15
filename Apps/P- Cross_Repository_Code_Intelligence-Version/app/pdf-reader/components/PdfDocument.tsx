"use client";

import { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";
import type { PdfAnchor, PdfMarkVisual } from "../../../lib/pdf-marks";

// Prepared from the installed pdfjs-dist package before every dev/build run.
// A same-origin public URL works in both Next.js and the local Vinext Worker;
// constructing this URL from import.meta.url crashes during Vinext SSR.
const workerUrl = "/pdf.worker.min.mjs";

type PdfJsModule = typeof import("pdfjs-dist");
export type { PdfAnchor, PdfMarkVisual, PdfRect } from "../../../lib/pdf-marks";

export type PdfSelectionMenuPosition = {
  x: number;
  y: number;
  placement: "above" | "below";
};

export type PdfSelection = {
  text: string;
  page: number;
  anchor?: PdfAnchor;
  menuPosition?: PdfSelectionMenuPosition;
};

type PdfDocumentProps = {
  data: ArrayBuffer;
  scale: number;
  marks: PdfMarkVisual[];
  onDocumentReady: (pages: number) => void;
  onPageVisible: (page: number) => void;
  onSelection: (selection: PdfSelection) => void;
  onSelectionRejected?: (reason: string) => void;
};

const toneColors: Record<PdfMarkVisual["tone"], string> = {
  yellow: "#f4d98d",
  green: "#bde2d2",
  blue: "#b9daf2",
  pink: "#edc8d7",
  red: "#edc0bb",
};

function offsetInside(root: HTMLElement, target: Node, targetOffset: number) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let total = 0;
  let node = walker.nextNode();
  while (node) {
    if (node === target) return total + Math.min(targetOffset, node.textContent?.length ?? 0);
    total += node.textContent?.length ?? 0;
    node = walker.nextNode();
  }
  return total;
}

function PdfPage({
  pdf,
  pdfjs,
  pageNumber,
  scale,
  initialSize,
  marks,
}: {
  pdf: PDFDocumentProxy;
  pdfjs: PdfJsModule;
  pageNumber: number;
  scale: number;
  initialSize: { width: number; height: number };
  marks: PdfMarkVisual[];
}) {
  const pageRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const [shouldRender, setShouldRender] = useState(false);
  const [measuredSize, setMeasuredSize] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    const element = pageRef.current;
    if (!element || !("IntersectionObserver" in window)) {
      setShouldRender(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setShouldRender(Boolean(entry?.isIntersecting)),
      {
        root: element.parentElement,
        rootMargin: "900px 600px",
        threshold: 0.01,
      },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const layer = textLayerRef.current;
    if (!shouldRender) {
      if (canvas) {
        canvas.width = 1;
        canvas.height = 1;
        canvas.style.width = "0";
        canvas.style.height = "0";
      }
      layer?.replaceChildren();
      return;
    }

    let cancelled = false;
    let page: PDFPageProxy | null = null;
    let textLayer: InstanceType<PdfJsModule["TextLayer"]> | null = null;
    let renderTask: ReturnType<PDFPageProxy["render"]> | null = null;

    const render = async () => {
      page = await pdf.getPage(pageNumber);
      if (cancelled) return;
      const baseViewport = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale });
      setMeasuredSize({ width: baseViewport.width, height: baseViewport.height });

      const canvas = canvasRef.current;
      const layer = textLayerRef.current;
      if (!canvas || !layer) return;
      const outputScale = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(viewport.width * outputScale);
      canvas.height = Math.floor(viewport.height * outputScale);
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;

      renderTask = page.render({
        canvas,
        viewport,
        transform: outputScale === 1 ? undefined : [outputScale, 0, 0, outputScale, 0, 0],
      });
      await renderTask.promise;
      if (cancelled) return;

      layer.replaceChildren();
      const content = await page.getTextContent({ includeMarkedContent: true });
      textLayer = new pdfjs.TextLayer({ textContentSource: content, container: layer, viewport });
      await textLayer.render();
    };

    void render().catch((error) => {
      if (!cancelled && error instanceof Error && error.name !== "RenderingCancelledException") {
        console.error("PDF page rendering failed", error.message);
      }
    });

    return () => {
      cancelled = true;
      renderTask?.cancel();
      textLayer?.cancel();
      page?.cleanup();
    };
  }, [pdf, pdfjs, pageNumber, scale, shouldRender]);

  const pageMarks = marks.filter((mark) => mark.page === pageNumber && mark.anchor?.rects.length);
  const pageSize = measuredSize ?? initialSize;
  const pageStyle = {
    width: pageSize.width * scale,
    height: pageSize.height * scale,
    "--total-scale-factor": String(scale),
  } as React.CSSProperties;

  return (
    <section ref={pageRef} className="pdf-page" id={`pdf-page-${pageNumber}`} data-page={pageNumber} style={pageStyle} aria-label={`PDF-Seite ${pageNumber}`}>
      <canvas ref={canvasRef} aria-hidden="true" />
      <div ref={textLayerRef} className="textLayer" />
      <div className="mark-layer" aria-label={`Markierungen auf Seite ${pageNumber}`}>
        {pageMarks.flatMap((mark) =>
          (mark.anchor?.rects ?? []).map((rect, index) => (
            <span
              className={`pdf-mark-overlay ${mark.type}`}
              key={`${mark.id}-${index}`}
              style={{
                left: `${rect.x * 100}%`,
                top: `${rect.y * 100}%`,
                width: `${rect.width * 100}%`,
                height: `${rect.height * 100}%`,
                "--mark-color": toneColors[mark.tone],
              } as React.CSSProperties}
            />
          )),
        )}
      </div>
      <span className="pdf-page-number">{pageNumber}</span>
    </section>
  );
}

export default function PdfDocument({ data, scale, marks, onDocumentReady, onPageVisible, onSelection, onSelectionRejected }: PdfDocumentProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [pdfjs, setPdfjs] = useState<PdfJsModule | null>(null);
  const [defaultPageSize, setDefaultPageSize] = useState({ width: 595, height: 842 });
  const [availableWidth, setAvailableWidth] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const updateWidth = () => setAvailableWidth(root.clientWidth);
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(root);
    return () => observer.disconnect();
  }, [pdf]);

  useEffect(() => {
    let active = true;
    let loaded: PDFDocumentProxy | null = null;
    let task: ReturnType<PdfJsModule["getDocument"]> | null = null;
    void import("pdfjs-dist")
      .then((module) => {
        if (!active) throw new Error("PDF loading cancelled");
        setError("");
        setPdf(null);
        module.GlobalWorkerOptions.workerSrc = workerUrl;
        setPdfjs(module);
        task = module.getDocument({ data: new Uint8Array(data.slice(0)) });
        return task.promise;
      })
      .then(async (document) => {
        if (!active) {
          void document.destroy();
          return;
        }
        const firstPage = await document.getPage(1);
        const firstViewport = firstPage.getViewport({ scale: 1 });
        firstPage.cleanup();
        if (!active) {
          void document.destroy();
          return;
        }
        loaded = document;
        setDefaultPageSize({ width: firstViewport.width, height: firstViewport.height });
        setPdf(document);
        onDocumentReady(document.numPages);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Das PDF konnte nicht geöffnet werden.");
      });
    return () => {
      active = false;
      if (task) void task.destroy();
      if (loaded) void loaded.destroy();
    };
  }, [data, onDocumentReady]);

  useEffect(() => {
    if (!pdf || !rootRef.current) return;
    const root = rootRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        const page = Number((visible?.target as HTMLElement | undefined)?.dataset.page);
        if (page) onPageVisible(page);
      },
      { root, threshold: [0, 0.01, 0.1, 0.35] },
    );
    root.querySelectorAll(".pdf-page").forEach((page) => observer.observe(page));
    return () => observer.disconnect();
  }, [pdf, scale, onPageVisible]);

  const selectionMenuPosition = (range: Range): PdfSelectionMenuPosition | null => {
    const rect = Array.from(range.getClientRects()).find((item) => item.width > 1 && item.height > 1)
      ?? range.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return null;

    const menuHalfWidth = 164;
    const x = Math.min(
      window.innerWidth - menuHalfWidth - 12,
      Math.max(menuHalfWidth + 12, rect.left + rect.width / 2),
    );
    const placement = rect.top < 230 ? "below" : "above";
    return {
      x,
      y: placement === "above" ? rect.top - 10 : rect.bottom + 10,
      placement,
    };
  };

  const captureSelection = (openMenu = false) => {
    const selection = window.getSelection();
    const text = selection?.toString().trim() ?? "";
    if (!selection || !text || selection.rangeCount === 0) return false;
    const range = selection.getRangeAt(0);
    const startElement = range.startContainer.nodeType === Node.ELEMENT_NODE ? (range.startContainer as Element) : range.startContainer.parentElement;
    const endElement = range.endContainer.nodeType === Node.ELEMENT_NODE ? (range.endContainer as Element) : range.endContainer.parentElement;
    const startPage = startElement?.closest<HTMLElement>(".pdf-page");
    const endPage = endElement?.closest<HTMLElement>(".pdf-page");
    const page = Number(startPage?.dataset.page) || 1;

    if (text.replace(/\s+/g, "").length < 2) {
      onSelectionRejected?.("Bitte mindestens ein vollständiges Wort auswählen.");
      selection.removeAllRanges();
      return false;
    }
    if (text.length > 2_000) {
      onSelectionRejected?.("Die Auswahl ist zu groß. Bitte nur einen Absatz markieren.");
      selection.removeAllRanges();
      return false;
    }

    const menu = openMenu ? selectionMenuPosition(range) : null;
    const menuData = menu ? { menuPosition: menu } : {};

    if (!startPage || startPage !== endPage) {
      onSelectionRejected?.("Bitte Text nur auf einer PDF-Seite auswählen.");
      selection.removeAllRanges();
      return false;
    }
    const textLayer = startPage.querySelector<HTMLElement>(".textLayer");
    if (!textLayer || !textLayer.contains(range.startContainer) || !textLayer.contains(range.endContainer)) {
      onSelection({ text, page, ...menuData });
      return true;
    }

    const pageRect = startPage.getBoundingClientRect();
    const clientRects = Array.from(range.getClientRects())
      .filter((rect) => rect.width > 1 && rect.height > 1);
    const hasMultipleColumns = clientRects.some((left, index) => clientRects.slice(index + 1).some((right) => {
      const verticallyOverlaps = Math.min(left.bottom, right.bottom) - Math.max(left.top, right.top) > 2;
      const horizontalGap = Math.max(right.left - left.right, left.left - right.right);
      return verticallyOverlaps && horizontalGap > pageRect.width * 0.12;
    }));
    if (hasMultipleColumns) {
      onSelectionRejected?.("Bitte Text nur in einer Spalte auswählen.");
      selection.removeAllRanges();
      return false;
    }
    const rects = clientRects
      .filter((rect) => rect.width > 1 && rect.height > 1)
      .map((rect) => ({
        x: Math.max(0, (rect.left - pageRect.left) / pageRect.width),
        y: Math.max(0, (rect.top - pageRect.top) / pageRect.height),
        width: Math.min(1, rect.width / pageRect.width),
        height: Math.min(1, rect.height / pageRect.height),
      }));
    onSelection({
      text,
      page,
      ...menuData,
      anchor: {
        page,
        start: offsetInside(textLayer, range.startContainer, range.startOffset),
        end: offsetInside(textLayer, range.endContainer, range.endOffset),
        rects,
      },
    });
    return true;
  };

  if (error) return <div className="pdf-error"><strong>PDF konnte nicht geladen werden.</strong><span>{error}</span></div>;
  if (!pdf || !pdfjs) return <div className="pdf-loading"><span className="spinner" />PDF wird vorbereitet …</div>;

  const pageGutter = availableWidth !== null && availableWidth <= 720 ? 16 : 48;
  const fitScale = availableWidth === null
    ? scale
    : Math.max(0.1, (availableWidth - pageGutter) / defaultPageSize.width);
  const responsiveScale = Math.min(scale, fitScale);

  return (
    <div
      ref={rootRef}
      className="pdf-document"
      onMouseUp={() => { captureSelection(true); }}
      onTouchEnd={() => { window.setTimeout(() => captureSelection(true), 0); }}
      onContextMenu={(event) => {
        if (captureSelection(true)) event.preventDefault();
      }}
    >
      {Array.from({ length: pdf.numPages }, (_, index) => (
        <PdfPage key={index + 1} pdf={pdf} pdfjs={pdfjs} pageNumber={index + 1} scale={responsiveScale} initialSize={defaultPageSize} marks={marks} />
      ))}
    </div>
  );
}
