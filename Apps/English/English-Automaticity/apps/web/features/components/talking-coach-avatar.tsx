import { AvaCoachAvatar } from "./ava-coach-avatar";

interface TalkingCoachAvatarProps {
  listening: boolean;
  speaking: boolean;
  status: string;
}

export function TalkingCoachAvatar({
  listening,
  speaking,
  status,
}: TalkingCoachAvatarProps) {
  return (
    <div
      className="talking-coach"
      data-listening={listening}
      data-speaking={speaking}
      >
      <div className="talking-coach-frame">
        <AvaCoachAvatar className="talking-coach-image" />
        <span aria-hidden className="talking-coach-sound-wave">
          <i />
          <i />
          <i />
        </span>
      </div>
      <p className="mt-2 text-center text-base font-black">Ava</p>
      <p
        aria-live="polite"
        className="mt-1 text-center text-xs font-bold text-violet-800"
      >
        {status}
      </p>
    </div>
  );
}
