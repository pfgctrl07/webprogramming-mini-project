/**
 * Static Demo - Dashboard page rendering.
 * Client-side port of index.php: same markup/classes, data now comes
 * from DTStore (localStorage) instead of a MySQL query.
 */
document.addEventListener('DOMContentLoaded', function () {
    var allTasks = DTStore.getTasks({ sort: 'deadline_asc' });
    var stats = DTStore.computeStats(allTasks);
    var upcoming = DTStore.getUpcomingDeadlines(allTasks, 5);
    var completionPct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

    var subjectProgress = {};
    allTasks.forEach(function (task) {
        if (!subjectProgress[task.subject]) {
            subjectProgress[task.subject] = { total: 0, completed: 0 };
        }
        subjectProgress[task.subject].total++;
        if (task.status === 'Completed') subjectProgress[task.subject].completed++;
    });
    var subjectNames = Object.keys(subjectProgress).sort();

    var completionRatio = stats.total > 0 ? stats.completed / stats.total : 0;
    var overdueRatio = stats.total > 0 ? stats.overdue / stats.total : 0;
    var momentumScore = Math.max(0, Math.min(100, Math.round((completionRatio * 100) - (overdueRatio * 40))));
    var momentumTier;
    if (momentumScore >= 80) momentumTier = { label: 'On Fire', icon: 'bi-fire' };
    else if (momentumScore >= 50) momentumTier = { label: 'Building Momentum', icon: 'bi-graph-up-arrow' };
    else if (momentumScore >= 20) momentumTier = { label: 'Getting Started', icon: 'bi-seedling' };
    else momentumTier = { label: 'Needs Attention', icon: 'bi-exclamation-circle' };

    document.getElementById('todayLine').textContent =
        new Date().toLocaleDateString('en-US', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }) +
        ' · ' + stats.pending + ' task' + (stats.pending === 1 ? '' : 's') + ' still need your attention.';

    document.getElementById('momentumIcon').className = 'bi ' + momentumTier.icon;
    document.getElementById('momentumScore').textContent = momentumScore;
    document.getElementById('momentumLabel').textContent = momentumTier.label;

    document.getElementById('statTotal').textContent = stats.total;
    document.getElementById('statPending').textContent = stats.pending;
    document.getElementById('statCompleted').textContent = stats.completed;
    document.getElementById('statOverdue').textContent = stats.overdue;
    document.getElementById('statDueSoon').textContent = stats.due_soon;
    document.getElementById('statHigh').textContent = stats.priority.High;

    window.DASHBOARD_STATS = {
        pending: stats.pending,
        completed: stats.completed,
        overdue: stats.overdue,
        dueSoon: stats.due_soon
    };
    drawStatusChart(window.DASHBOARD_STATS);

    var upcomingList = document.getElementById('upcomingList');
    if (upcoming.length === 0) {
        upcomingList.innerHTML = '<p class="empty-state">No pending tasks. Great job staying on top of things!</p>';
    } else {
        upcomingList.innerHTML = '<ul class="upcoming-list">' + upcoming.map(function (task) {
            var overdue = DTStore.isOverdue(task);
            var dueSoon = DTStore.isDueSoon(task);
            var badgeClass = overdue ? 'badge-overdue' : (dueSoon ? 'badge-due-soon' : '');
            return '<li class="upcoming-item priority-' + task.priority.toLowerCase() + '">' +
                '<div class="upcoming-main">' +
                '<span class="upcoming-title">' + escapeHtml(task.title) + '</span>' +
                '<span class="upcoming-subject">' + escapeHtml(task.subject) + '</span>' +
                '</div>' +
                '<div class="upcoming-meta">' +
                '<span class="badge-deadline ' + badgeClass + '">' + escapeHtml(DTStore.formatDeadline(task.deadline)) + '</span>' +
                '</div></li>';
        }).join('') + '</ul>';
    }

    document.getElementById('priorityLowCount').textContent = stats.priority.Low;
    document.getElementById('priorityMediumCount').textContent = stats.priority.Medium;
    document.getElementById('priorityHighCount').textContent = stats.priority.High;

    document.getElementById('completionRing').style.setProperty('--pct', completionPct);
    document.getElementById('completionRingValue').textContent = completionPct + '%';
    document.getElementById('completionLegend').innerHTML =
        '<strong>' + stats.completed + '</strong> of <strong>' + stats.total + '</strong> tasks completed so far. Keep it up!';

    var subjectProgressEl = document.getElementById('subjectProgress');
    if (subjectNames.length === 0) {
        subjectProgressEl.innerHTML = '<p class="empty-state">No tasks yet to track progress by subject.</p>';
    } else {
        subjectProgressEl.innerHTML = subjectNames.map(function (name) {
            var p = subjectProgress[name];
            var pct = p.total > 0 ? Math.round((p.completed / p.total) * 100) : 0;
            return '<div class="subject-progress-row">' +
                '<div class="subject-progress-label">' +
                '<span class="subject-name">' + escapeHtml(name) + '</span>' +
                '<span class="subject-fraction">' + p.completed + '/' + p.total + ' · ' + pct + '%</span>' +
                '</div>' +
                '<div class="subject-progress-track"><div class="subject-progress-fill" style="width: ' + pct + '%;"></div></div>' +
                '</div>';
        }).join('');
    }
});
