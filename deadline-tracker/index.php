<?php
require_once __DIR__ . '/includes/functions.php';

$pageTitle  = 'Dashboard';
$activePage = 'dashboard';

$allTasks = getTasks(['sort' => 'deadline_asc']);
$stats    = computeStats($allTasks);
$upcoming = getUpcomingDeadlines($allTasks, 5);
$completionPct = $stats['total'] > 0 ? round(($stats['completed'] / $stats['total']) * 100) : 0;

// ---- Subject-wise progress: group the already-fetched $allTasks by
// subject (no extra query) so the dashboard shows per-course progress,
// not just one site-wide total.
$subjectProgress = [];
foreach ($allTasks as $task) {
    $subj = $task['subject'];
    if (!isset($subjectProgress[$subj])) {
        $subjectProgress[$subj] = ['total' => 0, 'completed' => 0];
    }
    $subjectProgress[$subj]['total']++;
    if ($task['status'] === 'Completed') {
        $subjectProgress[$subj]['completed']++;
    }
}
ksort($subjectProgress);

// ---- Momentum Score: a rule-based scoring concept layered on top of
// existing stats (no new queries/schema) - rewards completion rate,
// penalizes overdue load, so it reflects both effort and urgency.
$completionRatio = $stats['total'] > 0 ? $stats['completed'] / $stats['total'] : 0;
$overdueRatio    = $stats['total'] > 0 ? $stats['overdue'] / $stats['total'] : 0;
$momentumScore   = (int) max(0, min(100, round(($completionRatio * 100) - ($overdueRatio * 40))));

if ($momentumScore >= 80) {
    $momentumTier = ['label' => 'On Fire', 'icon' => 'bi-fire'];
} elseif ($momentumScore >= 50) {
    $momentumTier = ['label' => 'Building Momentum', 'icon' => 'bi-graph-up-arrow'];
} elseif ($momentumScore >= 20) {
    $momentumTier = ['label' => 'Getting Started', 'icon' => 'bi-seedling'];
} else {
    $momentumTier = ['label' => 'Needs Attention', 'icon' => 'bi-exclamation-circle'];
}

require __DIR__ . '/includes/header.php';
?>

