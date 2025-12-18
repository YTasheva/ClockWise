import React, { useState, useEffect } from 'react';

function Timer({ currentTimer, activeTask, activeProject, tasks, onTimerStarted, onTimerEnded }) {
  const [elapsedTime, setElapsedTime] = useState('00:00');
  const [selectedTask, setSelectedTask] = useState(null);

  // Update selected task when active task changes
  useEffect(() => {
    if (activeTask) {
      setSelectedTask(activeTask);
    }
  }, [activeTask]);

  // Update elapsed time display
  useEffect(() => {
    if (currentTimer?.active && currentTimer?.start_time) {
      const interval = setInterval(() => {
        const start = new Date(currentTimer.start_time);
        const now = new Date();
        const diffMs = now - start;
        const totalMinutes = Math.floor(diffMs / (1000 * 60));
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        setElapsedTime(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
      }, 1000);
      return () => clearInterval(interval);
    } else if (currentTimer?.elapsed_minutes !== undefined) {
      const hours = Math.floor(currentTimer.elapsed_minutes / 60);
      const minutes = currentTimer.elapsed_minutes % 60;
      setElapsedTime(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
    } else {
      setElapsedTime('00:00');
    }
  }, [currentTimer]);

  const handleStartTimer = async (taskId) => {
    if (!taskId) {
      alert('Please select a task');
      return;
    }

    try {
      const response = await fetch('/api/timer/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_id: taskId })
      });

      if (!response.ok) {
        const data = await response.json();
        alert('Error: ' + (data.error || 'Failed to start timer'));
        return;
      }

      onTimerStarted();
    } catch (err) {
      alert('Error starting timer: ' + err.message);
    }
  };

  const handleEndTimer = async () => {
    try {
      const response = await fetch('/api/timer/end', { method: 'POST' });

      if (!response.ok) {
        const data = await response.json();
        alert('Error: ' + (data.error || 'Failed to end timer'));
        return;
      }

      const data = await response.json();
      if (data.discarded) {
        alert('Entry was too short (less than 1 minute) and was not recorded.');
      }

      onTimerEnded();
    } catch (err) {
      alert('Error ending timer: ' + err.message);
    }
  };

  return (
    <div>
      <div className="timer-display">
        {currentTimer?.active && currentTimer?.task_name ? (
          <div className="timer-task-info">
            <p className="label">Currently tracking:</p>
            <p><strong>{currentTimer.task_name}</strong></p>
          </div>
        ) : (
          <div className="timer-task-info">
            <p className="label">No active timer</p>
          </div>
        )}

        <div className="timer-time">{elapsedTime}</div>

        <div className="timer-controls">
          {!currentTimer?.active ? (
            <button
              className="play-btn"
              onClick={() => handleStartTimer(selectedTask?.id || activeTask?.id)}
            >
              Start
            </button>
          ) : (
            <>
              <button
                className="end-btn"
                onClick={handleEndTimer}
              >
                End
              </button>
            </>
          )}
        </div>
      </div>

      {!currentTimer?.active && (
        <div className="task-selector">
          <h3>Quick Select All Tasks</h3>
          <div className="task-quick-select">
            {tasks.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: '#95a5a6' }}>No tasks defined</p>
            ) : (
              tasks.map(task => (
                <button
                  key={task.id}
                  className={`task-quick-btn ${selectedTask?.id === task.id ? 'active' : ''}`}
                  onClick={() => setSelectedTask(task)}
                  title={task.name}
                >
                  {task.name}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Timer;
