/**
 * Deadline Tracker - Static Demo shared UI behaviors.
 * Ported from assets/js/app.js: same sidebar toggle, custom modal
 * z-index stacking, validation feedback, Canvas chart, Focus Mode
 * timer, and Hello World demo - just wired to DTStore instead of a
 * server round trip.
 */

function escapeHtml(value) {
    var div = document.createElement('div');
    div.textContent = value === undefined || value === null ? '' : String(value);
    return div.innerHTML;
}

function initCommon() {
    var sidebarToggleBtn = document.getElementById('sidebarToggle');
    var sidebar = document.getElementById('appSidebar');
    if (sidebarToggleBtn && sidebar) {
        sidebarToggleBtn.addEventListener('click', function () {
            sidebar.classList.toggle('is-open');
        });
    }

    var searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.focus();
    }

    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
            closeTaskModal();
        }
    });
    var overlay = document.getElementById('taskModalOverlay');
    if (overlay) {
        overlay.addEventListener('click', function (event) {
            if (event.target === overlay) {
                closeTaskModal();
            }
        });
    }

    var resetBtn = document.getElementById('resetDemoDataBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', function () {
            DTStore.resetDemoData();
            location.reload();
        });
    }

    var exportBtn = document.getElementById('exportCsvBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', function (event) {
            event.preventDefault();
            DTStore.exportTasksToCsvAndDownload(DTStore.getTasks({ sort: 'deadline_asc' }));
        });
    }

    if (window.DASHBOARD_STATS) {
        drawStatusChart(window.DASHBOARD_STATS);
    }
}

/** flashMessage(type, message) - shows a one-shot alert at the top of <main>. */
function flashMessage(type, message) {
    var container = document.getElementById('flashContainer');
    if (!container) return;
    var alertClass = type === 'error' ? 'danger' : 'success';
    var icon = type === 'error' ? 'bi-exclamation-triangle' : 'bi-check-circle';
    container.innerHTML =
        '<div class="alert alert-' + alertClass + ' alert-dismissible fade show app-flash" role="alert">' +
        '<i class="bi ' + icon + '"></i> ' + escapeHtml(message) +
        '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>' +
        '</div>';
}

// ---- Custom add/edit task modal ----
function openTaskModal() {
    var overlay = document.getElementById('taskModalOverlay');
    var form = document.getElementById('taskForm');
    var title = document.getElementById('taskModalTitle');

    form.reset();
    document.getElementById('taskFormAction').value = 'create';
    document.getElementById('taskId').value = '';
    title.textContent = 'Add New Task';
    clearFieldErrors();

    overlay.classList.add('is-open');
    document.getElementById('taskTitle').focus();
}

function closeTaskModal() {
    var overlay = document.getElementById('taskModalOverlay');
    if (overlay) overlay.classList.remove('is-open');
}

function editTask(task) {
    document.getElementById('taskFormAction').value = 'update';
    document.getElementById('taskId').value = task.id;
    document.getElementById('taskTitle').value = task.title;
    document.getElementById('taskSubject').value = task.subject;
    document.getElementById('taskDescription').value = task.description;
    document.getElementById('taskDeadline').value = task.deadline;

    var priorityRadios = document.getElementsByName('priority');
    for (var i = 0; i < priorityRadios.length; i++) {
        priorityRadios[i].checked = (priorityRadios[i].value === task.priority);
    }
    var statusRadios = document.getElementsByName('status');
    for (var j = 0; j < statusRadios.length; j++) {
        statusRadios[j].checked = (statusRadios[j].value === task.status);
    }

    clearFieldErrors();
    document.getElementById('taskModalTitle').textContent = 'Edit Task';
    document.getElementById('taskModalOverlay').classList.add('is-open');
    document.getElementById('taskTitle').focus();
}

function resetTaskForm() {
    var form = document.getElementById('taskForm');
    form.reset();
    clearFieldErrors();
    document.getElementById('taskTitle').focus();
}

function clearFieldErrors() {
    document.querySelectorAll('.field-error').forEach(function (el) { el.textContent = ''; });
    document.querySelectorAll('.field-invalid').forEach(function (el) { el.classList.remove('field-invalid'); });
}

function validateField(input) {
    var errorEl = document.getElementById(input.id + 'Error');
    var value = input.value.trim();
    var message = '';

    if (input.hasAttribute('required') && value === '') {
        message = 'This field is required.';
    } else if (input.id === 'taskDeadline' && value !== '') {
        var chosen = new Date(value);
        if (isNaN(chosen.getTime())) {
            message = 'Enter a valid date and time.';
        }
    }

    if (message) {
        input.classList.add('field-invalid');
        input.classList.remove('field-touched');
    } else {
        input.classList.remove('field-invalid');
        input.classList.add('field-touched');
    }

    if (errorEl) {
        errorEl.textContent = message;
    }
}

function prepareDelete(id, title) {
    document.getElementById('deleteTaskId').value = id;
    document.getElementById('deleteTaskTitle').textContent = title;
}

