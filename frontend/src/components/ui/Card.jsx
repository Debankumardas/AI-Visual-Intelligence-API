import { cn } from "../../utils/cn"

function Card({
  as: Tag = "section",
  padded = true,
  className,
  children,
  ...props
}) {
  return (
    <Tag
      className={cn(
        "rounded-panel border border-hairline bg-surface",
        padded && "p-5",
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  )
}

export function CardHeader({ title, description, actions, id }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 id={id} className="text-base font-semibold text-fg">
          {title}
        </h2>

        {description && (
          <p className="mt-1 text-sm text-muted">{description}</p>
        )}
      </div>

      {actions}
    </div>
  )
}

export default Card
