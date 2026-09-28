'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils/currency'
import type { IconType } from './report-widgets'

export function MiniBars({ items, formatValue, valueClass }: {
    items: { label: string; value: number; display?: string }[]
    formatValue: (v: number) => string
    valueClass?: string
}) {
    if (items.length === 0) return null
    const max = Math.max(1, ...items.map((i) => i.value))
    return (
        <div className="space-y-1.5">
            {items.map((it, idx) => (
                <div key={`${it.label}-${idx}`} className="flex items-center gap-2 text-xs">
                    <span className="w-24 shrink-0 truncate text-right text-muted-foreground sm:w-32" title={it.label}>{it.label}</span>
                    <div className="h-4 flex-1 overflow-hidden rounded-sm bg-muted">
                        <div className="h-full rounded-sm bg-primary/70 transition-all" style={{ width: `${(it.value / max) * 100}%` }} />
                    </div>
                    <span className={`w-16 shrink-0 text-right font-mono tabular-nums ${valueClass ?? ''}`}>{it.display ?? formatValue(it.value)}</span>
                </div>
            ))}
        </div>
    )
}

export function BucketBars({ items }: { items: { label: string; count: number }[] }) {
    const max = Math.max(1, ...items.map((i) => i.count))
    return (
        <div className="flex items-end justify-around gap-2">
            {items.map((it) => (
                <div key={it.label} className="flex w-full max-w-[56px] flex-col items-center gap-1">
                    <span className="text-xs font-semibold tabular-nums">{it.count}</span>
                    <div className="flex h-16 w-full items-end">
                        <div className="w-full rounded-t-sm bg-primary/70 transition-all" style={{ height: `${Math.max(2, (it.count / max) * 100)}%` }} />
                    </div>
                    <span className="text-center text-[10px] leading-tight text-muted-foreground">{it.label}</span>
                </div>
            ))}
        </div>
    )
}

export function LineChart({ series, labels, formatValue }: {
    series: { label: string; strokeClass: string; dotClass: string; bgClass: string; points: number[] }[]
    labels: string[]
    formatValue: (v: number) => string
}) {
    const W = 340
    const H = 150
    const padL = 6
    const padR = 6
    const padT = 16
    const padB = 18
    const innerW = W - padL - padR
    const innerH = H - padT - padB
    let maxV = 1
    for (const s of series) for (const p of s.points) if (p > maxV) maxV = p
    const n = labels.length
    const xAt = (i: number) => padL + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW)
    const yAt = (v: number) => padT + (1 - v / maxV) * innerH
    return (
        <div>
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img">
                {[0, 0.25, 0.5, 0.75, 1].map((f) => (
                    <line
                        key={f}
                        x1={padL}
                        x2={W - padR}
                        y1={padT + f * innerH}
                        y2={padT + f * innerH}
                        stroke="currentColor"
                        className="text-muted-foreground/40"
                        strokeWidth={0.6}
                        strokeDasharray="3 3"
                    />
                ))}
                <text x={padL} y={padT - 5} fontSize={7} className="fill-muted-foreground">{formatValue(maxV)}</text>
                {labels.map((lb, i) =>
                    i % 2 === 0 ? (
                        <text key={`${lb}-${i}`} x={xAt(i)} y={H - 4} textAnchor="middle" fontSize={6.5} className="fill-muted-foreground">{lb}</text>
                    ) : null
                )}
                {series.map((s) => (
                    <g key={s.label}>
                        <polyline
                            fill="none"
                            strokeWidth={1.6}
                            strokeLinejoin="round"
                            strokeLinecap="round"
                            className={s.strokeClass}
                            points={s.points.map((v, i) => `${xAt(i).toFixed(1)},${yAt(v).toFixed(1)}`).join(' ')}
                        />
                        {s.points.map((v, i) => (
                            <circle key={i} cx={xAt(i).toFixed(1)} cy={yAt(v).toFixed(1)} r={2.4} className={s.dotClass}>
                                <title>{`${labels[i]} — ${s.label} : ${formatValue(v)}`}</title>
                            </circle>
                        ))}
                    </g>
                ))}
            </svg>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                {series.map((s) => (
                    <span key={s.label} className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                        <span className={`h-[3px] w-6 rounded-full ${s.bgClass}`} />
                        {s.label}
                    </span>
                ))}
            </div>
        </div>
    )
}

