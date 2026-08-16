import Image from "next/image";
import { cn } from "@/lib/utils";

interface ProfileAvatarProps {
  className?: string | undefined;
  label: string;
  photo?: string | undefined;
  variant?: "coach" | "learner" | undefined;
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
          <circle cx="80" cy="80" fill={coach ? "#dbeafe" : "#ffedd5"} r="80" />
          <circle cx="80" cy="64" fill={coach ? "#d99b73" : "#b87855"} r="35" />
          <path
            d="M43 65q3-45 38-45 34 0 37 45-18-13-37-13-21 0-38 13"
            fill={coach ? "#4b2f27" : "#2f2522"}
          />
          <circle cx="68" cy="66" r="4" />
          <circle cx="93" cy="66" r="4" />
          <path
            d="M70 84q11 8 22 0"
            fill="none"
            stroke="#7f3f3f"
            strokeLinecap="round"
            strokeWidth="5"
          />
          <rect
            fill={coach ? "#2563eb" : "#ea580c"}
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
