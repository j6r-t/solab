import { formatCurrency } from '@/lib/utils/currency'
import { effectivePaymentTotal, pendingInstrumentTotal } from '@/lib/utils/payments'
import type { BillingRecord } from './billing.types'

function formatDateFr(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('fr-TN', { day: 'numeric', month: 'numeric', year: 'numeric' })
}

export function printFacture(selected: BillingRecord) {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    const { client, items, repairs, totalAmount, createdAt } = selected

    const lines = [
        ...items.map((i) => ({ designation: `${i.productName}${i.brand ? ` (${i.brand})` : ''}` || '—', quantity: i.quantity, unitPrice: parseFloat(i.unitPrice) })),
        ...repairs.map((r) => ({ designation: `Réparation — ${r.type}`, quantity: 1, unitPrice: parseFloat(r.price) })),
    ]
    const grandTotal = lines.length
        ? lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0)
        : parseFloat(totalAmount)
    const lineRows = lines.map((l) =>
        `<tr><td>${l.designation}</td><td class="center">${l.quantity}</td><td class="right">${formatCurrency(l.unitPrice.toFixed(3))}</td><td class="right">${formatCurrency((l.quantity * l.unitPrice).toFixed(3))}</td></tr>`
    ).join('')

    const origin = window.location.origin
    const logoHtml = '<img src="' + origin + '/logo.png" alt="Sofiene Optic" class="logo-img" />'

    printWindow.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title></title>
        <style>
            *{margin:0;padding:0;box-sizing:border-box}
            body{font-family:'Segoe UI',Arial,sans-serif;max-width:800px;margin:0 auto;padding:32px 24px;color:#1a1a2e;font-size:16px}
            .header{display:flex;align-items:flex-start;gap:16px;margin-bottom:28px;padding-bottom:16px;border-bottom:3px solid #519651}
            .logo-img{max-width:140px;max-height:48px;object-fit:contain;flex-shrink:0}
            .shop-contact{font-size:13px;color:#777;margin-top:2px}
            .doc-head{text-align:right;margin-left:auto}
            .doc-title{font-size:26px;font-weight:700;letter-spacing:1px}
            .doc-ref{font-size:15px;color:#555;margin-top:4px}
            .info-grid{display:flex;gap:24px;margin-bottom:28px;font-size:15px}
            .info-grid .col{flex:1}
            .info-row{display:flex;gap:8px;margin-bottom:6px}
            .info-row .label{font-weight:600;min-width:110px}
            table{width:100%;border-collapse:collapse;font-size:15px;margin-bottom:28px}
            th{background:#519651;color:#fff;padding:12px 14px;text-align:left;font-weight:600}
            td{padding:12px 14px;border-bottom:1px solid #e8e8e8}
            th.center,td.center{text-align:center}
            th.right,td.right{text-align:right}
            .totals{display:flex;flex-direction:column;align-items:flex-end;gap:6px;margin-bottom:24px;font-size:16px}
            .totals .grand-total-row{display:flex;gap:24px;font-size:19px;font-weight:700;color:#519651;border-top:2px solid #519651;padding-top:8px}
            .footer{text-align:center;margin-top:28px;padding-top:12px;border-top:1px solid #e0e0e0;font-size:13px;color:#999}
            @media print{body{padding:16px}}
</style></head><body>
        <div class="header">
            ${logoHtml}
            <div>
                <div class="shop-contact">Rue de la Liberte a cote Mosquee Omar ibn Elkhattab &mdash; 24.398.692 / 24.248.632</div>
            </div>
            <div class="doc-head">
                <div class="doc-title">FACTURE</div>
                <div class="doc-ref">N&deg; ${selected.orderNumber}</div>
            </div>
        </div>

        <div class="info-grid">
            <div class="col">
                <div class="info-row"><span class="label">Client:</span><span>${client.name} ${client.familyName}</span></div>
                <div class="info-row"><span class="label">T&eacute;l&eacute;phone:</span><span>${client.phone}</span></div>
                ${client.address ? `<div class="info-row"><span class="label">Adresse:</span><span>${client.address}</span></div>` : ''}
            </div>
            <div class="col">
                <div class="info-row"><span class="label">Date d&rsquo;achat:</span><span>${formatDateFr(createdAt)}</span></div>
                <div class="info-row"><span class="label">Facture N&deg;:</span><span>${selected.orderNumber}</span></div>
            </div>
        </div>

        <table>
            <thead>
                <tr><th>D&eacute;signation</th><th class="center">Quantit&eacute;</th><th class="right">Prix unitaire</th><th class="right">Total</th></tr>
            </thead>
            <tbody>${lineRows}</tbody>
        </table>

        <div class="totals">
            <div class="grand-total-row"><span>Total g&eacute;n&eacute;ral:</span><span>${formatCurrency(grandTotal.toFixed(3))}</span></div>
        </div>

        <div class="footer">
            Sofien Optic &mdash; Rue de la Liberte a cote Mosquee Omar ibn Elkhattab &mdash; 24.398.692 / 24.248.632
        </div>
        </body></html>`)
    printWindow.document.close()
    printWindow.document.title = ''
    setTimeout(() => printWindow.print(), 500)
}

export function printRecu(selected: BillingRecord) {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    const { client, items, payments, totalAmount, createdAt, turnaroundDays, prescription } = selected
    const designation = items.map((i) => `${i.productName}${i.brand ? ` (${i.brand})` : ''}`).join(', ')
    const paidTotal = effectivePaymentTotal(payments, 'client')
    const pendingTotal = pendingInstrumentTotal(payments, 'client')
    const reste = parseFloat(totalAmount) - paidTotal
    const promiseDate = turnaroundDays
        ? new Date(new Date(createdAt).getTime() + turnaroundDays * 86400000).toLocaleDateString('fr-TN', { day: 'numeric', month: 'numeric', year: 'numeric' })
        : ''
    const purchaseDate = formatDateFr(createdAt)
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
            '<div class="field-row"><span class="label">Date d\'achat:</span><span class="dots"></span><span class="value">' + purchaseDate + '</span></div>' +
            '<div class="field-row des-field"><span class="label">Designation:</span></div>'
        const desField = '<div class="des-value">' + (designation || '&mdash;') + '</div>'
        const finRows = '<div class="field-row"><span class="label">Prix:</span><span class="dots"></span><span class="value">' + formatCurrency(totalAmount) + '</span></div>' +
            '<div class="field-row"><span class="label">Acompte:</span><span class="dots"></span><span class="value">' + (paidTotal > 0 ? formatCurrency(paidTotal.toFixed(3)) : '&mdash;') + '</span></div>' +
            (pendingTotal > 0 ? '<div class="field-row"><span class="label">En attente (ch&egrave;que/traite):</span><span class="dots"></span><span class="value">' + formatCurrency(pendingTotal.toFixed(3)) + '</span></div>' : '') +
            '<div class="field-row"><span class="label">Reste:</span><span class="dots"></span><span class="value">' + formatCurrency(reste.toFixed(3)) + '</span></div>' +
            '<div class="field-row"><span class="label">Date promise:</span><span class="dots"></span><span class="value">' + (promiseDate || '&mdash;') + '</span></div>'
        const rxTable = '<table class="rx-table">' +
            '<thead><tr><th style="width:12%">OD/OG</th><th style="width:14%">Sph</th><th style="width:14%">Cyl</th><th style="width:14%">Axe</th><th style="width:14%">Add</th><th style="width:16%">Ep</th><th style="width:16%">H</th></tr></thead>' +
            '<tbody>' + (rxRows || '<tr><td colspan="7" style="padding:8px;text-align:center;color:#999;font-size:12px">Aucune ordonnance</td></tr>') + '</tbody></table>'
        const clientCrm = '<div class="crm-box filled">' +
            '<div class="crm-row"><span class="crm-label">Adresse:</span><span class="crm-fill">Rue de la Liberte a cote Mosquee Omar ibn Elkhattab</span></div>' +
            '<div class="crm-row"><span class="crm-label">Tel 2:</span><span class="crm-fill">24.398.692 &mdash; 24.248.632</span></div>' +
            '<div class="crm-row"><span class="crm-label">Facebook:</span><span class="crm-fill">sofien optic</span></div></div>'
        return '<div class="half ' + side + '">' +
            logoHtml +
            '<div class="grid-2col"><div class="gcol">' + metaRows + desField + '</div><div class="gcol">' + finRows + '</div></div>' +
            (isShop ? rxTable : '') +
            (isShop ? '' : clientCrm) +
            '</div>'
    }

    printWindow.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title></title>
        <style>
            *{margin:0;padding:0;box-sizing:border-box}
            body{font-family:'Segoe UI',Arial,sans-serif;color:#000;width:800px;overflow:hidden;font-size:14px}
            .receipt{display:flex;width:100%}
            .half{flex:1;padding:10px 14px;display:flex;flex-direction:column;gap:4px;overflow:hidden}
            .half.shop{border-right:2px dashed #999}
            .header{text-align:center;padding:2px 0}
            .logo-img{max-width:150px;max-height:44px;object-fit:contain}
            .field-row{display:flex;align-items:baseline;margin-bottom:3px;font-size:13px}
            .field-row .label{font-weight:600;white-space:nowrap;min-width:80px;flex-shrink:0}
            .field-row .dots{flex:1;border-bottom:1px dotted #999;margin:0 3px;height:1em;min-width:6px}
            .field-row .value{font-weight:500;white-space:nowrap;font-size:13px}
            .field-row.des-field .label{font-size:13px}
            .des-value{font-size:12px;line-height:1.3;word-break:break-word;color:#333;padding:2px 4px;background:#f9f9f9;border-radius:2px;margin-bottom:2px}
            .grid-2col{display:flex;gap:10px;flex:1;min-height:0}
            .grid-2col .gcol{flex:1;display:flex;flex-direction:column;gap:0}
            .rx-table{width:100%;border-collapse:collapse;font-size:13px}
            .rx-table th{padding:5px 4px;text-align:center;font-weight:600;border:1px solid #000;background:#f5f5f5;font-size:12px}
            .rx-table td{padding:5px 4px;text-align:center;border:1px solid #000}
            .rx-table .cell-label{font-weight:600}
            .crm-box{border-top:1.5px solid #37b34a;padding-top:4px;margin-top:auto}
            .crm-box.filled{border-color:#37b34a;background:#f0faf0;padding:5px 6px;border-radius:2px}
            .crm-row{display:flex;align-items:baseline;margin-bottom:2px;font-size:12px}
            .crm-label{font-weight:600;min-width:70px;white-space:nowrap;flex-shrink:0}
            .crm-line{flex:1;border-bottom:1px solid #999;height:1em;margin-left:2px}
            .crm-fill{font-weight:500;margin-left:2px}
</style></head><body>
        <div class="receipt">
            ${half('shop')}
            ${half('client')}
        </div>
        </body></html>`)
    printWindow.document.close()
    printWindow.document.title = ''
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
    const totals = reportData.reduce(
        (acc, r) => ({ revenue: acc.revenue + parseFloat(r.totalAmount), paid: acc.paid + parseFloat(r.totalPaid), count: acc.count + 1 }),
        { revenue: 0, paid: 0, count: 0 }
    )
    const orderRows = reportData.map((r) =>
        `<tr><td style="padding:10px 12px">#${r.orderNumber}</td><td style="padding:10px 12px">${r.client.name} ${r.client.familyName}</td><td style="padding:10px 12px">${typeLabel(r.orderType)}</td><td style="padding:10px 12px;text-align:right">${formatCurrency(r.totalAmount)}</td><td style="padding:10px 12px;text-align:right">${formatCurrency(r.totalPaid)}</td></tr>`
    ).join('')

    const origin = window.location.origin
    const logoHtml = '<img src="' + origin + '/logo.png" alt="Sofiene Optic" class="logo-img" />'
    printWindow.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title></title>
        <style>
            *{margin:0;padding:0;box-sizing:border-box}
            body{font-family:'Segoe UI',Arial,sans-serif;max-width:800px;margin:0 auto;padding:32px 24px;color:#1a1a2e;font-size:15px}
            .header{display:flex;align-items:center;gap:16px;margin-bottom:24px;padding-bottom:16px;border-bottom:3px solid #519651}
            .logo-img{max-width:140px;max-height:48px;object-fit:contain;flex-shrink:0}
            .shop-name{font-size:24px;font-weight:700;color:#519651}
            table{width:100%;border-collapse:collapse;font-size:15px;margin-bottom:24px}
            th{background:#519651;color:#fff;padding:10px 12px;text-align:left;font-weight:600}
            td{border-bottom:1px solid #e8e8e8}
            .summary{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px}
            .summary-card{padding:16px;border-radius:8px;text-align:center}
            .summary-card .value{font-size:22px;font-weight:700;margin-top:4px}
            .summary-card.revenue{background:#f0f9f0;border:1px solid #c8e6c9;color:#519651}
            .summary-card.paid{background:#f0f4ff;border:1px solid #c8d6f0;color:#2563eb}
            .summary-card.count{background:#fef3e6;border:1px solid #fde0c0;color:#d97706}
            .footer{text-align:center;margin-top:24px;padding-top:12px;border-top:1px solid #e0e0e0;font-size:13px;color:#999}
            @media print{button{display:none}}
</style></head><body>
        <div class="header">
            ${logoHtml}
            <div><div class="shop-name">Sofien Optic</div></div>
        </div>
        <div class="summary">
            <div class="summary-card revenue"><div>Revenue</div><div class="value">${formatCurrency(totals.revenue.toFixed(3))}</div></div>
            <div class="summary-card paid"><div>Collected</div><div class="value">${formatCurrency(totals.paid.toFixed(3))}</div></div>
            <div class="summary-card count"><div>Orders</div><div class="value">${totals.count}</div></div>
        </div>
        <table><thead><tr><th>#</th><th>Client</th><th>Type</th><th>Total</th><th>Paid</th></tr></thead><tbody>${orderRows}</tbody></table>
        <div class="footer">Sofien Optic</div>
        </body></html>`)
    printWindow.document.close()
    printWindow.document.title = ''
    setTimeout(() => printWindow.print(), 300)
}
