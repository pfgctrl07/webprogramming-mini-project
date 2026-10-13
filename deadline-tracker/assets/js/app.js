/**
 * Deadline Tracker - external JavaScript (Unit II)
 *
 * This single external file drives every client-side interaction in
 * the PHP-rendered pages: the custom add/edit task dialog (z-index
 * stacking), form validation feedback, the sidebar toggle, the
 * priority list-box highlighting, and the Canvas status chart.
 * Vanilla JS only - no jQuery or frameworks.
 */

// ---------------------------------------------------------------
// initDashboard() runs from <body onload="initDashboard()">.
// Demonstrates the onload event handler and wires up every
// addEventListener-based listener used elsewhere on the page.
// ---------------------------------------------------------------
function initDashboard() {
    // variables + identifiers + assignment statements
    var sidebarToggleBtn = document.getElementById('sidebarToggle');
    var sidebar = document.getElementById('appSidebar');
    var searchInput = document.getElementById('searchInput');

    if (sidebarToggleBtn && sidebar) {
        sidebarToggleBtn.addEventListener('click', function () {
            sidebar.classList.toggle('is-open'); // CSS manipulation through JS
        });
    }

    // Give the search box keyboard focus as soon as the tasks page
    // loads, demonstrating the focus() method.
    if (searchInput) {
        searchInput.focus();
    }

    // Close the custom modal with the Escape key, and when the user
    // clicks the dark backdrop outside the dialog itself.
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

    // Draw the Canvas bar chart if this page provided dashboard data.
    if (window.DASHBOARD_STATS) {
        drawStatusChart(window.DASHBOARD_STATS);
    }
}

// ---------------------------------------------------------------
// Hello World / JS basics demo (About page).
// Shows: a button calling a function, a variable, a plain JS
// object, and writing the result into the DOM.
// ---------------------------------------------------------------
function sayHello() {
    var outputEl = document.getElementById('helloOutput');
    var student = { course: 'Web Programming', project: 'Deadline Tracker' };
    if (outputEl) {
        outputEl.textContent = 'Hello, World! This is the ' + student.project + ' mini project for ' + student.course + '.';
    }
}

// ---------------------------------------------------------------
// Custom modal dialog (add / edit task).
// Opening/closing simply toggles a class; the heavy lifting of
// stacking the dialog above the rest of the page is done purely in
// CSS via z-index (see assets/css/style.css .custom-modal-overlay).
// ---------------------------------------------------------------
function openTaskModal() {
    var overlay = document.getElementById('taskModalOverlay');
    var form = document.getElementById('taskForm');
    var title = document.getElementById('taskModalTitle');

    form.reset();                 // reset() method clears all controls
    document.getElementById('taskFormAction').value = 'create';
    document.getElementById('taskId').value = '';
    title.textContent = 'Add New Task';

    overlay.classList.add('is-open');
    document.getElementById('taskTitle').focus(); // focus() on first control
}

function closeTaskModal() {
    var overlay = document.getElementById('taskModalOverlay');
    overlay.classList.remove('is-open');
}

/**
 * editTask(task) - called from an inline onclick handler on each
 * task card's Edit button. Reads a plain JS object (task) and
 * writes its properties into the shared form's controls - this is
 * "accessing text control values" in reverse (assignment instead of
 * reading), which the validateField()/prepareDelete() functions
 * below complement by reading control values back out.
 */
function editTask(task) {
    document.getElementById('taskFormAction').value = 'update';
    document.getElementById('taskId').value = task.id;
    document.getElementById('taskTitle').value = task.title;
    document.getElementById('taskSubject').value = task.subject;
    document.getElementById('taskDescription').value = task.description;
    document.getElementById('taskDeadline').value = task.deadline;

    // Radio buttons: select the one matching this task's priority/status.
    var priorityRadios = document.getElementsByName('priority');
    for (var i = 0; i < priorityRadios.length; i++) { // for loop
        priorityRadios[i].checked = (priorityRadios[i].value === task.priority);
    }
    var statusRadios = document.getElementsByName('status');
    for (var j = 0; j < statusRadios.length; j++) {
        statusRadios[j].checked = (statusRadios[j].value === task.status);
    }

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
    var errorEls = document.querySelectorAll('.field-error');
    errorEls.forEach(function (el) { el.textContent = ''; });
    document.querySelectorAll('.field-invalid').forEach(function (el) {
        el.classList.remove('field-invalid');
    });
}

/**
 * validateField(input) - fires on each required field's onblur.
 * Reads the control's current value (text control access) and gives
 * immediate feedback; this is a convenience layer only - the
 * authoritative validation always happens again in PHP.
 */
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

/**
 * prepareDelete(id, title) - fills the Bootstrap confirmation modal
 * (a Bootstrap plugin component, triggered via data-bs-toggle) right
 * before it opens, so one shared modal can confirm deletion of
 * whichever task the user clicked.
 */
