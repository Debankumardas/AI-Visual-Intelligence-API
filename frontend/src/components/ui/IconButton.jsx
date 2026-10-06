import { buttonStyles } from "./buttonStyles"

/** Icon-only button. `label` is required: it names the button. */
function IconButton({
  label,
  icon: Icon,
  variant = "ghost",
  className,
  type = "button",
  children,
  ...props
}) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={buttonStyles({ variant, size: "icon", className })}
      {...props}
    >
      {Icon && <Icon size={18} aria-hidden="true" />}
      {children}
    </button>
  )
}

export default IconButton
