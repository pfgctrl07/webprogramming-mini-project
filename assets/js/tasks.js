/**
 * Static Demo - My Tasks page (client-side port of tasks.php).
 * Full CRUD, search/filter/sort, list + kanban views, and both
 * modals (custom overlay + Bootstrap) all work against DTStore
 * (localStorage) instead of actions/tasks.php + MySQL.
 */
var currentFilters = { search: '', status: [], priority: [], subject: '', sort: 'deadline_asc' };

var PRIORITY_ICON = { low: 'bi-arrow-down-circle', medium: 'bi-dash-circle', high: 'bi-arrow-up-circle' };

function readFiltersFromForm() {
    var form = document.getElementById('filterForm');
    var statusBoxes = form.querySelectorAll('input[name="status[]"]:checked');
    var priorityOptions = form.querySelectorAll('#priorityListBox option:checked');

    return {
        search: form.querySelector('#searchInput').value.trim(),
        status: Array.prototype.map.call(statusBoxes, function (el) { return el.value; }),
        priority: Array.prototype.map.call(priorityOptions, function (el) { return el.value; }),
        subject: form.querySelector('#subjectSelect').value,
        sort: form.querySelector('#sortSelect').value
    };
}

function populateSubjectFilter() {
    var select = document.getElementById('subjectSelect');
    var subjects = DTStore.getDistinctSubjects();
    var current = select.value;
    select.innerHTML = '<option value="">All Subjects</option>' + subjects.map(function (s) {
        return '<option value="' + escapeHtml(s) + '">' + escapeHtml(s) + '</option>';
    }).join('');
    select.value = current;
}

function renderTasksPage() {
    populateSubjectFilter();
    var tasks = DTStore.getTasks(currentFilters);
    renderTaskList(tasks);
    renderKanban(tasks);
}

function renderTaskList(tasks) {
    var container = document.getElementById('listView');
    if (tasks.length === 0) {
        container.innerHTML = '<div class="panel-card empty-state-card"><p class="empty-state"><i class="bi bi-inbox fs-3 d-block mb-2"></i>No tasks match your filters. Try adjusting search or filters, or add a new task.</p></div>';
        return;
    }

    container.innerHTML = tasks.map(function (task) {
        var overdue = DTStore.isOverdue(task);
        var dueSoon = DTStore.isDueSoon(task);
        var isDone = task.status === 'Completed';
        var priorityLower = task.priority.toLowerCase();
        var priorityIcon = PRIORITY_ICON[priorityLower];
        var suggested = DTStore.suggestPriorityFromDeadline(task);
        var showSuggestion = !isDone && DTStore.priorityWeight(suggested) > DTStore.priorityWeight(task.priority);
        var deadlineBadgeClass = overdue ? 'badge-overdue' : (dueSoon ? 'badge-due-soon' : '');
        var deadlineIcon = overdue ? 'bi-exclamation-triangle' : (dueSoon ? 'bi-alarm' : 'bi-calendar3');
        var deadlinePrefix = overdue ? 'Overdue &middot; ' : (dueSoon ? 'Due Soon &middot; ' : '');
        var taskJson = escapeHtml(JSON.stringify({
            id: task.id, title: task.title, subject: task.subject, description: task.description,
            deadline: DTStore.toDatetimeLocalValue(task.deadline), priority: task.priority, status: task.status
        })).replace(/'/g, '&#39;');

        return '<article class="task-card priority-' + priorityLower + ' ' + (isDone ? 'task-completed' : '') + '">' +
            '<div class="task-card-main">' +
            '<div class="task-card-header">' +
            '<h2 class="task-title">' + (isDone ? '<i class="bi bi-check2-circle text-success"></i> ' : '') + escapeHtml(task.title) + '</h2>' +
            '<span class="badge-priority badge-priority-' + priorityLower + '"><i class="bi ' + priorityIcon + '"></i> ' + escapeHtml(task.priority) + '</span>' +
            (showSuggestion ? '<span class="badge-suggestion" title="Deadline is close enough that this task\'s priority might deserve bumping up"><i class="bi bi-lightbulb"></i> Suggest: ' + escapeHtml(suggested) + '</span>' : '') +
            '</div>' +
            '<p class="task-subject"><i class="bi bi-journal-bookmark"></i> ' + escapeHtml(task.subject) + '</p>' +
            (task.description ? '<p class="task-description">' + escapeHtml(task.description) + '</p>' : '') +
            '<div class="task-meta">' +
            '<span class="badge-deadline ' + deadlineBadgeClass + '"><i class="bi ' + deadlineIcon + '"></i> ' + deadlinePrefix + escapeHtml(DTStore.formatDeadline(task.deadline)) + '</span>' +
            '<span class="badge-status badge-status-' + task.status.toLowerCase() + '"><i class="bi ' + (isDone ? 'bi-check-circle' : 'bi-hourglass-split') + '"></i> ' + escapeHtml(task.status) + '</span>' +
            '</div></div>' +
            '<div class="task-card-actions">' +
            '<button type="button" class="btn btn-sm btn-outline-success js-toggle-status" data-id="' + task.id + '" data-new-status="' + (isDone ? 'Pending' : 'Completed') + '" title="' + (isDone ? 'Reopen task' : 'Mark complete') + '">' +
            '<i class="bi ' + (isDone ? 'bi-arrow-counterclockwise' : 'bi-check-lg') + '"></i> ' + (isDone ? 'Reopen' : 'Mark Complete') + '</button>' +
            '<button type="button" class="btn btn-sm btn-outline-primary js-edit-task" data-task=\'' + taskJson + '\'><i class="bi bi-pencil"></i> Edit</button>' +
            '<button type="button" class="btn btn-sm btn-outline-danger js-delete-task" data-bs-toggle="modal" data-bs-target="#deleteConfirmModal" data-id="' + task.id + '" data-title="' + escapeHtml(task.title) + '"><i class="bi bi-trash"></i> Delete</button>' +
            '</div></article>';
    }).join('');

    container.querySelectorAll('.js-toggle-status').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var id = parseInt(btn.getAttribute('data-id'), 10);
            var newStatus = btn.getAttribute('data-new-status');
            DTStore.setTaskStatus(id, newStatus);
            flashMessage('success', newStatus === 'Completed' ? 'Task marked complete.' : 'Task reopened.');
            renderTasksPage();
        });
    });
    container.querySelectorAll('.js-edit-task').forEach(function (btn) {
        btn.addEventListener('click', function () {
            editTask(JSON.parse(btn.getAttribute('data-task')));
        });
    });
    container.querySelectorAll('.js-delete-task').forEach(function (btn) {
        btn.addEventListener('click', function () {
            prepareDelete(btn.getAttribute('data-id'), btn.getAttribute('data-title'));
        });
    });
}

