export interface MicrophoneRequestOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
}

/** A browser permission prompt may never settle. Late grants must release audio. */
export function requestMicrophone(
  acquire: () => Promise<MediaStream>,
  { signal, timeoutMs = 30_000 }: MicrophoneRequestOptions = {},
): Promise<MediaStream> {
  return new Promise((resolve, reject) => {
    let settled = false;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const cleanup = () => {
      if (timeout !== undefined) clearTimeout(timeout);
      signal?.removeEventListener("abort", abort);
    };
    const fail = (error: unknown) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(error);
    };
    const abort = () =>
      fail(new DOMException("Microphone request cancelled", "AbortError"));
    if (signal?.aborted) {
      abort();
      return;
    }
    signal?.addEventListener("abort", abort, { once: true });
    timeout = setTimeout(
      () =>
        fail(
          new DOMException("Microphone permission timed out", "TimeoutError"),
        ),
      timeoutMs,
    );
    try {
      void acquire().then((stream) => {
        if (settled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        settled = true;
        cleanup();
        resolve(stream);
      }, fail);
    } catch (error) {
      fail(error);
    }
  });
}
