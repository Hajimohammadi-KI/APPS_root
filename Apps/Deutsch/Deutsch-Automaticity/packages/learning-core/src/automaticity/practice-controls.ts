/** Freeze all editable controls until the asynchronous submission settles. */
export function disablePracticeControls(
  controls: Iterable<{ disabled: boolean }>,
): () => void {
  const states = Array.from(controls, (control) => ({
    control,
    disabled: control.disabled,
  }));
  for (const { control } of states) control.disabled = true;
  return () => {
    for (const { control, disabled } of states) control.disabled = disabled;
  };
}
