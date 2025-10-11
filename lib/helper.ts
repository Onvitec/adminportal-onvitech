import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Parser } from "json2csv";

// 🟦 Export all (or filtered) leads to CSV
export const exportLeadsToCSV = (data: any, fileName: string) => {
  if (!data.length) {
    alert("No leads available for export.");
    return;
  }

  // Flatten nested data for CSV
  const flattened = data.map((lead: any) => ({
    session_title: lead.sessions?.title || "",
    form_title: lead.form_title,
    journey_summary: lead.journey_summary || "",
    "Submitted At": lead.created_at
      ? new Date(lead.created_at).toLocaleString()
      : "",
    ...Object.fromEntries(
      Object.entries(lead.form_data || {}).map(([k, v]) => [
        k,
        Array.isArray(v) ? v.join(", ") : v,
      ])
    ),
  }));

  const parser = new Parser();
  const csv = parser.parse(flattened);

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${fileName}.csv`;
  link.click();
};

// 🟥 Export single lead to PDF
export const exportLeadToPDF = (lead: any) => {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text("Lead Report", 14, 20);

  doc.setFontSize(12);
  doc.text(`Form Title: ${lead.form_title}`, 14, 35);
  doc.text(`Session: ${lead.sessions?.title || "N/A"}`, 14, 43);
  doc.text(
    `Created At: ${
      lead.created_at ? new Date(lead.created_at).toLocaleString() : "N/A"
    }`,
    14,
    51
  );
  doc.text(`Lead ID: ${lead.id}`, 14, 59);

  // 🟨 Add Form Data Table
  const formEntries = Object.entries(lead.form_data || {}).map(
    ([key, value]) => [
      key.replace(/_/g, " "),
      Array.isArray(value) ? value.join(", ") : String(value),
    ]
  );

  if (formEntries.length > 0) {
    autoTable(doc, {
      startY: 70,
      head: [["Field", "Value"]],
      body: formEntries,
    });
  }

  // 🟩 Add Journey Summary
  // @ts-ignore
  let yPos = doc?.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 15 : 80;
  doc.setFontSize(14);
  doc.text("Journey Summary", 14, yPos);

  doc.setFontSize(12);
  doc.text(lead.journey_summary || "No summary available.", 14, yPos + 10, {
    maxWidth: 180,
  });

  // Save PDF
  doc.save(`${lead.form_title || "lead"}-${lead.id}.pdf`);
};
