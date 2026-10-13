<?php
require_once __DIR__ . '/includes/functions.php';

$pageTitle  = 'Insights';
$activePage = 'insights';

// Reuses the exact same data-fetching functions as the dashboard - no
// new queries, no schema changes. This page's job is to look at that
// data from different angles instead of just listing it.
$allTasks = getTasks(['sort' => 'deadline_asc']);
$stats    = computeStats($allTasks);

// ---- Momentum Score (same formula as the dashboard, recomputed here
// so this page stands on its own) ----
$completionRatio = $stats['total'] > 0 ? $stats['completed'] / $stats['total'] : 0;
$overdueRatio     = $stats['total'] > 0 ? $stats['overdue'] / $stats['total'] : 0;
$momentumScore    = (int) max(0, min(100, round(($completionRatio * 100) - ($overdueRatio * 40))));

// ---- Busiest deadline day of week: group every task's deadline by
// weekday name, find the one with the most tasks stacked on it ----
$weekdayCounts = ['Monday' => 0, 'Tuesday' => 0, 'Wednesday' => 0, 'Thursday' => 0, 'Friday' => 0, 'Saturday' => 0, 'Sunday' => 0];
foreach ($allTasks as $task) {
    $weekday = date('l', strtotime($task['deadline']));
    $weekdayCounts[$weekday]++;
}
$busiestDay = array_search(max($weekdayCounts), $weekdayCounts, true);
$busiestDayCount = $weekdayCounts[$busiestDay] ?? 0;

// ---- Completion pace: how many tasks have been completed per day
// since the oldest task was created, then project how many days it
// would take to clear the current pending backlog at that pace ----
$oldestCreatedAt = null;
foreach ($allTasks as $task) {
    if ($oldestCreatedAt === null || strtotime($task['created_at']) < $oldestCreatedAt) {
        $oldestCreatedAt = strtotime($task['created_at']);
    }
}
$daysSinceStart   = $oldestCreatedAt !== null ? max(1, (time() - $oldestCreatedAt) / 86400) : 1;
$completionPace   = round($stats['completed'] / $daysSinceStart, 2); // tasks/day
$daysToClearBacklog = $completionPace > 0 ? ceil($stats['pending'] / $completionPace) : null;

// ---- Priority Health Index: of all High-priority tasks, what share
// are still on track (not overdue)? A measure of whether "important"
// work is actually being protected from slipping. ----
$highPriorityTotal   = 0;
$highPriorityOnTrack = 0;
foreach ($allTasks as $task) {
    if ($task['priority'] === 'High') {
        $highPriorityTotal++;
        if (!isOverdue($task)) {
            $highPriorityOnTrack++;
        }
    }
}
$priorityHealthIndex = $highPriorityTotal > 0 ? round(($highPriorityOnTrack / $highPriorityTotal) * 100) : 100;

// ---- At-risk subject: which subject currently has the most overdue
// tasks stacked up? ----
$subjectOverdue = [];
foreach ($allTasks as $task) {
    if (isOverdue($task)) {
        $subjectOverdue[$task['subject']] = ($subjectOverdue[$task['subject']] ?? 0) + 1;
    }
}
arsort($subjectOverdue);
$atRiskSubject = array_key_first($subjectOverdue);
$atRiskSubjectCount = $atRiskSubject !== null ? $subjectOverdue[$atRiskSubject] : 0;

require __DIR__ . '/includes/header.php';
?>

<section class="page-section" aria-labelledby="insightsHeading">
    <h1 id="insightsHeading" class="page-title"><i class="bi bi-lightbulb"></i> Insights</h1>
    <p class="page-intro">
        Not just a list of tasks &mdash; this page looks at the same data from
        a different angle: workload patterns, completion pace, and where
        risk is concentrated. Every number here is computed live, nothing
        is stored separately.
    </p>

    <div class="row g-4">
        <div class="col-md-6">
            <article class="panel-card h-100">
                <h2 class="panel-title"><i class="bi bi-speedometer"></i> Momentum Score</h2>
                <div class="insight-big-number"><?= $momentumScore ?><span class="insight-unit">/100</span></div>
                <p class="insight-explain">
                    Completion rate, reduced by your overdue load. Formula:
                    <code>(completed&divide;total &times; 100) &minus; (overdue&divide;total &times; 40)</code>
                </p>
            </article>
        </div>

        <div class="col-md-6">
            <article class="panel-card h-100">
                <h2 class="panel-title"><i class="bi bi-shield-check"></i> Priority Health Index</h2>
                <div class="insight-big-number"><?= $priorityHealthIndex ?><span class="insight-unit">%</span></div>
                <p class="insight-explain">
                    Of your <?= $highPriorityTotal ?> High-priority task<?= $highPriorityTotal === 1 ? '' : 's' ?>,
                    <?= $highPriorityOnTrack ?> <?= $highPriorityOnTrack === 1 ? 'is' : 'are' ?> still on track
                    (not overdue). This tracks whether "important" work is actually protected from slipping.
                </p>
            </article>
        </div>

        <div class="col-md-6">
            <article class="panel-card h-100">
                <h2 class="panel-title"><i class="bi bi-calendar-week"></i> Busiest Deadline Day</h2>
                <div class="insight-big-number insight-text"><?= e($busiestDay) ?></div>
                <p class="insight-explain">
                    <?= $busiestDayCount ?> of your <?= $stats['total'] ?> task<?= $stats['total'] === 1 ? '' : 's' ?>
                    fall due on a <?= e($busiestDay) ?> &mdash; the single most loaded day of the week in your
                    current schedule.
                </p>
            </article>
        </div>

        <div class="col-md-6">
            <article class="panel-card h-100">
                <h2 class="panel-title"><i class="bi bi-graph-up"></i> Completion Pace</h2>
                <div class="insight-big-number"><?= $completionPace ?><span class="insight-unit">/day</span></div>
                <p class="insight-explain">
                    <?php if ($daysToClearBacklog !== null): ?>
                        At this pace, clearing your current <?= $stats['pending'] ?> pending task<?= $stats['pending'] === 1 ? '' : 's' ?>
                        would take roughly <strong><?= (int) $daysToClearBacklog ?> day<?= $daysToClearBacklog == 1 ? '' : 's' ?></strong>.
                    <?php else: ?>
                        Not enough completed tasks yet to project a pace &mdash; complete a few tasks and check back.
                    <?php endif; ?>
                </p>
            </article>
        </div>

        <div class="col-12">
            <article class="panel-card">
                <h2 class="panel-title"><i class="bi bi-exclamation-octagon"></i> Most At-Risk Subject</h2>
                <?php if ($atRiskSubject !== null): ?>
                    <p class="insight-risk-line">
                        <span class="badge-overdue badge-deadline"><?= e($atRiskSubject) ?></span>
                        currently has <strong><?= $atRiskSubjectCount ?></strong> overdue task<?= $atRiskSubjectCount === 1 ? '' : 's' ?> &mdash;
                        the most of any subject right now. Worth tackling first.
                    </p>
                <?php else: ?>
                    <p class="insight-risk-line">No overdue tasks in any subject right now &mdash; nothing at risk.</p>
                <?php endif; ?>
            </article>
        </div>
    </div>
</section>

<?php require __DIR__ . '/includes/footer.php'; ?>
