import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link2, ListChecks, Pencil, Plus, Trash2 } from "lucide-react";

function TaskManager({
  tasks,
  projects,
  activeProject,
  activeTask,
  linkedTaskIds = [],
  selectedTaskIds = [],
  onTaskSelect,
  onToggleTaskSelection,
  onTaskAdded,
  onTaskDeleted,
  onTaskLinked,
}) {
  const [newTaskName, setNewTaskName] = useState("");
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");

  const handleAddTask = async (e) => {
    e.preventDefault();
    setError("");

    if (!newTaskName.trim()) {
      setError("Task name cannot be empty");
      return;
    }

    if (newTaskName.length > 50) {
      setError("Task name cannot exceed 50 characters");
      return;
    }

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTaskName }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to add task");
        return;
      }

      const data = await response.json();
      setNewTaskName("");
      onTaskAdded();

      if (activeProject?.id) {
        await linkTaskToProject(data.id, activeProject.id);
        onTaskLinked?.();
      }
    } catch (err) {
      setError("Error adding task: " + err.message);
    }
  };

  const linkTaskToProject = async (taskId, projectId) => {
    try {
      const response = await fetch(
        `/api/projects/${projectId}/tasks/${taskId}`,
        { method: "POST" }
      );
      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to link task to project");
      }
    } catch (err) {
      setError("Error linking task: " + err.message);
    }
  };

  const handleEditTask = async (id, newName) => {
    setError("");

    if (!newName.trim()) {
      setError("Task name cannot be empty");
      return;
    }

    if (newName.length > 50) {
      setError("Task name cannot exceed 50 characters");
      return;
    }

    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to update task");
        return;
      }

      setEditingId(null);
      onTaskAdded(); // Refresh tasks
    } catch (err) {
      setError("Error updating task: " + err.message);
    }
  };

  const handleDeleteTask = async (id) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    setError("");

    try {
      const response = await fetch(`/api/tasks/${id}`, { method: "DELETE" });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to delete task");
        return;
      }

      onTaskDeleted();
      onTaskLinked?.();
    } catch (err) {
      setError("Error deleting task: " + err.message);
    }
  };

  return (
    <div>
      {error && <div className="error-alert">{error}</div>}

      <ul className="task-list">
        {tasks.length === 0 ? (
          <li className="no-data">No tasks yet. Add one below.</li>
        ) : (
          tasks.map((task) => (
            <motion.li
              key={task.id}
              className={`task-item ${
                (activeProject?.is_builtin
                  ? selectedTaskIds.includes(task.id)
                  : activeTask?.id === task.id)
                  ? "active"
                  : ""
              }`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div
                style={{ flex: 1, cursor: "pointer" }}
                onClick={() =>
                  onTaskSelect(task)
                }
              >
                {editingId === task.id ? (
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleEditTask(task.id, editName);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    onBlur={() => handleEditTask(task.id, editName)}
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                    className="form-control"
                    style={{ maxWidth: "300px" }}
                  />
                ) : (
                  <div className="task-label">
                    <input
                      type="checkbox"
                      className="task-select-checkbox"
                      checked={selectedTaskIds.includes(task.id)}
                      onChange={() => onToggleTaskSelection?.(task)}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Select ${task.name}`}
                    />
                    <strong>
                      {task.name}
                      {linkedTaskIds.includes(task.id) && (
                        <span className="linked-dot" aria-hidden="true" />
                      )}
                    </strong>
                  </div>
                )}
              </div>
              {activeProject?.id && linkedTaskIds.includes(task.id) && (
                <span className="link-status-icon" title="Linked">
                  <Link2 size={14} aria-hidden="true" />
                </span>
              )}
              <div className="task-actions">
                <button
                  className="task-edit-btn"
                  aria-label="Edit task"
                  title="Edit"
                  onClick={() => {
                    setEditingId(task.id);
                    setEditName(task.name);
                  }}
                >
                  <span className="btn-icon" aria-hidden="true">
                    <Pencil size={14} />
                  </span>
                </button>
                <button
                  className="task-delete-btn"
                  aria-label="Delete task"
                  title="Delete"
                  onClick={() => handleDeleteTask(task.id)}
                >
                  <span className="btn-icon" aria-hidden="true">
                    <Trash2 size={14} />
                  </span>
                </button>
              </div>
            </motion.li>
          ))
        )}
      </ul>

      <form onSubmit={handleAddTask} className="task-form">
        <div className="form-label">
          <span className="section-icon" aria-hidden="true">
            <ListChecks size={16} />
          </span>
          Add Task
        </div>
        <div className="form-row">
          <input
            type="text"
            value={newTaskName}
            onChange={(e) => setNewTaskName(e.target.value)}
            placeholder="New task name (max 50 characters)"
            maxLength="50"
            className="form-control"
          />
          <button type="submit" className="btn btn-primary add-btn-icon">
            <Plus size={18} aria-hidden="true" />
          </button>
        </div>
      </form>
    </div>
  );
}

export default TaskManager;
