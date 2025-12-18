import React, { useState } from "react";

function ProjectManager({
  projects,
  activeProject,
  onProjectSelect,
  onProjectAdded,
  onProjectDeleted,
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

      <div className="project-list">
        {projects.map((project) => (
          <div key={project.id}>
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
                style={{ marginBottom: "0.5rem" }}
              />
            ) : (
              <button
                className={`project-btn ${
                  activeProject?.id === project.id ? "active" : ""
                }`}
                onClick={() => onProjectSelect(project)}
              >
                {project.name}
              </button>
            )}
            {!project.is_builtin && (
              <div
                className="project-actions"
                style={{ display: "inline-block", marginLeft: "0.5rem" }}
              >
                <button
                  className="btn btn-sm btn-info"
                  onClick={() => {
                    setEditingId(project.id);
                    setEditName(project.name);
                  }}
                >
                  Edit
                </button>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => handleDeleteProject(project.id)}
                  style={{ marginLeft: "0.25rem" }}
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleAddProject} className="project-form">
        <input
          type="text"
          value={newProjectName}
          onChange={(e) => setNewProjectName(e.target.value)}
          placeholder="New project name (max 50 characters)"
          maxLength="50"
          className="form-control"
        />
        <button type="submit" className="btn btn-primary">
          Add Project
        </button>
      </form>
    </div>
  );
}

export default ProjectManager;
