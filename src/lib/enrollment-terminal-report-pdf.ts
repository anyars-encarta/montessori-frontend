import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import type { ClassEnrollmentOverviewRow, SchoolDetailsRecord } from "@/types";

type PdfMode = "download" | "print";

type GenerateEnrollmentReportPdfOptions = {
  mode?: PdfMode;
  filename?: string;
  autoClosePrintWindow?: boolean;
};

const mm = (value: number) => value;

const toDisplay = (value?: string | number | null) => {
  if (value === null || value === undefined) return "N/A";
  const text = String(value).trim();
  return text.length ? text : "N/A";
};

const formatDate = (value?: string | null) => {
  if (!value) return "N/A";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "N/A" : date.toLocaleDateString();
};

const sanitizeFilePart = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

const loadImageAsDataUrl = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(url, { mode: "cors" });
    if (!response.ok) return null;

    const blob = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Unable to read image"));
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

const maybeAddLogo = async (
  doc: jsPDF,
  school: SchoolDetailsRecord | null,
  startX: number,
  startY: number,
) => {
  const logoUrl = school?.logo?.trim();
  if (!logoUrl) return false;

  const dataUrl = await loadImageAsDataUrl(logoUrl);
  if (!dataUrl) return false;

  doc.addImage(dataUrl, "PNG", startX, startY, mm(20), mm(20));
  return true;
};

const openPrintWindow = (doc: jsPDF, autoClose = true) => {
  const pdfBlob = doc.output("blob");
  const objectUrl = URL.createObjectURL(pdfBlob);
  const popup = window.open("", "_blank", "noopener,noreferrer,width=1024,height=768");

  if (!popup) {
    URL.revokeObjectURL(objectUrl);
    throw new Error("Pop-up blocked. Please allow pop-ups and try again.");
  }

  popup.document.open();
  popup.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>Terminal Report</title>
        <style>
          html, body { margin: 0; padding: 0; height: 100%; }
          iframe { border: 0; width: 100%; height: 100%; }
        </style>
      </head>
      <body>
        <iframe src="${objectUrl}"></iframe>
        <script>
          const revoke = () => URL.revokeObjectURL("${objectUrl}");
          window.onafterprint = () => {
            revoke();
            ${autoClose ? "window.close();" : ""}
          };

          window.addEventListener("focus", () => {
            setTimeout(() => {
              if (${autoClose ? "!window.closed" : "false"}) {
                try { revoke(); } catch {}
                ${autoClose ? "window.close();" : ""}
              }
            }, 300);
          }, { once: true });

          setTimeout(() => window.print(), 350);
        </script>
      </body>
    </html>
  `);
  popup.document.close();
};

export const generateEnrollmentTerminalReportPdf = async (
  report: ClassEnrollmentOverviewRow,
  school: SchoolDetailsRecord | null,
  options: GenerateEnrollmentReportPdfOptions = {},
) => {
  const mode = options.mode ?? "print";
  const schoolName = school?.name?.trim() || "School";

  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pageWidth = doc.internal.pageSize.getWidth();

  const headerTop = mm(12);
  const logoAdded = await maybeAddLogo(doc, school, mm(12), headerTop);
  const textStartX = logoAdded ? mm(36) : mm(12);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(schoolName, textStartX, mm(19));

  const schoolLine = [school?.address, school?.phone, school?.email, school?.website]
    .map((part) => (part ?? "").trim())
    .filter(Boolean)
    .join(" | ");

  if (schoolLine) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(schoolLine, textStartX, mm(24));
  }

  doc.setDrawColor(31, 41, 55);
  doc.setLineWidth(0.4);
  doc.line(mm(12), mm(34), pageWidth - mm(12), mm(34));

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Student Terminal Report", mm(12), mm(42));

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  const infoRows = [
    ["Student", report.student.fullName],
    ["Registration", toDisplay(report.student.registrationNumber)],
    ["Class", `${toDisplay(report.class.name)} (${toDisplay(report.class.level)})`],
    ["Academic Year", toDisplay(report.academicYear.year)],
    ["Term", toDisplay(report.term.name)],
    ["Enrollment Date", formatDate(report.enrollmentDate)],
  ];

  let infoY = mm(50);
  for (const [label, value] of infoRows) {
    doc.setFont("helvetica", "bold");
    doc.text(`${label}:`, mm(12), infoY);
    doc.setFont("helvetica", "normal");
    doc.text(String(value), mm(42), infoY);
    infoY += mm(5.5);
  }

  const summaryTop = infoY + mm(3);
  const summaryWidth = (pageWidth - mm(24) - mm(8)) / 3;
  const summaryHeight = mm(13);

  const summaryItems: Array<[string, string]> = [
    ["Aggregate", toDisplay(report.aggregate)],
    ["Class Position", toDisplay(report.classPosition)],
    ["Remark", toDisplay(report.remarks)],
  ];

  summaryItems.forEach(([label, value], index) => {
    const x = mm(12) + index * (summaryWidth + mm(4));
    doc.setDrawColor(209, 213, 219);
    doc.setFillColor(249, 250, 251);
    doc.roundedRect(x, summaryTop, summaryWidth, summaryHeight, 1.2, 1.2, "FD");

    doc.setFont("helvetica", "normal");
    doc.setTextColor(75, 85, 99);
    doc.setFontSize(8);
    doc.text(label, x + mm(2.2), summaryTop + mm(4));

    doc.setTextColor(17, 24, 39);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(value, x + mm(2.2), summaryTop + mm(9));
  });

  autoTable(doc, {
    startY: summaryTop + summaryHeight + mm(6),
    theme: "grid",
    headStyles: {
      fillColor: [243, 244, 246],
      textColor: [17, 24, 39],
      fontStyle: "bold",
      lineColor: [209, 213, 219],
      lineWidth: 0.1,
      fontSize: 8,
    },
    styles: {
      font: "helvetica",
      fontSize: 8,
      textColor: [17, 24, 39],
      lineColor: [229, 231, 235],
      lineWidth: 0.1,
      cellPadding: 1.6,
    },
    bodyStyles: {
      valign: "middle",
    },
    head: [["Subject", "HW1", "HW2", "EX1", "EX2", "Test", "Class", "Exam", "Total", "Pos", "Remark"]],
    body:
      report.assessments.length > 0
        ? report.assessments.map((assessment) => [
            toDisplay(assessment.subjectName),
            toDisplay(assessment.homeWork1),
            toDisplay(assessment.homeWork2),
            toDisplay(assessment.exercise1),
            toDisplay(assessment.exercise2),
            toDisplay(assessment.classTest),
            toDisplay(assessment.classMark),
            toDisplay(assessment.examMark),
            toDisplay(assessment.totalMark),
            toDisplay(assessment.subjectPosition),
            toDisplay(assessment.remarks),
          ])
        : [["No assessments found for this enrollment.", "", "", "", "", "", "", "", "", "", ""]],
    columnStyles: {
      0: { cellWidth: 36 },
      10: { cellWidth: 24 },
    },
    margin: { left: 12, right: 12 },
  });

  const finalY = (doc as jsPDF & { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? 265;
  const generatedAt = new Date().toLocaleString();

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text(`Generated on ${generatedAt}`, mm(12), Math.min(finalY + mm(8), 286));

  if (mode === "download") {
    const fallbackFile = `terminal-report-${sanitizeFilePart(report.student.fullName)}-${report.id}.pdf`;
    doc.save(options.filename ?? fallbackFile);
    return;
  }

  openPrintWindow(doc, options.autoClosePrintWindow ?? true);
};
