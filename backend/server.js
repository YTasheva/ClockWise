import express from "express";
import cors from "cors";
import { initializeDatabase, dbRun, dbGet, dbAll } from "./database.js";
import {
  getTodayDate,
  calculateDurationMinutes,
  isValidDuration,
  getDateRangeForDay,
  isValidDateString,
  buildDailySummary,
} from "./utils.js";

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Initialize database on startup
await initializeDatabase();

// ============= PROJECTS API =============

app.get("/api/projects", async (req, res) => {
  try {
    const projects = await dbAll(
      "SELECT id, name, is_builtin FROM projects ORDER BY is_builtin DESC, name"
    );
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/projects", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || name.trim().length === 0 || name.length > 50) {
      return res
        .status(400)
        .json({ error: "Project name must be 1-50 characters" });
    }

    const result = await dbRun(
      "INSERT INTO projects (name, is_builtin) VALUES (?, 0)",
      [name.trim()]
    );

    res.json({ id: result.lastID, name: name.trim(), is_builtin: 0 });
  } catch (error) {
    if (error.message.includes("UNIQUE")) {
      res.status(400).json({ error: "Project name already exists" });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

app.put("/api/projects/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const project = await dbGet(
      "SELECT is_builtin FROM projects WHERE id = ?",
      [id]
    );
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    if (project.is_builtin) {
      return res.status(400).json({ error: "Cannot rename built-in project" });
    }

    if (!name || name.trim().length === 0 || name.length > 50) {
      return res
        .status(400)
        .json({ error: "Project name must be 1-50 characters" });
    }

    await dbRun("UPDATE projects SET name = ? WHERE id = ?", [name.trim(), id]);
    res.json({ id: parseInt(id), name: name.trim(), is_builtin: 0 });
  } catch (error) {
    if (error.message.includes("UNIQUE")) {
      res.status(400).json({ error: "Project name already exists" });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

app.delete("/api/projects/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const project = await dbGet(
      "SELECT is_builtin FROM projects WHERE id = ?",
      [id]
    );
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    if (project.is_builtin) {
      return res.status(400).json({ error: "Cannot delete built-in project" });
    }

    // Delete project (cascade will handle task_projects and time_entries)
    await dbRun("DELETE FROM projects WHERE id = ?", [id]);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============= TASKS API =============

app.get("/api/tasks", async (req, res) => {
  try {
    const tasks = await dbAll(
      `SELECT DISTINCT t.id, t.name
       FROM tasks t
       ORDER BY t.name`
    );
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/tasks", async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || name.trim().length === 0 || name.length > 50) {
      return res
        .status(400)
        .json({ error: "Task name must be 1-50 characters" });
    }

    const result = await dbRun("INSERT INTO tasks (name) VALUES (?)", [
      name.trim(),
    ]);

    res.json({ id: result.lastID, name: name.trim() });
  } catch (error) {
    if (error.message.includes("UNIQUE")) {
      res.status(400).json({ error: "Task already exists" });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

app.put("/api/tasks/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const task = await dbGet("SELECT id FROM tasks WHERE id = ?", [id]);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    if (!name || name.trim().length === 0 || name.length > 50) {
      return res
        .status(400)
        .json({ error: "Task name must be 1-50 characters" });
    }

    await dbRun("UPDATE tasks SET name = ? WHERE id = ?", [name.trim(), id]);
    res.json({ id: parseInt(id), name: name.trim() });
  } catch (error) {
    if (error.message.includes("UNIQUE")) {
      res.status(400).json({ error: "Task already exists" });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

app.delete("/api/tasks/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const task = await dbGet("SELECT id FROM tasks WHERE id = ?", [id]);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    await dbRun("DELETE FROM time_entries WHERE task_id = ?", [id]);
    await dbRun("DELETE FROM task_projects WHERE task_id = ?", [id]);
    await dbRun("DELETE FROM tasks WHERE id = ?", [id]);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============= PROJECT TASK LINKS API =============

app.get("/api/projects/:id/tasks", async (req, res) => {
  try {
    const { id } = req.params;
    const tasks = await dbAll(
      `SELECT t.id, t.name
       FROM tasks t
       JOIN task_projects tp ON t.id = tp.task_id
       WHERE tp.project_id = ?
       ORDER BY t.name`,
      [id]
    );
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/projects/:projectId/tasks/:taskId", async (req, res) => {
  try {
    const { projectId, taskId } = req.params;

    const project = await dbGet(
      "SELECT id FROM projects WHERE id = ?",
      [projectId]
    );
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const task = await dbGet("SELECT id FROM tasks WHERE id = ?", [taskId]);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    await dbRun(
      "INSERT OR IGNORE INTO task_projects (task_id, project_id) VALUES (?, ?)",
      [taskId, projectId]
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============= TIMER API =============

app.get("/api/timer/current", async (req, res) => {
  try {
    const today = getTodayDate();

    // Get the most recent active time entry
    const entry = await dbGet(
      `SELECT te.id, te.task_id, te.start_time, te.end_time, t.name as task_name
       FROM time_entries te
       JOIN tasks t ON te.task_id = t.id
       WHERE te.date = ? AND te.end_time IS NULL
       ORDER BY te.start_time DESC
       LIMIT 1`,
      [today]
    );

    if (entry) {
      res.json({
        active: true,
        entry_id: entry.id,
        task_id: entry.task_id,
        task_name: entry.task_name,
        start_time: entry.start_time,
        elapsed_minutes: calculateDurationMinutes(entry.start_time, new Date()),
      });
    } else {
      res.json({ active: false });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/timer/start", async (req, res) => {
  try {
    const { task_id } = req.body;

    if (!task_id) {
      return res.status(400).json({ error: "Task ID required" });
    }

    const today = getTodayDate();
    const now = new Date().toISOString();

    const task = await dbGet("SELECT id, name FROM tasks WHERE id = ?", [
      task_id,
    ]);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Stop any currently active timer
    const activeEntry = await dbGet(
      `SELECT id FROM time_entries WHERE date = ? AND end_time IS NULL`,
      [today]
    );

    if (activeEntry) {
      await dbRun("UPDATE time_entries SET end_time = ? WHERE id = ?", [
        now,
        activeEntry.id,
      ]);

      // Check duration and delete if less than 1 minute
      const entry = await dbGet(
        "SELECT start_time, end_time FROM time_entries WHERE id = ?",
        [activeEntry.id]
      );
      if (!isValidDuration(entry.start_time, entry.end_time)) {
        await dbRun("DELETE FROM time_entries WHERE id = ?", [activeEntry.id]);
      } else {
        const duration = calculateDurationMinutes(
          entry.start_time,
          entry.end_time
        );
        await dbRun(
          "UPDATE time_entries SET duration_minutes = ? WHERE id = ?",
          [duration, activeEntry.id]
        );
      }
    }

    // Start new timer
    const result = await dbRun(
      "INSERT INTO time_entries (task_id, date, start_time) VALUES (?, ?, ?)",
      [task_id, today, now]
    );

    res.json({
      active: true,
      entry_id: result.lastID,
      task_id,
      task_name: task.name,
      start_time: now,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/timer/end", async (req, res) => {
  try {
    const today = getTodayDate();
    const now = new Date().toISOString();

    const activeEntry = await dbGet(
      `SELECT te.id, te.task_id, te.start_time, t.name as task_name
       FROM time_entries te
       JOIN tasks t ON te.task_id = t.id
       WHERE te.date = ? AND te.end_time IS NULL`,
      [today]
    );

    if (!activeEntry) {
      return res.status(400).json({ error: "No active timer" });
    }

    // End the timer
    await dbRun("UPDATE time_entries SET end_time = ? WHERE id = ?", [
      now,
      activeEntry.id,
    ]);

    // Check duration and delete if less than 1 minute
    if (!isValidDuration(activeEntry.start_time, now)) {
      await dbRun("DELETE FROM time_entries WHERE id = ?", [activeEntry.id]);
      res.json({ success: true, discarded: true });
    } else {
      const duration = calculateDurationMinutes(activeEntry.start_time, now);
      await dbRun("UPDATE time_entries SET duration_minutes = ? WHERE id = ?", [
        duration,
        activeEntry.id,
      ]);
      res.json({
        success: true,
        discarded: false,
        entry: {
          id: activeEntry.id,
          task_name: activeEntry.task_name,
          duration_minutes: duration,
        },
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============= TOTALS API =============

app.get("/api/totals", async (req, res) => {
  try {
    const requestedDate = req.query.date;
    const day = isValidDateString(requestedDate)
      ? requestedDate
      : getTodayDate();
    const dayRange = getDateRangeForDay(day);

    if (!dayRange) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    const { start: dayStart, end: dayEnd } = dayRange;
    const timeEntries = await dbAll(
      `SELECT te.id, te.task_id, te.start_time, te.end_time, te.duration_minutes,
              t.name as task_name,
              GROUP_CONCAT(tp.project_id) as project_ids
       FROM time_entries te
       JOIN tasks t ON te.task_id = t.id
       LEFT JOIN task_projects tp ON t.id = tp.task_id
       WHERE te.start_time < ? AND te.end_time IS NOT NULL AND te.end_time > ?
       GROUP BY te.id`,
      [dayEnd.toISOString(), dayStart.toISOString()]
    );

    const projects = await dbAll(
      "SELECT id, name, is_builtin FROM projects ORDER BY is_builtin DESC, name"
    );

    const { byTask, byProject, byTaskPerProject } = buildDailySummary({
      entries: timeEntries,
      projects,
      dayRange: { start: dayStart, end: dayEnd },
    });

    res.json({ byTask, byProject, byTaskPerProject, date: day });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============= TIMESHEET EXPORT API =============

app.get("/api/timesheet/entries", async (req, res) => {
  try {
    const requestedDate = req.query.date;
    const day = isValidDateString(requestedDate)
      ? requestedDate
      : getTodayDate();
    const dayRange = getDateRangeForDay(day);

    if (!dayRange) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    // Get time entries that overlap with the selected day window
    const entries = await dbAll(
      `SELECT te.id, te.task_id, te.start_time, te.end_time, te.duration_minutes, t.name as task_name
       FROM time_entries te
       JOIN tasks t ON te.task_id = t.id
       WHERE te.start_time < ? AND te.end_time IS NOT NULL AND te.end_time > ?
       ORDER BY te.start_time ASC`,
      [dayRange.end.toISOString(), dayRange.start.toISOString()]
    );

    const entriesWithOverlap = (entries || []).map((entry) => ({
      ...entry,
      overlap_minutes: calculateOverlapMinutes(
        entry.start_time,
        entry.end_time,
        dayRange.start,
        dayRange.end
      ),
    }));

    res.json(entriesWithOverlap);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`ClockWise backend running on http://localhost:${PORT}`);
});