<section class="page-section" aria-labelledby="dashboardHeading">

    <!-- Hero banner: friendly greeting + quick context -->
    <div class="dashboard-hero">
        <div class="dashboard-hero-content d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
                <p class="dashboard-hero-eyebrow"><i class="bi bi-stars"></i> Welcome back</p>
                <h1 id="dashboardHeading">Here's your deadline overview</h1>
                <p><?= date('l, d F Y') ?> &middot; <?= (int) $stats['pending'] ?> task<?= $stats['pending'] === 1 ? '' : 's' ?> still need your attention.</p>
                <div class="momentum-badge" title="Momentum Score = completion rate, reduced by your overdue load">
                    <i class="bi <?= $momentumTier['icon'] ?>"></i>
                    <span class="momentum-score"><?= $momentumScore ?></span>
                    <span class="momentum-label"><?= e($momentumTier['label']) ?></span>
                </div>
            </div>
            <a href="tasks.php?action=new" class="btn btn-primary btn-add-task"><i class="bi bi-plus-lg"></i> Add New Task</a>
        </div>
    </div>

    <!-- Summary cards: Bootstrap grid + flexbox -->
    <div class="row g-3 stat-card-row">
        <div class="col-6 col-md-4 col-xl-2">
            <article class="stat-card stat-total" onmouseover="this.classList.add('stat-hover')" onmouseout="this.classList.remove('stat-hover')">
                <div class="stat-icon"><i class="bi bi-collection"></i></div>
                <p class="stat-value"><?= (int) $stats['total'] ?></p>
                <p class="stat-label">Total Tasks</p>
            </article>
        </div>
        <div class="col-6 col-md-4 col-xl-2">
            <article class="stat-card stat-pending" onmouseover="this.classList.add('stat-hover')" onmouseout="this.classList.remove('stat-hover')">
                <div class="stat-icon"><i class="bi bi-hourglass-split"></i></div>
                <p class="stat-value"><?= (int) $stats['pending'] ?></p>
                <p class="stat-label">Pending</p>
            </article>
        </div>
        <div class="col-6 col-md-4 col-xl-2">
            <article class="stat-card stat-completed" onmouseover="this.classList.add('stat-hover')" onmouseout="this.classList.remove('stat-hover')">
                <div class="stat-icon"><i class="bi bi-check2-circle"></i></div>
                <p class="stat-value"><?= (int) $stats['completed'] ?></p>
                <p class="stat-label">Completed</p>
            </article>
        </div>
        <div class="col-6 col-md-4 col-xl-2">
            <article class="stat-card stat-overdue" onmouseover="this.classList.add('stat-hover')" onmouseout="this.classList.remove('stat-hover')">
                <div class="stat-icon"><i class="bi bi-exclamation-triangle"></i></div>
                <p class="stat-value"><?= (int) $stats['overdue'] ?></p>
                <p class="stat-label">Overdue</p>
            </article>
        </div>
        <div class="col-6 col-md-4 col-xl-2">
            <article class="stat-card stat-due-soon" onmouseover="this.classList.add('stat-hover')" onmouseout="this.classList.remove('stat-hover')">
                <div class="stat-icon"><i class="bi bi-alarm"></i></div>
                <p class="stat-value"><?= (int) $stats['due_soon'] ?></p>
                <p class="stat-label">Due Soon (48h)</p>
            </article>
        </div>
        <div class="col-6 col-md-4 col-xl-2">
            <article class="stat-card stat-priority" onmouseover="this.classList.add('stat-hover')" onmouseout="this.classList.remove('stat-hover')">
                <div class="stat-icon"><i class="bi bi-flag"></i></div>
                <p class="stat-value"><?= (int) $stats['priority']['High'] ?></p>
                <p class="stat-label">High Priority</p>
            </article>
        </div>
    </div>

    <div class="row g-4 mt-2">
        <!-- Canvas chart: Unit II Canvas drawing requirement -->
        <div class="col-lg-7">
            <section class="panel-card" aria-labelledby="chartHeading">
                <h2 id="chartHeading" class="panel-title"><i class="bi bi-bar-chart-line"></i> Task Status Overview (Canvas)</h2>
                <canvas id="statusChart" width="520" height="260" aria-label="Bar chart of pending, completed, overdue and due soon tasks" role="img"></canvas>
                <p class="chart-caption">Drawn with the HTML5 Canvas API from live database counts &mdash; no chart library used.</p>
            </section>
        </div>

        <!-- Upcoming deadlines list -->
        <div class="col-lg-5">
            <aside class="panel-card" aria-labelledby="upcomingHeading">
                <h2 id="upcomingHeading" class="panel-title"><i class="bi bi-calendar-event"></i> Upcoming Deadlines</h2>
                <?php if (empty($upcoming)): ?>
                    <p class="empty-state">No pending tasks. Great job staying on top of things!</p>
                <?php else: ?>
                    <ul class="upcoming-list">
                        <?php foreach ($upcoming as $task): ?>
                            <li class="upcoming-item priority-<?= strtolower($task['priority']) ?>">
                                <div class="upcoming-main">
                                    <span class="upcoming-title"><?= e($task['title']) ?></span>
                                    <span class="upcoming-subject"><?= e($task['subject']) ?></span>
                                </div>
                                <div class="upcoming-meta">
                                    <span class="badge-deadline <?= isOverdue($task) ? 'badge-overdue' : (isDueSoon($task) ? 'badge-due-soon' : '') ?>">
                                        <?= formatDeadline($task['deadline']) ?>
                                    </span>
                                </div>
                            </li>
                        <?php endforeach; ?>
                    </ul>
                <?php endif; ?>
            </aside>
        </div>
    </div>

    <div class="row g-4 mt-1">
        <!-- Priority distribution -->
        <div class="col-lg-7">
            <section class="panel-card h-100" aria-labelledby="priorityHeading">
                <h2 id="priorityHeading" class="panel-title"><i class="bi bi-flag"></i> Task Distribution by Priority</h2>
                <div class="row g-3 text-center">
                    <div class="col-md-4">
                        <div class="priority-bar priority-bar-low">
                            <i class="bi bi-arrow-down-circle"></i>
                            <span class="priority-count"><?= (int) $stats['priority']['Low'] ?></span>
                            <span class="priority-name">Low</span>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="priority-bar priority-bar-medium">
                            <i class="bi bi-dash-circle"></i>
                            <span class="priority-count"><?= (int) $stats['priority']['Medium'] ?></span>
                            <span class="priority-name">Medium</span>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="priority-bar priority-bar-high">
                            <i class="bi bi-arrow-up-circle"></i>
                            <span class="priority-count"><?= (int) $stats['priority']['High'] ?></span>
                            <span class="priority-name">High</span>
                        </div>
                    </div>
                </div>
            </section>
        </div>

        <!-- Completion rate ring: derived from completed / total, CSS conic-gradient -->
        <div class="col-lg-5">
            <section class="panel-card h-100" aria-labelledby="completionHeading">
                <h2 id="completionHeading" class="panel-title"><i class="bi bi-pie-chart"></i> Completion Rate</h2>
                <div class="completion-ring-wrap">
                    <div class="completion-ring" style="--pct: <?= $completionPct ?>;">
                        <span class="completion-ring-value"><?= $completionPct ?>%</span>
                    </div>
                    <p class="completion-legend">
                        <strong><?= (int) $stats['completed'] ?></strong> of
                        <strong><?= (int) $stats['total'] ?></strong> tasks completed so far. Keep it up!
                    </p>
                </div>
            </section>
        </div>
    </div>

    <!-- Subject-wise progress: same task data, grouped by subject instead
         of site-wide, so you can see which course is falling behind -->
    <section class="panel-card mt-4" aria-labelledby="subjectProgressHeading">
        <h2 id="subjectProgressHeading" class="panel-title"><i class="bi bi-journal-bookmark"></i> Progress by Subject</h2>
        <?php if (empty($subjectProgress)): ?>
            <p class="empty-state">No tasks yet to track progress by subject.</p>
        <?php else: ?>
            <?php foreach ($subjectProgress as $subjectName => $progress): ?>
                <?php $subjPct = $progress['total'] > 0 ? round(($progress['completed'] / $progress['total']) * 100) : 0; ?>
                <div class="subject-progress-row">
                    <div class="subject-progress-label">
                        <span class="subject-name"><?= e($subjectName) ?></span>
                        <span class="subject-fraction"><?= (int) $progress['completed'] ?>/<?= (int) $progress['total'] ?> &middot; <?= $subjPct ?>%</span>
                    </div>
                    <div class="subject-progress-track">
                        <div class="subject-progress-fill" style="width: <?= $subjPct ?>%;"></div>
                    </div>
                </div>
            <?php endforeach; ?>
        <?php endif; ?>
    </section>
</section>

<!-- Data for the Canvas chart, read by assets/js/app.js on window load -->
<script>
    window.DASHBOARD_STATS = {
        pending: <?= (int) $stats['pending'] ?>,
        completed: <?= (int) $stats['completed'] ?>,
        overdue: <?= (int) $stats['overdue'] ?>,
        dueSoon: <?= (int) $stats['due_soon'] ?>
    };
</script>

<?php require __DIR__ . '/includes/footer.php'; ?>
