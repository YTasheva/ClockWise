import React, { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FileDown } from "lucide-react";
import { apiFetch } from "../utils/api";

function TimesheetExport() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const formatDuration = (minutes) => {
    if (!minutes) return "00:00";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
  };

  const getTodayDate = () => {
    const now = new Date();
    // If before 4 AM, the "day" actually started yesterday at 4 AM
    if (now.getHours() < 4) {
      now.setDate(now.getDate() - 1);
    }
    return now.toISOString().split("T")[0];
  };

  const generatePDF = async () => {
    try {
      setLoading(true);
      setError("");

      // Fetch all necessary data
      const [totalsRes, entriesRes] = await Promise.all([
        apiFetch("/api/totals"),
        apiFetch("/api/timesheet/entries"),
      ]);

      if (!totalsRes.ok || !entriesRes.ok) {
        throw new Error("Failed to fetch timesheet data");
      }

      const totals = await totalsRes.json();
      const entries = await entriesRes.json();

      // Create PDF
      const doc = new jsPDF();
      const today = getTodayDate();
      const dateStr = new Date(today + "T00:00:00").toLocaleDateString(
        "en-US",
        {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }
      );

      // Title
      doc.setFontSize(18);
      doc.text("Daily Timesheet", 14, 15);

      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Date: ${dateStr}`, 14, 25);

      let yPosition = 35;

      // 1. Time by Task per Project
      if (totals.byTaskPerProject && totals.byTaskPerProject.length > 0) {
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text("Time by Task per Project", 14, yPosition);
        yPosition += 8;

        const byTaskPerProjectData = totals.byTaskPerProject.map((item) => [
          item.project_name,
          item.task_name,
          formatDuration(item.total_minutes),
        ]);

        autoTable(doc, {
          head: [["Project", "Task", "Time"]],
          body: byTaskPerProjectData,
          startY: yPosition,
          margin: { left: 14, right: 14 },
          theme: "grid",
          headerStyles: {
            fillColor: [13, 110, 253],
            textColor: 255,
            fontStyle: "bold",
          },
          alternateRowStyles: {
            fillColor: [240, 242, 245],
          },
          didDrawPage: (data) => {
            if (data.lastAutoTable?.finalY) {
              yPosition = data.lastAutoTable.finalY + 5;
            } else {
              yPosition += 5;
            }
          },
        });

        if (doc.lastAutoTable?.finalY) {
          yPosition = doc.lastAutoTable.finalY + 10;
        } else {
          yPosition += 10;
        }
      }

      // 2. Total Time by Project
      if (totals.byProject && totals.byProject.length > 0) {
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text("Total Time by Project", 14, yPosition);
        yPosition += 8;

        const byProjectData = totals.byProject.map((item) => [
          item.name,
          formatDuration(item.total_minutes),
        ]);

        autoTable(doc, {
          head: [["Project", "Total Time"]],
          body: byProjectData,
          startY: yPosition,
          margin: { left: 14, right: 14 },
          theme: "grid",
          headerStyles: {
            fillColor: [25, 135, 84],
            textColor: 255,
            fontStyle: "bold",
          },
          alternateRowStyles: {
            fillColor: [240, 245, 242],
          },
          didDrawPage: (data) => {
            if (data.lastAutoTable?.finalY) {
              yPosition = data.lastAutoTable.finalY + 5;
            } else {
              yPosition += 5;
            }
          },
        });

        if (doc.lastAutoTable?.finalY) {
          yPosition = doc.lastAutoTable.finalY + 10;
        } else {
          yPosition += 10;
        }
      }

      // 3. Total Time by Task (irrespective of projects)
      if (totals.byTask && totals.byTask.length > 0) {
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text("Total Time by Task", 14, yPosition);
        yPosition += 8;

        const byTaskData = totals.byTask.map((item) => [
          item.name,
          formatDuration(item.total_minutes),
        ]);

        autoTable(doc, {
          head: [["Task", "Total Time"]],
          body: byTaskData,
          startY: yPosition,
          margin: { left: 14, right: 14 },
          theme: "grid",
          headerStyles: {
            fillColor: [13, 202, 240],
            textColor: 0,
            fontStyle: "bold",
          },
          alternateRowStyles: {
            fillColor: [240, 248, 255],
          },
          didDrawPage: (data) => {
            if (data.lastAutoTable?.finalY) {
              yPosition = data.lastAutoTable.finalY + 5;
            } else {
              yPosition += 5;
            }
          },
        });

        if (doc.lastAutoTable?.finalY) {
          yPosition = doc.lastAutoTable.finalY + 10;
        } else {
          yPosition += 10;
        }
      }

      // 4. Chronological list of entries
      if (entries && entries.length > 0) {
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text("Time Entries (Chronological)", 14, yPosition);
        yPosition += 8;

        const entriesData = entries.map((entry) => {
          const startTime = new Date(entry.start_time).toLocaleTimeString(
            "en-US",
            {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            }
          );
          const endTime = entry.end_time
            ? new Date(entry.end_time).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })
            : "In Progress";

          return [
            entry.task_name,
            startTime,
            endTime,
            Number.isFinite(entry.overlap_minutes)
              ? formatDuration(entry.overlap_minutes)
              : entry.duration_minutes
                ? formatDuration(entry.duration_minutes)
                : "N/A",
          ];
        });

        autoTable(doc, {
          head: [["Task", "Start Time", "End Time", "Duration"]],
          body: entriesData,
          startY: yPosition,
          margin: { left: 14, right: 14 },
          theme: "grid",
          headerStyles: {
            fillColor: [220, 53, 69],
            textColor: 255,
            fontStyle: "bold",
          },
          alternateRowStyles: {
            fillColor: [255, 248, 247],
          },
        });
      }

      // Save PDF
      const filename = `timesheet_${today}.pdf`;
      doc.save(filename);

      setLoading(false);
    } catch (err) {
      setError("Error generating PDF: " + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="timesheet-export">
      {error && <div className="error-alert">{error}</div>}
      <button
        className="btn btn-primary"
        onClick={generatePDF}
        disabled={loading}
      >
        {loading ? (
          "Generating PDF..."
        ) : (
          <>
            <span className="btn-icon" aria-hidden="true">
              <FileDown size={16} />
            </span>
            Generate PDF
          </>
        )}
      </button>
    </div>
  );
}

export default TimesheetExport;