function prepareDelete(id, title) {
    document.getElementById('deleteTaskId').value = id;
    document.getElementById('deleteTaskTitle').textContent = title;
}

/**
 * showTaskView(view) - switches the Tasks page between the stacked
 * list and the Kanban board. Both are rendered server-side from the
 * same filtered task set; this just toggles which one is visible, so
 * no extra request or database query happens on switch.
 */
// ---------------------------------------------------------------
// Focus Mode: a plain Pomodoro-style countdown timer. No server
// involvement at all - setInterval(), Date math, and a CSS custom
// property driving a conic-gradient ring, purely client-side.
// ---------------------------------------------------------------
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
    if (!display || !ring) {
        return;
    }
    display.textContent = focusFormatTime(focusSecondsLeft);
    var elapsedPct = ((focusTotalSeconds - focusSecondsLeft) / focusTotalSeconds) * 100;
    ring.style.setProperty('--timer-pct', elapsedPct);
}

function focusSetDuration(minutes) {
    focusToggleTimer(true); // force-stop if running
    focusTotalSeconds = minutes * 60;
    focusSecondsLeft = focusTotalSeconds;
    focusRender();
    var hint = document.getElementById('focusTimerHint');
    if (hint) {
        hint.textContent = minutes + '-minute focus block selected.';
    }
}

function focusToggleTimer(forceStop) {
    var startBtn = document.getElementById('focusStartBtn');
    if (focusIsRunning || forceStop) {
        clearInterval(focusTimerId);
        focusIsRunning = false;
        if (startBtn) {
            startBtn.innerHTML = '<i class="bi bi-play-fill"></i> Start';
        }
        return;
    }
    focusIsRunning = true;
    if (startBtn) {
        startBtn.innerHTML = '<i class="bi bi-pause-fill"></i> Pause';
    }
    focusTimerId = setInterval(function () {
        focusSecondsLeft--;
        if (focusSecondsLeft <= 0) {
            focusSecondsLeft = 0;
            focusRender();
            focusToggleTimer(true);
            var hint = document.getElementById('focusTimerHint');
            if (hint) {
                hint.textContent = "Time's up! Take a short break, then start another block.";
            }
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

function showTaskView(view) {
    var listView = document.getElementById('listView');
    var boardView = document.getElementById('boardView');
    var listBtn = document.getElementById('viewToggleList');
    var boardBtn = document.getElementById('viewToggleBoard');
    if (!listView || !boardView) {
        return;
    }
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

/**
 * highlightSelectedPriorities(selectEl) - fires on the priority list
 * box's onchange. Demonstrates manipulating CSS (inline style/class)
 * through JavaScript based on form control state, using a for loop
 * to walk every <option>.
 */
function highlightSelectedPriorities(selectEl) {
    var options = selectEl.options;
    for (var i = 0; i < options.length; i++) {
        if (options[i].selected) {
            options[i].style.fontWeight = '700';
        } else {
            options[i].style.fontWeight = '400';
        }
    }
}

// ---------------------------------------------------------------
// Canvas status chart (dashboard).
// Draws a simple bar chart from server-supplied counts using only
// the Canvas 2D API - no charting library.
// ---------------------------------------------------------------
function drawStatusChart(stats) {
    var canvas = document.getElementById('statusChart');
    if (!canvas || !canvas.getContext) {
        return;
    }
    var ctx = canvas.getContext('2d');
    var width = canvas.width;
    var height = canvas.height;

    var bars = [
        { label: 'Pending',   value: stats.pending,   color: '#2fb6a7' },
        { label: 'Completed', value: stats.completed, color: '#2e9e63' },
        { label: 'Overdue',   value: stats.overdue,   color: '#d64550' },
        { label: 'Due Soon',  value: stats.dueSoon,   color: '#e0a73b' }
    ];

    // do...while loop: find the largest bar value so every bar can be
    // scaled against the same maximum (guaranteed to run at least once).
    var maxValue = 0;
    var idx = 0;
    do {
        if (bars[idx].value > maxValue) {
            maxValue = bars[idx].value;
        }
        idx++;
    } while (idx < bars.length);
    if (maxValue === 0) {
        maxValue = 1; // avoid division by zero when there is no data yet
    }

    ctx.clearRect(0, 0, width, height);

    var chartBottom = height - 40;
    var chartTop = 20;
    var chartHeight = chartBottom - chartTop;
    var gap = 30;
    var barWidth = (width - gap * (bars.length + 1)) / bars.length;

    // for loop: draw each bar, its value label, and its name label.
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

    // baseline
    ctx.strokeStyle = '#dfe6ec';
    ctx.beginPath();
    ctx.moveTo(0, chartBottom);
    ctx.lineTo(width, chartBottom);
    ctx.stroke();
}
