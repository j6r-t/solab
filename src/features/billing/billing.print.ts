import { formatCurrency } from '@/lib/utils/currency'
import type { BillingRecord } from './billing.types'

export function printInvoice(selected: BillingRecord) {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    const { client, items, payments, totalAmount, balance, createdAt, turnaroundDays, prescription } = selected
    const deposit = payments.find((p) => p.type === 'deposit')
    const designation = items.map((i) => `${i.productName}${i.brand ? ` (${i.brand})` : ''}`).join(', ')
    const promiseDate = turnaroundDays
        ? new Date(new Date(createdAt).getTime() + turnaroundDays * 86400000).toLocaleDateString('fr-TN', { day: 'numeric', month: 'numeric', year: 'numeric' })
        : ''
    const isDirectSale = selected.orderType === 'direct_sale'
    const rxRows = !isDirectSale && prescription
        ? `
          <tr><td class="cell-label">OD</td><td class="cell">${prescription.sphRight}</td><td class="cell">${prescription.cylRight}</td><td class="cell">${prescription.axisRight}</td><td class="cell">${prescription.addRight}</td><td class="cell">${prescription.pdRight}</td><td class="cell"></td></tr>
          <tr><td class="cell-label">OG</td><td class="cell">${prescription.sphLeft}</td><td class="cell">${prescription.cylLeft}</td><td class="cell">${prescription.axisLeft}</td><td class="cell">${prescription.addLeft}</td><td class="cell">${prescription.pdLeft}</td><td class="cell"></td></tr>`
        : ''

    const origin = window.location.origin
    const logoHtml = '<img src="' + origin + '/logo.png" alt="Sofiene Optic" class="logo-img" />'

    function half(side: 'shop' | 'client') {
        const isShop = side === 'shop'
        const metaRows = '<div class="field-row"><span class="label">N &amp; P:</span><span class="dots"></span><span class="value">' + client.name + ' ' + client.familyName + '</span></div>' +
            '<div class="field-row"><span class="label">N de Tel:</span><span class="dots"></span><span class="value">' + client.phone + '</span></div>' +
            '<div class="field-row des-field"><span class="label">Designation:</span></div>'
        const desField = '<div class="des-value">' + (designation || '&mdash;') + '</div>'
        const finRows = '<div class="field-row"><span class="label">Prix:</span><span class="dots"></span><span class="value">' + formatCurrency(totalAmount) + '</span></div>' +
            '<div class="field-row"><span class="label">Acompte:</span><span class="dots"></span><span class="value">' + (deposit ? formatCurrency(deposit.amount) : '&mdash;') + '</span></div>' +
            '<div class="field-row"><span class="label">Reste:</span><span class="dots"></span><span class="value">' + formatCurrency(balance) + '</span></div>' +
            '<div class="field-row"><span class="label">Date promise:</span><span class="dots"></span><span class="value">' + (promiseDate || '&mdash;') + '</span></div>'
        const rxTable = '<table class="rx-table">' +
            '<thead><tr><th style="width:12%">OD/OG</th><th style="width:14%">Sph</th><th style="width:14%">Cyl</th><th style="width:14%">Axe</th><th style="width:14%">Add</th><th style="width:16%">Ep</th><th style="width:16%">H</th></tr></thead>' +
            '<tbody>' + (rxRows || '<tr><td colspan="7" style="padding:10px;text-align:center;color:#999;font-size:10px">Aucune ordonnance</td></tr>') + '</tbody></table>'
        const clientCrm = '<div class="crm-box filled">' +
            '<div class="crm-row"><span class="crm-label">Adresse:</span><span class="crm-fill">Rue de la liberte M&rsquo;himidia en face Ooredoo</span></div>' +
            '<div class="crm-row"><span class="crm-label">Tel 2:</span><span class="crm-fill">24.398.692 &mdash; 24.248.632</span></div>' +
            '<div class="crm-row"><span class="crm-label">Facebook:</span><span class="crm-fill">sofien optic</span></div></div>'
        return '<div class="half ' + side + '">' +
            logoHtml +
            '<div class="grid-2col"><div class="gcol">' + metaRows + desField + '</div><div class="gcol">' + finRows + '</div></div>' +
            (isShop ? rxTable : '') +
            (isShop ? '' : clientCrm) +
            '</div>'
    }

    printWindow.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Facture</title>
        <style>
            *{margin:0;padding:0;box-sizing:border-box}
            body{font-family:'Segoe UI',Arial,sans-serif;color:#000;width:776px;height:220px;overflow:hidden}
            .receipt{display:flex;width:100%;height:100%}
            .half{flex:1;padding:5px 10px;display:flex;flex-direction:column;gap:2px;overflow:hidden}
            .half.shop{border-right:2px dashed #999}
            .header{text-align:center;padding:1px 0}
            .logo-img{max-width:120px;max-height:32px;object-fit:contain}
            .field-row{display:flex;align-items:baseline;margin-bottom:1px;font-size:9px}
            .field-row .label{font-weight:600;white-space:nowrap;min-width:55px;flex-shrink:0}
            .field-row .dots{flex:1;border-bottom:1px dotted #999;margin:0 2px;height:1em;min-width:6px}
            .field-row .value{font-weight:500;white-space:nowrap;font-size:9px}
            .field-row.des-field .label{font-size:9px}
            .des-value{font-size:8px;line-height:1.2;word-break:break-word;color:#333;padding:1px 3px;background:#f9f9f9;border-radius:1px;margin-bottom:1px}
            .grid-2col{display:flex;gap:6px;flex:1;min-height:0}
            .grid-2col .gcol{flex:1;display:flex;flex-direction:column;gap:0}
            .rx-table{width:100%;border-collapse:collapse;font-size:9px}
            .rx-table th{padding:2px 2px;text-align:center;font-weight:600;border:1px solid #000;background:#f5f5f5;font-size:8px}
            .rx-table td{padding:2px 2px;text-align:center;border:1px solid #000}
            .rx-table .cell-label{font-weight:600}
            .crm-box{border-top:1.5px solid #37b34a;padding-top:2px;margin-top:auto}
            .crm-box.filled{border-color:#37b34a;background:#f0faf0;padding:3px 4px;border-radius:2px}
            .crm-row{display:flex;align-items:baseline;margin-bottom:1px;font-size:8px}
            .crm-label{font-weight:600;min-width:50px;white-space:nowrap;flex-shrink:0}
            .crm-line{flex:1;border-bottom:1px solid #999;height:1em;margin-left:2px}
            .crm-fill{font-weight:500;margin-left:2px}
</style></head><body>
        <div class="receipt">
            ${half('shop')}
            ${half('client')}
        </div>
        </body></html>`)
    printWindow.document.close()
    setTimeout(() => printWindow.print(), 500)
}

export function printReport(
    reportData: BillingRecord[],
    reportPeriod: string,
    typeLabel: (t: string) => string,
) {
    if (!reportData.length) return
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    const periodLabel = reportPeriod === 'today' ? 'Today' : reportPeriod === 'week' ? 'This Week' : 'This Month'
    const totals = reportData.reduce(
        (acc, r) => ({ revenue: acc.revenue + parseFloat(r.totalAmount), paid: acc.paid + parseFloat(r.totalPaid), count: acc.count + 1 }),
        { revenue: 0, paid: 0, count: 0 }
    )
    const orderRows = reportData.map((r) =>
        `<tr><td style="padding:6px 10px">#${r.orderNumber}</td><td style="padding:6px 10px">${r.client.name} ${r.client.familyName}</td><td style="padding:6px 10px">${typeLabel(r.orderType)}</td><td style="padding:6px 10px;text-align:right">${formatCurrency(r.totalAmount)}</td><td style="padding:6px 10px;text-align:right">${formatCurrency(r.totalPaid)}</td></tr>`
    ).join('')
    printWindow.document.write(`<!DOCTYPE html><html><head><title>Report ${periodLabel} — Sofien Optic</title>
        <style>
            *{margin:0;padding:0;box-sizing:border-box}
            body{font-family:'Segoe UI',Arial,sans-serif;max-width:800px;margin:0 auto;padding:32px 24px;color:#1a1a2e}
            .header{display:flex;align-items:center;gap:16px;margin-bottom:24px;padding-bottom:16px;border-bottom:3px solid #519651}
            .logo{width:40px;height:40px;background:#519651;border-radius:10px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:20px;font-weight:bold;flex-shrink:0}
            .shop-name{font-size:20px;font-weight:700;color:#519651}
            h2{font-size:16px;margin-bottom:16px;color:#555}
            table{width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px}
            th{background:#519651;color:#fff;padding:8px 10px;text-align:left;font-weight:600}
            td{padding:8px 10px;border-bottom:1px solid #e8e8e8}
            .summary{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px}
            .summary-card{padding:16px;border-radius:8px;text-align:center}
            .summary-card .value{font-size:20px;font-weight:700;margin-top:4px}
            .summary-card.revenue{background:#f0f9f0;border:1px solid #c8e6c9;color:#519651}
            .summary-card.paid{background:#f0f4ff;border:1px solid #c8d6f0;color:#2563eb}
            .summary-card.count{background:#fef3e6;border:1px solid #fde0c0;color:#d97706}
            .footer{text-align:center;margin-top:24px;padding-top:12px;border-top:1px solid #e0e0e0;font-size:11px;color:#999}
            @media print{button{display:none}}
</style></head><body>
        <div class="header">
            <div class="logo">SO</div>
            <div><div class="shop-name">Sofien Optic</div></div>
        </div>
        <h2>Report — ${periodLabel}</h2>
        <div class="summary">
            <div class="summary-card revenue"><div>Revenue</div><div class="value">${formatCurrency(totals.revenue.toFixed(3))}</div></div>
            <div class="summary-card paid"><div>Collected</div><div class="value">${formatCurrency(totals.paid.toFixed(3))}</div></div>
            <div class="summary-card count"><div>Orders</div><div class="value">${totals.count}</div></div>
        </div>
        <table><thead><tr><th>#</th><th>Client</th><th>Type</th><th>Total</th><th>Paid</th></tr></thead><tbody>${orderRows}</tbody></table>
        <div class="footer">Sofien Optic — Report generated ${new Date().toLocaleDateString('en-US')}</div>
        </body></html>`)
    printWindow.document.close()
    setTimeout(() => printWindow.print(), 300)
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
}
