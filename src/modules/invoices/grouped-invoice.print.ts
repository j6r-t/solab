import { formatCurrency } from '@/lib/utils/currency'
import { formatDate } from '@/lib/utils/dates'

interface PrintGroupedInvoiceItem {
    sourceBillNumber: string
    amount: string
}

interface PrintGroupedInvoicePayment {
    amount: string
    method: string
    paidAt: string
    cheque: {
        status: string | null
        type: string | null
        number: string | null
        bankName: string | null
        dueDate: string | null
    } | null
}

interface PrintGroupedInvoice {
    invoiceNumber: string
    opticianShop: { id: string; name: string } | null
    totalAmount: string
    paidAmount: string
    status: string
    items: PrintGroupedInvoiceItem[]
    payments: PrintGroupedInvoicePayment[]
    notes: string | null
    createdAt: string
}

function methodLabel(payment: PrintGroupedInvoicePayment): string {
    if (payment.method === 'cheque') return payment.cheque?.type === 'traite' ? 'Traite' : 'Chèque'
    if (payment.method === 'card') return 'Carte'
    return 'Espèces'
}

function instrumentStatusLabel(payment: PrintGroupedInvoicePayment): string {
    if (!payment.cheque) return '—'
    if (payment.cheque.status === 'cashed' || payment.cheque.status === 'paid') return 'Encaissé'
    if (payment.cheque.status === 'bounced') return 'Rejeté'
    return 'En attente'
}

export function downloadGroupedInvoice(invoice: PrintGroupedInvoice) {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const total = parseFloat(invoice.totalAmount)
    const paid = parseFloat(invoice.paidAmount)
    const balance = total - paid

    const itemRows = invoice.items.map((item) => {
        return `<tr><td style="padding:8px 10px">Facture n° ${item.sourceBillNumber}</td><td style="padding:8px 10px;text-align:right">${formatCurrency(item.amount)}</td></tr>`
    }).join('')

    const paymentRows = invoice.payments.map((p) =>
        `<tr><td style="padding:6px 10px">${formatDate(p.paidAt)}</td><td style="padding:6px 10px">${methodLabel(p)}${p.cheque?.number ? ` <span style="color:#999">(${p.cheque.number})</span>` : ''}</td><td style="padding:6px 10px;text-align:right">${formatCurrency(p.amount)}</td><td style="padding:6px 10px">${instrumentStatusLabel(p)}</td></tr>`
    ).join('')

    const statusLabel = invoice.status === 'paid' ? 'Payée' : invoice.status === 'partiallyPaid' ? 'Partielle' : 'Impayée'
    const statusClass = invoice.status === 'paid' ? 'status-paid' : invoice.status === 'partiallyPaid' ? 'status-partial' : 'status-unpaid'

    const origin = window.location.origin
    const logoHtml = '<img src="' + origin + '/logo.png" alt="Sofien Optic" class="logo-img" />'

    printWindow.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${invoice.invoiceNumber}</title>
        <style>
            *{margin:0;padding:0;box-sizing:border-box}
            body{font-family:'Segoe UI',Arial,sans-serif;max-width:800px;margin:0 auto;padding:32px 24px;color:#1a1a2e}
            .header{display:flex;align-items:center;gap:16px;margin-bottom:24px;padding-bottom:16px;border-bottom:3px solid #519651}
            .logo-img{max-width:140px;max-height:48px;object-fit:contain;flex-shrink:0}
            .inv-title{font-size:14px;color:#555;margin-top:2px}
            .info-grid{display:flex;gap:24px;margin-bottom:24px;font-size:13px}
            .info-grid .col{flex:1}
            .info-row{display:flex;gap:8px;margin-bottom:4px}
            .info-row .label{font-weight:600;min-width:100px}
            table{width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px}
            th{background:#519651;color:#fff;padding:8px 10px;text-align:left;font-weight:600}
            th.right{text-align:right}
            th.center{text-align:center}
            td{border-bottom:1px solid #e8e8e8}
            .totals{display:flex;flex-direction:column;align-items:flex-end;gap:4px;margin-bottom:24px;font-size:14px}
            .totals .row{display:flex;gap:24px}
            .totals .row .label{font-weight:600;min-width:110px;text-align:right}
            .totals .row .value{min-width:100px;text-align:right}
            .totals .grand-total{font-size:16px;font-weight:700;color:#c62828;border-top:2px solid #519651;padding-top:4px}
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
                <div class="inv-title">Facture groupée — ${invoice.invoiceNumber}</div>
            </div>
            <div style="margin-left:auto">
                <span class="status-badge ${statusClass}">${statusLabel}</span>
            </div>
        </div>

        <div class="info-grid">
            <div class="col">
                <div class="info-row"><span class="label">Sofien Optic</span></div>
                <div class="info-row"><span class="label">Tél:</span><span>24.398.692 / 24.248.632</span></div>
            </div>
            <div class="col">
                <div class="info-row"><span class="label">Opticien:</span><span>${invoice.opticianShop?.name || '—'}</span></div>
                <div class="info-row"><span class="label">Date:</span><span>${formatDate(invoice.createdAt)}</span></div>
                <div class="info-row"><span class="label">Facture N°:</span><span>${invoice.invoiceNumber}</span></div>
            </div>
        </div>

        <table>
            <thead>
                <tr><th>Facture n°</th><th class="right">Montant restant</th></tr>
            </thead>
            <tbody>${itemRows}</tbody>
        </table>

        <div class="totals">
            <div class="row"><span class="label">TOTAL:</span><span class="value">${formatCurrency(invoice.totalAmount)}</span></div>
            <div class="row"><span class="label">PAYÉ:</span><span class="value">${formatCurrency(invoice.paidAmount)}</span></div>
            <div class="row grand-total"><span class="label">RESTE À PAYER:</span><span class="value">${formatCurrency(balance.toFixed(3))}</span></div>
        </div>

        ${paymentRows ? `
        <div class="payment-section">
            <h3>Historique des paiements</h3>
            <table>
                <thead><tr><th>Date</th><th>Méthode</th><th class="right">Montant</th><th>Statut</th></tr></thead>
                <tbody>${paymentRows}</tbody>
            </table>
        </div>` : ''}

        ${invoice.notes ? `<div class="notes"><div class="label">Notes</div>${invoice.notes}</div>` : ''}

        <div class="footer">
            Sofien Optic — Rue de la Liberte a cote Mosquee Omar ibn Elkhattab — 24.398.692 / 24.248.632
        </div>
        </body></html>`)
    printWindow.document.close()
    setTimeout(() => printWindow.print(), 500)
}
