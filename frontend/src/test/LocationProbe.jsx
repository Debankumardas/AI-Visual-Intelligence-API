import { useLocation } from "react-router"

// Shows where the router is, so tests can check the address.
function LocationProbe() {
  const location = useLocation()

  return (
    <output data-testid="location">
      {location.pathname + location.search}
    </output>
  )
}

export default LocationProbe
