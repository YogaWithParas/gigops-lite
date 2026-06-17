import { Badge } from "@/components/ui/badge"

type Variant = "difference" | "need" | "neutral"

const variantClasses: Record<Variant, string> = {
  difference: "border-transparent bg-secondary text-secondary-foreground",
  need: "border-transparent bg-accent text-accent-foreground",
  neutral: "border-border bg-card text-muted-foreground",
}

export function TagList({
  label,
  items,
  variant = "neutral",
}: {
  label: string
  items: string[]
  variant?: Variant
}) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <ul className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <li key={item}>
            <Badge className={`font-medium ${variantClasses[variant]}`}>{item}</Badge>
          </li>
        ))}
      </ul>
    </div>
  )
}
