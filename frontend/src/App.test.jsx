import { act } from "react"
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest"
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react"

import App from "./App"

import {
  getCurrentUser,
  getPreferences,
} from "./services/api"


vi.mock("./services/api", () => ({
  getCurrentUser: vi.fn(),
  getPreferences: vi.fn(),
}))


vi.mock("./components/auth/Login", () => ({
  default: ({ onLogin }) => (
    <div>
      <h1>Login</h1>

      <button
        type="button"
        onClick={() => onLogin("test-access-token")}
      >
        Mock Login
      </button>
    </div>
  ),
}))


vi.mock("./components/layout/Sidebar", () => ({
  default: ({ activePage, onNavigate }) => (
    <nav>
      <span data-testid="active-page">
        {activePage}
      </span>

      <button
        type="button"
        onClick={() => onNavigate("Dashboard")}
      >
        Dashboard
      </button>

      <button
        type="button"
        onClick={() => onNavigate("Image Analysis")}
      >
        Image Analysis
      </button>

      <button
        type="button"
        onClick={() => onNavigate("Video Analysis")}
      >
        Video Analysis
      </button>

      <button
        type="button"
        onClick={() => onNavigate("Analytics")}
      >
        Analytics
      </button>

      <button
        type="button"
        onClick={() => onNavigate("Settings")}
      >
        Settings
      </button>
    </nav>
  ),
}))


vi.mock("./components/layout/Topbar", () => ({
  default: ({ user, onLogout }) => (
    <header>
      <span data-testid="user-name">
        {user?.name}
      </span>

      <button
        type="button"
        onClick={onLogout}
      >
        Logout
      </button>
    </header>
  ),
}))


vi.mock("./components/ui/StatCard", () => ({
  default: ({ title, value }) => (
    <div>
      <span>{title}</span>
      <span>{value}</span>
    </div>
  ),
}))


vi.mock("./pages/ImageAnalysis", () => ({
  default: () => (
    <div>Image Analysis Page</div>
  ),
}))


vi.mock("./pages/VideoAnalysis", () => ({
  default: () => (
    <div>Video Analysis Page</div>
  ),
}))


vi.mock("./pages/Analytics", () => ({
  default: () => (
    <div>Analytics Page</div>
  ),
}))


vi.mock("./pages/Settings", () => ({
  default: ({ user }) => (
    <div>
      <span>Settings Page</span>
      <span>{user?.name}</span>
    </div>
  ),
}))


const mockUser = {
  id: 1,
  name: "Test User",
  email: "test@example.com",
  role: "Analyst",
  is_active: true,
}


const defaultPreferences = {
  dashboard_enabled: true,
  image_analysis_enabled: true,
  video_analysis_enabled: true,
  analysis_completed_notifications: true,
  system_notifications: true,
}


beforeEach(() => {
  localStorage.clear()

  vi.clearAllMocks()

  getCurrentUser.mockResolvedValue(mockUser)

  getPreferences.mockResolvedValue(
    defaultPreferences,
  )
})


