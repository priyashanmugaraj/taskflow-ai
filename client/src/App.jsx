import { useEffect, useState } from "react";
import "./App.css";

const API = "http://localhost:5000/api";

function App() {
  const [title, setTitle] = useState("");
  const [tasks, setTasks] = useState([]);
  const [goal, setGoal] = useState("");
  const [plan, setPlan] = useState("");
  const [loading, setLoading] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editedTitle, setEditedTitle] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const loadTasks = async () => {
      try {
        const response = await fetch(`${API}/tasks`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load tasks");
        }

        setTasks(data.tasks ?? []);
      } catch (err) {
        setError(err.message || "Could not load tasks. Check your server.");
      }
    };

    loadTasks();
  }, []);

  const handleAddTask = async (taskTitle) => {
    if (!taskTitle.trim()) return;

    const response = await fetch(`${API}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: taskTitle.trim() }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to add task");
    }

    setTasks((previous) => [...previous, data.task]);
    return data.task;
  };

  const handleAddTaskSubmit = async (event) => {
    event.preventDefault();
    if (!title.trim()) return;

    setError("");

    try {
      await handleAddTask(title);
      setTitle("");
    } catch (err) {
      setError(err.message || "Failed to add task");
    }
  };

  const handleToggleTask = async (taskId) => {
    setError("");

    try {
      const response = await fetch(`${API}/tasks/${taskId}`, {
        method: "PATCH",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update task");
      }

      setTasks((previous) =>
        previous.map((task) => (task.id === taskId ? data.task : task)),
      );
    } catch (err) {
      setError(err.message || "Failed to update task");
    }
  };

  const handleDeleteTask = async (taskId) => {
    setError("");

    try {
      const response = await fetch(`${API}/tasks/${taskId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete task");
      }

      setTasks((previous) => previous.filter((task) => task.id !== taskId));
    } catch (err) {
      setError(err.message || "Failed to delete task");
    }
  };

  const handleEditTask = async (taskId) => {
    if (!editedTitle.trim()) {
      setError("Task title cannot be empty.");
      return;
    }

    setError("");

    try {
      const response = await fetch(`${API}/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editedTitle.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to edit task");
      }

      setTasks((previous) =>
        previous.map((task) => (task.id === taskId ? data.task : task)),
      );

      setEditingTaskId(null);
      setEditedTitle("");
    } catch (err) {
      setError(err.message || "Failed to edit task");
    }
  };

  const handleGeneratePlan = async (event) => {
    event.preventDefault();

    if (!goal.trim()) {
      setError("Please enter a goal first.");
      return;
    }

    setLoading(true);
    setError("");
    setPlan("");

    try {
      const response = await fetch(`${API}/ai/plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal: goal.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to generate plan");
      }

      setPlan(data.plan);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const planTasks = plan
    .split(/\r?\n/)
    .map((line) =>
      line
        .trim()
        .replace(/^[-*•]\s*/, "")
        .replace(/^\d+[.)]\s*/, "")
        .replace(/^#{1,6}\s*/, "")
        .replace(/\*\*(.*?)\*\*/g, "$1")
        .trim(),
    )
    .filter((line) => line.length > 0);

  const handleSavePlan = async () => {
    setSavingPlan(true);
    setError("");

    try {
      const existingTitles = new Set(
        tasks.map((task) => task.title.trim().toLowerCase()),
      );

      for (const taskTitle of planTasks) {
        if (!existingTitles.has(taskTitle.toLowerCase())) {
          await handleAddTask(taskTitle);
          existingTitles.add(taskTitle.toLowerCase());
        }
      }

      setPlan("");
      setGoal("");
    } catch (err) {
      setError(err.message || "Failed to save the AI plan.");
    } finally {
      setSavingPlan(false);
    }
  };

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.completed).length;
  const pendingTasks = totalTasks - completedTasks;

  const completionPercentage =
    totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  const filteredTasks = tasks.filter((task) => {
    if (filter === "pending" && task.completed) return false;
    if (filter === "completed" && !task.completed) return false;

    return task.title.toLowerCase().includes(searchTerm.trim().toLowerCase());
  });

  const taskInsight =
    totalTasks === 0
      ? "Add your first task to start tracking progress."
      : completionPercentage === 100
        ? "Excellent! All your tasks are complete."
        : `You've completed ${completedTasks} of ${totalTasks} tasks. Keep going!`;

  const nextBestAction =
    pendingTasks === 0
      ? "You're all caught up. Great work!"
      : `Focus on one of your ${pendingTasks} pending tasks next.`;

  const productivitySummary =
    completionPercentage === 100 && totalTasks > 0
      ? "Amazing work! Everything is complete."
      : completionPercentage >= 50
        ? "You're making good progress. Keep the momentum going."
        : "Small steps add up. Pick one task and get started.";

  return (
    <main className="app-container">
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">T</div>
          <div>
            <h1>
              TaskFlow <span>AI</span>
            </h1>
            <p>Your personal productivity workspace</p>
          </div>
        </div>
        <div className="ai-status">
          <span className="status-dot" />
          AI workspace
        </div>
      </header>

      <section className="welcome-section">
        <div>
          <p className="eyebrow">YOUR WORKSPACE</p>
          <h2>Good things start with a plan.</h2>
          <p className="welcome-copy">
            Organize your tasks and turn your goals into action.
          </p>
        </div>
        <div className="welcome-decoration" aria-hidden="true">
          <span>✦</span>
        </div>
      </section>

      <section className="stats-grid" aria-label="Task statistics">
        <article className="stat-card">
          <div className="stat-top">
            <span>Total tasks</span>
            <span className="stat-icon purple">▤</span>
          </div>
          <strong>{totalTasks}</strong>
          <p>All your tasks</p>
        </article>

        <article className="stat-card">
          <div className="stat-top">
            <span>Completed</span>
            <span className="stat-icon green">✓</span>
          </div>
          <strong>{completedTasks}</strong>
          <p>Tasks finished</p>
        </article>

        <article className="stat-card">
          <div className="stat-top">
            <span>Pending</span>
            <span className="stat-icon orange">◷</span>
          </div>
          <strong>{pendingTasks}</strong>
          <p>Still to do</p>
        </article>

        <article className="stat-card progress-stat">
          <div className="stat-top">
            <span>Completion rate</span>
            <span className="stat-icon purple">↗</span>
          </div>
          <strong>{completionPercentage}%</strong>
          <div className="progress-track">
            <div
              className="progress-value"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <p>Your overall progress</p>
        </article>
      </section>

      {error && (
        <div className="error-message" role="alert">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      <div className="workspace-grid">
        <section className="panel tasks-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">STAY ON TRACK</p>
              <h2>My tasks</h2>
              <p className="panel-subtitle">
                Keep your priorities moving forward.
              </p>
            </div>
            <span className="task-count">{pendingTasks} pending</span>
          </div>

          <form className="add-task-form" onSubmit={handleAddTaskSubmit}>
            <input
              type="text"
              placeholder="What needs to get done?"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              aria-label="New task title"
            />
            <button type="submit" className="primary-button">
              <span>＋</span> Add task
            </button>
          </form>

          <div className="task-toolbar">
            <label className="search-box">
              <span aria-hidden="true">⌕</span>
              <input
                type="search"
                placeholder="Search your tasks..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                aria-label="Search tasks"
              />
            </label>

            <div className="task-filters" aria-label="Filter tasks">
              {["all", "pending", "completed"].map((value) => (
                <button
                  type="button"
                  key={value}
                  className={
                    filter === value ? "filter-button active" : "filter-button"
                  }
                  onClick={() => setFilter(value)}
                >
                  {value.charAt(0).toUpperCase() + value.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="task-list-header">
            <span>
              {filter === "all"
                ? "All tasks"
                : `${filter.charAt(0).toUpperCase() + filter.slice(1)} tasks`}
            </span>
            <span>{filteredTasks.length} shown</span>
          </div>

          {tasks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">✓</div>
              <h3>Your task list starts here</h3>
              <p>Add your first task or let AI help you create a plan.</p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="empty-state compact-empty">
              <h3>No tasks found</h3>
              <p>Try another search or filter.</p>
            </div>
          ) : (
            <ul className="task-list">
              {filteredTasks.map((task) => (
                <li
                  key={task.id}
                  className={
                    task.completed ? "task-item is-complete" : "task-item"
                  }
                >
                  <button
                    type="button"
                    className={
                      task.completed ? "task-check checked" : "task-check"
                    }
                    onClick={() => handleToggleTask(task.id)}
                    aria-label={
                      task.completed ? "Mark task pending" : "Complete task"
                    }
                    title={task.completed ? "Mark pending" : "Mark complete"}
                  >
                    {task.completed ? "✓" : ""}
                  </button>

                  <div className="task-content">
                    {editingTaskId === task.id ? (
                      <input
                        className="edit-input"
                        value={editedTitle}
                        onChange={(event) => setEditedTitle(event.target.value)}
                        aria-label="Edit task title"
                        autoFocus
                      />
                    ) : (
                      <span className="task-title">{task.title}</span>
                    )}
                    <span
                      className={
                        task.completed ? "task-status done" : "task-status"
                      }
                    >
                      {task.completed ? "Completed" : "In progress"}
                    </span>
                  </div>

                  <div className="task-actions">
                    {editingTaskId === task.id ? (
                      <>
                        <button
                          type="button"
                          className="icon-button save-action"
                          onClick={() => handleEditTask(task.id)}
                          title="Save task"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          className="icon-button"
                          onClick={() => {
                            setEditingTaskId(null);
                            setEditedTitle("");
                          }}
                          title="Cancel editing"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="icon-button"
                        onClick={() => {
                          setEditingTaskId(task.id);
                          setEditedTitle(task.title);
                          setError("");
                        }}
                        title="Edit task"
                        aria-label={`Edit ${task.title}`}
                      >
                        ✎
                      </button>
                    )}

                    <button
                      type="button"
                      className="icon-button delete-action"
                      onClick={() => handleDeleteTask(task.id)}
                      title="Delete task"
                      aria-label={`Delete ${task.title}`}
                    >
                      ×
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="right-column">
          <section className="panel ai-panel">
            <div className="ai-panel-heading">
              <div className="ai-icon">✦</div>
              <div>
                <p className="eyebrow">YOUR AI ASSISTANT</p>
                <h2>Plan with AI</h2>
              </div>
            </div>

            <p className="ai-description">
              Tell me what you want to achieve. I'll help break it down into
              actionable steps.
            </p>

            <form onSubmit={handleGeneratePlan} className="goal-form">
              <label htmlFor="goal-input">Your goal</label>
              <textarea
                id="goal-input"
                placeholder="e.g. Learn React in 30 days..."
                value={goal}
                onChange={(event) => setGoal(event.target.value)}
                rows={3}
              />
              <button
                type="submit"
                className="primary-button full-button"
                disabled={loading}
              >
                {loading ? (
                  "Creating your plan..."
                ) : (
                  <>
                    ✦ Generate AI plan <span>→</span>
                  </>
                )}
              </button>
            </form>

            {!plan && (
              <div className="ai-tip">
                <span>✧</span>
                <p>Tip: A specific goal helps create a more useful plan.</p>
              </div>
            )}

            {plan && (
              <div className="generated-plan">
                <div className="generated-plan-heading">
                  <h3>Your action plan</h3>
                  <span>{planTasks.length} steps</span>
                </div>

                <ol className="plan-list">
                  {planTasks.map((line, index) => (
                    <li key={`${index}-${line}`}>
                      <span className="plan-number">{index + 1}</span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ol>

                <div className="plan-actions">
                  <button
                    type="button"
                    className="primary-button full-button"
                    onClick={handleSavePlan}
                    disabled={savingPlan}
                  >
                    {savingPlan ? "Adding tasks..." : "＋ Add plan to tasks"}
                  </button>
                  <button
                    type="button"
                    className="secondary-button full-button"
                    onClick={() => {
                      setPlan("");
                      setGoal("");
                      setError("");
                    }}
                  >
                    Discard plan
                  </button>
                </div>
              </div>
            )}
          </section>

          <section className="panel productivity-panel">
            <div className="panel-heading compact-heading">
              <div>
                <p className="eyebrow">YOUR PROGRESS</p>
                <h2>Productivity</h2>
              </div>
              <span className="productivity-icon">↗</span>
            </div>

            <div className="productivity-score">
              <strong>{completionPercentage}%</strong>
              <span>completed</span>
            </div>

            <div className="progress-track large-progress">
              <div
                className="progress-value"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>

            <div className="progress-legend">
              <span>
                <i className="legend-dot completed-dot" /> {completedTasks}{" "}
                completed
              </span>
              <span>
                <i className="legend-dot pending-dot" /> {pendingTasks} pending
              </span>
            </div>

            <details className="insights-details">
              <summary>
                View productivity insights <span>＋</span>
              </summary>
              <div className="insights-content">
                <div className="insight-item">
                  <span className="insight-symbol">✧</span>
                  <div>
                    <h3>Task insight</h3>
                    <p>{taskInsight}</p>
                  </div>
                </div>

                <div className="insight-item">
                  <span className="insight-symbol">→</span>
                  <div>
                    <h3>Next best action</h3>
                    <p>{nextBestAction}</p>
                  </div>
                </div>

                <div className="insight-item">
                  <span className="insight-symbol">↗</span>
                  <div>
                    <h3>Productivity summary</h3>
                    <p>{productivitySummary}</p>
                  </div>
                </div>
              </div>
            </details>
          </section>

          <div className="sidebar-note">
            <span>✦</span>
            <p>
              <strong>One step at a time.</strong>
              <br />
              Progress beats perfection.
            </p>
          </div>
        </aside>
      </div>

      <footer className="app-footer">
        <span>TaskFlow AI</span>
        <span>Make progress, every day.</span>
      </footer>
    </main>
  );
}

export default App;
