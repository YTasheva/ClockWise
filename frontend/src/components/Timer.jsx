import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Activity, FolderKanban, ListChecks, Play, Square } from "lucide-react";

function Timer({
  currentTimer,
  activeTask,
  activeProject,
  linkedTaskIds = [],
  tasks,
  onTaskSelect,
  onProjectLinkChange,
  onTimerStarted,
  onTimerEnded,
}) {
  const [elapsedTime, setElapsedTime] = useState("00:00:00");
  const [selectedTask, setSelectedTask] = useState(null);
  const [toast, setToast] = useState("");

  const formatElapsed = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(seconds).padStart(2, "0")}`;
  };

  // Update selected task when active task changes
  useEffect(() => {
    if (activeTask) {
      setSelectedTask(activeTask);
    }
  }, [activeTask]);

  // Update elapsed time display
  useEffect(() => {
    if (!currentTimer?.active || !currentTimer?.start_time) return;

    const start = new Date(currentTimer.start_time);
    const tick = () => {
      const now = new Date();
      const diffMs = now - start;
      const totalSeconds = Math.floor(diffMs / 1000);
      setElapsedTime(formatElapsed(totalSeconds));
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [currentTimer?.active, currentTimer?.start_time]);

  useEffect(() => {
    if (currentTimer?.active) return;
    if (currentTimer?.elapsed_minutes !== undefined) {
      setElapsedTime(formatElapsed(currentTimer.elapsed_minutes * 60));
    } else {
      setElapsedTime("00:00:00");
    }
  }, [currentTimer?.active, currentTimer?.elapsed_minutes]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 2000);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleStartTimer = async (taskId, options = {}) => {
    if (!taskId) {
      alert("Please select a task");
      return;
    }
    if (!options.skipProjectCheck && activeProject?.id) {
      if (linkedTaskIds.length === 0) {
        alert("Link a task to this project before starting the timer.");
        return;
      }
      if (!linkedTaskIds.includes(taskId)) {
        alert("Start the linked task for this project.");
        return;
      }
    }

    try {
      const response = await fetch("/api/timer/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task_id: taskId }),
      });

      if (!response.ok) {
        const data = await response.json();
        alert("Error: " + (data.error || "Failed to start timer"));
        return;
      }

      onTimerStarted();
    } catch (err) {
      alert("Error starting timer: " + err.message);
    }
  };

  const handleEndTimer = async () => {
    try {
      const response = await fetch("/api/timer/end", { method: "POST" });

      if (!response.ok) {
        const data = await response.json();
        alert("Error: " + (data.error || "Failed to end timer"));
        return;
      }

      const data = await response.json();
      if (data.discarded) {
        alert("Entry was too short (less than 1 minute) and was not recorded.");
      }

      onTimerEnded();
    } catch (err) {
      alert("Error ending timer: " + err.message);
    }
  };

  const handleQuickSwitchTask = async (task) => {
    if (currentTimer?.active) {
      await handleEndTimer();
    }

    if (activeProject?.id && !linkedTaskIds.includes(task.id)) {
      try {
        const response = await fetch(
          `/api/projects/${activeProject.id}/tasks/${task.id}`,
          { method: "POST" }
        );
        if (!response.ok) {
          const data = await response.json();
          setToast(data.error || "Failed to link task to project.");
          return;
        }
        onProjectLinkChange?.({
          action: "link",
          taskId: task.id,
          optimistic: true,
        });
        onTaskSelect?.(task);
      } catch (err) {
        setToast("Error linking task: " + err.message);
        return;
      }
    }

    setSelectedTask(task);
    onTaskSelect?.(task);
    await handleStartTimer(task.id, { skipProjectCheck: true });
    setToast(`Switched to ${task.name}`);
  };

  return (
    <div>
      {toast && <div className="toast-notice">{toast}</div>}
      <motion.div
        className="timer-display"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="timer-task-info">
          <p className="label">
            <span className="btn-icon" aria-hidden="true">
              <Activity size={14} />
            </span>
            CURRENT ACTIVITY
          </p>
          {activeProject?.name && (currentTimer?.task_name || activeTask?.name) ? (
            <div className="current-activity">
              <span className="current-project">
                <span className="current-icon" aria-hidden="true">
                  <FolderKanban size={16} />
                </span>
                {activeProject.name}
              </span>
              <span className="current-separator">›</span>
              <span className="current-task">
                <span className="current-icon" aria-hidden="true">
                  <ListChecks size={16} />
                </span>
                {currentTimer?.task_name || activeTask?.name}
              </span>
            </div>
          ) : (currentTimer?.task_name || activeTask?.name) ? (
            <div className="current-activity">
              <span className="current-task">
                {currentTimer?.task_name || activeTask?.name}
              </span>
            </div>
          ) : (
            <p className="current-empty">Select a project and task</p>
          )}
        </div>

        <div className="timer-time">{elapsedTime}</div>

        <div className="timer-controls">
          {!currentTimer?.active ? (
            <button
              className="play-btn"
              onClick={() =>
                handleStartTimer(selectedTask?.id || activeTask?.id)
              }
            >
              <span className="btn-icon" aria-hidden="true">
                <Play size={16} />
              </span>
              Start
            </button>
          ) : (
            <>
              <button className="end-btn" onClick={handleEndTimer}>
                <span className="btn-icon" aria-hidden="true">
                  <Square size={16} />
                </span>
                End
              </button>
            </>
          )}
        </div>
      </motion.div>

      <motion.div
        className="task-selector"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <h3>Quick Task Switching</h3>
        <div className="task-quick-select">
          {tasks.length === 0 ? (
            <p style={{ fontSize: "0.85rem", color: "#95a5a6" }}>
              No tasks defined
            </p>
          ) : (
            tasks.map((task) => (
              <button
                key={task.id}
                className={`task-quick-btn ${
                  selectedTask?.id === task.id ? "active" : ""
                }`}
                onClick={() => handleQuickSwitchTask(task)}
                title={task.name}
              >
                {task.name}
              </button>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default Timer;
