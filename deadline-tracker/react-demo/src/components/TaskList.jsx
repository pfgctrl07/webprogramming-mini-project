import PropTypes from 'prop-types';

function formatDeadline(iso) {
  return new Date(iso).toLocaleString(undefined, {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

/**
 * TaskList - functional component demonstrating JSX, props, and
 * reusable list rendering. onToggle/onDelete are callback props
 * (data flows down as props, events flow up as function calls) -
 * the standard React dataflow pattern from Unit V.
 */
function TaskList({ tasks, onToggle, onDelete }) {
  if (tasks.length === 0) {
    return <p className="empty-state">No tasks yet. Add one using the form above.</p>;
  }

  return (
    <ul className="react-task-list">
      {tasks.map((task) => {
        const overdue = task.status !== 'Completed' && new Date(task.deadline).getTime() < Date.now();
        return (
          <li key={task.id} className={`react-task-item priority-${task.priority.toLowerCase()} ${task.status === 'Completed' ? 'is-completed' : ''}`}>
            <div className="react-task-main">
              <strong>{task.title}</strong>
              <span className="react-task-subject">{task.subject}</span>
              <span className={`react-task-deadline ${overdue ? 'is-overdue' : ''}`}>
                {overdue ? 'Overdue - ' : ''}{formatDeadline(task.deadline)}
              </span>
            </div>
            <div className="react-task-actions">
              <button type="button" onClick={() => onToggle(task.id)}>
                {task.status === 'Completed' ? 'Reopen' : 'Mark Complete'}
              </button>
              <button type="button" className="danger" onClick={() => onDelete(task.id)}>
                Delete
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

TaskList.propTypes = {
  tasks: PropTypes.array.isRequired,
  onToggle: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

export default TaskList;
