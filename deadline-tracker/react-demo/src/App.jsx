import { useState, useEffect } from 'react';
import TaskStats from './components/TaskStats.jsx';
import TaskList from './components/TaskList.jsx';
import TaskForm from './components/TaskForm.jsx';
import UrgentTaskClock from './components/UrgentTaskClock.jsx';
import initialTasks from './data/initialTasks.js';

/**
 * App - the root functional component. Holds the task list in state
 * (Unit V: React state) and passes slices of it down to child
 * components via props. `view` drives a tiny hand-rolled "router"
 * (Unit V: routing concepts) that swaps the visible section without
 * pulling in react-router.
 */
function App() {
  const [tasks, setTasks] = useState(initialTasks);
  const [view, setView] = useState('dashboard');

  // useEffect Hook: synchronise the browser tab title with whichever
  // view is currently active - a side effect that must re-run
  // whenever `view` changes, so it is listed as a dependency.
  useEffect(() => {
    document.title = `Deadline Tracker React Demo - ${view[0].toUpperCase()}${view.slice(1)}`;
  }, [view]);

  function addTask(task) {
    setTasks((prev) => [...prev, task]);
  }

  function toggleTask(id) {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: t.status === 'Completed' ? 'Pending' : 'Completed' } : t))
    );
  }

  function deleteTask(id) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  const pendingTasks = tasks.filter((t) => t.status !== 'Completed');
  const mostUrgentTask = pendingTasks
    .slice()
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))[0] || null;

  return (
    <div className="react-app">
      <header className="react-app-header">
        <h1>Deadline Tracker - React Demo</h1>
        <p>Unit IV / Unit V ReactJS syllabus demonstration (separate from the PHP + MySQL application).</p>
        <nav className="react-nav">
          <button className={view === 'dashboard' ? 'active' : ''} onClick={() => setView('dashboard')}>Dashboard</button>
          <button className={view === 'tasks' ? 'active' : ''} onClick={() => setView('tasks')}>Tasks</button>
          <button className={view === 'about' ? 'active' : ''} onClick={() => setView('about')}>About</button>
        </nav>
      </header>

      <main className="react-app-main">
        {view === 'dashboard' && (
          <section>
            <TaskStats tasks={tasks} />
            <UrgentTaskClock mostUrgentTask={mostUrgentTask} />
          </section>
        )}

        {view === 'tasks' && (
          <section>
            <TaskForm onAdd={addTask} />
            <TaskList tasks={tasks} onToggle={toggleTask} onDelete={deleteTask} />
          </section>
        )}

        {view === 'about' && (
          <section className="react-about">
            <h2>Case study: how this demo builds a dynamic UI</h2>
            <ul>
              <li><strong>State:</strong> <code>tasks</code> and <code>view</code> live in <code>App</code> via <code>useState</code>.</li>
              <li><strong>Props:</strong> <code>App</code> passes <code>tasks</code> down to <code>TaskStats</code>/<code>TaskList</code>; children call back up (<code>onToggle</code>, <code>onDelete</code>, <code>onAdd</code>) instead of mutating state directly.</li>
              <li><strong>Props validation:</strong> every child declares <code>propTypes</code> (see each component file) using the <code>prop-types</code> package.</li>
              <li><strong>Styling:</strong> plain CSS in <code>src/styles.css</code>, scoped with component-specific class names.</li>
              <li><strong>Hooks:</strong> <code>useState</code> for all state, <code>useEffect</code> to keep the document title in sync with the active view.</li>
              <li><strong>Lifecycle/class component:</strong> <code>UrgentTaskClock</code> is a class component using a constructor plus <code>componentDidMount</code>/<code>componentWillUnmount</code> to run a ticking countdown.</li>
              <li><strong>Routing:</strong> the three-button nav above swaps sections by changing a single state value - no router library involved.</li>
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
