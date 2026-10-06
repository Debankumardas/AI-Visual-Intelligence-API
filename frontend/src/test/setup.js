import "@testing-library/jest-dom"
import { expect } from "vitest"
import * as axeMatchers from "vitest-axe/matchers"

expect.extend(axeMatchers)
import { vi } from "vitest"

// jsdom has no object URLs; the app creates them for previews.
URL.createObjectURL ??= vi.fn(() => "blob:preview")
URL.revokeObjectURL ??= vi.fn()
