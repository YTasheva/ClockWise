import React, { useState, useEffect } from "react";

function Totals({ refreshKey }) {
  const [totals, setTotals] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTotals();
  }, [refreshKey]);

  const fetchTotals = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/totals");
      const data = await response.json();
      setTotals(data);
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
          <div className="totals-table-wrapper">
            <h3>Total Time by Task</h3>
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
          </div>
        )}

        {/* By Project */}
        {totals.byProject?.length > 0 && (
          <div className="totals-table-wrapper">
            <h3>Total Time by Project</h3>
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
          </div>
        )}

        {/* By Task Per Project */}
        {totals.byTaskPerProject?.length > 0 && (
          <div className="totals-table-wrapper">
            <h3>Time by Task per Project</h3>
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
          </div>
        )}
      </div>
    </div>
  );
}

export default Totals;
