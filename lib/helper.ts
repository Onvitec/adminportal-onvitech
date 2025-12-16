import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Parser } from "json2csv";
import { VideoType } from "@/lib/types";

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


export function formatTimestamp(seconds:number) {
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(1); // keeps .5 etc.

  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
}

export const exportSessionAnalyticsToPDF = ({
  session,
  leads,
  watchEntries,
  videos,
}: {
  session: { id: string; title: string; total_views?: number };
  leads: Array<
    {
      id: string;
      session_id: string;
      form_title?: string;
      user_journey?: any;
      created_at?: string;
    } & Record<string, any>
  >;
  watchEntries: Array<{ watch_time: number }>;
  videos: VideoType[];
}) => {
  const doc = new jsPDF();

  const title = `${session.title} — Analytics Report`;
  doc.setFontSize(18);
  doc.text(title, 14, 18);

  const totalViews = Number(session.total_views || 0);
  const totalLeads = leads.length;
  const totalWatch = watchEntries.reduce((acc, w) => acc + (w.watch_time || 0), 0);
  const avgWatch = totalLeads > 0 ? totalWatch / totalLeads : 0;

  const videoTitleMap: Record<string, string> = {};
  videos.forEach((v) => {
    videoTitleMap[v.id] = v.title || v.id;
  });

  const buttonClicks: Record<string, number> = {};
  const videoVisits: Record<string, number> = {};
  const dropouts: Record<string, number> = {};
  const dwellSum: Record<string, number> = {};
  const dwellCount: Record<string, number> = {};

  leads.forEach((lead) => {
    let journey = lead.user_journey;
    if (typeof journey === "string") {
      try {
        journey = JSON.parse(journey);
      } catch {
        journey = null;
      }
    }
    const steps: Array<{
      videoId: string;
      videoTitle: string;
      clickedElement?: { id: string; label: string; type: string };
      timestamp: number;
    }> = journey?.steps || [];
    if (!steps || steps.length === 0) return;

    steps.forEach((step, idx) => {
      const label = step.clickedElement?.label;
      if (label) {
        buttonClicks[label] = (buttonClicks[label] || 0) + 1;
      }
      if (!step.clickedElement) {
        videoVisits[step.videoId] = (videoVisits[step.videoId] || 0) + 1;
      }
      const next = steps[idx + 1];
      if (!step.clickedElement && next && next.videoId !== step.videoId) {
        const delta = Math.max(0, (next.timestamp || 0) - (step.timestamp || 0)) / 1000;
        dwellSum[step.videoId] = (dwellSum[step.videoId] || 0) + delta;
        dwellCount[step.videoId] = (dwellCount[step.videoId] || 0) + 1;
      }
    });

    const last = steps[steps.length - 1];
    if (last?.videoId) {
      dropouts[last.videoId] = (dropouts[last.videoId] || 0) + 1;
    }
  });

  doc.setFontSize(12);
  doc.text(
    `Total Views: ${totalViews}\nTotal Leads: ${totalLeads}\nAverage Session Watch Time: ${formatTimestamp(
      avgWatch
    )}\nTotal Watch Time: ${formatTimestamp(totalWatch)}`,
    14,
    30
  );

  const videoIds = Array.from(
    new Set([
      ...Object.keys(videoVisits),
      ...Object.keys(dwellSum),
      ...Object.keys(dropouts),
      ...videos.map((v) => v.id),
    ])
  );

  const videoRows = videoIds.map((vid) => {
    const title = videoTitleMap[vid] || vid;
    const visits = videoVisits[vid] || 0;
    const avgDwell =
      (dwellCount[vid] || 0) > 0 ? (dwellSum[vid] || 0) / dwellCount[vid] : 0;
    const dropout = dropouts[vid] || 0;
    return [title, String(visits), formatTimestamp(avgDwell), String(dropout)];
  });

  autoTable(doc, {
    startY: 52,
    head: [["Video", "Visits", "Avg Dwell", "Dropouts"]],
    body: videoRows,
    styles: { fontSize: 10 },
  });

  const yAfterVideos =
    // @ts-ignore
    doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 10 : 60;
  doc.setFontSize(14);
  doc.text("Top Clicked Elements", 14, yAfterVideos);

  const buttonRows = Object.entries(buttonClicks)
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => [label, String(count)]);

  autoTable(doc, {
    startY: yAfterVideos + 6,
    head: [["Element", "Clicks"]],
    body: buttonRows.length ? buttonRows : [["—", "0"]],
    styles: { fontSize: 10 },
  });

  const filename = `${session.title || "session"}-analytics.pdf`;
  doc.save(filename);
};
