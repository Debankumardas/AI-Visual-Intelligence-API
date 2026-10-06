import {
  act,
  fireEvent,
  render,
  screen,
} from "@testing-library/react"
import { Image as ImageIcon, Settings } from "lucide-react"
import { useState } from "react"
import { axe } from "vitest-axe"
import { afterEach, describe, expect, it, vi } from "vitest"

import Alert from "./Alert"
import Button from "./Button"
import Dropzone from "./Dropzone"
import ElapsedTimer from "./ElapsedTimer"
import EmptyState from "./EmptyState"
import IconButton from "./IconButton"
import Popover from "./Popover"
import Switch from "./Switch"
import Tabs, { TabPanel } from "./Tabs"
import TextField from "./TextField"

afterEach(() => {
  vi.useRealTimers()
})

describe("Button", () => {
  it("is disabled and busy while loading", () => {
    const onClick = vi.fn()

    render(
      <Button loading loadingLabel="Analyzing…" onClick={onClick}>
        Analyze image
      </Button>,
    )

    const button = screen.getByRole("button", { name: "Analyzing…" })

    expect(button).toBeDisabled()
    expect(button).toHaveAttribute("aria-busy", "true")

    fireEvent.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })

  it("defaults to type=button so it never submits a form", () => {
    render(<Button>Save</Button>)

    expect(screen.getByRole("button")).toHaveAttribute("type", "button")
  })
})

describe("IconButton", () => {
  it("is named by its label", () => {
    render(<IconButton label="Open settings" icon={Settings} />)

    expect(
      screen.getByRole("button", { name: "Open settings" }),
    ).toBeInTheDocument()
  })
})

describe("Alert", () => {
  it("interrupts for errors and warnings only", () => {
    const { rerender } = render(<Alert tone="danger" title="Failed" />)

    expect(screen.getByRole("alert")).toBeInTheDocument()

    rerender(<Alert tone="warning" title="Careful" />)
    expect(screen.getByRole("alert")).toBeInTheDocument()

    rerender(<Alert tone="success" title="Saved" />)
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
    expect(screen.getByRole("status")).toBeInTheDocument()
  })
})

describe("TextField", () => {
  it("connects label, hint and error to the input", () => {
    const { rerender } = render(
      <TextField label="Email" hint="Use your work email." />,
    )

    const input = screen.getByLabelText("Email")

    expect(input).not.toHaveAttribute("aria-invalid")
    expect(input).toHaveAccessibleDescription("Use your work email.")

    rerender(
      <TextField
        label="Email"
        hint="Use your work email."
        error="Enter a valid email address."
      />,
    )

    expect(screen.getByLabelText("Email")).toHaveAttribute(
      "aria-invalid",
      "true",
    )
    expect(screen.getByLabelText("Email")).toHaveAccessibleDescription(
      "Enter a valid email address.",
    )
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Enter a valid email address.",
    )
  })
})

describe("Switch", () => {
  it("toggles through onChange and is named by its label", () => {
    const onChange = vi.fn()

    render(
      <Switch
        label="Video analysis"
        description="Show the video page."
        checked={false}
        onChange={onChange}
      />,
    )

    const toggle = screen.getByRole("switch", { name: "Video analysis" })

    expect(toggle).toHaveAttribute("aria-checked", "false")
    expect(toggle).toHaveAccessibleDescription("Show the video page.")

    fireEvent.click(toggle)
    expect(onChange).toHaveBeenCalledWith(true)
  })

  it("does not toggle while disabled", () => {
    const onChange = vi.fn()

    render(
      <Switch label="Dashboard" checked disabled onChange={onChange} />,
    )

    fireEvent.click(screen.getByRole("switch"))
    expect(onChange).not.toHaveBeenCalled()
  })
})

describe("Tabs", () => {
  const items = [
    { id: "detect", label: "Detect" },
    { id: "segment", label: "Segment" },
    { id: "text", label: "Text" },
  ]

  function Harness() {
    const [value, setValue] = useState("detect")

    return (
      <>
        <Tabs
          id="modes"
          label="Analysis mode"
          items={items}
          value={value}
          onChange={setValue}
        />
        <TabPanel id="modes" value={value}>
          Panel for {value}
        </TabPanel>
      </>
    )
  }

  it("uses a roving tabindex and links tabs to the panel", () => {
    render(<Harness />)

    const [detect, segment] = screen.getAllByRole("tab")

    expect(detect).toHaveAttribute("aria-selected", "true")
    expect(detect).toHaveAttribute("tabindex", "0")
    expect(segment).toHaveAttribute("tabindex", "-1")

    expect(screen.getByRole("tabpanel")).toHaveAccessibleName("Detect")
  })

  it("moves with the arrow keys, wrapping at both ends", () => {
    render(<Harness />)

    const tabs = screen.getAllByRole("tab")

    fireEvent.keyDown(tabs[0], { key: "ArrowRight" })
    expect(tabs[1]).toHaveAttribute("aria-selected", "true")
    expect(tabs[1]).toHaveFocus()

    fireEvent.keyDown(tabs[1], { key: "End" })
    expect(tabs[2]).toHaveAttribute("aria-selected", "true")

    fireEvent.keyDown(tabs[2], { key: "ArrowRight" })
    expect(tabs[0]).toHaveAttribute("aria-selected", "true")

    fireEvent.keyDown(tabs[0], { key: "ArrowLeft" })
    expect(tabs[2]).toHaveAttribute("aria-selected", "true")

    fireEvent.keyDown(tabs[2], { key: "Home" })
    expect(tabs[0]).toHaveAttribute("aria-selected", "true")

    expect(screen.getByRole("tabpanel")).toHaveTextContent(
      "Panel for detect",
    )
  })
})

