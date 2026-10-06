import { fireEvent, screen, waitFor, within } from "@testing-library/react"
import { axe } from "vitest-axe"
import { beforeEach, describe, expect, it, vi } from "vitest"

import * as api from "../services/api"
import { primeApi, renderApp, signIn } from "../test/appTestUtils"

vi.mock("../services/api", async (importOriginal) => {
  const { mockApiModule } = await import("../test/apiMock")

  return mockApiModule(importOriginal)
})

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()

  vi.clearAllMocks()
  primeApi(api)
  signIn()
})

const openSettings = async () => {
  renderApp("/settings")

  await screen.findByRole("heading", { name: "Settings" })
}

describe("Settings", () => {
  it("shows every preference as a switch", async () => {
    await openSettings()

    for (const name of [
      "Overview",
      "Image lab",
      "Video lab",
      "Analysis completed",
      "System status",
    ]) {
      expect(screen.getByRole("switch", { name })).toHaveAttribute(
        "aria-checked",
        "true",
      )
    }
  })

  it("saves a change and updates the navigation", async () => {
    await openSettings()

    const navigation = screen.getByRole("navigation", { name: "Workspace" })

    expect(
      within(navigation).getByRole("link", { name: "Image lab" }),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole("switch", { name: "Image lab" }))

    await waitFor(() =>
      expect(screen.getByRole("switch", { name: "Image lab" })).toHaveAttribute(
        "aria-checked",
        "false",
      ),
    )

    expect(api.updatePreferences).toHaveBeenCalledWith("valid-token", {
      image_analysis_enabled: false,
    })

    expect(
      within(navigation).queryByRole("link", { name: "Image lab" }),
    ).not.toBeInTheDocument()
  })

  it("restores the previous value and explains when saving fails", async () => {
    api.updatePreferences.mockRejectedValue(new Error("offline"))

    await openSettings()

    fireEvent.click(screen.getByRole("switch", { name: "Video lab" }))

    expect(
      await screen.findByText("Couldn't save that change"),
    ).toBeInTheDocument()

    expect(screen.getByRole("switch", { name: "Video lab" })).toHaveAttribute(
      "aria-checked",
      "true",
    )
  })

  it("disables the switches while a change is saving", async () => {
    api.updatePreferences.mockReturnValue(new Promise(() => {}))

    await openSettings()

    fireEvent.click(screen.getByRole("switch", { name: "Overview" }))

    expect(await screen.findByText("Saving preference…")).toBeInTheDocument()
    expect(screen.getByRole("switch", { name: "System status" })).toBeDisabled()
  })

  it("shows the account and the backend address", async () => {
    await openSettings()

    expect(screen.getByText("test@example.com")).toBeInTheDocument()
    expect(screen.getByText("Analyst")).toBeInTheDocument()
    expect(
      screen.getByText("Proxied to the backend by the dev server."),
    ).toBeInTheDocument()
  })

  it("has no accessibility violations", async () => {
    const { container } = renderApp("/settings")

    await screen.findByRole("heading", { name: "Settings" })

    expect(await axe(container)).toHaveNoViolations()
  })
})
