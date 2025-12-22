import sqlite3 from "sqlite3";
import path from "path";
import os from "os";
import fs from "fs";

const DEFAULT_DB_DIR = path.join(
  os.homedir(),
  "Library",
  "Application Support",
  "ClockWise"
);
const FALLBACK_DB_DIR = path.join(process.cwd(), "data");

function ensureDirectoryWritable(dir) {
  try {
    fs.mkdirSync(dir, { recursive: true });
    fs.accessSync(dir, fs.constants.W_OK);
    return dir;
  } catch (error) {
    console.warn(`Cannot use database directory "${dir}": ${error.message}`);
    return null;
  }
}

const resolvedDbDir =
  ensureDirectoryWritable(process.env.CLOCKWISE_DB_DIR || DEFAULT_DB_DIR) ||
  ensureDirectoryWritable(FALLBACK_DB_DIR);

if (!resolvedDbDir) {
  throw new Error("Unable to find a writable directory for the database");
}

const DB_PATH = path.join(resolvedDbDir, "clockwise.db");

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error("Database connection error:", err);
  } else {
    console.log("Connected to SQLite database at:", DB_PATH);
  }
});

// Enable foreign keys
db.run("PRAGMA foreign_keys = ON");

export function initializeDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Drop old tables if they exist (for migration)
      db.run("DROP TABLE IF EXISTS time_entries", (err) => {
        if (err) console.log("Dropping time_entries:", err);
      });
      db.run("DROP TABLE IF EXISTS task_projects", (err) => {
        if (err) console.log("Dropping task_projects:", err);
      });
      db.run("DROP TABLE IF EXISTS tasks", (err) => {
        if (err) console.log("Dropping tasks:", err);
      });
      db.run("DROP TABLE IF EXISTS projects", (err) => {
        if (err) console.log("Dropping projects:", err);
      });

      // Projects table
      db.run(
        `
        CREATE TABLE IF NOT EXISTS projects (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          is_builtin INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `,
        (err) => {
          if (err) reject(err);
        }
      );

      // Create built-in "No Project" if it doesn't exist
      db.run(
        `INSERT OR IGNORE INTO projects (name, is_builtin) VALUES (?, 1)`,
        ["No Project"],
        (err) => {
          if (err) reject(err);
        }
      );

      // Tasks table (no project_id - tasks are independent)
      db.run(
        `
        CREATE TABLE IF NOT EXISTS tasks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `,
        (err) => {
          if (err) reject(err);
        }
      );

      // Task-Project junction table (many-to-many)
      db.run(
        `
        CREATE TABLE IF NOT EXISTS task_projects (
          task_id INTEGER NOT NULL,
          project_id INTEGER NOT NULL,
          PRIMARY KEY (task_id, project_id),
          FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
          FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        )
      `,
        (err) => {
          if (err) reject(err);
        }
      );

      // Time entries table
      db.run(
        `
        CREATE TABLE IF NOT EXISTS time_entries (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          task_id INTEGER NOT NULL,
          date DATE NOT NULL,
          start_time DATETIME NOT NULL,
          end_time DATETIME,
          duration_minutes INTEGER,
          FOREIGN KEY (task_id) REFERENCES tasks(id),
          UNIQUE(task_id, date, start_time)
        )
      `,
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  });
}

// Helper functions for database queries
export function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

export function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

export function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

export default db;
