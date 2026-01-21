import React, { useState } from "react";
import { motion } from "framer-motion";
import { Pencil, Plus, Trash2 } from "lucide-react";

function TaskManager({
  tasks,
  projects,
  activeProject,
  activeTask,
  onTaskSelect,
  onTaskAdded,
  onTaskDeleted,
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

      setNewTaskName("");
      onTaskAdded();
    } catch (err) {
      setError("Error adding task: " + err.message);
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
                activeTask?.id === task.id ? "active" : ""
              }`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div
                style={{ flex: 1, cursor: "pointer" }}
                onClick={() => onTaskSelect(task)}
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
                  <strong>{task.name}</strong>
                )}
              </div>
              <div className="task-actions">
                <button
                  className="task-edit-btn"
                  onClick={() => {
                    setEditingId(task.id);
                    setEditName(task.name);
                  }}
                >
                  <span className="btn-icon" aria-hidden="true">
                    <Pencil size={14} />
                  </span>
                  Edit
                </button>
                <button
                  className="task-delete-btn"
                  onClick={() => handleDeleteTask(task.id)}
                >
                  <span className="btn-icon" aria-hidden="true">
                    <Trash2 size={14} />
                  </span>
                  Delete
                </button>
              </div>
            </motion.li>
          ))
        )}
      </ul>

      <form onSubmit={handleAddTask} className="task-form">
        <input
          type="text"
          value={newTaskName}
          onChange={(e) => setNewTaskName(e.target.value)}
          placeholder="New task name (max 50 characters)"
          maxLength="50"
          className="form-control"
        />
        <button type="submit" className="btn btn-primary">
          <span className="btn-icon" aria-hidden="true">
            <Plus size={16} />
          </span>
          Add Task
        </button>
      </form>
    </div>
  );
}

export default TaskManager;
