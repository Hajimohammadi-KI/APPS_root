import { RecordingCapture } from "../learning-core/src/automaticity/recording-capture";
import { summarizeSignal } from "./signal";
const start = document.querySelector<HTMLButtonElement>("#start")!;
const stop = document.querySelector<HTMLButtonElement>("#stop")!;
const status = document.querySelector<HTMLElement>("#status")!;
const result = document.querySelector<HTMLElement>("#result")!;
const player = document.querySelector<HTMLAudioElement>("#player")!;
const heard = document.querySelector<HTMLInputElement>("#heard")!;
const confirmation = document.querySelector<HTMLElement>("#confirmation")!;
let stream: MediaStream | null = null,
  recorder: MediaRecorder | null = null;
let capture: RecordingCapture | null = null,
  timer: ReturnType<typeof setTimeout> | null = null;
let url: string | null = null,
  generation = 0,
  active = false,
  hasSignal = false;
function stopTracks() {
  stream?.getTracks().forEach((track) => track.stop());
  stream = null;
}
function clearTimer() {
  if (timer !== null) clearTimeout(timer);
  timer = null;
}
function discard() {
  player.pause();
  player.removeAttribute("src");
  player.load();
  player.hidden = true;
  if (url) URL.revokeObjectURL(url);
  url = null;
  heard.checked = false;
  heard.disabled = true;
  hasSignal = false;
  confirmation.textContent = "";
}
function requestStop() {
  clearTimer();
  capture?.stop();
  if (recorder?.state === "recording") recorder.stop();
  stopTracks();
  stop.disabled = true;
  status.textContent = "در حال بررسی فایل ضبط‌شده…";
}
function friendlyError(error: unknown): string {
  const name = error instanceof DOMException ? error.name : "";
  if (name === "NotAllowedError" || name === "SecurityError")
    return "اجازهٔ میکروفن داده نشد. از تنظیمات همین سایت اجازه بده و دوباره امتحان کن.";
  if (name === "NotFoundError")
    return "میکروفنی پیدا نشد. اتصال یا تنظیمات دستگاه را بررسی کن.";
  if (name === "NotReadableError")
    return "میکروفن در دسترس نیست؛ ممکن است برنامهٔ دیگری از آن استفاده کند.";
  return "ضبط یا خواندن صوت کامل نشد. دوباره امتحان کن یا این صفحه را در نسخهٔ به‌روز Chrome یا Safari باز کن.";
}
start.addEventListener("click", async () => {
  if (active) return;
  active = true;
  start.disabled = true;
  stop.disabled = true;
  discard();
  result.textContent = "";
  const attempt = ++generation;
  let context: AudioContext | null = null;
  try {
    if (
      !isSecureContext ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined" ||
      typeof AudioContext === "undefined"
    )
      throw Error("Unsupported browser");
    status.textContent = "در انتظار اجازهٔ میکروفن…";
    const acquired = await navigator.mediaDevices.getUserMedia({ audio: true });
    if (attempt !== generation) {
      acquired.getTracks().forEach((track) => track.stop());
      return;
    }
    stream = acquired;
    const current = new MediaRecorder(acquired),
      session = new RecordingCapture();
    recorder = current;
    capture = session;
    const blob = await new Promise<Blob>((resolve, reject) => {
      current.addEventListener("dataavailable", (event) =>
        session.add(event.data),
      );
      current.addEventListener(
        "error",
        () => {
          session.fail();
          reject(Error("Recorder failed"));
        },
        { once: true },
      );
      current.addEventListener(
        "stop",
        () => {
          const complete = session.finish(current.mimeType);
          if (!complete || complete.blob.size > 8_000_000)
            reject(Error("Invalid recording"));
          else resolve(complete.blob);
        },
        { once: true },
      );
      current.start();
      stop.disabled = false;
      status.textContent =
        "در حال ضبط: جملهٔ نمونه را بخوان. ضبط پس از ۶ ثانیه متوقف می‌شود.";
      timer = setTimeout(requestStop, 6000);
    });
    stopTracks();
    if (attempt !== generation) return;
    context = new AudioContext();
    const decoded = await context.decodeAudioData(await blob.arrayBuffer());
    if (attempt !== generation) return;
    if (decoded.duration < 1 || decoded.duration > 15)
      throw Error("Invalid recording duration");
    const channels = Array.from({ length: decoded.numberOfChannels }, (_, i) =>
      summarizeSignal(decoded.getChannelData(i), decoded.sampleRate),
    );
    const summary = channels.sort(
      (a, b) => (b.rmsDb ?? -200) - (a.rmsDb ?? -200),
    )[0]!;
    hasSignal = summary.state !== "silence";
    const descriptions = {
      silence:
        "سکوت ثبت شد. نزدیک‌تر به میکروفن صحبت کن و ورودی صوت را بررسی کن.",
      quiet: "سطح صدا کم است. نزدیک‌تر صحبت کن و ضبط را دوباره گوش بده.",
      clipped:
        "بلندی صدا احتمالاً باعث اعوجاج شده است. کمی از میکروفن فاصله بگیر.",
      signal: "سیگنال صوت ثبت شد. برای تأیید، صدای خودت را بازپخش کن.",
    };
    result.textContent = `مدت ضبط: ${summary.durationSeconds.toFixed(1)} ثانیه. ${descriptions[summary.state]} این بررسی، سنجش تلفظ یا روانی نیست.`;
    url = URL.createObjectURL(blob);
    player.src = url;
    player.hidden = false;
    status.textContent = "ضبط پایان یافت؛ میکروفن خاموش است.";
  } catch (error) {
    if (attempt === generation) {
      status.textContent = friendlyError(error);
      result.textContent = "آزمون کامل نشد؛ نتیجهٔ موفق ثبت نشده است.";
    }
  } finally {
    if (context) await context.close().catch(() => {});
    if (attempt === generation) {
      clearTimer();
      stopTracks();
      recorder = null;
      capture = null;
      active = false;
      start.disabled = false;
      stop.disabled = true;
    }
  }
});
stop.addEventListener("click", requestStop);
player.addEventListener("ended", () => {
  heard.disabled = !hasSignal;
});
heard.addEventListener("change", () => {
  confirmation.textContent =
    heard.checked && hasSignal
      ? "بازپخش را خودت تأیید کردی. این نتیجه فقط مربوط به ضبط و شنیدن صدا در همین دستگاه است و امتیاز یادگیری ایجاد نمی‌کند."
      : "";
});
function cancel() {
  generation++;
  clearTimer();
  capture?.fail();
  if (recorder?.state === "recording") recorder.stop();
  stopTracks();
  recorder = null;
  capture = null;
  active = false;
  start.disabled = false;
  stop.disabled = true;
  discard();
  status.textContent = "آزمون متوقف شد. برای ضبط دوباره دکمهٔ شروع را بزن.";
}
document.addEventListener("visibilitychange", () => {
  if (document.hidden && active) cancel();
});
window.addEventListener("pagehide", cancel);
