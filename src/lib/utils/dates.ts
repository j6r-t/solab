/**
 * Canonical frontend date formatting — always dd/mm/yyyy, independent of the
 * device locale (bare toLocaleDateString() renders m/d/yyyy on English devices).
 */

type DateLike = string | number | Date | null | undefined

function pad2(n: number): string {
    return String(n).padStart(2, '0')
}

/** Safe parts extraction in local time; returns null for invalid input. */
function parts(value: DateLike): { d: number; m: number; y: number; hh: number; mm: number } | null {
    if (value === null || value === undefined || value === '') return null
    const date = value instanceof Date ? value : new Date(value)
    if (isNaN(date.getTime())) return null
    return {
        d: date.getDate(),
        m: date.getMonth() + 1,
        y: date.getFullYear(),
        hh: date.getHours(),
        mm: date.getMinutes(),
    }
}

/** dd/mm/yyyy — e.g. 05/01/2026 */
export function formatDate(value: DateLike): string {
    const p = parts(value)
    if (!p) return ''
    return `${pad2(p.d)}/${pad2(p.m)}/${p.y}`
}

/** dd/mm/yyyy HH:mm — e.g. 05/01/2026 14:07 */
export function formatDateTime(value: DateLike): string {
    const p = parts(value)
    if (!p) return ''
    return `${pad2(p.d)}/${pad2(p.m)}/${p.y} ${pad2(p.hh)}:${pad2(p.mm)}`
}
