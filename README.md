<h1 align="center">ClockWise</h1>
  <br>
  <a href="https://github.com/ytasheva">
      <img src="https://img.shields.io/badge/SayThanks.io-%E2%98%BC-1EAEDB.svg?style=for-the-badge" alt=""></a>
  <a href="https://github.com/ytasheva/ClockWise/graphs/contributors">
      <img src="https://img.shields.io/github/contributors/ytasheva/ClockWise.svg?style=for-the-badge" alt=""></a>
  <a href="https://github.com/ytasheva/ClockWise/issues">
      <img src="https://img.shields.io/github/issues/ytasheva/ClockWise.svg?style=for-the-badge" alt=""></a>
  <a href="https://github.com/ytasheva/ClockWise/network/members">
      <img src="https://img.shields.io/github/forks/ytasheva/ClockWise.svg?style=for-the-badge" alt=""></a>

## Table of contents

- [Overview](#overview)
- [Features](#features)
- [Links](#links)
- [Quick Start](#quick-start)
  - [Prerequisites](#prerequisites)
  - [Installation & Setup](#installation-&-setup)
  - [Running the Application](#running-the-application)
- [How to Use](#how-to-use)
  - [Setup Your Projects and Tasks](#setup-your-projects-and-tasks)
  - [Track Time](#track-time)
  - [Quick Task Switching](#quick-task-switching)
  - [View Daily Totals](#view-daily-totals)
- [Data Storage](#data-storage)
- [Time Tracking Rules](#time-tracking-rules)
- [Architecture](#architecture)
- [API Endpoints](#api-endpoints)
- [Project Structure](#project-structure)
- [Development](#development)
  - [Testing](#testing)
- [Licence](#licence)
- [Authors](#authors)

## Overview

A web-based time tracking application that helps you keep track of how much time you spend on tasks during your working day.

## Features

- **Project Management** - Create and organize projects (includes a built-in "No Project" for unassigned tasks)
- **Task Management** - Add tasks to projects with quick switching between tasks and projects
- **Real-time Timer** - Track time with minute-level precision (HH:MM format)
- **Daily Summary** - View total time spent on each task, project, and task-per-project
- **Daily Isolation** - Data is organized by day with a 4 AM boundary (time before 4 AM belongs to the previous day)
- **Persistent Storage** - All data is stored locally in SQLite

## Screenshot

<img width="1497" alt="Screenshot" src="https://github.com/YTasheva/ClockWise/blob/main/frontend/src/screenshot2.jpg">

## Links

- [Deployed Application](https://)
- [GitHub Repo](https://github.com/YTasheva/ClockWise)

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm

### Installation & Setup

1. **Install backend dependencies:**

   ```bash
   cd backend
   npm install
   ```

2. **Install frontend dependencies:**
   ```bash
   cd ../frontend
   npm install
   ```

### Running the Application

1. **Start the backend (Terminal 1):**

   ```bash
   cd backend
   npm run dev
   ```

   The backend will run on `http://localhost:3001`

2. **Start the frontend (Terminal 2):**

   ```bash
   cd frontend
   npm run dev
   ```

   The frontend will run on `http://localhost:3000`

3. **Open your browser** and navigate to `http://localhost:3000`

## How to Use

### Setup Your Projects and Tasks

1. Use the **Projects** section to create projects (or use the default "No Project")
2. Select a project and use the **Tasks** section to create tasks for that project

### Track Time

1. Click on a task in the **Tasks** section to select it
2. In the **Timer** section, click the **Start** button to begin tracking
3. The timer will show elapsed time in HH:MM format
4. Click **End** to stop tracking and record the entry
   - Entries shorter than 1 minute are automatically discarded

### Quick Task Switching

- **1 click to switch tasks in same project:** Click a different task in the current project
- **1 click to switch projects for same task:** Select a different project, then click the active task again
- **2 clicks for different task+project:** Select the new project, then click the desired task

### View Daily Totals

The **Daily Summary** section shows:

- **Total Time by Task** - Time spent on each task
- **Total Time by Project** - Time spent on each project
- **Total Time by Task per Project** - Breakdown of each task within each project

## Data Storage

All data is stored locally in a SQLite database at:

```
~/Library/Application Support/ClockWise/clockwise.db
```

## Time Tracking Rules

- **Time precision:** Recorded to the minute (start and stop times)
- **Minimum duration:** Entries must be at least 1 minute to be recorded
- **Non-overlapping tasks:** Starting a new task automatically ends the previous one
- **Daily boundary:** New days start at 4 AM (time before 4 AM belongs to the previous day)

## Architecture

- **Backend:** Node.js + Express + SQLite3
- **Frontend:** React + Vite
- **Data:** Local SQLite database
- **Communication:** REST API over HTTP

## API Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/projects` | List projects |
| POST | `/api/projects` | Create project |
| PUT | `/api/projects/:id` | Rename project |
| DELETE | `/api/projects/:id` | Delete project |
| GET | `/api/tasks` | List tasks |
| POST | `/api/tasks` | Create task |
| PUT | `/api/tasks/:id` | Rename task |
| DELETE | `/api/tasks/:id` | Delete task |
| GET | `/api/timer/current` | Fetch active timer |
| POST | `/api/timer/start` | Start timer for task |
| POST | `/api/timer/end` | End active timer |
| GET | `/api/totals` | Daily totals summary |
| GET | `/api/timesheet/entries` | Daily time entries |

## Project Structure

```
ClockWise/
├── backend/
│   ├── database.js       - Database initialization and helpers
│   ├── utils.js          - Time calculation utilities
│   ├── server.js         - Express server and API endpoints
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx       - Main application component
│   │   ├── main.jsx      - React entry point
│   │   ├── index.css     - Global styles
│   │   └── components/
│   │       ├── ProjectManager.jsx  - Project CRUD
│   │       ├── TaskManager.jsx     - Task CRUD
│   │       ├── Timer.jsx           - Timer controls
│   │       └── Totals.jsx          - Daily summary display
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── README.md
└── LICENSE
```

## Development

To work on the application:

1. Run both servers together from repo root with `npm run dev`
2. Backend changes automatically reload with `npm run dev`
3. Frontend changes automatically reload with Vite's hot module replacement
4. Make API changes in `backend/server.js`
5. Make UI changes in `frontend/src/`

### Testing

Run the full test suite from the repo root:

```bash
npx vitest run --no-cache
```

## License

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Authors

- GitHub - [YTasheva](https://github.com/YTasheva) | [Yuliya Tasheva](https://github.com/YTasheva)
- For any questions, suggestions, or issues, please contact our team at
  
> Email [info@yuliya-tasheva.co.uk](#) &nbsp;&middot;&nbsp;
> Copyright &copy; 2026 All Rights Reserved. Site By Yuliya Tasheva&reg;

**Thank you for using and contributing to the ClockWise app! Your support helps us continually improve and deliver the best shipping management experience.**