function highlightSelectedPriorities(selectEl) {
    var options = selectEl.options;
    for (var i = 0; i < options.length; i++) {
        options[i].style.fontWeight = options[i].selected ? '700' : '400';
    }
}

function showTaskView(view) {
    var listView = document.getElementById('listView');
    var boardView = document.getElementById('boardView');
    var listBtn = document.getElementById('viewToggleList');
    var boardBtn = document.getElementById('viewToggleBoard');
    if (!listView || !boardView) return;

    if (view === 'board') {
        listView.classList.add('is-hidden');
        boardView.classList.remove('is-hidden');
        boardBtn.classList.add('active');
        listBtn.classList.remove('active');
    } else {
        boardView.classList.add('is-hidden');
        listView.classList.remove('is-hidden');
        listBtn.classList.add('active');
        boardBtn.classList.remove('active');
    }
}

// ---- Canvas status chart (dashboard) ----
function drawStatusChart(stats) {
    var canvas = document.getElementById('statusChart');
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext('2d');
    var width = canvas.width;
    var height = canvas.height;

    var bars = [
        { label: 'Pending', value: stats.pending, color: '#2fb6a7' },
        { label: 'Completed', value: stats.completed, color: '#2e9e63' },
        { label: 'Overdue', value: stats.overdue, color: '#d64550' },
        { label: 'Due Soon', value: stats.dueSoon, color: '#e0a73b' }
    ];

    var maxValue = 0;
    var idx = 0;
    do {
        if (bars[idx].value > maxValue) maxValue = bars[idx].value;
        idx++;
    } while (idx < bars.length);
    if (maxValue === 0) maxValue = 1;

    ctx.clearRect(0, 0, width, height);

    var chartBottom = height - 40;
    var chartTop = 20;
    var chartHeight = chartBottom - chartTop;
    var gap = 30;
    var barWidth = (width - gap * (bars.length + 1)) / bars.length;

    for (var i = 0; i < bars.length; i++) {
        var bar = bars[i];
        var barHeight = (bar.value / maxValue) * chartHeight;
        var x = gap + i * (barWidth + gap);
        var y = chartBottom - barHeight;

        ctx.fillStyle = bar.color;
        ctx.fillRect(x, y, barWidth, barHeight);

        ctx.fillStyle = '#1b2a38';
        ctx.font = '13px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(String(bar.value), x + barWidth / 2, y - 8);
        ctx.fillText(bar.label, x + barWidth / 2, chartBottom + 18);
    }

    ctx.strokeStyle = '#dfe6ec';
    ctx.beginPath();
    ctx.moveTo(0, chartBottom);
    ctx.lineTo(width, chartBottom);
    ctx.stroke();
}

// ---- Focus Mode: Pomodoro timer ----
var focusTotalSeconds = 25 * 60;
var focusSecondsLeft = focusTotalSeconds;
var focusTimerId = null;
var focusIsRunning = false;

function focusFormatTime(totalSeconds) {
    var mins = Math.floor(totalSeconds / 60);
    var secs = totalSeconds % 60;
    return (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;
}

function focusRender() {
    var display = document.getElementById('focusTimerDisplay');
    var ring = document.getElementById('focusRing');
    if (!display || !ring) return;
    display.textContent = focusFormatTime(focusSecondsLeft);
    var elapsedPct = ((focusTotalSeconds - focusSecondsLeft) / focusTotalSeconds) * 100;
    ring.style.setProperty('--timer-pct', elapsedPct);
}

function focusSetDuration(minutes) {
    focusToggleTimer(true);
    focusTotalSeconds = minutes * 60;
    focusSecondsLeft = focusTotalSeconds;
    focusRender();
    var hint = document.getElementById('focusTimerHint');
    if (hint) hint.textContent = minutes + '-minute focus block selected.';
}

function focusToggleTimer(forceStop) {
    var startBtn = document.getElementById('focusStartBtn');
    if (focusIsRunning || forceStop) {
        clearInterval(focusTimerId);
        focusIsRunning = false;
        if (startBtn) startBtn.innerHTML = '<i class="bi bi-play-fill"></i> Start';
        return;
    }
    focusIsRunning = true;
    if (startBtn) startBtn.innerHTML = '<i class="bi bi-pause-fill"></i> Pause';
    focusTimerId = setInterval(function () {
        focusSecondsLeft--;
        if (focusSecondsLeft <= 0) {
            focusSecondsLeft = 0;
            focusRender();
            focusToggleTimer(true);
            var hint = document.getElementById('focusTimerHint');
            if (hint) hint.textContent = "Time's up! Take a short break, then start another block.";
            return;
        }
        focusRender();
    }, 1000);
}

function focusResetTimer() {
    focusToggleTimer(true);
    focusSecondsLeft = focusTotalSeconds;
    focusRender();
}

// ---- About page: Hello World demo ----
function sayHello() {
    var outputEl = document.getElementById('helloOutput');
    var student = { course: 'Web Programming', project: 'Deadline Tracker' };
    if (outputEl) {
        outputEl.textContent = 'Hello, World! This is the ' + student.project + ' mini project for ' + student.course + '.';
    }
}
