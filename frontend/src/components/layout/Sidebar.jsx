import SidebarContent from "./SidebarContent"

/** The fixed navigation rail shown from the lg breakpoint up. */
function Sidebar({ preferences }) {
  return (
    <aside className="sticky top-0 hidden h-dvh flex-col border-r border-hairline bg-surface lg:flex">
      <SidebarContent preferences={preferences} />
    </aside>
  )
}

export default Sidebar
