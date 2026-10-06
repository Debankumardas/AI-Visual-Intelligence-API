import { render } from "@testing-library/react"
import { MemoryRouter } from "react-router"

import App from "../App"
import LocationProbe from "./LocationProbe"

export { defaultPreferences, mockUser, primeApi, readyModels } from "./apiMock"

export function signIn(token = "valid-token") {
  localStorage.setItem("access_token", token)
}

export function renderApp(path = "/") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
      <LocationProbe />
    </MemoryRouter>,
  )
}
