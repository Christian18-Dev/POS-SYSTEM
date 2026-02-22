import * as XLSX from 'xlsx-js-style'

export type ExcelSheetRow = Record<string, string | number | boolean | null | undefined>

export function exportToExcel(sheets: Record<string, ExcelSheetRow[]>, fileName: string) {
  const workbook = XLSX.utils.book_new()

  for (const [sheetName, rows] of Object.entries(sheets)) {
    const worksheet = XLSX.utils.json_to_sheet(rows)

    const rangeForWidth = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1')
    const minWidth = 10
    const maxWidth = 50
    const colWidths: Array<{ wch: number }> = []
    for (let c = rangeForWidth.s.c; c <= rangeForWidth.e.c; c++) {
      let best = minWidth
      for (let r = rangeForWidth.s.r; r <= rangeForWidth.e.r; r++) {
        const addr = XLSX.utils.encode_cell({ r, c })
        const cell = worksheet[addr]
        if (!cell || cell.v === undefined || cell.v === null) continue
        const text = String(cell.v)
        best = Math.max(best, Math.min(maxWidth, text.length + 2))
      }
      colWidths[c] = { wch: best }
    }
    worksheet['!cols'] = colWidths

    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1')
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c })
      const cell = worksheet[cellAddress]
      if (!cell) continue

      if (typeof cell.v === 'string') {
        cell.v = cell.v.toUpperCase()
      }

      ;(cell as any).s = {
        font: { bold: true },
        fill: { patternType: 'solid', fgColor: { rgb: 'F2F2F2' } },
        alignment: { vertical: 'center', horizontal: 'center' },
      }
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  }

  XLSX.writeFile(workbook, fileName)
}
