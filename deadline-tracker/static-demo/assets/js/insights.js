/**
 * Static Demo - Insights page rendering (client-side port of insights.php).
 */
document.addEventListener('DOMContentLoaded', function () {
    var allTasks = DTStore.getTasks({ sort: 'deadline_asc' });
    var stats = DTStore.computeStats(allTasks);

    var completionRatio = stats.total > 0 ? stats.completed / stats.total : 0;
    var overdueRatio = stats.total > 0 ? stats.overdue / stats.total : 0;
    var momentumScore = Math.max(0, Math.min(100, Math.round((completionRatio * 100) - (overdueRatio * 40))));

    var weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    var weekdayCounts = { Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0, Sunday: 0 };
    allTasks.forEach(function (task) {
        var weekday = weekdayNames[new Date(task.deadline).getDay()];
        weekdayCounts[weekday]++;
    });
    var busiestDay = Object.keys(weekdayCounts).reduce(function (a, b) {
        return weekdayCounts[a] >= weekdayCounts[b] ? a : b;
    });
    var busiestDayCount = weekdayCounts[busiestDay];

    var oldestCreatedAt = null;
    allTasks.forEach(function (task) {
        var created = new Date(task.created_at).getTime();
        if (oldestCreatedAt === null || created < oldestCreatedAt) oldestCreatedAt = created;
    });
    var daysSinceStart = oldestCreatedAt !== null ? Math.max(1, (Date.now() - oldestCreatedAt) / 86400000) : 1;
    var completionPace = Math.round((stats.completed / daysSinceStart) * 100) / 100;
    var daysToClearBacklog = completionPace > 0 ? Math.ceil(stats.pending / completionPace) : null;

    var highPriorityTotal = 0;
    var highPriorityOnTrack = 0;
    allTasks.forEach(function (task) {
        if (task.priority === 'High') {
            highPriorityTotal++;
            if (!DTStore.isOverdue(task)) highPriorityOnTrack++;
        }
    });
    var priorityHealthIndex = highPriorityTotal > 0 ? Math.round((highPriorityOnTrack / highPriorityTotal) * 100) : 100;

    var subjectOverdue = {};
    allTasks.forEach(function (task) {
        if (DTStore.isOverdue(task)) {
            subjectOverdue[task.subject] = (subjectOverdue[task.subject] || 0) + 1;
        }
    });
    var atRiskSubject = null;
    var atRiskSubjectCount = 0;
    Object.keys(subjectOverdue).forEach(function (subject) {
        if (subjectOverdue[subject] > atRiskSubjectCount) {
            atRiskSubject = subject;
            atRiskSubjectCount = subjectOverdue[subject];
        }
    });

    document.getElementById('momentumScoreBig').textContent = momentumScore;
    document.getElementById('priorityHealthBig').textContent = priorityHealthIndex;
    document.getElementById('priorityHealthExplain').textContent =
        'Of your ' + highPriorityTotal + ' High-priority task' + (highPriorityTotal === 1 ? '' : 's') + ', ' +
        highPriorityOnTrack + ' ' + (highPriorityOnTrack === 1 ? 'is' : 'are') +
        ' still on track (not overdue). This tracks whether "important" work is actually protected from slipping.';

    document.getElementById('busiestDayBig').textContent = busiestDay;
    document.getElementById('busiestDayExplain').textContent =
        busiestDayCount + ' of your ' + stats.total + ' task' + (stats.total === 1 ? '' : 's') +
        ' fall due on a ' + busiestDay + ' — the single most loaded day of the week in your current schedule.';

    document.getElementById('completionPaceBig').textContent = completionPace;
    document.getElementById('completionPaceExplain').textContent = daysToClearBacklog !== null
        ? 'At this pace, clearing your current ' + stats.pending + ' pending task' + (stats.pending === 1 ? '' : 's') +
          ' would take roughly ' + daysToClearBacklog + ' day' + (daysToClearBacklog === 1 ? '' : 's') + '.'
        : 'Not enough completed tasks yet to project a pace — complete a few tasks and check back.';

    var riskLine = document.getElementById('atRiskLine');
    if (atRiskSubject !== null) {
        riskLine.innerHTML = '<span class="badge-overdue badge-deadline">' + escapeHtml(atRiskSubject) + '</span> currently has <strong>' +
            atRiskSubjectCount + '</strong> overdue task' + (atRiskSubjectCount === 1 ? '' : 's') +
            ' — the most of any subject right now. Worth tackling first.';
    } else {
        riskLine.textContent = 'No overdue tasks in any subject right now — nothing at risk.';
    }
});
