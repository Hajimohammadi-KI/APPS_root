import Image from "next/image";

interface TalkingCoachAvatarProps {
  listening: boolean;
  speaking: boolean;
  status: string;
}

const coachImage = "/coach/ava-language-coach.png";

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
        <Image
          alt="Ava, your original animated English speaking coach"
          className="talking-coach-image"
          height={360}
          priority
          src={coachImage}
          width={360}
        />
        <Image
          alt=""
          aria-hidden
          className="talking-coach-mouth-layer"
          height={360}
          src={coachImage}
          width={360}
        />
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
