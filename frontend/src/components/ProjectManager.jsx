import React, { useState } from "react";
import { motion } from "framer-motion";
import { FolderKanban, Pencil, Plus, Trash2 } from "lucide-react";

function ProjectManager({
  projects,
  activeProject,
  activeTask,
  linkedTaskIds = [],
  selectedTaskIds = [],
  onProjectSelect,
  onProjectAdded,
  onProjectDeleted,
  onLinkSelectedTasks,
  onUnlinkSelectedTasks,
}) {
  const [newProjectName, setNewProjectName] = useState("");
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");

  const handleAddProject = async (e) => {
    e.preventDefault();
    setError("");

    if (!newProjectName.trim()) {
      setError("Project name cannot be empty");
      return;
    }

    if (newProjectName.length > 50) {
      setError("Project name cannot exceed 50 characters");
      return;
    }

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newProjectName }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to add project");
        return;
      }

      setNewProjectName("");
      onProjectAdded();
    } catch (err) {
      setError("Error adding project: " + err.message);
    }
  };

  const handleEditProject = async (id, newName) => {
    setError("");

    if (!newName.trim()) {
      setError("Project name cannot be empty");
      return;
    }

    if (newName.length > 50) {
      setError("Project name cannot exceed 50 characters");
      return;
    }

    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to update project");
        return;
      }

      setEditingId(null);
      onProjectAdded(); // Refresh projects
    } catch (err) {
      setError("Error updating project: " + err.message);
    }
  };

  const handleDeleteProject = async (id) => {
    if (!confirm("Are you sure you want to delete this project?")) return;

    setError("");

    try {
      const response = await fetch(`/api/projects/${id}`, { method: "DELETE" });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to delete project");
        return;
      }

      onProjectDeleted();
    } catch (err) {
      setError("Error deleting project: " + err.message);
    }
  };

  return (
    <div>
      {error && <div className="error-alert">{error}</div>}

      <ul className="task-list">
        {projects.map((project) => (
          <motion.li
            key={project.id}
            className={`task-item ${
              activeProject?.id === project.id ? "active" : ""
            }`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div
              style={{ flex: 1, cursor: "pointer" }}
              onClick={() => onProjectSelect(project)}
            >
              {editingId === project.id ? (
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter")
                      handleEditProject(project.id, editName);
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  onBlur={() => handleEditProject(project.id, editName)}
                  autoFocus
                  className="form-control"
                  style={{ maxWidth: "300px" }}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <strong>{project.name}</strong>
              )}
            </div>
            {!project.is_builtin && (
              <div className="task-actions">
                <button
                  className="task-edit-btn"
                  aria-label="Edit project"
                  title="Edit"
                  onClick={() => {
                    setEditingId(project.id);
                    setEditName(project.name);
                  }}
                >
                  <span className="btn-icon" aria-hidden="true">
                    <Pencil size={14} />
                  </span>
                </button>
                <button
                  className="task-delete-btn"
                  aria-label="Delete project"
                  title="Delete"
                  onClick={() => handleDeleteProject(project.id)}
                >
                  <span className="btn-icon" aria-hidden="true">
                    <Trash2 size={14} />
                  </span>
                </button>
              </div>
            )}
            {project.is_builtin === 1 ? (
              <span className="default-pill">Default</span>
            ) : null}
          </motion.li>
        ))}
      </ul>

      {activeProject && (
        <div className="project-link-panel">
          <div className="form-label">
            {activeProject.is_builtin === 1
              ? "No Project Links"
              : "Project Links"}
          </div>
          <p className="project-link-help">
            {activeProject.is_builtin === 1
              ? "Link tasks explicitly to include them under No Project."
              : "Link tasks explicitly to include them under this project."}
          </p>
          <div className="project-link-actions">
            <button
              type="button"
              className={`project-link-btn ${
                selectedTaskIds.length > 0 &&
                selectedTaskIds.every((id) => linkedTaskIds.includes(id))
                  ? "end-btn"
                  : "play-btn"
              }`}
              onClick={() => {
                if (selectedTaskIds.length === 0) return;
                if (selectedTaskIds.every((id) => linkedTaskIds.includes(id))) {
                  onUnlinkSelectedTasks?.();
                } else {
                  onLinkSelectedTasks?.();
                }
              }}
              disabled={selectedTaskIds.length === 0}
            >
              {selectedTaskIds.length > 0 &&
              selectedTaskIds.every((id) => linkedTaskIds.includes(id))
                ? "Unlink Selected Tasks"
                : "Link Selected Tasks"}
            </button>
          </div>
          {selectedTaskIds.length > 0 && (
            <span className="project-link-count">
              {selectedTaskIds.length} selected
            </span>
          )}
        </div>
      )}

      <form onSubmit={handleAddProject} className="project-form">
        <div className="form-label">
          <span className="section-icon" aria-hidden="true">
            <FolderKanban size={16} />
          </span>
          Add Project
        </div>
        <div className="form-row">
          <input
            type="text"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            placeholder="New project name (max 50 characters)"
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

export default ProjectManager;