function polarPoint(cx: number, cy: number, r: number, deg: number) {
    const rad = ((deg - 90) * Math.PI) / 180
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function donutSlicePath(cx: number, cy: number, rOuter: number, rInner: number, startDeg: number, endDeg: number) {
    const largeArc = endDeg - startDeg > 180 ? 1 : 0
    const p1 = polarPoint(cx, cy, rOuter, startDeg)
    const p2 = polarPoint(cx, cy, rOuter, endDeg)
    const p3 = polarPoint(cx, cy, rInner, endDeg)
    const p4 = polarPoint(cx, cy, rInner, startDeg)
    const f = (n: number) => n.toFixed(2)
    return `M ${f(p1.x)} ${f(p1.y)} A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${f(p2.x)} ${f(p2.y)} L ${f(p3.x)} ${f(p3.y)} A ${rInner} ${rInner} 0 ${largeArc} 0 ${f(p4.x)} ${f(p4.y)} Z`
}

export function Donut({ slices, total, centerLabel, centerText, className }: {
    slices: { value: number; pct: number; fill: string }[]
    total: number
    centerLabel: string
    centerText?: string
    className?: string
}) {
    const c = 50
    const rOuter = 46
    const rInner = 29
    const sweepOf = (pct: number) => Math.min((pct / 100) * 360, 359.98)
    const arcs = slices.map((s, i) => {
        const start = slices.slice(0, i).reduce((sum, prev) => sum + sweepOf(prev.pct), 0)
        const sweep = sweepOf(s.pct)
        return { fill: s.fill, pct: s.pct, start, end: start + sweep, mid: start + sweep / 2 }
    })
    return (
        <svg viewBox="0 0 100 100" className={className ?? 'h-28 w-28 shrink-0'} role="img">
            {arcs.map((a, i) => {
                const labelPos = polarPoint(c, c, (rOuter + rInner) / 2, a.mid)
                return (
                    <g key={i}>
                        <path d={donutSlicePath(c, c, rOuter, rInner, a.start, a.end)} className={a.fill} stroke="var(--card)" strokeWidth={1} />
                        {a.pct >= 8 && (
                            <text x={labelPos.x} y={labelPos.y} textAnchor="middle" dominantBaseline="central" fontSize={9} className="fill-foreground font-medium">
                                {Math.round(a.pct)} %
                            </text>
                        )}
                    </g>
                )
            })}
            <text x={c} y={46} textAnchor="middle" fontSize={6.5} className="fill-muted-foreground">{centerLabel}</text>
            <text x={c} y={57} textAnchor="middle" fontSize={8.5} fontWeight={600} className="fill-foreground">{centerText ?? formatCurrency(total)}</text>
        </svg>
    )
}

export function DonutCard({ title, icon: Icon, color, items, emptyText, centerLabel, centerText, formatValue, wide }: {
    title: string
    icon: IconType
    color: string
    items: { label: string; value: number; fill: string; dot: string }[]
    emptyText: string
    centerLabel: string
    centerText?: string
    formatValue?: (v: number) => string
    wide?: boolean
}) {
    const fmt = formatValue ?? formatCurrency
    const total = items.reduce((s, i) => s + i.value, 0)
    const slices = items.filter((i) => i.value > 0).map((i) => ({ ...i, pct: total > 0 ? (i.value / total) * 100 : 0 }))
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base">{title}</CardTitle>
                <Icon className={`h-4 w-4 ${color}`} />
            </CardHeader>
            <CardContent className={wide ? 'space-y-3' : 'flex items-center gap-4'}>
                {slices.length > 0 ? (
                    <Donut
                        slices={slices}
                        total={total}
                        centerLabel={centerLabel}
                        centerText={centerText}
                        className={wide ? 'mx-auto h-auto w-full max-w-[200px]' : undefined}
                    />
                ) : (
                    <div className={`h-28 w-28 rounded-full border border-dashed ${wide ? 'mx-auto' : 'shrink-0'}`} />
                )}
                {wide ? (
                    <div className="space-y-2">
                        {slices.length === 0 && <p className="text-sm text-muted-foreground">{emptyText}</p>}
                        {slices.map((s) => (
                            <div key={s.label} className="flex items-center gap-2">
                                <span className={`h-2.5 w-2.5 shrink-0 rounded-sm ${s.dot}`} />
                                <span className="flex-1 truncate text-sm">{s.label}</span>
                                <span className="text-sm font-semibold tabular-nums">{fmt(s.value)}</span>
                                <span className="w-10 shrink-0 text-right text-xs text-muted-foreground">{Math.round(s.pct)} %</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="min-w-0 flex-1 space-y-2">
                        {slices.length === 0 && <p className="text-sm text-muted-foreground">{emptyText}</p>}
                        {slices.map((s) => (
                            <div key={s.label}>
                                <div className="flex items-center gap-2">
                                    <span className={`h-2.5 w-2.5 shrink-0 rounded-sm ${s.dot}`} />
                                    <span className="flex-1 truncate text-sm">{s.label}</span>
                                    <span className="text-sm font-semibold tabular-nums">{fmt(s.value)}</span>
                                </div>
                                <p className="text-right text-xs text-muted-foreground">{Math.round(s.pct)} %</p>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
