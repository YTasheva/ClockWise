const DAY_BOUNDARY_HOUR = 4;

// Get today's date with 4 AM boundary (in local timezone)
export function getTodayDate() {
  const now = new Date();
  const hour = now.getHours();

  // If before 4 AM, use yesterday's date
  if (hour < DAY_BOUNDARY_HOUR) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split("T")[0];
  }

  return now.toISOString().split("T")[0];
}

// Get current time with 4 AM boundary offset
export function getCurrentTimeWithBoundary() {
  const now = new Date();
  const hour = now.getHours();

  // If before 4 AM, use yesterday's date
  if (hour < DAY_BOUNDARY_HOUR) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(DAY_BOUNDARY_HOUR, 0, 0, 0);
    return yesterday;
  }

  return now;
}

// Calculate duration in minutes (rounded down, minimum 1 minute)
export function calculateDurationMinutes(startTime, endTime) {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const diffMs = end - start;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  return diffMinutes;
}

// Check if duration is valid (must be at least 1 minute)
export function isValidDuration(startTime, endTime) {
  const durationMinutes = calculateDurationMinutes(startTime, endTime);
  return durationMinutes >= 1;
}

// Format minutes as HH:MM
export function formatDuration(minutes) {
  const safeMinutes = Number.isFinite(minutes) ? minutes : 0;
  const hours = Math.floor(safeMinutes / 60);
  const mins = safeMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

export function isValidDateString(dateStr) {
  if (typeof dateStr !== "string") return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const parsed = new Date(`${dateStr}T00:00:00`);
  return !Number.isNaN(parsed.getTime());
}

export function getDateRangeForDay(dateStr, boundaryHour = DAY_BOUNDARY_HOUR) {
  if (!isValidDateString(dateStr)) return null;
  const start = new Date(`${dateStr}T00:00:00`);
  start.setHours(boundaryHour, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

export function calculateOverlapMinutes(
  startTime,
  endTime,
  rangeStart,
  rangeEnd
) {
  if (!startTime || !endTime || !rangeStart || !rangeEnd) return 0;
  const start = startTime instanceof Date ? startTime : new Date(startTime);
  const end = endTime instanceof Date ? endTime : new Date(endTime);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  const overlapStart = new Date(Math.max(start, rangeStart));
  const overlapEnd = new Date(Math.min(end, rangeEnd));
  const diffMs = overlapEnd - overlapStart;
  if (diffMs <= 0) return 0;
  return Math.floor(diffMs / (1000 * 60));
}

export function buildDailySummary({ entries, projects, dayRange }) {
  if (!Array.isArray(entries) || !Array.isArray(projects) || !dayRange) {
    return { byTask: [], byProject: [], byTaskPerProject: [] };
  }

  const projectById = new Map(
    projects.map((project) => [project.id, project])
  );
  const noProject = projects.find((project) => project.is_builtin);
  const noProjectId = noProject?.id ?? null;

  const taskTotals = new Map();
  const projectTotals = new Map();
  const taskProjectTotals = new Map();

  entries.forEach((entry) => {
    const overlapMinutes = calculateOverlapMinutes(
      entry.start_time,
      entry.end_time,
      dayRange.start,
      dayRange.end
    );

    if (overlapMinutes <= 0) return;

    const taskId = entry.task_id;
    const taskName = entry.task_name;
    const taskTotal = taskTotals.get(taskId) || {
      id: taskId,
      name: taskName,
      total_minutes: 0,
    };
    taskTotal.total_minutes += overlapMinutes;
    taskTotals.set(taskId, taskTotal);

    const projectIds = entry.project_ids
      ? entry.project_ids.split(",").map((value) => Number(value))
      : [];
    const effectiveProjectIds =
      projectIds.length > 0 ? projectIds : noProjectId ? [noProjectId] : [];

    effectiveProjectIds.forEach((projectId) => {
      const project = projectById.get(projectId);
      if (!project) return;

      const projectTotal = projectTotals.get(projectId) || {
        id: project.id,
        name: project.name,
        total_minutes: 0,
        is_builtin: project.is_builtin,
      };
      projectTotal.total_minutes += overlapMinutes;
      projectTotals.set(projectId, projectTotal);

      const taskProjectKey = `${projectId}:${taskId}`;
      const taskProjectTotal = taskProjectTotals.get(taskProjectKey) || {
        project_id: project.id,
        project_name: project.name,
        task_id: taskId,
        task_name: taskName,
        total_minutes: 0,
        project_is_builtin: project.is_builtin,
      };
      taskProjectTotal.total_minutes += overlapMinutes;
      taskProjectTotals.set(taskProjectKey, taskProjectTotal);
    });
  });

  const byTask = Array.from(taskTotals.values()).sort(
    (a, b) => b.total_minutes - a.total_minutes
  );

  const byProject = Array.from(projectTotals.values()).sort((a, b) => {
    if (a.is_builtin !== b.is_builtin) {
      return b.is_builtin - a.is_builtin;
    }
    return a.name.localeCompare(b.name);
  });

  const byTaskPerProject = Array.from(taskProjectTotals.values()).sort(
    (a, b) => {
      if (a.project_is_builtin !== b.project_is_builtin) {
        return b.project_is_builtin - a.project_is_builtin;
      }
      const nameCompare = a.project_name.localeCompare(b.project_name);
      if (nameCompare !== 0) return nameCompare;
      return b.total_minutes - a.total_minutes;
    }
  );

  return { byTask, byProject, byTaskPerProject };
}
