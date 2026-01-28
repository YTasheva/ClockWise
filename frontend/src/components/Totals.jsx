import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { BarChart3, Layers, ListChecks } from "lucide-react";

function Totals({ refreshKey }) {
  const [totals, setTotals] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [entriesOpen, setEntriesOpen] = useState(false);
  const entriesBodyRef = useRef(null);

  useEffect(() => {
    fetchTotals();
  }, [refreshKey]);

  const fetchTotals = async () => {
    try {
      setLoading(true);
      const [totalsRes, entriesRes] = await Promise.all([
        fetch("/api/totals"),
        fetch("/api/timesheet/entries"),
      ]);
      const totalsData = await totalsRes.json();
      const entriesData = await entriesRes.json();
      setTotals(totalsData);
      setEntries(Array.isArray(entriesData) ? entriesData : []);
    } catch (error) {
      console.error("Error fetching totals:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (minutes) => {
    if (!minutes) return "00:00";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
  };

  const formatTime = (timestamp) =>
    new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

  useEffect(() => {
    const el = entriesBodyRef.current;
    if (!el) return;
    if (entriesOpen) {
      const nextHeight = el.scrollHeight;
      el.style.maxHeight = `${nextHeight}px`;
    } else {
      el.style.maxHeight = "0px";
    }
  }, [entriesOpen, entries.length]);

  if (loading) {
    return <div className="no-data">Loading...</div>;
  }

  if (!totals) {
    return <div className="no-data">Unable to load totals</div>;
  }

  const hasData =
    totals.byTask?.length > 0 ||
    totals.byProject?.length > 0 ||
    totals.byTaskPerProject?.length > 0;

  if (!hasData) {
    return <div className="no-data">No time entries recorded yet</div>;
  }

  return (
    <div>
      <div className="totals-container">
        {/* By Task */}
        {totals.byTask?.length > 0 && (
          <motion.div
            className="totals-table-wrapper"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <h3>
              <span className="section-icon" aria-hidden="true">
                <ListChecks size={16} />
              </span>
              By Task
            </h3>
            <table className="totals-table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th style={{ textAlign: "right" }}>Time</th>
                </tr>
              </thead>
              <tbody>
                {totals.byTask.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td
                      style={{ textAlign: "right" }}
                      className="duration-cell"
                    >
                      {formatDuration(item.total_minutes)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}

        {/* By Project */}
        {totals.byProject?.length > 0 && (
          <motion.div
            className="totals-table-wrapper"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.05 }}
          >
            <h3>
              <span className="section-icon" aria-hidden="true">
                <Layers size={16} />
              </span>
              By Project
            </h3>
            <table className="totals-table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th style={{ textAlign: "right" }}>Time</th>
                </tr>
              </thead>
              <tbody>
                {totals.byProject.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td
                      style={{ textAlign: "right" }}
                      className="duration-cell"
                    >
                      {formatDuration(item.total_minutes)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}

        {/* By Task Per Project */}
        {totals.byTaskPerProject?.length > 0 && (
          <motion.div
            className="totals-table-wrapper"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.1 }}
          >
            <h3>
              <span className="section-icon" aria-hidden="true">
                <BarChart3 size={16} />
              </span>
              By Task per Project
            </h3>
            <table className="totals-table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Task</th>
                  <th style={{ textAlign: "right" }}>Time</th>
                </tr>
              </thead>
              <tbody>
                {totals.byTaskPerProject.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.project_name}</td>
                    <td>{item.task_name}</td>
                    <td
                      style={{ textAlign: "right" }}
                      className="duration-cell"
                    >
                      {formatDuration(item.total_minutes)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}

        {/* Today's Entries */}
        {entries.length > 0 && (
          <motion.div
            className="totals-table-wrapper"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.15 }}
          >
            <details
              className="totals-accordion"
              open={entriesOpen}
              onToggle={(event) => setEntriesOpen(event.currentTarget.open)}
            >
              <summary>
                <span>Today's Entries (Chronological)</span>
                <span className="totals-accordion-count">
                  {entries.length} entries
                </span>
              </summary>
              <div className="totals-accordion-body" ref={entriesBodyRef}>
                <table className="totals-table">
                  <thead>
                    <tr>
                      <th>Task</th>
                      <th>Time</th>
                      <th style={{ textAlign: "right" }}>Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry) => (
                      <tr key={entry.id}>
                        <td>{entry.task_name}</td>
                        <td>
                          {formatTime(entry.start_time)} –{" "}
                          {formatTime(entry.end_time)}
                        </td>
                        <td
                          style={{ textAlign: "right" }}
                          className="duration-cell"
                        >
                          {formatDuration(entry.overlap_minutes)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default Totals;
