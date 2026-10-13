<?php
require_once __DIR__ . '/includes/functions.php';

$pageTitle  = 'Focus Mode';
$activePage = 'focus';

// Reuses getTasks()/computeStats() exactly like the dashboard - the
// "most urgent" pick was already being computed there (do...while loop
// over deadline-sorted tasks), just never surfaced on its own page.
$allTasks = getTasks(['sort' => 'deadline_asc']);
$stats    = computeStats($allTasks);
$focusTask = $stats['most_urgent'];

require __DIR__ . '/includes/header.php';
?>

<section class="page-section" aria-labelledby="focusHeading">
    <h1 id="focusHeading" class="page-title"><i class="bi bi-stopwatch"></i> Focus Mode</h1>
    <p class="page-intro">
        A distraction-free timer pointed at whatever actually needs your
        attention right now &mdash; picked automatically from your real
        deadlines, not chosen manually.
    </p>

    <div class="row g-4">
        <div class="col-lg-5">
            <section class="panel-card h-100" aria-labelledby="focusTaskHeading">
                <h2 id="focusTaskHeading" class="panel-title"><i class="bi bi-bullseye"></i> Right now, focus on</h2>
                <?php if ($focusTask): ?>
                    <?php
                        $overdue = isOverdue($focusTask);
                        $dueSoon = isDueSoon($focusTask);
                    ?>
                    <p class="focus-task-title"><?= e($focusTask['title']) ?></p>
                    <p class="task-subject"><i class="bi bi-journal-bookmark"></i> <?= e($focusTask['subject']) ?></p>
                    <span class="badge-deadline <?= $overdue ? 'badge-overdue' : ($dueSoon ? 'badge-due-soon' : '') ?>">
                        <i class="bi <?= $overdue ? 'bi-exclamation-triangle' : ($dueSoon ? 'bi-alarm' : 'bi-calendar3') ?>"></i>
                        <?= $overdue ? 'Overdue &middot; ' : ($dueSoon ? 'Due Soon &middot; ' : '') ?><?= formatDeadline($focusTask['deadline']) ?>
                    </span>

                    <form method="post" action="actions/tasks.php" class="mt-3">
                        <input type="hidden" name="task_action" value="toggle_status">
                        <input type="hidden" name="id" value="<?= (int) $focusTask['id'] ?>">
                        <input type="hidden" name="new_status" value="Completed">
                        <button type="submit" class="btn btn-primary"><i class="bi bi-check-lg"></i> Mark Complete</button>
                    </form>
                <?php else: ?>
                    <p class="empty-state"><i class="bi bi-emoji-sunglasses fs-3 d-block mb-2"></i>Nothing pending &mdash; you're completely caught up.</p>
                <?php endif; ?>
            </section>
        </div>

        <div class="col-lg-7">
            <section class="panel-card h-100" aria-labelledby="timerHeading">
                <h2 id="timerHeading" class="panel-title"><i class="bi bi-clock-history"></i> Pomodoro Timer</h2>
                <div class="focus-timer-wrap">
                    <div class="focus-timer-ring" id="focusRing" style="--timer-pct: 0;">
                        <span class="focus-timer-value" id="focusTimerDisplay">25:00</span>
                    </div>
                    <div class="focus-timer-controls">
                        <div class="focus-timer-presets">
                            <button type="button" class="btn btn-sm btn-view" onclick="focusSetDuration(25)">25 min</button>
                            <button type="button" class="btn btn-sm btn-view" onclick="focusSetDuration(15)">15 min</button>
                            <button type="button" class="btn btn-sm btn-view" onclick="focusSetDuration(5)">5 min</button>
                        </div>
                        <div class="focus-timer-actions">
                            <button type="button" class="btn btn-primary" id="focusStartBtn" onclick="focusToggleTimer()"><i class="bi bi-play-fill"></i> Start</button>
                            <button type="button" class="btn btn-outline-secondary" onclick="focusResetTimer()"><i class="bi bi-arrow-counterclockwise"></i> Reset</button>
                        </div>
                        <p class="focus-timer-hint" id="focusTimerHint">Classic Pomodoro: 25 minutes of focus, then a short break.</p>
                    </div>
                </div>
            </section>
        </div>
    </div>
</section>

<script>
    document.addEventListener('DOMContentLoaded', function () { focusSetDuration(25); });
</script>

<?php require __DIR__ . '/includes/footer.php'; ?>
