import ExcelJS from "exceljs";
import type { LateReportRow, OvertimeReportRow } from "@/types";
import { namaFileRekap } from "./time";

const RUPIAH = '"Rp"#,##0';

function setHeader(row: ExcelJS.Row, labels: string[]) {
  row.values = labels;
  row.font = { bold: true };
  row.alignment = { vertical: "middle" };
  row.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFEF3C7" },
    };
    cell.border = {
      bottom: { style: "thin", color: { argb: "FFD97706" } },
    };
  });
}

export async function buatExcelRekap(
  keterlambatan: LateReportRow[],
  lembur: OvertimeReportRow[],
): Promise<Blob> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Absensi Al Manna Bakery";
  wb.created = new Date();

  // Sheet 1: Keterlambatan
  const s1 = wb.addWorksheet("Keterlambatan");
  setHeader(s1.getRow(1), [
    "No",
    "Nama",
    "Jabatan",
    "Total Hari Hadir",
    "Total Hari Telat",
    "Total Menit Telat",
    "Total Jam Telat",
    "Denda Per Jam",
    "Total Menit Efektif",
    "Total Denda",
  ]);

  if (keterlambatan.length === 0) {
    s1.addRow(["Tidak ada data periode ini"]);
  } else {
    keterlambatan.forEach((r, i) => {
      const row = s1.addRow([
        i + 1,
        r.nama,
        r.jabatan,
        r.total_hari_hadir,
        r.total_hari_telat,
        r.total_menit_telat,
        r.total_jam_telat,
        r.tarif_denda_per_jam,
        r.total_menit_efektif,
        r.total_denda,
      ]);
      row.getCell(8).numFmt = RUPIAH;
      row.getCell(10).numFmt = RUPIAH;
    });
    const total = s1.addRow([
      "",
      "TOTAL",
      "",
      keterlambatan.reduce((n, r) => n + r.total_hari_hadir, 0),
      keterlambatan.reduce((n, r) => n + r.total_hari_telat, 0),
      keterlambatan.reduce((n, r) => n + r.total_menit_telat, 0),
      Math.round(keterlambatan.reduce((n, r) => n + r.total_jam_telat, 0) * 100) / 100,
      "",
      keterlambatan.reduce((n, r) => n + r.total_menit_efektif, 0),
      keterlambatan.reduce((n, r) => n + r.total_denda, 0),
    ]);
    total.font = { bold: true };
    total.getCell(10).numFmt = RUPIAH;
  }

  s1.columns.forEach((col, i) => {
    col.width = [6, 20, 14, 16, 16, 18, 15, 16, 18, 16][i] ?? 14;
  });
  s1.views = [{ state: "frozen", ySplit: 1 }];

  // Sheet 2: Lembur
  const s2 = wb.addWorksheet("Lembur");
  setHeader(s2.getRow(1), [
    "No",
    "Nama",
    "Jabatan",
    "Total Pengajuan Approved",
    "Total Jam",
    "Tarif Per Jam",
    "Total Nominal",
  ]);

  if (lembur.length === 0) {
    s2.addRow(["Tidak ada data periode ini"]);
  } else {
    lembur.forEach((r, i) => {
      const row = s2.addRow([
        i + 1,
        r.nama,
        r.jabatan,
        r.total_pengajuan_approved,
        r.total_jam,
        r.tarif_per_jam,
        r.total_nominal,
      ]);
      row.getCell(6).numFmt = RUPIAH;
      row.getCell(7).numFmt = RUPIAH;
    });
    const total = s2.addRow([
      "",
      "TOTAL",
      "",
      lembur.reduce((n, r) => n + r.total_pengajuan_approved, 0),
      Math.round(lembur.reduce((n, r) => n + r.total_jam, 0) * 100) / 100,
      "",
      lembur.reduce((n, r) => n + r.total_nominal, 0),
    ]);
    total.font = { bold: true };
    total.getCell(7).numFmt = RUPIAH;
  }

  s2.columns.forEach((col, i) => {
    col.width = [6, 20, 14, 24, 12, 16, 18][i] ?? 14;
  });
  s2.views = [{ state: "frozen", ySplit: 1 }];

  const buffer = await wb.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

export function unduhBlob(blob: Blob, namaFile: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = namaFile;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export { namaFileRekap };
