import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import type {
  ClassEnrollmentOverviewRow,
  GenerateEnrollmentReportPdfOptions,
  SchoolDetailsRecord,
  StudentFeeRow,
  StudentPaymentRow,
  StudentPdfContext,
} from "@/types";

const mm = (value: number) => value;

const toDisplay = (value?: string | number | null) => {
  if (value === null || value === undefined) return "N/A";
  const text = String(value).trim();
  return text.length ? text : "N/A";
};

const formatDate = (value?: string | null) => {
  if (!value) return "N/A";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "N/A"
    : date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
};

const sanitizeFilePart = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

const parseClassLevelNumber = (level: string) => {
  const match = level.match(/(\d+)/);
  if (!match) return null;
  const parsed = Number.parseInt(match[1] ?? "", 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const getRemarkLegendRows = (classLevel: string) => {
  const levelNumber = parseClassLevelNumber(classLevel);
  const isUpperClass = levelNumber !== null && levelNumber > 6;

  if (isUpperClass) {
    return {
      title: "LEGEND",
      rows: [
        "90 - 100 : EXCELLENT",
        "80 - 89 : VERY GOOD",
        "70 - 79 : HIGH",
        "60 - 69 : HIGH AVERAGE",
        "55 - 59 : AVERAGE",
        "50 - 54 : LOW AVERAGE",
        "40 - 49 : LOW",
        "35 - 39 : CREDIT",
        "0 - 34 : FAIL",
      ],
    };
  }

  return {
    title: "LEGEND",
    rows: [
      "90 - 100 : HIGHEST",
      "85 - 89 : HIGHER",
      "80 - 84 : HIGH",
      "75 - 79 : HIGH AVERAGE",
      "70 - 74 : AVERAGE",
      "65 - 69 : LOW AVERAGE",
      "60 - 64 : LOW",
      "50 - 59 : LOWER",
      "0 - 49 : LOWEST",
    ],
  };
};

const addRemarkLegend = (
  doc: jsPDF,
  classLevel: string,
  startY: number,
) => {
  const pageHeight = doc.internal.pageSize.getHeight();
  const availableBottom = pageHeight - mm(14);
  const legend = getRemarkLegendRows(classLevel);
  const rowHeight = mm(3.7);
  const headingHeight = mm(4.5);
  const requiredHeight = headingHeight + rowHeight * legend.rows.length + mm(2);

  let y = startY;

  if (y + requiredHeight > availableBottom) {
    doc.addPage();
    y = mm(18);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(31, 41, 55);
  doc.text(legend.title, mm(12), y);

  let lineY = y + mm(4);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(55, 65, 81);

  legend.rows.forEach((line) => {
    doc.text(line, mm(12), lineY);
    lineY += rowHeight;
  });
};

const addPdfFooter = (doc: jsPDF) => {
  const generatedAt = new Date().toLocaleString();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const footerText = "Software by Encarta Networks & Multimedia - +233 24 211 9972 / +233 20 259 4960, anyarsencarta@gmail.com";
  const generatedY = pageHeight - mm(8);
  const attributionY = pageHeight - mm(3.5);
  const separatorY = pageHeight - mm(11);

  doc.setDrawColor(209, 213, 219);
  doc.setLineWidth(0.2);
  doc.line(mm(12), separatorY, pageWidth - mm(12), separatorY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text(`Generated on ${generatedAt}`, mm(12), generatedY);
  doc.text(footerText, pageWidth / 2, attributionY, { align: "center" });
};

const drawSchoolName = (doc: jsPDF, text: string, x: number, y: number) => {
  doc.setFont("times", "bold");
  doc.setFontSize(18);
  doc.text(text.toUpperCase(), x, y);
};

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

const openPrintWindow = (
  doc: jsPDF,
  autoClose = true,
  existingWindow?: Window | null,
) => {
  const pdfBlob = doc.output("blob");
  const objectUrl = URL.createObjectURL(pdfBlob);
  const popup =
    existingWindow ??
    window.open("", "_blank", "width=1024,height=768");

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
        <meta charset="UTF-8" />
        <style>
          html, body { margin: 0; padding: 0; height: 100%; width: 100%; }
          #pdf-embed { border: 0; width: 100%; height: 100%; display: block; }
        </style>
      </head>
      <body>
        <embed id="pdf-embed" type="application/pdf" />
        <script>
          const objectUrl = "${objectUrl}";
          const revoke = () => {
            try { URL.revokeObjectURL(objectUrl); } catch {}
          };
          const embedEl = document.getElementById("pdf-embed");
          embedEl.src = objectUrl;
          
          window.onafterprint = () => {
            revoke();
            ${autoClose ? "window.close();" : ""}
          };

          window.addEventListener("focus", () => {
            setTimeout(() => {
              if (${autoClose ? "!window.closed" : "false"}) {
                revoke();
                ${autoClose ? "window.close();" : ""}
              }
            }, 300);
          }, { once: true });

          setTimeout(() => window.print(), 500);
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

  drawSchoolName(doc, schoolName, textStartX, mm(19));

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
  doc.setFontSize(14);
  doc.text("Student Terminal Report", mm(12), mm(42));

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  const leftInfoRows = [
    ["Student", report.student.fullName],
    ["Registration", toDisplay(report.student.registrationNumber)],
    ["Class", `${toDisplay(report.class.name)} (${toDisplay(report.class.level)})`],
  ];

  const rightInfoRows = [
    ["Academic Year", toDisplay(report.academicYear.year)],
    ["Term", toDisplay(report.term.name)],
    ["Enrollment Date", formatDate(report.enrollmentDate)],
  ];

  let infoY = mm(50);
  for (let i = 0; i < 3; i += 1) {
    const [leftLabel, leftValue] = leftInfoRows[i] ?? ["", ""];
    const [rightLabel, rightValue] = rightInfoRows[i] ?? ["", ""];

    doc.setFont("helvetica", "bold");
    doc.text(`${leftLabel}:`, mm(12), infoY);
    doc.setFont("helvetica", "normal");
    doc.text(String(leftValue), mm(48), infoY);

    doc.setFont("helvetica", "bold");
    doc.text(`${rightLabel}:`, mm(108), infoY);
    doc.setFont("helvetica", "normal");
    doc.text(String(rightValue), mm(148), infoY);

    infoY += mm(5.5);
  }

  const leftExtraRows = [
    ["No. on Roll", toDisplay(report.class.capacity)],
    ["Attendance", toDisplay(report.attendance)],
  ];

  const rightExtraRows = [
    ["School Vacates On", formatDate(report.term.endDate)],
    ["Next Term Begins", formatDate(report.term.nextTermStartDate)],
  ];

  for (let i = 0; i < 2; i += 1) {
    const [leftLabel, leftValue] = leftExtraRows[i] ?? ["", ""];
    const [rightLabel, rightValue] = rightExtraRows[i] ?? ["", ""];

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(17, 24, 39);
    doc.text(`${leftLabel}:`, mm(12), infoY);
    doc.setFont("helvetica", "normal");
    doc.text(String(leftValue), mm(48), infoY);

    doc.setFont("helvetica", "bold");
    doc.text(`${rightLabel}:`, mm(108), infoY);
    doc.setFont("helvetica", "normal");
    doc.text(String(rightValue), mm(148), infoY);

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
    head: [["Subject", "Class (30%)", "Exam (70%)", "Total (100%)", "Grade", "Position", "Remark"]],
    body:
      report.assessments.length > 0
        ? report.assessments.map((assessment) => [
            toDisplay(assessment.subjectName),
            toDisplay(assessment.classMark),
            toDisplay(assessment.examMark),
            toDisplay(assessment.totalMark),
            toDisplay(assessment.grade),
            toDisplay(assessment.subjectPosition),
            toDisplay(assessment.remarks),
          ])
        : [["No assessments found for this enrollment.", "", "", "", "", "", ""]],
    columnStyles: {
      0: { cellWidth: 36 },
      6: { cellWidth: 32 },
    },
    margin: { left: 12, right: 12 },
  });

  const singleReportTableEndY =
    (doc as jsPDF & { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ??
    summaryTop + summaryHeight + mm(40);
  addRemarkLegend(doc, report.class.level, singleReportTableEndY + mm(6));

  addPdfFooter(doc);

  if (mode === "download") {
    const fallbackFile = `terminal-report-${sanitizeFilePart(report.student.fullName)}-${report.id}.pdf`;
    doc.save(options.filename ?? fallbackFile);
    return;
  }

  openPrintWindow(
    doc,
    options.autoClosePrintWindow ?? true,
    options.printWindow,
  );
};

export const generateStudentFeeReportPdf = async (
  fee: StudentFeeRow,
  student: StudentPdfContext,
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
  doc.text("Student Fee Report", mm(12), mm(42));

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Student: ${student.fullName}`, mm(12), mm(50));
  doc.text(`Registration: ${toDisplay(student.registrationNumber)}`, mm(12), mm(56));

  const amount = Number.parseFloat(fee.amount ?? "0");
  const paid = Number.parseFloat(fee.amountPaid ?? "0");
  const remaining = Math.max(amount - paid, 0);

  autoTable(doc, {
    startY: mm(64),
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
      fontSize: 9,
      textColor: [17, 24, 39],
      lineColor: [229, 231, 235],
      lineWidth: 0.1,
      cellPadding: 2,
    },
    head: [["Fee", "Academic Year", "Term", "Due Date", "Amount", "Paid", "Remaining", "Status"]],
    body: [[
      toDisplay(fee.feeName),
      toDisplay(fee.academicYear),
      toDisplay(fee.term),
      formatDate(fee.dueDate),
      toDisplay(fee.amount),
      toDisplay(fee.amountPaid),
      remaining.toFixed(2),
      toDisplay(fee.status),
    ]],
    margin: { left: 12, right: 12 },
  });

  addPdfFooter(doc);

  if (mode === "download") {
    const fallbackFile = `fee-report-${sanitizeFilePart(student.fullName)}-${fee.id}.pdf`;
    doc.save(options.filename ?? fallbackFile);
    return;
  }

  openPrintWindow(
    doc,
    options.autoClosePrintWindow ?? true,
    options.printWindow,
  );
};

export const generateStudentPaymentReportPdf = async (
  payment: StudentPaymentRow,
  student: StudentPdfContext,
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
  doc.text("Student Payment Report", mm(12), mm(42));

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Student: ${student.fullName}`, mm(12), mm(50));
  doc.text(`Registration: ${toDisplay(student.registrationNumber)}`, mm(12), mm(56));

  autoTable(doc, {
    startY: mm(64),
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
      fontSize: 9,
      textColor: [17, 24, 39],
      lineColor: [229, 231, 235],
      lineWidth: 0.1,
      cellPadding: 2,
    },
    head: [["Fee", "Method", "Payment Date", "Reference", "Amount", "Status"]],
    body: [[
      toDisplay(payment.feeName),
      toDisplay(payment.paymentMethod),
      formatDate(payment.paymentDate),
      toDisplay(payment.reference),
      toDisplay(payment.amount),
      toDisplay(payment.status),
    ]],
    margin: { left: 12, right: 12 },
  });

  addPdfFooter(doc);

  if (mode === "download") {
    const fallbackFile = `payment-report-${sanitizeFilePart(student.fullName)}-${payment.id}.pdf`;
    doc.save(options.filename ?? fallbackFile);
    return;
  }

  openPrintWindow(
    doc,
    options.autoClosePrintWindow ?? true,
    options.printWindow,
  );
};

export const generateStudentFeesReportPdf = async (
  fees: StudentFeeRow[],
  student: StudentPdfContext,
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
  doc.text("Student Fees Report", mm(12), mm(42));

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Student: ${student.fullName}`, mm(12), mm(50));
  doc.text(`Registration: ${toDisplay(student.registrationNumber)}`, mm(12), mm(56));

  autoTable(doc, {
    startY: mm(64),
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
      cellPadding: 1.8,
    },
    head: [["Fee", "Academic Year", "Term", "Due Date", "Amount", "Paid", "Remaining", "Status"]],
    body:
      fees.length > 0
        ? fees.map((fee) => {
            const amount = Number.parseFloat(fee.amount ?? "0");
            const paid = Number.parseFloat(fee.amountPaid ?? "0");
            const remaining = Math.max(amount - paid, 0);

            return [
              toDisplay(fee.feeName),
              toDisplay(fee.academicYear),
              toDisplay(fee.term),
              formatDate(fee.dueDate),
              toDisplay(fee.amount),
              toDisplay(fee.amountPaid),
              remaining.toFixed(2),
              toDisplay(fee.status),
            ];
          })
        : [["No fee records found.", "", "", "", "", "", "", ""]],
    margin: { left: 12, right: 12 },
  });

  addPdfFooter(doc);

  if (mode === "download") {
    const fallbackFile = `fees-report-${sanitizeFilePart(student.fullName)}.pdf`;
    doc.save(options.filename ?? fallbackFile);
    return;
  }

  openPrintWindow(
    doc,
    options.autoClosePrintWindow ?? true,
    options.printWindow,
  );
};

export const generateStudentPaymentsReportPdf = async (
  payments: StudentPaymentRow[],
  student: StudentPdfContext,
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
  doc.text("Student Payments Report", mm(12), mm(42));

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Student: ${student.fullName}`, mm(12), mm(50));
  doc.text(`Registration: ${toDisplay(student.registrationNumber)}`, mm(12), mm(56));

  autoTable(doc, {
    startY: mm(64),
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
      cellPadding: 1.8,
    },
    head: [["Fee", "Method", "Payment Date", "Reference", "Amount", "Status"]],
    body:
      payments.length > 0
        ? payments.map((payment) => [
            toDisplay(payment.feeName),
            toDisplay(payment.paymentMethod),
            formatDate(payment.paymentDate),
            toDisplay(payment.reference),
            toDisplay(payment.amount),
            toDisplay(payment.status),
          ])
        : [["No payment records found.", "", "", "", "", ""]],
    margin: { left: 12, right: 12 },
  });

  addPdfFooter(doc);

  if (mode === "download") {
    const fallbackFile = `payments-report-${sanitizeFilePart(student.fullName)}.pdf`;
    doc.save(options.filename ?? fallbackFile);
    return;
  }

  openPrintWindow(
    doc,
    options.autoClosePrintWindow ?? true,
    options.printWindow,
  );
};

export const generateStudentSummariesReportPdf = async (
  summaries: ClassEnrollmentOverviewRow[],
  student: StudentPdfContext,
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
  doc.text("Student Summaries Report", mm(12), mm(42));

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Student: ${student.fullName}`, mm(12), mm(50));
  doc.text(`Registration: ${toDisplay(student.registrationNumber)}`, mm(12), mm(56));

  autoTable(doc, {
    startY: mm(64),
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
      cellPadding: 1.8,
    },
    head: [["Class", "Academic Year", "Term", "Enrollment Date", "Aggregate", "Position", "Remark"]],
    body:
      summaries.length > 0
        ? summaries.map((summary) => [
            toDisplay(summary.class.name),
            toDisplay(summary.academicYear.year),
            toDisplay(summary.term.name),
            formatDate(summary.enrollmentDate),
            toDisplay(summary.aggregate),
            toDisplay(summary.classPosition),
            toDisplay(summary.remarks),
          ])
        : [["No enrollment summaries found.", "", "", "", "", "", ""]],
    margin: { left: 12, right: 12 },
  });

  addPdfFooter(doc);

  if (mode === "download") {
    const fallbackFile = `summaries-report-${sanitizeFilePart(student.fullName)}.pdf`;
    doc.save(options.filename ?? fallbackFile);
    return;
  }

  openPrintWindow(
    doc,
    options.autoClosePrintWindow ?? true,
    options.printWindow,
  );
};

export const generateClassEnrollmentSummariesReportPdf = async (
  summaries: ClassEnrollmentOverviewRow[],
  school: SchoolDetailsRecord | null,
  scopeLabel: string,
  options: GenerateEnrollmentReportPdfOptions = {},
) => {
  const mode = options.mode ?? "print";
  const schoolName = school?.name?.trim() || "School";

  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const schoolLine = [school?.address, school?.phone, school?.email, school?.website]
    .map((part) => (part ?? "").trim())
    .filter(Boolean)
    .join(" | ");

  if (summaries.length === 0) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const headerTop = mm(12);
    const logoAdded = await maybeAddLogo(doc, school, mm(12), headerTop);
    const textStartX = logoAdded ? mm(36) : mm(12);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(schoolName, textStartX, mm(19));

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
    doc.text("Class Terminal Reports", mm(12), mm(42));
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Filter: ${scopeLabel}`, mm(12), mm(50));
    doc.text("No students found for the selected filters.", mm(12), mm(58));

    addPdfFooter(doc);
  } else {
    for (let index = 0; index < summaries.length; index += 1) {
      const summary = summaries[index];

      if (index > 0) {
        doc.addPage();
      }

      const pageWidth = doc.internal.pageSize.getWidth();
      const headerTop = mm(12);
      const logoAdded = await maybeAddLogo(doc, school, mm(12), headerTop);
      const textStartX = logoAdded ? mm(36) : mm(12);

      drawSchoolName(doc, schoolName, textStartX, mm(19));

      if (schoolLine) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text(schoolLine, textStartX, mm(24));
      }

      doc.setDrawColor(31, 41, 55);
      doc.setLineWidth(0.4);
      doc.line(mm(12), mm(34), pageWidth - mm(12), mm(34));

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("Student Terminal Report", mm(12), mm(42));

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);

      const leftInfoRows = [
        ["Student", summary.student.fullName],
        ["Registration", toDisplay(summary.student.registrationNumber)],
        ["Class", `${toDisplay(summary.class.name)} (${toDisplay(summary.class.level)})`],
      ];

      const rightInfoRows = [
        ["Academic Year", toDisplay(summary.academicYear.year)],
        ["Term", toDisplay(summary.term.name)],
        ["Enrollment Date", formatDate(summary.enrollmentDate)],
      ];

      let infoY = mm(50);
      for (let i = 0; i < 3; i += 1) {
        const [leftLabel, leftValue] = leftInfoRows[i] ?? ["", ""];
        const [rightLabel, rightValue] = rightInfoRows[i] ?? ["", ""];

        doc.setFont("helvetica", "bold");
        doc.text(`${leftLabel}:`, mm(12), infoY);
        doc.setFont("helvetica", "normal");
        doc.text(String(leftValue), mm(48), infoY);

        doc.setFont("helvetica", "bold");
        doc.text(`${rightLabel}:`, mm(108), infoY);
        doc.setFont("helvetica", "normal");
        doc.text(String(rightValue), mm(148), infoY);

        infoY += mm(5.5);
      }

      const leftExtraRows = [
        ["No. on Roll", toDisplay(summary.class.capacity)],
        ["Attendance", toDisplay(summary.attendance)],
      ];

      const rightExtraRows = [
        ["School Vacates On", formatDate(summary.term.endDate)],
        ["Next Term Begins", formatDate(summary.term.nextTermStartDate)],
      ];

      for (let i = 0; i < 2; i += 1) {
        const [leftLabel, leftValue] = leftExtraRows[i] ?? ["", ""];
        const [rightLabel, rightValue] = rightExtraRows[i] ?? ["", ""];

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(17, 24, 39);
        doc.text(`${leftLabel}:`, mm(12), infoY);
        doc.setFont("helvetica", "normal");
        doc.text(String(leftValue), mm(48), infoY);

        doc.setFont("helvetica", "bold");
        doc.text(`${rightLabel}:`, mm(108), infoY);
        doc.setFont("helvetica", "normal");
        doc.text(String(rightValue), mm(148), infoY);

        infoY += mm(5.5);
      }

      const summaryTop = infoY + mm(3);
      const summaryWidth = (pageWidth - mm(24) - mm(8)) / 3;
      const summaryHeight = mm(13);

      const summaryItems: Array<[string, string]> = [
        ["Aggregate", toDisplay(summary.aggregate)],
        ["Class Position", toDisplay(summary.classPosition)],
        // ["Remark", toDisplay(summary.remarks)],
      ];

      summaryItems.forEach(([label, value], itemIndex) => {
        const x = mm(12) + itemIndex * (summaryWidth + mm(4));
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
        head: [["Subject", "Class (30%)", "Exam (70%)", "Total (100%)", "Grade", "Position", "Remark"]],
        body:
          summary.assessments.length > 0
            ? summary.assessments.map((assessment) => [
                toDisplay(assessment.subjectName),
                toDisplay(assessment.classMark),
                toDisplay(assessment.examMark),
                toDisplay(assessment.totalMark),
                toDisplay(assessment.grade),
                toDisplay(assessment.subjectPosition),
                toDisplay(assessment.remarks),
              ])
            : [["No assessments found for this enrollment.", "", "", "", "", "", ""]],
        columnStyles: {
          0: { cellWidth: 36 },
          6: { cellWidth: 32 },
        },
        margin: { left: 12, right: 12 },
      });

      const classReportTableEndY =
        (doc as jsPDF & { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ??
        summaryTop + summaryHeight + mm(40);
      addRemarkLegend(doc, summary.class.level, classReportTableEndY + mm(6));

      addPdfFooter(doc);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(107, 114, 128);
      doc.text(`Filter: ${scopeLabel}`, pageWidth - mm(12), 286, { align: "right" });
    }
  }

  if (mode === "download") {
    const fallbackFile = `class-terminal-reports-${sanitizeFilePart(scopeLabel)}.pdf`;
    doc.save(options.filename ?? fallbackFile);
    return;
  }

  openPrintWindow(
    doc,
    options.autoClosePrintWindow ?? true,
    options.printWindow,
  );
};
