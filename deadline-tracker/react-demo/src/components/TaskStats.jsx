import PropTypes from 'prop-types';

/**
 * TaskStats - a functional component that receives data purely
 * through props (Unit V: React props) and renders it. It owns no
 * state of its own.
 */
function TaskStats({ tasks }) {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === 'Completed').length;
  const pending = total - completed;
  const overdue = tasks.filter(
    (t) => t.status !== 'Completed' && new Date(t.deadline).getTime() < Date.now()
  ).length;

  return (
    <div className="stats-row">
      <div className="stat-box">
        <span className="stat-box-value">{total}</span>
        <span className="stat-box-label">Total</span>
      </div>
      <div className="stat-box">
        <span className="stat-box-value">{pending}</span>
        <span className="stat-box-label">Pending</span>
      </div>
      <div className="stat-box">
        <span className="stat-box-value">{completed}</span>
        <span className="stat-box-label">Completed</span>
      </div>
      <div className="stat-box stat-box-overdue">
        <span className="stat-box-value">{overdue}</span>
        <span className="stat-box-label">Overdue</span>
      </div>
    </div>
  );
}

// Props validation (Unit V requirement) using the standard
// 'prop-types' package: TaskStats will warn in the console in dev
// mode if `tasks` is missing or of the wrong shape.
TaskStats.propTypes = {
  tasks: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      title: PropTypes.string.isRequired,
      status: PropTypes.oneOf(['Pending', 'Completed']).isRequired,
      deadline: PropTypes.string.isRequired,
    })
  ).isRequired,
};

export default TaskStats;
