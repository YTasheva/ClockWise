import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  CalendarDays,
  FolderKanban,
  Globe,
  LayoutGrid,
  ListChecks,
  Mail,
  Moon,
  Linkedin,
  Sun,
} from "lucide-react";
import clockIcon from "./clockwise.logo.png";
import bannerImage from "./clockwise-banner.png";
import ProjectManager from "./components/ProjectManager";
import TaskManager from "./components/TaskManager";
import Timer from "./components/Timer";
import Totals from "./components/Totals";
import TimesheetExport from "./components/TimesheetExport";

function App() {
  const getInitialTheme = () => {
    if (typeof window === "undefined") return "light";
    const saved = window.localStorage.getItem("clockwise-theme");
    if (saved) return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  };

  const [theme, setTheme] = useState(getInitialTheme);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [linkedTaskIds, setLinkedTaskIds] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [activeTask, setActiveTask] = useState(null);
  const [currentTimer, setCurrentTimer] = useState(null);
  const [refreshTotals, setRefreshTotals] = useState(0);
  const [error, setError] = useState(null);

  const pageVariants = {
    hidden: { opacity: 0, y: 16 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  const gridVariants = {
    hidden: {},
    show: {
      transition: { staggerChildren: 0.12, delayChildren: 0.1 },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 18 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const heroVariants = {
    hidden: { opacity: 0, y: 14 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const heroChildVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };


  // Fetch projects
  useEffect(() => {
    console.log("useEffect: fetching projects");
    fetchProjects();
  }, []);

  // Set default project (No Project)
  useEffect(() => {
    if (projects.length > 0 && !activeProject) {
      const noProject = projects.find((p) => p.is_builtin);
      setActiveProject(noProject);
    }
  }, [projects]);

  // Fetch tasks (all tasks, not filtered by project)
  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    if (activeProject?.id) {
      fetchProjectTasks(activeProject.id);
      setActiveTask(null);
    } else {
      setLinkedTaskIds([]);
      setActiveTask(null);
    }
  }, [activeProject]);

  // Fetch current timer
  useEffect(() => {
    fetchCurrentTimer();
    const interval = setInterval(fetchCurrentTimer, 1000); // Update every second for elapsed time
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    document.body.dataset.theme = theme;
    window.localStorage.setItem("clockwise-theme", theme);
  }, [theme]);

  const fetchProjects = async () => {
    try {
      console.log("Fetching projects from /api/projects");
      const response = await fetch("/api/projects");
      const data = await response.json();
      console.log("Projects fetched:", data);
      setProjects(data);
    } catch (error) {
      console.error("Error fetching projects:", error);
      setError("Failed to load projects: " + error.message);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await fetch("/api/tasks");
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  const fetchProjectTasks = async (projectId) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/tasks`);
      const data = await response.json();
      setLinkedTaskIds(data.map((task) => task.id));
    } catch (error) {
      console.error("Error fetching project tasks:", error);
    }
  };

  const fetchCurrentTimer = async () => {
    try {
      const response = await fetch("/api/timer/current");
      const data = await response.json();
      setCurrentTimer(data);
    } catch (error) {
      console.error("Error fetching current timer:", error);
    }
  };

  const handleProjectAdded = () => {
    fetchProjects();
  };

  const handleProjectDeleted = () => {
    fetchProjects();
    setRefreshTotals((prev) => prev + 1);
  };

  const handleTaskAdded = () => {
    fetchTasks();
  };

  const handleTaskDeleted = () => {
    fetchTasks();
    setRefreshTotals((prev) => prev + 1);
  };

  const handleTaskLinkChange = (payload) => {
    if (!activeProject?.id) return;
    if (payload?.action === "link" && payload.taskId) {
      setLinkedTaskIds([payload.taskId]);
      if (!payload?.optimistic) {
        fetchProjectTasks(activeProject.id);
      }
      return;
    }

    if (payload?.action === "unlink") {
      setLinkedTaskIds([]);
      if (!payload?.optimistic) {
        fetchProjectTasks(activeProject.id);
      }
      return;
    }

    if (payload?.action === "refresh") {
      fetchProjectTasks(activeProject.id);
    }
  };

  const handleTaskSelect = async (task) => {
    if (!task) return;
    setActiveTask(task);
  };

  const handleTimerStarted = () => {
    fetchCurrentTimer();
  };

  const handleTimerEnded = () => {
    fetchCurrentTimer();
    setRefreshTotals((prev) => prev + 1);
  };

  const dateLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="app">
      {error && <div className="error-alert">{error}</div>}
      <motion.header
        className="app-header"
        variants={pageVariants}
        initial="hidden"
        animate="show"
      >
        <div className="container-lg header-bar">
          <nav className="app-nav">
            <motion.div className="brand" variants={cardVariants}>
              <div>
                <h1>
                  <img
                    src={clockIcon}
                    alt=""
                    className="title-icon-image"
                    aria-hidden="true"
                  />
                  ClockWise
                </h1>
                <p>Time Tracking Application</p>
              </div>
            </motion.div>
            <motion.div className="header-actions" variants={cardVariants}>
              <TimesheetExport />
              <button
                type="button"
                className="theme-toggle"
                onClick={() =>
                  setTheme((prev) => (prev === "dark" ? "light" : "dark"))
                }
              >
                <span className="btn-icon" aria-hidden="true">
                  {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                </span>
                {theme === "dark" ? "Light Scene" : "Dark Scene"}
              </button>
              <div className="date-pill">
                <CalendarDays size={16} />
                <span>{dateLabel}</span>
              </div>
            </motion.div>
          </nav>
        </div>
      </motion.header>

      <main className="app-main">
        <div className="container-lg">
          <motion.section
            className="hero"
            variants={heroVariants}
            initial="hidden"
            animate="show"
          >
            <motion.div className="hero-content" variants={heroChildVariants}>
              <h2>Track focused work, beautifully.</h2>
              <p>
                Link a task to a project, start the timer, and review clean daily
                summaries with a single export.
              </p>
            </motion.div>
            <motion.div className="hero-media" variants={heroChildVariants}>
              <img
                src={bannerImage}
                alt="ClockWise hero banner"
                className="hero-banner"
              />
            </motion.div>
          </motion.section>
          <motion.div
            className="dashboard-grid"
            variants={gridVariants}
            initial="hidden"
            animate="show"
          >
            <motion.section
              className="section timer-section"
              variants={cardVariants}
            >
              <Timer
                currentTimer={currentTimer}
                activeTask={activeTask}
                activeProject={activeProject}
                linkedTaskIds={linkedTaskIds}
                tasks={tasks}
                onTaskSelect={handleTaskSelect}
                onProjectLinkChange={handleTaskLinkChange}
                onTimerStarted={handleTimerStarted}
                onTimerEnded={handleTimerEnded}
              />
            </motion.section>

            <motion.section
              className="section totals-section"
              variants={cardVariants}
            >
              <div className="section-header">
                <h2>
                  <span className="section-icon" aria-hidden="true">
                    <LayoutGrid size={18} />
                  </span>
                  Today's Totals
                </h2>
              </div>
              <Totals refreshKey={refreshTotals} />
            </motion.section>

            <motion.section
              className="section manage-section"
              variants={cardVariants}
            >
              <div className="section-header">
                <h2>
                  <span className="section-icon" aria-hidden="true">
                    <ListChecks size={18} />
                  </span>
                  Manage Projects & Tasks
                </h2>
              </div>
              <div className="manage-grid">
                <div className="manage-panel">
                  <h3>
                    <span className="section-icon" aria-hidden="true">
                      <FolderKanban size={16} />
                    </span>
                    Projects
                  </h3>
                  <ProjectManager
                    projects={projects}
                    activeProject={activeProject}
                    onProjectSelect={setActiveProject}
                    onProjectAdded={handleProjectAdded}
                    onProjectDeleted={handleProjectDeleted}
                  />
                </div>
                <div className="manage-panel manage-panel-tasks">
                  <h3>
                    <span className="section-icon" aria-hidden="true">
                      <ListChecks size={16} />
                    </span>
                    Tasks
                  </h3>
                  <TaskManager
                    tasks={tasks}
                    projects={projects}
                    activeProject={activeProject}
                    activeTask={activeTask}
                    linkedTaskIds={linkedTaskIds}
                    onTaskSelect={handleTaskSelect}
                    onTaskAdded={handleTaskAdded}
                    onTaskDeleted={handleTaskDeleted}
                    onTaskLinked={handleTaskLinkChange}
                  />
                </div>
              </div>
            </motion.section>
          </motion.div>
        </div>
      </main>
      <footer className="app-footer">
        <div className="container-lg">
          <div className="footer-content">
            <div className="footer-brand">
              <h4>ClockWise</h4>
              <p>Time Tracking Application</p>
              <span>© {new Date().getFullYear()} Yuliya Tasheva</span>
            </div>
            <div className="footer-links">
              <a href="mailto:info@yuliya-tasheva.co.uk" className="footer-link">
                <Mail size={16} aria-hidden="true" />
                info@yuliya-tasheva.co.uk
              </a>
              <a
                href="https://yuliya-tasheva.co.uk"
                className="footer-link"
                target="_blank"
                rel="noreferrer"
              >
                <Globe size={16} aria-hidden="true" />
                yuliya-tasheva.co.uk
              </a>
              <a
                href="https://www.linkedin.com/company/yuliya-stella-tasheva"
                className="footer-link"
                target="_blank"
                rel="noreferrer"
              >
                <Linkedin size={16} aria-hidden="true" />
                LinkedIn
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
