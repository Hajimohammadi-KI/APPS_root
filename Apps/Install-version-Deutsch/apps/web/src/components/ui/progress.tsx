"use client";

import { Progress as ProgressPrimitive } from "@base-ui/react/progress";

import { cn } from "@/lib/utils";

function Progress({
  className,
  children,
  min = 0,
  max = 100,
  value,
  ...props
}: ProgressPrimitive.Root.Props) {
  const finiteMin = Number.isFinite(min) ? min : 0;
  const finiteMax = Number.isFinite(max) ? max : 100;
  const range = finiteMax - finiteMin;
  const ratio =
    typeof value === "number" && Number.isFinite(value) && range > 0
      ? Math.min(1, Math.max(0, (value - finiteMin) / range))
      : 0;

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn("flex flex-wrap gap-3", className)}
      max={max}
      min={min}
      value={value}
      {...props}
    >
      {children}
      <ProgressTrack>
        <ProgressIndicator
          style={{ width: "100%", transform: `scaleX(${ratio})` }}
        />
      </ProgressTrack>
    </ProgressPrimitive.Root>
  );
}

function ProgressTrack({ className, ...props }: ProgressPrimitive.Track.Props) {
  return (
    <ProgressPrimitive.Track
      className={cn(
        "relative flex h-1 w-full items-center overflow-x-hidden rounded-full bg-muted",
        className,
      )}
      data-slot="progress-track"
      {...props}
    />
  );
}

function ProgressIndicator({
  className,
  ...props
}: ProgressPrimitive.Indicator.Props) {
  return (
    <ProgressPrimitive.Indicator
      data-slot="progress-indicator"
      className={cn(
        "h-full origin-left bg-primary transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none",
        className,
      )}
      {...props}
    />
  );
}

function ProgressLabel({ className, ...props }: ProgressPrimitive.Label.Props) {
  return (
    <ProgressPrimitive.Label
      className={cn("text-sm font-medium", className)}
      data-slot="progress-label"
      {...props}
    />
  );
}

function ProgressValue({ className, ...props }: ProgressPrimitive.Value.Props) {
  return (
    <ProgressPrimitive.Value
      className={cn(
        "ml-auto text-sm text-muted-foreground tabular-nums",
        className,
      )}
      data-slot="progress-value"
      {...props}
    />
  );
}

export {
  Progress,
  ProgressTrack,
  ProgressIndicator,
  ProgressLabel,
  ProgressValue,
};
