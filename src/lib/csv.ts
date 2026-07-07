export function parseCSV(text: string): { headers: string[]; rows: string[][] } {
    const lines: string[] = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < text.length; i++) {
        const ch = text[i]
        if (ch === '"') {
            inQuotes = !inQuotes
        } else if (ch === '\n' && !inQuotes) {
            lines.push(current)
            current = ''
        } else if (ch === '\r' && !inQuotes) {
            // skip CR
        } else {
            current += ch
        }
    }
    if (current.trim()) lines.push(current)

    function splitRow(row: string): string[] {
        const cols: string[] = []
        let field = ''
        let q = false
        for (let i = 0; i < row.length; i++) {
            const ch = row[i]
            if (ch === '"') {
                if (q && row[i + 1] === '"') { field += '"'; i++ }
                else q = !q
            } else if (ch === ',' && !q) {
                cols.push(field.trim())
                field = ''
            } else {
                field += ch
            }
        }
        cols.push(field.trim())
        return cols
    }

    if (lines.length === 0) return { headers: [], rows: [] }
    const headers = splitRow(lines[0])
    const rows = lines.slice(1).filter(r => r.trim()).map(splitRow)
    return { headers, rows }
}

export function toCSV(headers: string[], rows: (string | number | null | undefined)[][]): string {
    const esc = (v: string) => /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
    const headerLine = headers.map(esc).join(',')
    const dataLines = rows.map(r => r.map(c => esc(String(c ?? ''))).join(','))
    return [headerLine, ...dataLines].join('\n')
}

export function detectEncoding(text: string): 'utf8' | 'latin1' {
    // check for common WinDev/Windows encoding markers
    if (/[\x80-\xFF]/.test(text) && !/[\u0600-\u06FF\u0400-\u04FF]/.test(text)) return 'latin1'
    return 'utf8'
}
