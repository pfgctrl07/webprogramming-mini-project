/**
 * Small, in-memory starter dataset for the React demo only.
 * The real application (PHP + MySQL in the project root) is the
 * actual persistent data store; this file exists purely so the
 * React demo has something meaningful to render immediately.
 */
const now = Date.now();
const hours = (h) => new Date(now + h * 60 * 60 * 1000).toISOString();

const initialTasks = [
  { id: 1, title: 'Submit DBMS Lab Record', subject: 'Database Management Systems', priority: 'High', status: 'Pending', deadline: hours(-6) },
  { id: 2, title: 'Web Programming Mini Project Review', subject: 'Web Programming', priority: 'High', status: 'Pending', deadline: hours(20) },
  { id: 3, title: 'Data Structures Assignment - Trees', subject: 'Data Structures', priority: 'Medium', status: 'Pending', deadline: hours(60) },
  { id: 4, title: 'Mathematics Tutorial Sheet 4', subject: 'Engineering Mathematics', priority: 'Low', status: 'Pending', deadline: hours(96) },
  { id: 5, title: 'Software Engineering Case Study', subject: 'Software Engineering', priority: 'Medium', status: 'Completed', deadline: hours(-120) },
];

export default initialTasks;
