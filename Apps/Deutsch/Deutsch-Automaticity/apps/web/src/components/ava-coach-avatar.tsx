interface AvaCoachAvatarProps {
  className?: string;
}

// The original coach PNG is an unavailable Git LFS placeholder in clean builds.
// This local SVG keeps Ava visible offline and on deployments without LFS media.
export function AvaCoachAvatar({ className }: AvaCoachAvatarProps) {
  return (
    <svg
      aria-label="Ava, die Sprechtrainerin"
      className={className}
      fill="none"
      role="img"
      viewBox="0 0 220 250"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient
          id="ava-background"
          x1="26"
          x2="194"
          y1="14"
          y2="236"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#F2E9FF" />
          <stop offset="1" stopColor="#DCCBFA" />
        </linearGradient>
        <linearGradient
          id="ava-hair"
          x1="70"
          x2="159"
          y1="42"
          y2="150"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#3E2767" />
          <stop offset="1" stopColor="#69429E" />
        </linearGradient>
      </defs>
      <rect width="220" height="250" rx="104" fill="url(#ava-background)" />
      <path
        d="M28 250C35 188 67 166 110 166C153 166 185 188 192 250H28Z"
        fill="#5930A3"
      />
      <path
        d="M50 111C50 63 75 35 111 35C150 35 173 66 170 113L163 155H57L50 111Z"
        fill="url(#ava-hair)"
      />
      <ellipse cx="110" cy="114" rx="54" ry="63" fill="#F7C8A7" />
      <path
        d="M53 107C52 61 77 39 112 39C149 39 171 65 168 108C150 88 130 80 106 80C82 80 64 89 53 107Z"
        fill="url(#ava-hair)"
      />
      <path
        d="M54 101C46 115 46 143 61 158L67 135L62 105L54 101Z"
        fill="#4B2E78"
      />
      <path
        d="M166 101C174 115 174 143 159 158L153 135L158 105L166 101Z"
        fill="#4B2E78"
      />
      <circle cx="89" cy="115" r="6" fill="#2B1C46" />
      <circle cx="132" cy="115" r="6" fill="#2B1C46" />
      <path
        d="M101 142C107 147 115 147 121 142"
        stroke="#B95872"
        strokeLinecap="round"
        strokeWidth="5"
      />
      <path
        d="M91 99L80 96"
        stroke="#4B2E78"
        strokeLinecap="round"
        strokeWidth="5"
      />
      <path
        d="M130 99L141 96"
        stroke="#4B2E78"
        strokeLinecap="round"
        strokeWidth="5"
      />
      <path
        d="M89 180C96 188 124 188 131 180L142 207H78L89 180Z"
        fill="#F1ECFF"
      />
      <path
        d="M73 250C80 218 94 202 110 202C126 202 140 218 147 250H73Z"
        fill="#7646C9"
      />
      <circle cx="183" cy="57" r="13" fill="#FFF" opacity=".9" />
      <path
        d="M183 48V66M174 57H192"
        stroke="#8A58D0"
        strokeLinecap="round"
        strokeWidth="3"
      />
    </svg>
  );
}