describe("App authentication", () => {
  it(
    "renders the login screen when no access token exists",
    async () => {
      render(<App />)

      expect(
        await screen.findByRole("heading", {
          name: "Login",
        }),
      ).toBeInTheDocument()

      expect(
        getCurrentUser,
      ).not.toHaveBeenCalled()

      expect(
        getPreferences,
      ).not.toHaveBeenCalled()
    },
  )


  it(
    "stores the access token and restores the authenticated session after login",
    async () => {
      render(<App />)

      fireEvent.click(
        await screen.findByRole("button", {
          name: "Mock Login",
        }),
      )

      await waitFor(() => {
        expect(
          getCurrentUser,
        ).toHaveBeenCalledWith(
          "test-access-token",
        )
      })

      expect(
        getPreferences,
      ).toHaveBeenCalledWith(
        "test-access-token",
      )

      expect(
        await screen.findByTestId("user-name"),
      ).toHaveTextContent("Test User")

      expect(
        localStorage.getItem("access_token"),
      ).toBe("test-access-token")
    },
  )


  it(
    "restores an existing session after refresh",
    async () => {
      localStorage.setItem(
        "access_token",
        "existing-token",
      )

      render(<App />)

      expect(
        await screen.findByTestId("user-name"),
      ).toHaveTextContent("Test User")

      expect(
        getCurrentUser,
      ).toHaveBeenCalledWith(
        "existing-token",
      )

      expect(
        getPreferences,
      ).toHaveBeenCalledWith(
        "existing-token",
      )
    },
  )


  it(
    "clears an invalid stored session",
    async () => {
      localStorage.setItem(
        "access_token",
        "invalid-token",
      )

      getCurrentUser.mockRejectedValueOnce(
        new Error("Unauthorized"),
      )

      render(<App />)

      expect(
        await screen.findByRole("heading", {
          name: "Login",
        }),
      ).toBeInTheDocument()

      expect(
        localStorage.getItem("access_token"),
      ).toBeNull()
    },
  )


  it(
    "logs the user out and clears the stored session",
    async () => {
      localStorage.setItem(
        "access_token",
        "valid-token",
      )

      render(<App />)

      expect(
        await screen.findByTestId("user-name"),
      ).toHaveTextContent("Test User")

      fireEvent.click(
        screen.getByRole("button", {
          name: "Logout",
        }),
      )

      expect(
        localStorage.getItem("access_token"),
      ).toBeNull()

      expect(
        await screen.findByRole("heading", {
          name: "Login",
        }),
      ).toBeInTheDocument()
    },
  )


  it(
    "shows the session expired message after a session-expired event",
    async () => {
      localStorage.setItem(
        "access_token",
        "valid-token",
      )

      render(<App />)

      expect(
        await screen.findByTestId("user-name"),
      ).toHaveTextContent("Test User")

      await act(async () => {
        window.dispatchEvent(
          new Event("session-expired"),
        )
      })

      expect(
        await screen.findByText(
          "Your session has expired. Please log in again.",
        ),
      ).toBeInTheDocument()

      expect(
        localStorage.getItem("access_token"),
      ).toBeNull()
    },
  )
})


describe("App navigation and preferences", () => {
  it(
    "renders the dashboard by default after authentication",
    async () => {
      localStorage.setItem(
        "access_token",
        "valid-token",
      )

      render(<App />)

      expect(
        await screen.findByText(
          "Computer Vision Workspace",
        ),
      ).toBeInTheDocument()

      expect(
        screen.getByTestId("active-page"),
      ).toHaveTextContent("Dashboard")
    },
  )


  it(
    "navigates to the image analysis page",
    async () => {
      localStorage.setItem(
        "access_token",
        "valid-token",
      )

      render(<App />)

      await screen.findByTestId("user-name")

      fireEvent.click(
        screen.getByRole("button", {
          name: "Image Analysis",
        }),
      )

      expect(
        await screen.findByText(
          "Image Analysis Page",
        ),
      ).toBeInTheDocument()
    },
  )


  it(
    "falls back to Analytics when a disabled page is requested and Dashboard is disabled",
    async () => {
      localStorage.setItem(
        "access_token",
        "valid-token",
      )

      getPreferences.mockResolvedValueOnce({
        ...defaultPreferences,
        dashboard_enabled: false,
        image_analysis_enabled: false,
      })

      render(<App />)

      await screen.findByTestId("user-name")

      fireEvent.click(
        screen.getByRole("button", {
          name: "Image Analysis",
        }),
      )

      expect(
        await screen.findByText(
          "Analytics Page",
        ),
      ).toBeInTheDocument()
    },
  )


  it(
    "falls back to Dashboard when a disabled page is requested and Dashboard is enabled",
    async () => {
      localStorage.setItem(
        "access_token",
        "valid-token",
      )

      getPreferences.mockResolvedValueOnce({
        ...defaultPreferences,
        image_analysis_enabled: false,
      })

      render(<App />)

      await screen.findByTestId("user-name")

      fireEvent.click(
        screen.getByRole("button", {
          name: "Image Analysis",
        }),
      )

      expect(
        await screen.findByText(
          "Computer Vision Workspace",
        ),
      ).toBeInTheDocument()

      expect(
        screen.getByTestId("active-page"),
      ).toHaveTextContent("Dashboard")
    },
  )
})