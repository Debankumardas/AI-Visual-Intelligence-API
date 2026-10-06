import { cn } from "../../utils/cn"

/**
 * A chart's data as a table, tucked in a disclosure. This is the
 * accessible alternative to the picture.
 */
function DataTable({ caption, columns, rows, label = "View as table" }) {
  return (
    <details className="mt-4 border-t border-hairline pt-1">
      <summary className="flex min-h-11 cursor-pointer items-center text-sm font-medium text-muted transition-colors duration-150 hover:text-fg">
        {label}
      </summary>

      <div className="scroll-contain overflow-x-auto">
        <table className="w-full min-w-max text-left text-sm">
          <caption className="sr-only">{caption}</caption>

          <thead>
            <tr className="border-b border-hairline text-muted">
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={cn(
                    "px-3 py-2 font-medium",
                    column.numeric && "text-right",
                  )}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-hairline">
            {rows.map((row, index) => (
              <tr key={row.key ?? index}>
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      "px-3 py-2 text-fg",
                      column.numeric && "tnum text-right font-mono",
                    )}
                  >
                    {column.format
                      ? column.format(row[column.key], row)
                      : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  )
}

export default DataTable
