function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <svg
        width="28"
        height="28"
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect width="32" height="32" rx="7" fill="#181c22" />
        <path
          d="M9 13V9h4M23 13V9h-4M9 19v4h4M23 19v4h-4"
          stroke="#22d3ee"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="16" cy="16" r="2.5" fill="#22d3ee" />
      </svg>

      <span
        translate="no"
        className="text-sm font-semibold leading-tight text-fg"
      >
        AI Visual
        <br />
        Intelligence
      </span>
    </div>
  )
}

export default Brand
