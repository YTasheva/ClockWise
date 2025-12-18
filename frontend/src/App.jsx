import React, { useState, useEffect } from 'react';
import ProjectManager from './components/ProjectManager';
import TaskManager from './components/TaskManager';
import Timer from './components/Timer';
import Totals from './components/Totals';
import TimesheetExport from './components/TimesheetExport';

function App() {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [activeTask, setActiveTask] = useState(null);
  const [currentTimer, setCurrentTimer] = useState(null);
  const [refreshTotals, setRefreshTotals] = useState(0);
  const [error, setError] = useState(null);

  // Fetch projects
  useEffect(() => {
    console.log('useEffect: fetching projects');
    fetchProjects();
  }, []);

  // Set default project (No Project)
  useEffect(() => {
    if (projects.length > 0 && !activeProject) {
      const noProject = projects.find(p => p.is_builtin);
      setActiveProject(noProject);
    }
  }, [projects]);

  // Fetch tasks (all tasks, not filtered by project)
  useEffect(() => {
    fetchTasks();
  }, []);

  // Fetch current timer
  useEffect(() => {
    fetchCurrentTimer();
    const interval = setInterval(fetchCurrentTimer, 1000); // Update every second for elapsed time
    return () => clearInterval(interval);
  }, []);

  const fetchProjects = async () => {
    try {
      console.log('Fetching projects from /api/projects');
      const response = await fetch('/api/projects');
      const data = await response.json();
      console.log('Projects fetched:', data);
      setProjects(data);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setError('Failed to load projects: ' + error.message);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks');
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchCurrentTimer = async () => {
    try {
      const response = await fetch('/api/timer/current');
      const data = await response.json();
      setCurrentTimer(data);
    } catch (error) {
      console.error('Error fetching current timer:', error);
    }
  };

  const handleProjectAdded = () => {
    fetchProjects();
  };

  const handleProjectDeleted = () => {
    fetchProjects();
    setRefreshTotals(prev => prev + 1);
  };

  const handleTaskAdded = () => {
    fetchTasks();
  };

  const handleTaskDeleted = () => {
    fetchTasks();
    setRefreshTotals(prev => prev + 1);
  };

  const handleTimerStarted = () => {
    fetchCurrentTimer();
  };

  const handleTimerEnded = () => {
    fetchCurrentTimer();
    setRefreshTotals(prev => prev + 1);
  };

  return (
    <div className="app">
      {error && <div className="error-alert">{error}</div>}
      <header className="app-header">
        <div className="container-lg">
          <h1>ClockWise</h1>
          <p>Time Tracking Application</p>
        </div>
      </header>

      <main className="app-main">
        <div className="container-lg">
          <section className="section projects-section">
            <h2>Projects</h2>
            <ProjectManager 
              projects={projects}
              activeProject={activeProject}
              onProjectSelect={setActiveProject}
              onProjectAdded={handleProjectAdded}
              onProjectDeleted={handleProjectDeleted}
            />
          </section>

          <section className="section tasks-section">
            <h2>Tasks</h2>
            <TaskManager 
              tasks={tasks}
              projects={projects}
              activeProject={activeProject}
              activeTask={activeTask}
              onTaskSelect={setActiveTask}
              onTaskAdded={handleTaskAdded}
              onTaskDeleted={handleTaskDeleted}
            />
          </section>

          <section className="section timer-section">
            <Timer 
              currentTimer={currentTimer}
              activeTask={activeTask}
              activeProject={activeProject}
              tasks={tasks}
              onTimerStarted={handleTimerStarted}
              onTimerEnded={handleTimerEnded}
            />
          </section>

          <section className="section totals-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0 }}>Daily Totals</h2>
              <TimesheetExport />
            </div>
            <Totals refreshKey={refreshTotals} />
          </section>
        </div>
      </main>
    </div>
  );
}

export default App;
