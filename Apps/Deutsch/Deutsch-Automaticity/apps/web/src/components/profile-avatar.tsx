import Image from "next/image";

import { cn } from "@/lib/utils";

interface ProfileAvatarProps {
  readonly className?: string | undefined;
  readonly label: string;
  readonly photo?: string | undefined;
  readonly variant?: "coach" | "learner" | undefined;
}

export function ProfileAvatar({
  className,
  label,
  photo,
  variant = "learner",
}: ProfileAvatarProps) {
  const coach = variant === "coach";
  return (
    <span
      className={cn(
        "relative inline-flex size-20 shrink-0 overflow-hidden rounded-full border-4 border-white bg-white shadow-md",
        className,
      )}
      data-slot="profile-avatar"
    >
      {photo ? (
        <Image
          alt={label}
          className="size-full object-cover"
          height={320}
          src={photo}
          unoptimized
          width={320}
        />
      ) : (
        <svg aria-label={label} role="img" viewBox="0 0 160 160">
          <circle cx="80" cy="80" fill={coach ? "#dcecf8" : "#f6ead8"} r="80" />
          <circle cx="80" cy="64" fill={coach ? "#edb98e" : "#e7b288"} r="35" />
          <path
            d="M44 64q2-44 37-44 36 0 37 44-18-12-37-12-20 0-37 12"
            fill={coach ? "#553b2d" : "#352c28"}
          />
          <circle cx="68" cy="65" r="4" />
          <circle cx="93" cy="65" r="4" />
          <path
            d="M70 84q11 8 22 0"
            fill="none"
            stroke="#994b4b"
            strokeLinecap="round"
            strokeWidth="5"
          />
          <rect
            fill={coach ? "#3d78b8" : "#d08a4d"}
            height="61"
            rx="28"
            width="76"
            x="42"
            y="99"
          />
        </svg>
      )}
    </span>
  );
}
