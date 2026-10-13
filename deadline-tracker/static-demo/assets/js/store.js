/**
 * Deadline Tracker - Static Demo data layer.
 *
 * A client-side port of includes/functions.php: the real app stores
 * tasks in MySQL and reads/writes them through PDO; this port stores
 * the exact same shape of data in localStorage so the static demo
 * can run with no server at all. Every function name/behavior below
 * mirrors its PHP counterpart one-to-one.
 */
(function (global) {
    'use strict';

    var STORAGE_KEY = 'dt_static_tasks_v1';
    var ID_KEY = 'dt_static_next_id_v1';

    var ALLOWED_PRIORITIES = ['Low', 'Medium', 'High'];
    var ALLOWED_STATUSES = ['Pending', 'Completed'];
    var DUE_SOON_HOURS = 48;

    function pad(n) { return n < 10 ? '0' + n : '' + n; }

    function toLocalIso(date) {
        return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) +
            'T' + pad(date.getHours()) + ':' + pad(date.getMinutes()) + ':' + pad(date.getSeconds());
    }

    function addHours(base, hours) {
        return new Date(base.getTime() + hours * 3600 * 1000);
    }

    // Same 12 demo tasks as database/schema.sql, but with deadlines/
    // created_at computed relative to "now" (just like NOW() + INTERVAL
    // in the SQL seed) so the demo always looks realistic.
    function seedTasks() {
        var now = new Date();
        var defs = [
            ['Submit DBMS Lab Record', 'Database Management Systems', 'Complete all 10 SQL lab exercises and get the record signed by the lab instructor.', -48, 'High', 'Pending', -240],
            ['Operating Systems Assignment 3', 'Operating Systems', 'Solve the CPU scheduling numericals (FCFS, SJF, Round Robin) and submit a handwritten copy.', -5, 'High', 'Pending', -144],
            ['Web Programming Mini Project Review 1', 'Web Programming', 'First review of the mini project: show working HTML/CSS/JS prototype to the panel.', 18, 'High', 'Pending', -96],
            ['Data Structures Assignment - Trees', 'Data Structures', 'Implement AVL tree insertion, deletion and rotations in C with a short report.', 48, 'Medium', 'Pending', -72],
            ['Mathematics Tutorial Sheet 4', 'Engineering Mathematics', 'Solve the tutorial sheet on Laplace transforms, questions 1 to 12.', 96, 'Low', 'Pending', -48],
            ['Compiler Design Lab - Lexical Analyzer', 'Compiler Design', 'Write a lexical analyzer using Lex/Flex for a simplified C-like language.', 168, 'Medium', 'Pending', -24],
            ['Computer Networks Quiz Preparation', 'Computer Networks', 'Revise OSI layers, TCP/IP, and subnetting for the surprise quiz.', 24, 'Medium', 'Pending', 0],
            ['Software Engineering Case Study', 'Software Engineering', 'Prepare a case study on Agile vs Waterfall for the chosen mini project.', -360, 'Medium', 'Completed', -480],
            ['DBMS Normalization Worksheet', 'Database Management Systems', 'Normalize the given schema up to BCNF with justification for each step.', -192, 'Low', 'Completed', -288],
            ['Web Programming HTML/CSS Exercise', 'Web Programming', 'Build a static résumé page using semantic HTML and an external stylesheet.', -480, 'Low', 'Completed', -600],
            ['End Semester Exam - Operating Systems', 'Operating Systems', 'University theory examination covering all five units.', 360, 'High', 'Pending', -24],
            ['Project Review 2 - Final Demo', 'Web Programming', 'Final demonstration of the complete mini project with report submission.', 504, 'High', 'Pending', 0]
        ];

        return defs.map(function (d, i) {
            return {
                id: i + 1,
                title: d[0],
                subject: d[1],
                description: d[2],
                deadline: toLocalIso(addHours(now, d[3])),
                priority: d[4],
                status: d[5],
                created_at: toLocalIso(addHours(now, d[6]))
            };
        });
    }

    function loadTasks() {
        var raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            var seeded = seedTasks();
            saveTasks(seeded);
            localStorage.setItem(ID_KEY, String(seeded.length + 1));
            return seeded;
        }
        try {
            return JSON.parse(raw);
        } catch (e) {
            var fallback = seedTasks();
            saveTasks(fallback);
            localStorage.setItem(ID_KEY, String(fallback.length + 1));
            return fallback;
        }
    }

    function saveTasks(tasks) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    }

    function nextId() {
        var id = parseInt(localStorage.getItem(ID_KEY) || '1', 10);
        localStorage.setItem(ID_KEY, String(id + 1));
        return id;
    }

    function resetDemoData() {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(ID_KEY);
    }

    function getTaskById(id) {
        var tasks = loadTasks();
        for (var i = 0; i < tasks.length; i++) {
            if (tasks[i].id === id) return tasks[i];
        }
        return null;
    }

    function validateTaskInput(data) {
        var errors = {};

        var title = (data.title || '').trim();
        if (title === '') {
            errors.title = 'Task title is required.';
        } else if (title.length > 150) {
            errors.title = 'Title must be 150 characters or fewer.';
        }

        var subject = (data.subject || '').trim();
        if (subject === '') {
            errors.subject = 'Subject / course is required.';
        } else if (subject.length > 100) {
            errors.subject = 'Subject must be 100 characters or fewer.';
        }

        var description = (data.description || '').trim();
        if (description.length > 1000) {
            errors.description = 'Description must be 1000 characters or fewer.';
        }

        var deadline = (data.deadline || '').trim();
        if (deadline === '' || isNaN(new Date(deadline).getTime())) {
            errors.deadline = 'A valid deadline date and time is required.';
        }

        if (ALLOWED_PRIORITIES.indexOf(data.priority) === -1) {
            errors.priority = 'Priority must be Low, Medium, or High.';
        }

        var status = data.status || 'Pending';
        if (ALLOWED_STATUSES.indexOf(status) === -1) {
            errors.status = 'Status must be Pending or Completed.';
        }

        return errors;
    }

    function createTask(data) {
        var tasks = loadTasks();
        var task = {
            id: nextId(),
            title: data.title.trim(),
            subject: data.subject.trim(),
            description: (data.description || '').trim(),
            deadline: data.deadline + ':00',
            priority: data.priority,
            status: data.status || 'Pending',
            created_at: toLocalIso(new Date())
        };
        tasks.push(task);
        saveTasks(tasks);
        return task.id;
    }

    function updateTask(id, data) {
        var tasks = loadTasks();
        for (var i = 0; i < tasks.length; i++) {
            if (tasks[i].id === id) {
                tasks[i].title = data.title.trim();
                tasks[i].subject = data.subject.trim();
                tasks[i].description = (data.description || '').trim();
                tasks[i].deadline = data.deadline + ':00';
                tasks[i].priority = data.priority;
                tasks[i].status = data.status || 'Pending';
                saveTasks(tasks);
                return true;
            }
        }
        return false;
    }

    function deleteTask(id) {
        var tasks = loadTasks().filter(function (t) { return t.id !== id; });
        saveTasks(tasks);
    }

    function setTaskStatus(id, status) {
        if (ALLOWED_STATUSES.indexOf(status) === -1) return false;
        var tasks = loadTasks();
        for (var i = 0; i < tasks.length; i++) {
            if (tasks[i].id === id) {
                tasks[i].status = status;
                saveTasks(tasks);
                return true;
            }
        }
        return false;
    }

    function getTasks(filters) {
        filters = filters || {};
        var tasks = loadTasks().slice();

        if (filters.search) {
            var term = filters.search.toLowerCase();
            tasks = tasks.filter(function (t) {
                return t.title.toLowerCase().indexOf(term) !== -1 ||
                    t.subject.toLowerCase().indexOf(term) !== -1 ||
                    (t.description || '').toLowerCase().indexOf(term) !== -1;
            });
        }

        if (filters.status && filters.status.length) {
            tasks = tasks.filter(function (t) { return filters.status.indexOf(t.status) !== -1; });
        }

        if (filters.priority && filters.priority.length) {
            tasks = tasks.filter(function (t) { return filters.priority.indexOf(t.priority) !== -1; });
        }

        if (filters.subject) {
            tasks = tasks.filter(function (t) { return t.subject === filters.subject; });
        }

        var priorityRank = { High: 1, Medium: 2, Low: 3 };
        var comparators = {
            deadline_asc: function (a, b) { return new Date(a.deadline) - new Date(b.deadline); },
            deadline_desc: function (a, b) { return new Date(b.deadline) - new Date(a.deadline); },
            priority_desc: function (a, b) { return priorityRank[a.priority] - priorityRank[b.priority]; },
            priority_asc: function (a, b) { return priorityRank[b.priority] - priorityRank[a.priority]; },
            created_desc: function (a, b) { return new Date(b.created_at) - new Date(a.created_at); },
            created_asc: function (a, b) { return new Date(a.created_at) - new Date(b.created_at); }
        };
        var sortKey = filters.sort || 'deadline_asc';
        tasks.sort(comparators[sortKey] || comparators.deadline_asc);

        return tasks;
    }

    function getDistinctSubjects() {
        var tasks = loadTasks();
        var seen = {};
        var subjects = [];
        tasks.forEach(function (t) {
            if (!seen[t.subject]) {
                seen[t.subject] = true;
                subjects.push(t.subject);
            }
        });
        subjects.sort();
        return subjects;
    }

    function isOverdue(task) {
        if (task.status === 'Completed') return false;
        return new Date(task.deadline).getTime() < Date.now();
    }

    function isDueSoon(task) {
        if (task.status === 'Completed' || isOverdue(task)) return false;
        var hoursRemaining = (new Date(task.deadline).getTime() - Date.now()) / 3600000;
        return hoursRemaining <= DUE_SOON_HOURS;
    }

    function suggestPriorityFromDeadline(task) {
        if (task.status === 'Completed') return task.priority;
        var hoursRemaining = (new Date(task.deadline).getTime() - Date.now()) / 3600000;
        if (hoursRemaining <= 24) return 'High';
        if (hoursRemaining <= 72) return 'Medium';
        return 'Low';
    }

    function priorityWeight(priority) {
        var weights = { Low: 1, Medium: 2, High: 3 };
        return weights[priority] || 1;
    }

    function computeStats(tasks) {
        var stats = {
            total: tasks.length,
            pending: 0,
            completed: 0,
            overdue: 0,
            due_soon: 0,
            priority: { Low: 0, Medium: 0, High: 0 },
            most_urgent: null
        };

        for (var i = 0; i < tasks.length; i++) {
            var task = tasks[i];
            if (task.status === 'Completed') {
                stats.completed++;
            } else {
                stats.pending++;
            }
            if (isOverdue(task)) {
                stats.overdue++;
            } else if (isDueSoon(task)) {
                stats.due_soon++;
            }
            stats.priority[task.priority]++;
        }

        var sorted = tasks.slice().sort(function (a, b) { return new Date(a.deadline) - new Date(b.deadline); });
        var index = 0;
        if (sorted.length) {
            do {
                if (sorted[index].status !== 'Completed') {
                    stats.most_urgent = sorted[index];
                    break;
                }
                index++;
            } while (index < sorted.length);
        }

        return stats;
    }

    function getUpcomingDeadlines(tasks, limit) {
        limit = limit || 5;
        var pending = tasks.filter(function (t) { return t.status !== 'Completed'; });
        pending.sort(function (a, b) { return new Date(a.deadline) - new Date(b.deadline); });
        return pending.slice(0, limit);
    }

    function formatDeadline(deadline) {
        var d = new Date(deadline);
        var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        var hours = d.getHours();
        var h12 = hours % 12;
        if (h12 === 0) h12 = 12;
        var ampm = hours >= 12 ? 'PM' : 'AM';
        return pad(d.getDate()) + ' ' + months[d.getMonth()] + ' ' + d.getFullYear() + ', ' + pad(h12) + ':' + pad(d.getMinutes()) + ' ' + ampm;
    }

    function toDatetimeLocalValue(deadline) {
        var d = new Date(deadline);
        return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
    }

    function csvEscape(field) {
        var s = String(field === undefined || field === null ? '' : field);
        if (/[",\n]/.test(s)) {
            s = '"' + s.replace(/"/g, '""') + '"';
        }
        return s;
    }

    function exportTasksToCsvAndDownload(tasks) {
        var rows = [['ID', 'Title', 'Subject', 'Priority', 'Status', 'Deadline', 'Created At']];
        tasks.forEach(function (t) {
            rows.push([t.id, t.title, t.subject, t.priority, t.status, t.deadline, t.created_at]);
        });
        var csv = rows.map(function (row) { return row.map(csvEscape).join(','); }).join('\r\n');

        var blob = new Blob([csv], { type: 'text/csv' });
        var url = URL.createObjectURL(blob);
        var ts = new Date();
        var filename = 'tasks_report_' + ts.getFullYear() + pad(ts.getMonth() + 1) + pad(ts.getDate()) +
            '_' + pad(ts.getHours()) + pad(ts.getMinutes()) + pad(ts.getSeconds()) + '.csv';

        var a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    global.DTStore = {
        ALLOWED_PRIORITIES: ALLOWED_PRIORITIES,
        ALLOWED_STATUSES: ALLOWED_STATUSES,
        DUE_SOON_HOURS: DUE_SOON_HOURS,
        loadTasks: loadTasks,
        resetDemoData: resetDemoData,
        getTaskById: getTaskById,
        validateTaskInput: validateTaskInput,
        createTask: createTask,
        updateTask: updateTask,
        deleteTask: deleteTask,
        setTaskStatus: setTaskStatus,
        getTasks: getTasks,
        getDistinctSubjects: getDistinctSubjects,
        isOverdue: isOverdue,
        isDueSoon: isDueSoon,
        suggestPriorityFromDeadline: suggestPriorityFromDeadline,
        priorityWeight: priorityWeight,
        computeStats: computeStats,
        getUpcomingDeadlines: getUpcomingDeadlines,
        formatDeadline: formatDeadline,
        toDatetimeLocalValue: toDatetimeLocalValue,
        exportTasksToCsvAndDownload: exportTasksToCsvAndDownload
    };
})(window);
