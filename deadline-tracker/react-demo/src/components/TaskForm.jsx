import { useState } from 'react';
import PropTypes from 'prop-types';

/**
 * TaskForm - functional component using the useState Hook to hold
 * controlled-input state (Unit V: Hooks + React state). Submitting
 * calls the onAdd prop so the parent (App) owns the actual task list.
 */
function TaskForm({ onAdd }) {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [deadline, setDeadline] = useState('');

  function handleSubmit(event) {
    event.preventDefault();
    if (!title.trim() || !subject.trim() || !deadline) {
      return;
    }
    onAdd({
      id: Date.now(),
      title: title.trim(),
      subject: subject.trim(),
      priority,
      status: 'Pending',
      deadline: new Date(deadline).toISOString(),
    });
    setTitle('');
    setSubject('');
    setPriority('Medium');
    setDeadline('');
  }

  return (
    <form className="react-task-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <label htmlFor="rTitle">Title</label>
        <input id="rTitle" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div className="form-row">
        <label htmlFor="rSubject">Subject</label>
        <input id="rSubject" value={subject} onChange={(e) => setSubject(e.target.value)} required />
      </div>
      <div className="form-row">
        <label htmlFor="rDeadline">Deadline</label>
        <input id="rDeadline" type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} required />
      </div>
      <div className="form-row">
        <label htmlFor="rPriority">Priority</label>
        <select id="rPriority" value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>
      </div>
      <button type="submit">Add Task</button>
    </form>
  );
}

TaskForm.propTypes = {
  onAdd: PropTypes.func.isRequired,
};

export default TaskForm;
