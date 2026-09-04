import { formatCurrency } from '@/lib/utils/currency'

interface DownloadInvoice {
    invoiceNumber: string
    fournisseur: { id: string; name: string; phone: string }
    entity: string
    date: string
    totalAmount: string
    paidAmount: string
    paymentStatus: string
    items: Array<{
        product: { name: string; brand: string } | null
        lensBlank: { brand: string; thickness: string } | null
        description: string | null
        category: string | null
        quantity: number
        unitPrice: string
    }>
    payments: Array<{
        amount: string
        method: string
        paidAt: string
    }>
    notes: string | null
}

export function downloadPurchaseInvoice(inv: DownloadInvoice) {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const total = parseFloat(inv.totalAmount)
    const paid = parseFloat(inv.paidAmount)
    const balance = total - paid

    const itemRows = inv.items.map((item) => {
        const name = item.description
            || (item.product ? `${item.product.brand} ${item.product.name}` : '')
            || (item.lensBlank ? `${item.lensBlank.brand} ${item.lensBlank.thickness}` : '')
            || '—'
        return `<tr><td style="padding:8px 10px">${name}</td><td style="padding:8px 10px;text-align:center">${item.quantity}</td><td style="padding:8px 10px;text-align:right">${formatCurrency(item.unitPrice)}</td><td style="padding:8px 10px;text-align:right">${formatCurrency((parseFloat(item.unitPrice) * item.quantity).toFixed(3))}</td></tr>`
    }).join('')

    const paymentRows = inv.payments.map((p) =>
        `<tr><td style="padding:6px 10px">${new Date(p.paidAt).toLocaleDateString('fr-TN')}</td><td style="padding:6px 10px;text-transform:capitalize">${p.method}</td><td style="padding:6px 10px;text-align:right">${formatCurrency(p.amount)}</td></tr>`
    ).join('')

    const origin = window.location.origin
    const logoHtml = '<img src="' + origin + '/logo.png" alt="Sofien Optic" class="logo-img" />'

    printWindow.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${inv.invoiceNumber}</title>
        <style>
            *{margin:0;padding:0;box-sizing:border-box}
            body{font-family:'Segoe UI',Arial,sans-serif;max-width:800px;margin:0 auto;padding:32px 24px;color:#1a1a2e}
            .header{display:flex;align-items:center;gap:16px;margin-bottom:24px;padding-bottom:16px;border-bottom:3px solid #519651}
            .logo-img{max-width:140px;max-height:48px;object-fit:contain;flex-shrink:0}
            .inv-title{font-size:14px;color:#555;margin-top:2px}
            .info-grid{display:flex;gap:24px;margin-bottom:24px;font-size:13px}
            .info-grid .col{flex:1}
            .info-row{display:flex;gap:8px;margin-bottom:4px}
            .info-row .label{font-weight:600;min-width:80px}
            table{width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px}
            th{background:#519651;color:#fff;padding:8px 10px;text-align:left;font-weight:600}
            th.right{text-align:right}
            th.center{text-align:center}
            td{border-bottom:1px solid #e8e8e8}
            .totals{display:flex;flex-direction:column;align-items:flex-end;gap:4px;margin-bottom:24px;font-size:14px}
            .totals .row{display:flex;gap:24px}
            .totals .row .label{font-weight:600;min-width:80px;text-align:right}
            .totals .row .value{min-width:100px;text-align:right}
            .totals .grand-total{font-size:16px;font-weight:700;color:#519651;border-top:2px solid #519651;padding-top:4px}
            .notes{margin-top:16px;padding:12px;background:#f9f9f9;border-radius:6px;font-size:12px;color:#555}
            .notes .label{font-weight:600;margin-bottom:4px}
            .payment-section{margin-top:16px}
            .payment-section h3{font-size:13px;font-weight:600;margin-bottom:8px;color:#555}
            .footer{text-align:center;margin-top:24px;padding-top:12px;border-top:1px solid #e0e0e0;font-size:11px;color:#999}
            .status-badge{display:inline-block;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600}
            .status-paid{background:#d4edda;color:#155724}
            .status-partial{background:#fff3cd;color:#856404}
            .status-unpaid{background:#f8d7da;color:#721c24}
            @media print{body{padding:16px}}
</style></head><body>
        <div class="header">
            ${logoHtml}
            <div>
                <div class="inv-title">Supplier Invoice — ${inv.invoiceNumber}</div>
            </div>
            <div style="margin-left:auto">
                <span class="status-badge ${inv.paymentStatus === 'fullyPaid' ? 'status-paid' : inv.paymentStatus === 'partiallyPaid' ? 'status-partial' : 'status-unpaid'}">${inv.paymentStatus === 'fullyPaid' ? 'Fully Paid' : inv.paymentStatus === 'partiallyPaid' ? 'Partially Paid' : 'Unpaid'}</span>
            </div>
        </div>

        <div class="info-grid">
            <div class="col">
                <div class="info-row"><span class="label">Supplier:</span><span>${inv.fournisseur.name}</span></div>
                <div class="info-row"><span class="label">Phone:</span><span>${inv.fournisseur.phone}</span></div>
                <div class="info-row"><span class="label">Entity:</span><span>${inv.entity === 'shop' ? 'Shop' : 'Atelier'}</span></div>
            </div>
            <div class="col">
                <div class="info-row"><span class="label">Date:</span><span>${new Date(inv.date).toLocaleDateString('fr-TN')}</span></div>
                <div class="info-row"><span class="label">Invoice #:</span><span>${inv.invoiceNumber}</span></div>
            </div>
        </div>

        <table>
            <thead>
                <tr><th>Item</th><th class="center">Qty</th><th class="right">Unit Price</th><th class="right">Total</th></tr>
            </thead>
            <tbody>${itemRows}</tbody>
        </table>

        <div class="totals">
            <div class="row"><span class="label">Subtotal:</span><span class="value">${formatCurrency(inv.totalAmount)}</span></div>
            <div class="row"><span class="label">Paid:</span><span class="value">${formatCurrency(inv.paidAmount)}</span></div>
            <div class="row grand-total"><span class="label">Balance:</span><span class="value">${formatCurrency(balance.toFixed(3))}</span></div>
        </div>

        ${paymentRows ? `
        <div class="payment-section">
            <h3>Payment History</h3>
            <table>
                <thead><tr><th>Date</th><th>Method</th><th class="right">Amount</th></tr></thead>
                <tbody>${paymentRows}</tbody>
            </table>
        </div>` : ''}

        ${inv.notes ? `<div class="notes"><div class="label">Notes</div>${inv.notes}</div>` : ''}

        <div class="footer">
            Sofien Optic — Rue de la Liberte a cote Mosquee Omar ibn Elkhattab — 24.398.692 / 24.248.632
        </div>
        </body></html>`)
    printWindow.document.close()
    setTimeout(() => printWindow.print(), 500)
}
