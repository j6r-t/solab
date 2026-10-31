import QRCodeLib from 'qrcode'

export interface LabelProduct {
    name: string
    brand: string
    price: number
    code: string
}

/** Print price/QR labels for freshly created products — the "notebook
 * ritual" replacement: labels come straight out of the purchase invoice. */
export async function printProductLabels(products: LabelProduct[]): Promise<boolean> {
    const win = window.open('', '_blank')
    if (!win) return false

    const labels = await Promise.all(
        products.map(async (p) => {
            const dataUrl = await QRCodeLib.toDataURL(p.code, { width: 140, margin: 0 })
            return `<div class="label">
                <img class="qr" src="${dataUrl}" alt="${p.code}" />
                <div class="info">
                    <div class="brand">${escapeHtml(p.brand)}</div>
                    <div class="name">${escapeHtml(p.name)}</div>
                    <div class="price">${p.price.toFixed(3)} TND</div>
                    <div class="code">${escapeHtml(p.code)}</div>
                </div>
            </div>`
        })
    )

    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Étiquettes</title>
        <style>
            *{margin:0;padding:0;box-sizing:border-box}
            body{font-family:'Segoe UI',Arial,sans-serif;padding:8mm;display:flex;flex-wrap:wrap;gap:4mm}
            .label{width:70mm;border:1px dashed #999;border-radius:4px;padding:4mm;display:flex;gap:4mm;align-items:center;page-break-inside:avoid}
            .qr{width:22mm;height:22mm;flex-shrink:0}
            .info{min-width:0}
            .brand{font-size:11pt;font-weight:700;text-transform:uppercase}
            .name{font-size:10pt;color:#333;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:36mm}
            .price{font-size:14pt;font-weight:800;color:#1a1a2e;margin-top:1mm}
            .code{font-family:monospace;font-size:7pt;color:#777;margin-top:1mm}
        </style></head><body>${labels.join('')}</body></html>`)
    win.document.close()
    return true
}

function escapeHtml(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