describe("Popover", () => {
  const renderPopover = () =>
    render(
      <div>
        <button type="button">Outside</button>

        <Popover
          trigger={(props) => (
            <button type="button" {...props}>
              Menu
            </button>
          )}
        >
          <p>Panel content</p>
        </Popover>
      </div>,
    )

  it("opens from the trigger and reports its state", () => {
    renderPopover()

    const trigger = screen.getByRole("button", { name: "Menu" })

    expect(trigger).toHaveAttribute("aria-expanded", "false")
    expect(screen.queryByText("Panel content")).not.toBeInTheDocument()

    fireEvent.click(trigger)

    expect(trigger).toHaveAttribute("aria-expanded", "true")
    expect(screen.getByText("Panel content")).toBeInTheDocument()
  })

  it("closes on Escape and returns focus to the trigger", () => {
    renderPopover()

    const trigger = screen.getByRole("button", { name: "Menu" })

    fireEvent.click(trigger)
    fireEvent.keyDown(document, { key: "Escape" })

    expect(screen.queryByText("Panel content")).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it("closes when clicking outside but not inside", () => {
    renderPopover()

    fireEvent.click(screen.getByRole("button", { name: "Menu" }))

    fireEvent.pointerDown(screen.getByText("Panel content"))
    expect(screen.getByText("Panel content")).toBeInTheDocument()

    fireEvent.pointerDown(screen.getByRole("button", { name: "Outside" }))
    expect(screen.queryByText("Panel content")).not.toBeInTheDocument()
  })
})

describe("Dropzone", () => {
  const props = {
    acceptTypes: ["image/jpeg", "image/png"],
    acceptLabel: "JPEG or PNG",
    maxBytes: 1024,
    title: "Drop an image here or choose a file",
    icon: ImageIcon,
  }

  const makeFile = (name, type, size) => {
    const file = new File(["x"], name, { type })
    Object.defineProperty(file, "size", { value: size })
    return file
  }

  const drop = (file) =>
    fireEvent.drop(screen.getByRole("button").parentElement, {
      dataTransfer: { files: [file] },
    })

  it("accepts a valid dropped file", () => {
    const onFile = vi.fn()
    const onReject = vi.fn()

    render(<Dropzone {...props} onFile={onFile} onReject={onReject} />)

    const file = makeFile("dog.jpg", "image/jpeg", 512)
    drop(file)

    expect(onFile).toHaveBeenCalledWith(file)
    expect(onReject).not.toHaveBeenCalled()
  })

  it("rejects unsupported types with a helpful message", () => {
    const onFile = vi.fn()
    const onReject = vi.fn()

    render(<Dropzone {...props} onFile={onFile} onReject={onReject} />)

    drop(makeFile("notes.pdf", "application/pdf", 10))

    expect(onFile).not.toHaveBeenCalled()
    expect(onReject).toHaveBeenCalledWith(
      "notes.pdf isn't supported. Use JPEG or PNG.",
    )
  })

  it("rejects files over the size limit", () => {
    const onReject = vi.fn()

    render(<Dropzone {...props} onFile={vi.fn()} onReject={onReject} />)

    drop(makeFile("huge.png", "image/png", 4096))

    expect(onReject).toHaveBeenCalledWith(
      expect.stringContaining("The limit is 1 KB."),
    )
  })

  it("shows the selected file", () => {
    render(
      <Dropzone
        {...props}
        file={makeFile("dog.jpg", "image/jpeg", 2048)}
        onFile={vi.fn()}
      />,
    )

    expect(screen.getByText("dog.jpg")).toBeInTheDocument()
  })
})

describe("ElapsedTimer", () => {
  it("counts while running", () => {
    vi.useFakeTimers()

    render(<ElapsedTimer running />)

    expect(screen.getByText("0:00")).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(65_000)
    })

    expect(screen.getByText("1:05")).toBeInTheDocument()
  })
})

describe("accessibility", () => {
  it("has no axe violations in a composed form", async () => {
    const { container } = render(
      <main>
        <h1>Sign in</h1>

        <form>
          <TextField label="Email" type="email" autoComplete="email" />
          <TextField
            label="Password"
            type="password"
            autoComplete="current-password"
            error="Enter your password."
          />
          <Switch label="Remember me" checked onChange={() => {}} />
          <Button type="submit" variant="primary">
            Sign in
          </Button>
        </form>

        <Alert tone="danger" title="Sign-in failed">
          Check your email and password.
        </Alert>

        <EmptyState
          icon={ImageIcon}
          title="No results yet"
          description="Analyze an image to see detections."
        />
      </main>,
    )

    expect(await axe(container)).toHaveNoViolations()
  })
})
