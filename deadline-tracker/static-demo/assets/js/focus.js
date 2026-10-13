/**
 * Static Demo - Focus Mode page rendering (client-side port of focus.php).
 */
function renderFocusTask() {
    var allTasks = DTStore.getTasks({ sort: 'deadline_asc' });
    var stats = DTStore.computeStats(allTasks);
    var focusTask = stats.most_urgent;
    var card = document.getElementById('focusTaskCard');

    if (!focusTask) {
        card.innerHTML = '<p class="empty-state"><i class="bi bi-emoji-sunglasses fs-3 d-block mb-2"></i>Nothing pending — you\'re completely caught up.</p>';
        return;
    }

    var overdue = DTStore.isOverdue(focusTask);
    var dueSoon = DTStore.isDueSoon(focusTask);
    var badgeClass = overdue ? 'badge-overdue' : (dueSoon ? 'badge-due-soon' : '');
    var icon = overdue ? 'bi-exclamation-triangle' : (dueSoon ? 'bi-alarm' : 'bi-calendar3');
    var prefix = overdue ? 'Overdue &middot; ' : (dueSoon ? 'Due Soon &middot; ' : '');

    card.innerHTML =
        '<p class="focus-task-title">' + escapeHtml(focusTask.title) + '</p>' +
        '<p class="task-subject"><i class="bi bi-journal-bookmark"></i> ' + escapeHtml(focusTask.subject) + '</p>' +
        '<span class="badge-deadline ' + badgeClass + '"><i class="bi ' + icon + '"></i> ' + prefix + escapeHtml(DTStore.formatDeadline(focusTask.deadline)) + '</span>' +
        '<div class="mt-3"><button type="button" class="btn btn-primary" id="focusMarkCompleteBtn"><i class="bi bi-check-lg"></i> Mark Complete</button></div>';

    document.getElementById('focusMarkCompleteBtn').addEventListener('click', function () {
        DTStore.setTaskStatus(focusTask.id, 'Completed');
        flashMessage('success', 'Task marked complete.');
        renderFocusTask();
    });
}

document.addEventListener('DOMContentLoaded', function () {
    renderFocusTask();
    focusSetDuration(25);
});
