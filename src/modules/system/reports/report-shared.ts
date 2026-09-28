export interface PeriodWindow {
    start: Date
    end: Date | null
}

export interface PeriodRange {
    current: PeriodWindow | null
    previous: PeriodWindow | null
}

export function addDays(date: Date, days: number): Date {
    const d = new Date(date)
    d.setDate(d.getDate() + days)
    return d
}

export function pad2(n: number): string {
    return String(n).padStart(2, '0')
}

export function monthKey(d: Date): string {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`
}

export function round1(n: number): number {
    return Math.round(n * 10) / 10
}

/**
 * Current + previous windows for a period.
 * today → previous = yesterday; week → previous 7 days starting same weekday (weeks start Sunday);
 * month → previous calendar month; year → previous calendar year; all → null (no deltas).
 * Current end is always null (open, up to `now`); previous end is always bounded.
 */
export function getPeriodRange(period: string, now: Date): PeriodRange {
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    switch (period) {
        case 'today':
            return {
                current: { start: startOfToday, end: null },
                previous: { start: addDays(startOfToday, -1), end: startOfToday },
            }
        case 'week': {
            const weekStart = addDays(startOfToday, -now.getDay())
            return {
                current: { start: weekStart, end: null },
                previous: { start: addDays(weekStart, -7), end: weekStart },
            }
        }
        case 'month': {
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
            return {
                current: { start: monthStart, end: null },
                previous: { start: new Date(now.getFullYear(), now.getMonth() - 1, 1), end: monthStart },
            }
        }
        case 'year': {
            const yearStart = new Date(now.getFullYear(), 0, 1)
            return {
                current: { start: yearStart, end: null },
                previous: { start: new Date(now.getFullYear() - 1, 0, 1), end: yearStart },
            }
        }
        default:
            return { current: null, previous: null }
    }
}

export function inWindow(date: Date, range: PeriodWindow | null): boolean {
    if (!range) return true
    return date >= range.start && (range.end === null || date < range.end)
}

export function changePct(value: number, previous: number): number | null {
    if (!previous) return null
    return round1(((value - previous) / previous) * 100)
}

export function lastNMonthStarts(n: number, now: Date): Date[] {
    const out: Date[] = []
    for (let i = n - 1; i >= 0; i--) out.push(new Date(now.getFullYear(), now.getMonth() - i, 1))
    return out
}
