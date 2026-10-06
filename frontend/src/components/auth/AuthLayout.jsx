import Brand from "../layout/Brand"

// Decorative: a viewfinder with two labelled detections.
function ViewfinderArt() {
  return (
    <svg
      viewBox="0 0 360 240"
      fill="none"
      aria-hidden="true"
      className="w-full max-w-sm"
    >
      <rect
        x="0.5"
        y="0.5"
        width="359"
        height="239"
        rx="10"
        fill="#0e1115"
        stroke="#232830"
      />

      <g stroke="#232830">
        <path d="M0 80h360M0 160h360M120 0v240M240 0v240" />
      </g>

      <g stroke="#22d3ee" strokeWidth="2" strokeLinecap="round">
        <path d="M20 44V22h22M340 44V22h-22M20 196v22h22M340 196v22h-22" />
      </g>

      <rect
        x="64"
        y="70"
        width="150"
        height="120"
        rx="2"
        stroke="#22d3ee"
        strokeWidth="2"
      />
      <rect x="64" y="50" width="86" height="20" fill="#22d3ee" />
      <text
        x="72"
        y="64"
        fill="#04181c"
        fontSize="12"
        fontFamily="IBM Plex Mono, monospace"
      >
        dog 0.93
      </text>

      <rect
        x="236"
        y="130"
        width="62"
        height="62"
        rx="2"
        stroke="#f59e0b"
        strokeWidth="2"
      />
      <rect x="236" y="110" width="84" height="20" fill="#f59e0b" />
      <text
        x="244"
        y="124"
        fill="#04181c"
        fontSize="12"
        fontFamily="IBM Plex Mono, monospace"
      >
        ball 0.81
      </text>
    </svg>
  )
}

/** Two-column frame for the sign-in and sign-up pages. */
function AuthLayout({ title, description, children, footer }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <aside className="hidden flex-col justify-between border-r border-hairline bg-surface p-10 lg:flex">
        <Brand />

        <div>
          <ViewfinderArt />

          <h2 className="mt-8 max-w-[22ch] text-3xl font-semibold text-fg">
            See what your models see.
          </h2>

          <p className="mt-3 max-w-[48ch] text-sm text-muted">
            Upload an image or a video and inspect the detections,
            masks, text and tracks, together with the numbers you need
            to judge them.
          </p>
        </div>

        <p className="text-xs text-muted">
          Classification, detection, segmentation, OCR and tracking in
          one workspace.
        </p>
      </aside>

      <main className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Brand />
          </div>

          <h1 className="text-[1.375rem] font-semibold text-fg">
            {title}
          </h1>

          <p className="mt-1 text-sm text-muted">{description}</p>

          <div className="mt-6">{children}</div>

          <p className="mt-6 text-sm text-muted">{footer}</p>
        </div>
      </main>
    </div>
  )
}

export default AuthLayout
