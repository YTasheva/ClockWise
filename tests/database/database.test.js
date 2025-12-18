import { describe, it, expect, beforeAll, afterAll } from "vitest";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const testDbPath = path.join(__dirname, "../../test_db.sqlite");

let db;

// Initialize test database
function initializeTestDatabase() {
  const schema = `
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      is_builtin INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS task_projects (
      task_id INTEGER NOT NULL,
      project_id INTEGER NOT NULL,
      PRIMARY KEY (task_id, project_id),
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS time_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      date DATE NOT NULL,
      start_time DATETIME NOT NULL,
      end_time DATETIME,
      duration_minutes INTEGER,
      FOREIGN KEY (task_id) REFERENCES tasks(id),
      UNIQUE(task_id, date, start_time)
    );
  `;

  db.exec(schema);

  // Insert built-in project
  db.prepare(
    `INSERT OR IGNORE INTO projects (name, is_builtin) VALUES (?, 1)`
  ).run(["No Project"]);
}

describe("Database Tests", () => {
  beforeAll(() => {
    // Clean up if test database exists
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    db = new Database(testDbPath);
    initializeTestDatabase();
  });

  afterAll(() => {
    db.close();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe("Projects Table", () => {
    it("should create projects table", () => {
      const result = db
        .prepare(
          `SELECT name FROM sqlite_master WHERE type='table' AND name='projects'`
        )
        .get();
      expect(result).toBeDefined();
    });

    it("should insert a new project", () => {
      db.prepare(`INSERT INTO projects (name, is_builtin) VALUES (?, 0)`).run([
        "Test Project",
      ]);
      const project = db
        .prepare(`SELECT * FROM projects WHERE name = ?`)
        .get(["Test Project"]);
      expect(project).toBeDefined();
      expect(project.name).toBe("Test Project");
      expect(project.is_builtin).toBe(0);
    });

    it("should prevent duplicate project names", () => {
      db.prepare(`INSERT INTO projects (name, is_builtin) VALUES (?, 0)`).run([
        "Unique Project",
      ]);
      expect(() => {
        db.prepare(`INSERT INTO projects (name, is_builtin) VALUES (?, 0)`).run(
          ["Unique Project"]
        );
      }).toThrow();
    });

    it("should have No Project as built-in", () => {
      const project = db
        .prepare(`SELECT * FROM projects WHERE name = ?`)
        .get(["No Project"]);
      expect(project).toBeDefined();
      expect(project.is_builtin).toBe(1);
    });
  });

  describe("Tasks Table", () => {
    it("should create tasks table", () => {
      const result = db
        .prepare(
          `SELECT name FROM sqlite_master WHERE type='table' AND name='tasks'`
        )
        .get();
      expect(result).toBeDefined();
    });

    it("should insert a new task", () => {
      db.prepare(`INSERT INTO tasks (name) VALUES (?)`).run(["Write Tests"]);
      const task = db
        .prepare(`SELECT * FROM tasks WHERE name = ?`)
        .get(["Write Tests"]);
      expect(task).toBeDefined();
      expect(task.name).toBe("Write Tests");
    });

    it("should prevent duplicate task names", () => {
      db.prepare(`INSERT INTO tasks (name) VALUES (?)`).run(["Code Review"]);
      expect(() => {
        db.prepare(`INSERT INTO tasks (name) VALUES (?)`).run(["Code Review"]);
      }).toThrow();
    });

    it("should update task name", () => {
      db.prepare(`INSERT INTO tasks (name) VALUES (?)`).run(["Old Name"]);
      db.prepare(`UPDATE tasks SET name = ? WHERE name = ?`).run([
        "New Name",
        "Old Name",
      ]);
      const task = db
        .prepare(`SELECT * FROM tasks WHERE name = ?`)
        .get(["New Name"]);
      expect(task).toBeDefined();
      expect(task.name).toBe("New Name");
    });
  });

  describe("Task-Project Junction Table", () => {
    beforeAll(() => {
      db.prepare(`INSERT INTO projects (name, is_builtin) VALUES (?, 0)`).run([
        "Junction Test Project",
      ]);
      db.prepare(`INSERT INTO tasks (name) VALUES (?)`).run([
        "Junction Test Task",
      ]);
    });

    it("should link task to project", () => {
      const task = db
        .prepare(`SELECT id FROM tasks WHERE name = ?`)
        .get(["Junction Test Task"]);
      const project = db
        .prepare(`SELECT id FROM projects WHERE name = ?`)
        .get(["Junction Test Project"]);

      db.prepare(
        `INSERT INTO task_projects (task_id, project_id) VALUES (?, ?)`
      ).run([task.id, project.id]);

      const link = db
        .prepare(
          `SELECT * FROM task_projects WHERE task_id = ? AND project_id = ?`
        )
        .get([task.id, project.id]);
      expect(link).toBeDefined();
    });

    it("should prevent duplicate task-project links", () => {
      const task = db
        .prepare(`SELECT id FROM tasks WHERE name = ?`)
        .get(["Junction Test Task"]);
      const project = db
        .prepare(`SELECT id FROM projects WHERE name = ?`)
        .get(["Junction Test Project"]);

      expect(() => {
        db.prepare(
          `INSERT INTO task_projects (task_id, project_id) VALUES (?, ?)`
        ).run([task.id, project.id]);
      }).toThrow();
    });
  });

  describe("Time Entries Table", () => {
    beforeAll(() => {
      db.prepare(`INSERT INTO tasks (name) VALUES (?)`).run([
        "Time Entry Task",
      ]);
    });

    it("should insert a time entry", () => {
      const task = db
        .prepare(`SELECT id FROM tasks WHERE name = ?`)
        .get(["Time Entry Task"]);
      const today = new Date().toISOString().split("T")[0];
      const startTime = "2025-12-18T10:00:00Z";

      db.prepare(
        `INSERT INTO time_entries (task_id, date, start_time) VALUES (?, ?, ?)`
      ).run([task.id, today, startTime]);

      const entry = db
        .prepare(`SELECT * FROM time_entries WHERE task_id = ?`)
        .get([task.id]);
      expect(entry).toBeDefined();
      expect(entry.task_id).toBe(task.id);
      expect(entry.end_time).toBeNull();
    });

    it("should update end_time on timer end", () => {
      const task = db
        .prepare(`SELECT id FROM tasks WHERE name = ?`)
        .get(["Time Entry Task"]);
      const endTime = "2025-12-18T10:30:00Z";

      db.prepare(
        `UPDATE time_entries SET end_time = ?, duration_minutes = ? WHERE task_id = ?`
      ).run([endTime, 30, task.id]);

      const entry = db
        .prepare(`SELECT * FROM time_entries WHERE task_id = ?`)
        .get([task.id]);
      expect(entry.end_time).toBe(endTime);
      expect(entry.duration_minutes).toBe(30);
    });
  });
});
