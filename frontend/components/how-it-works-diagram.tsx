type FlowTone = "neutral" | "progress" | "done"

const toneStyle: Record<FlowTone, { rect: string }> = {
  neutral: { rect: "fill-secondary stroke-border" },
  progress: { rect: "fill-sky-100 stroke-sky-300" },
  done: { rect: "fill-emerald-100 stroke-emerald-300" },
}

const nodes: { key: string; label: string; sub: string; tone: FlowTone; cx: number }[] = [
  { key: "client", label: "Client", sub: "Submits", tone: "neutral", cx: 90 },
  { key: "ops", label: "Ops", sub: "Assigns · scores", tone: "progress", cx: 270 },
  { key: "worker", label: "Worker", sub: "Executes", tone: "progress", cx: 450 },
  { key: "qa", label: "QA", sub: "Reviews", tone: "progress", cx: 630 },
  { key: "payout", label: "Payout", sub: "Pays out", tone: "done", cx: 810 },
]

const NODE_WIDTH = 140
const NODE_HEIGHT = 70
const NODE_TOP = 36
const NODE_BOTTOM = NODE_TOP + NODE_HEIGHT
const NODE_CENTER_Y = NODE_TOP + NODE_HEIGHT / 2
const AUDIT_LINE_Y = 148

export function HowItWorksDiagram() {
  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox="0 0 900 195"
        role="img"
        aria-label="Flow diagram: Client submits, Ops assigns and scores, Worker executes, QA reviews, then Payout. Every step is logged in the audit trail."
        className="h-auto w-full min-w-[640px] max-w-4xl"
      >
        <defs>
          <marker id="how-it-works-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" className="fill-muted-foreground" />
          </marker>
        </defs>

        <text x="450" y="16" textAnchor="middle" className="fill-muted-foreground text-[12px] font-medium">
          How a job moves through GigOps Lite
        </text>

        {nodes.slice(0, -1).map((node, index) => {
          const next = nodes[index + 1]
          const x1 = node.cx + NODE_WIDTH / 2
          const x2 = next.cx - NODE_WIDTH / 2
          return (
            <line
              key={`arrow-${node.key}`}
              x1={x1}
              y1={NODE_CENTER_Y}
              x2={x2 - 6}
              y2={NODE_CENTER_Y}
              strokeWidth="2"
              className="stroke-muted-foreground"
              markerEnd="url(#how-it-works-arrow)"
            />
          )
        })}

        <line
          x1={nodes[0].cx}
          y1={AUDIT_LINE_Y}
          x2={nodes[nodes.length - 1].cx}
          y2={AUDIT_LINE_Y}
          strokeWidth="1.5"
          strokeDasharray="4 4"
          className="stroke-border"
        />
        <text x="450" y={AUDIT_LINE_Y + 24} textAnchor="middle" className="fill-muted-foreground text-[11px] font-medium">
          Audit — every step is logged
        </text>

        {nodes.map((node) => (
          <g key={node.key}>
            <line
              x1={node.cx}
              y1={NODE_BOTTOM}
              x2={node.cx}
              y2={AUDIT_LINE_Y}
              strokeWidth="1.5"
              strokeDasharray="3 3"
              className="stroke-border"
            />
            <rect
              x={node.cx - NODE_WIDTH / 2}
              y={NODE_TOP}
              width={NODE_WIDTH}
              height={NODE_HEIGHT}
              rx="14"
              ry="14"
              strokeWidth="2"
              className={toneStyle[node.tone].rect}
            />
            <text x={node.cx} y={NODE_TOP + 30} textAnchor="middle" className="fill-foreground text-[14px] font-semibold">
              {node.label}
            </text>
            <text x={node.cx} y={NODE_TOP + 48} textAnchor="middle" className="fill-muted-foreground text-[11px]">
              {node.sub}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}
