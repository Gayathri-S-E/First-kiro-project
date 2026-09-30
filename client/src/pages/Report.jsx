import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import StatusBadge from "../components/StatusBadge";

export default function Report() {
  const { userId: paramUserId } = useParams();   // admin viewing another user's report
  const { user, isStaff }       = useAuth();
  const navigate                = useNavigate();

  const targetId = paramUserId ? Number(paramUserId) : user?.id;

  const [report,   setReport]   = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [exporting,setExporting]= useState(false);
  const reportRef               = useRef(null);

  useEffect(() => {
    api.get(`/reports/faculty/${targetId}`)
      .then(({ data }) => setReport(data))
      .catch(() => navigate(isStaff ? "/admin/overview" : "/dashboard"))
      .finally(() => setLoading(false));
  }, [targetId, navigate, isStaff]);

  const exportPdf = () => {
    if (!report) return;
    setExporting(true);

    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const margin = 15;
      let y = margin;

      // ── Header ────────────────────────────────────────────────────────────
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("Faculty Career Profile", margin, y); y += 8;

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100);
      doc.text(`${report.user.name}  ·  ${report.user.designation || ""}  ·  ${report.user.department || ""}`, margin, y); y += 6;
      doc.text(`Report generated: ${new Date(report.generatedAt).toLocaleDateString("en-IN", { dateStyle: "long" })}`, margin, y); y += 10;

      doc.setTextColor(0);
      doc.setDrawColor(200);
      doc.line(margin, y, 210 - margin, y); y += 8;

      // ── Milestone Progress ─────────────────────────────────────────────────
      if (report.milestoneProgress?.length > 0) {
        doc.setFont("helvetica", "bold"); doc.setFontSize(13);
        doc.text("Milestone Progress", margin, y); y += 7;

        autoTable(doc, {
          startY: y,
          margin: { left: margin, right: margin },
          head: [["Milestone", "Category", "Required", "Current", "Status"]],
          body: report.milestoneProgress.map(p => [
            p.name,
            p.type_code,
            p.required_count,
            p.current_count,
            p.achieved ? "✓ Achieved" : `${p.percentage}%`,
          ]),
          styles: { fontSize: 9 },
          headStyles: { fillColor: [37, 99, 235] },
          columnStyles: { 4: { fontStyle: "bold" } },
          didParseCell: (data) => {
            if (data.column.index === 4 && data.cell.raw?.toString().startsWith("✓")) {
              data.cell.styles.textColor = [22, 163, 74];
            }
          },
        });
        y = doc.lastAutoTable.finalY + 10;
      }

      // ── Achievements by Type ─────────────────────────────────────────────
      for (const [code, group] of Object.entries(report.achievementsByType || {})) {
        if (!group.items?.length) continue;

        // New page if needed
        if (y > 240) { doc.addPage(); y = margin; }

        doc.setFont("helvetica", "bold"); doc.setFontSize(12);
        doc.text(group.label, margin, y); y += 6;

        autoTable(doc, {
          startY: y,
          margin: { left: margin, right: margin },
          head: [["Title", "Issuer / Publisher", "Date"]],
          body: group.items.map(item => [
            item.title,
            item.issuer || "—",
            item.date_achieved || "—",
          ]),
          styles: { fontSize: 9 },
          headStyles: { fillColor: [71, 85, 105] },
        });
        y = doc.lastAutoTable.finalY + 8;
      }

      doc.save(`${report.user.name.replace(/\s+/g, "_")}_Career_Profile.pdf`);
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <div className="loading"><div className="spinner"/>Loading report…</div>;
  if (!report) return null;

  const achieved = report.milestoneProgress.filter(p => p.achieved).length;
  const total    = report.milestoneProgress.length;

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Career Profile Report</h2>
          <p>{report.user.name} · {report.user.designation} · {report.user.department}</p>
        </div>
        <div className="flex gap-2">
          {isStaff && <button className="btn btn-secondary" onClick={() => navigate(-1)}>← Back</button>}
          <button className="btn btn-primary" onClick={exportPdf} disabled={exporting}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            {exporting ? "Generating…" : "Download PDF"}
          </button>
        </div>
      </div>

      <div className="page-body" ref={reportRef}>
        {/* Profile Card */}
        <div className="card" style={{ marginBottom: 20, padding: 24 }}>
          <div className="flex items-center gap-3">
            <div className="avatar" style={{ width: 56, height: 56, fontSize: "1.3rem", borderRadius: "50%", background: "var(--primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
              {report.user.name.split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>{report.user.name}</div>
              <div className="text-muted text-sm">{report.user.designation} · {report.user.department}</div>
              <div className="text-muted text-xs" style={{ marginTop: 2 }}>{report.user.email}</div>
            </div>
            <div style={{ marginLeft: "auto", textAlign: "right" }}>
              <div style={{ fontWeight: 700, fontSize: "1.5rem", color: "var(--primary)" }}>
                {achieved}/{total}
              </div>
              <div className="text-xs text-muted">Milestones achieved</div>
            </div>
          </div>
        </div>

        {/* Milestone Progress */}
        {report.milestoneProgress.length > 0 && (
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header"><h3>Milestone Progress</h3></div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Milestone</th><th>Category</th><th>Required</th><th>Current</th><th>Progress</th></tr>
                </thead>
                <tbody>
                  {report.milestoneProgress.map((p, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 500 }}>{p.name}</td>
                      <td><span className="badge badge-faculty">{p.type_code}</span></td>
                      <td>{p.required_count}</td>
                      <td style={{ fontWeight: 600 }}>{p.current_count}</td>
                      <td style={{ minWidth: 140 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ flex: 1 }}>
                            <div className="progress-bar" style={{ height: 6 }}>
                              <div className={`progress-fill${p.achieved ? " complete" : ""}`}
                                style={{ width: `${p.percentage}%` }} />
                            </div>
                          </div>
                          {p.achieved
                            ? <span style={{ fontSize: "0.75rem", color: "var(--success)", whiteSpace: "nowrap" }}>✓ Done</span>
                            : <span style={{ fontSize: "0.75rem", color: "var(--gray-400)", whiteSpace: "nowrap" }}>{p.percentage}%</span>
                          }
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Achievements by Type */}
        {Object.entries(report.achievementsByType || {}).map(([code, group]) => {
          if (!group.items?.length) return null;
          return (
            <div key={code} className="card" style={{ marginBottom: 16 }}>
              <div className="card-header">
                <h3>{group.label}</h3>
                <span className="badge badge-faculty">{group.items.length}</span>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Title</th><th>Issuer / Publisher</th><th>Date</th></tr>
                  </thead>
                  <tbody>
                    {group.items.map(item => (
                      <tr key={item.id}>
                        <td style={{ fontWeight: 500 }}>
                          {item.url
                            ? <a href={item.url} target="_blank" rel="noreferrer">{item.title}</a>
                            : item.title}
                        </td>
                        <td className="text-sm text-muted">{item.issuer || "—"}</td>
                        <td className="text-sm text-muted">{item.date_achieved || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}

        <div style={{ textAlign: "center", marginTop: 24, color: "var(--gray-400)", fontSize: "0.75rem" }}>
          Report generated on {new Date(report.generatedAt).toLocaleString()}
        </div>
      </div>
    </>
  );
}