function renderKanban(tasks) {
    var columns = {
        todo: { label: 'To Do', icon: 'bi-circle', tasks: [] },
        urgent: { label: 'Urgent', icon: 'bi-exclamation-triangle', tasks: [] },
        completed: { label: 'Completed', icon: 'bi-check-circle', tasks: [] }
    };
    tasks.forEach(function (task) {
        if (task.status === 'Completed') columns.completed.tasks.push(task);
        else if (DTStore.isOverdue(task) || DTStore.isDueSoon(task)) columns.urgent.tasks.push(task);
        else columns.todo.tasks.push(task);
    });

    var container = document.getElementById('boardView');
    container.innerHTML = Object.keys(columns).map(function (key) {
        var col = columns[key];
        var body = col.tasks.length === 0
            ? '<p class="kanban-empty">Nothing here.</p>'
            : col.tasks.map(function (task) {
                var priorityLower = task.priority.toLowerCase();
                return '<div class="kanban-card priority-' + priorityLower + '">' +
                    '<p class="kanban-card-title">' + escapeHtml(task.title) + '</p>' +
                    '<p class="kanban-card-subject"><i class="bi bi-journal-bookmark"></i> ' + escapeHtml(task.subject) + '</p>' +
                    '<div class="kanban-card-footer">' +
                    '<span class="badge-priority badge-priority-' + priorityLower + '">' + escapeHtml(task.priority) + '</span>' +
                    '<span class="kanban-card-deadline">' + escapeHtml(DTStore.formatDeadline(task.deadline)) + '</span>' +
                    '</div></div>';
            }).join('');
        return '<div class="kanban-column"><div class="kanban-column-header"><i class="bi ' + col.icon + '"></i> ' + col.label +
            '<span class="kanban-count">' + col.tasks.length + '</span></div>' + body + '</div>';
    }).join('');
}

document.addEventListener('DOMContentLoaded', function () {
    renderTasksPage();

    var filterForm = document.getElementById('filterForm');
    filterForm.addEventListener('submit', function (event) {
        event.preventDefault();
        currentFilters = readFiltersFromForm();
        renderTasksPage();
    });
    document.getElementById('resetFiltersBtn').addEventListener('click', function (event) {
        event.preventDefault();
        filterForm.reset();
        currentFilters = { search: '', status: [], priority: [], subject: '', sort: 'deadline_asc' };
        renderTasksPage();
    });

    document.getElementById('priorityListBox').addEventListener('change', function () {
        highlightSelectedPriorities(this);
    });

    document.getElementById('taskForm').addEventListener('submit', function (event) {
        event.preventDefault();
        clearFieldErrors();

        var data = {
            title: document.getElementById('taskTitle').value,
            subject: document.getElementById('taskSubject').value,
            description: document.getElementById('taskDescription').value,
            deadline: document.getElementById('taskDeadline').value,
            priority: (document.querySelector('input[name="priority"]:checked') || {}).value,
            status: (document.querySelector('input[name="status"]:checked') || {}).value
        };

        var errors = DTStore.validateTaskInput(data);
        if (Object.keys(errors).length) {
            Object.keys(errors).forEach(function (field) {
                var errorEl = document.getElementById('task' + field.charAt(0).toUpperCase() + field.slice(1) + 'Error');
                if (errorEl) errorEl.textContent = errors[field];
            });
            flashMessage('error', 'Could not save task: ' + Object.values(errors).join(' '));
            return;
        }

        var action = document.getElementById('taskFormAction').value;
        if (action === 'update') {
            var id = parseInt(document.getElementById('taskId').value, 10);
            DTStore.updateTask(id, data);
            flashMessage('success', 'Task updated successfully.');
        } else {
            DTStore.createTask(data);
            flashMessage('success', 'Task created successfully.');
        }
        closeTaskModal();
        renderTasksPage();
    });

    document.getElementById('deleteConfirmForm').addEventListener('submit', function (event) {
        event.preventDefault();
        var id = parseInt(document.getElementById('deleteTaskId').value, 10);
        DTStore.deleteTask(id);

        var modalEl = document.getElementById('deleteConfirmModal');
        var modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
        modal.hide();

        flashMessage('success', 'Task deleted.');
        renderTasksPage();
    });

    document.getElementById('addTaskBtn').addEventListener('click', function () {
        openTaskModal();
    });
});
