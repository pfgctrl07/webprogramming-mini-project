<?php
require_once __DIR__ . '/includes/functions.php';

$pageTitle  = 'My Tasks';
$activePage = 'tasks';

// ---- Read filter / search / sort parameters from the query string ----
$search   = trim($_GET['search'] ?? '');
$status   = $_GET['status']   ?? [];   // checkboxes   -> array
$priority = $_GET['priority'] ?? [];   // list box     -> array
$subject  = trim($_GET['subject'] ?? ''); // pulldown  -> single value
$sort     = $_GET['sort'] ?? 'deadline_asc'; // pulldown -> single value

$filters = [
    'search'   => $search,
    'status'   => is_array($status) ? $status : [$status],
    'priority' => is_array($priority) ? $priority : [$priority],
    'subject'  => $subject,
    'sort'     => $sort,
];

$tasks    = getTasks($filters);
$subjects = getDistinctSubjects();

$editTask = null;
if (isset($_GET['action']) && $_GET['action'] === 'edit' && isset($_GET['id'])) {
    $editTask = getTaskById((int) $_GET['id']);
}
$openNewModal  = isset($_GET['action']) && $_GET['action'] === 'new';
$openEditModal = $editTask !== null;

require __DIR__ . '/includes/header.php';
?>

<section class="page-section" aria-labelledby="tasksHeading">
    <div class="d-flex justify-content-between align-items-center flex-wrap mb-3">
        <h1 id="tasksHeading" class="page-title"><i class="bi bi-list-task"></i> My Tasks</h1>
        <button type="button" class="btn btn-primary btn-add-task" onclick="openTaskModal()"><i class="bi bi-plus-lg"></i> Add New Task</button>
    </div>

    <!-- Search / filter / sort toolbar -->
    <form method="get" action="tasks.php" class="panel-card filter-toolbar" id="filterForm">
        <div class="row g-3 align-items-start">
            <div class="col-md-3">
                <label for="searchInput" class="form-label"><i class="bi bi-search"></i> Search tasks</label>
                <input type="text" id="searchInput" name="search" class="form-control"
                       placeholder="Title, subject, description..."
                       value="<?= e($search) ?>"
                       onblur="this.classList.toggle('field-touched', this.value.trim() !== '')">
            </div>

            <div class="col-md-3">
                <!-- fieldset + legend grouping checkboxes (Unit II requirement) -->
                <fieldset class="filter-fieldset">
                    <legend><i class="bi bi-funnel"></i> Status</legend>
                    <div class="form-check form-check-inline">
                        <input class="form-check-input" type="checkbox" name="status[]" id="statusPending" value="Pending"
                               <?= in_array('Pending', $filters['status'], true) ? 'checked' : '' ?>>
                        <label class="form-check-label" for="statusPending">Pending</label>
                    </div>
                    <div class="form-check form-check-inline">
                        <input class="form-check-input" type="checkbox" name="status[]" id="statusCompleted" value="Completed"
                               <?= in_array('Completed', $filters['status'], true) ? 'checked' : '' ?>>
                        <label class="form-check-label" for="statusCompleted">Completed</label>
                    </div>
                </fieldset>
            </div>

            <div class="col-md-2">
                <!-- list box: multi-select -->
                <label for="priorityListBox" class="form-label"><i class="bi bi-flag"></i> Priority (list box)</label>
                <select id="priorityListBox" name="priority[]" class="form-select" multiple size="3"
                        onchange="highlightSelectedPriorities(this)">
                    <?php foreach (ALLOWED_PRIORITIES as $p): ?>
                        <option value="<?= e($p) ?>" <?= in_array($p, $filters['priority'], true) ? 'selected' : '' ?>><?= e($p) ?></option>
                    <?php endforeach; ?>
                </select>
            </div>

            <div class="col-md-2">
                <!-- pulldown menu: subject -->
                <label for="subjectSelect" class="form-label"><i class="bi bi-journal-bookmark"></i> Subject</label>
                <select id="subjectSelect" name="subject" class="form-select">
                    <option value="">All Subjects</option>
                    <?php foreach ($subjects as $s): ?>
                        <option value="<?= e($s) ?>" <?= $subject === $s ? 'selected' : '' ?>><?= e($s) ?></option>
                    <?php endforeach; ?>
                </select>
            </div>

            <div class="col-md-2">
                <!-- pulldown menu: sort -->
                <label for="sortSelect" class="form-label"><i class="bi bi-sort-down"></i> Sort by</label>
                <select id="sortSelect" name="sort" class="form-select">
                    <option value="deadline_asc"  <?= $sort === 'deadline_asc'  ? 'selected' : '' ?>>Deadline (soonest)</option>
                    <option value="deadline_desc" <?= $sort === 'deadline_desc' ? 'selected' : '' ?>>Deadline (latest)</option>
                    <option value="priority_desc" <?= $sort === 'priority_desc' ? 'selected' : '' ?>>Priority (high first)</option>
                    <option value="priority_asc"  <?= $sort === 'priority_asc'  ? 'selected' : '' ?>>Priority (low first)</option>
                    <option value="created_desc"  <?= $sort === 'created_desc'  ? 'selected' : '' ?>>Newest created</option>
                    <option value="created_asc"   <?= $sort === 'created_asc'   ? 'selected' : '' ?>>Oldest created</option>
                </select>
            </div>
        </div>
        <div class="filter-actions mt-3">
            <button type="submit" class="btn btn-outline-primary"><i class="bi bi-filter-circle"></i> Apply</button>
            <a href="tasks.php" class="btn btn-outline-secondary"><i class="bi bi-arrow-counterclockwise"></i> Reset</a>
        </div>
    </form>

    <!-- View toggle: List vs. Kanban board (same filtered $tasks, no extra query) -->
    <div class="view-toggle mt-4" role="group" aria-label="Task view switch">
        <button type="button" id="viewToggleList" class="btn btn-sm btn-view active" onclick="showTaskView('list')">
            <i class="bi bi-list-ul"></i> List View
        </button>
        <button type="button" id="viewToggleBoard" class="btn btn-sm btn-view" onclick="showTaskView('board')">
            <i class="bi bi-kanban"></i> Board View
        </button>
    </div>

    <!-- Task list -->
    <div class="task-list mt-3" id="listView">
        <?php if (empty($tasks)): ?>
            <div class="panel-card empty-state-card">
                <p class="empty-state"><i class="bi bi-inbox fs-3 d-block mb-2"></i>No tasks match your filters. Try adjusting search or filters, or add a new task.</p>
            </div>
        <?php else: ?>
            <?php foreach ($tasks as $task): ?>
                <?php
                    $overdue  = isOverdue($task);
                    $dueSoon  = isDueSoon($task);
                    $isDone   = $task['status'] === 'Completed';
                    $priorityIcon = ['low' => 'bi-arrow-down-circle', 'medium' => 'bi-dash-circle', 'high' => 'bi-arrow-up-circle'][strtolower($task['priority'])];
                    $suggested = suggestPriorityFromDeadline($task);
                    $showSuggestion = !$isDone && priorityWeight($suggested) > priorityWeight($task['priority']);
                ?>
                <article class="task-card priority-<?= strtolower($task['priority']) ?> <?= $isDone ? 'task-completed' : '' ?>">
                    <div class="task-card-main">
                        <div class="task-card-header">
                            <h2 class="task-title"><?= $isDone ? '<i class="bi bi-check2-circle text-success"></i> ' : '' ?><?= e($task['title']) ?></h2>
                            <span class="badge-priority badge-priority-<?= strtolower($task['priority']) ?>"><i class="bi <?= $priorityIcon ?>"></i> <?= e($task['priority']) ?></span>
                            <?php if ($showSuggestion): ?>
                                <span class="badge-suggestion" title="Deadline is close enough that this task's priority might deserve bumping up">
                                    <i class="bi bi-lightbulb"></i> Suggest: <?= e($suggested) ?>
                                </span>
                            <?php endif; ?>
                        </div>
                        <p class="task-subject"><i class="bi bi-journal-bookmark"></i> <?= e($task['subject']) ?></p>
                        <?php if (!empty($task['description'])): ?>
                            <p class="task-description"><?= e($task['description']) ?></p>
                        <?php endif; ?>
                        <div class="task-meta">
                            <span class="badge-deadline <?= $overdue ? 'badge-overdue' : ($dueSoon ? 'badge-due-soon' : '') ?>"
                                  title="<?= $overdue ? 'This task is overdue' : ($dueSoon ? 'Due within 48 hours' : 'Deadline') ?>">
                                <i class="bi <?= $overdue ? 'bi-exclamation-triangle' : ($dueSoon ? 'bi-alarm' : 'bi-calendar3') ?>"></i>
                                <?= $overdue ? 'Overdue &middot; ' : ($dueSoon ? 'Due Soon &middot; ' : '') ?><?= formatDeadline($task['deadline']) ?>
                            </span>
                            <span class="badge-status badge-status-<?= strtolower($task['status']) ?>">
                                <i class="bi <?= $isDone ? 'bi-check-circle' : 'bi-hourglass-split' ?>"></i> <?= e($task['status']) ?>
                            </span>
                        </div>
                    </div>
                    <div class="task-card-actions">
                        <form method="post" action="actions/tasks.php" class="d-inline">
                            <input type="hidden" name="task_action" value="toggle_status">
                            <input type="hidden" name="id" value="<?= (int) $task['id'] ?>">
                            <input type="hidden" name="new_status" value="<?= $isDone ? 'Pending' : 'Completed' ?>">
                            <button type="submit" class="btn btn-sm btn-outline-success" title="<?= $isDone ? 'Reopen task' : 'Mark complete' ?>">
                                <i class="bi <?= $isDone ? 'bi-arrow-counterclockwise' : 'bi-check-lg' ?>"></i> <?= $isDone ? 'Reopen' : 'Mark Complete' ?>
                            </button>
                        </form>

                        <button type="button" class="btn btn-sm btn-outline-primary"
                                onclick="editTask({
                                    id: <?= (int) $task['id'] ?>,
                                    title: <?= json_encode($task['title']) ?>,
                                    subject: <?= json_encode($task['subject']) ?>,
                                    description: <?= json_encode($task['description']) ?>,
                                    deadline: <?= json_encode(date('Y-m-d\TH:i', strtotime($task['deadline']))) ?>,
                                    priority: <?= json_encode($task['priority']) ?>,
                                    status: <?= json_encode($task['status']) ?>
                                })"><i class="bi bi-pencil"></i> Edit</button>

                        <button type="button" class="btn btn-sm btn-outline-danger"
                                data-bs-toggle="modal" data-bs-target="#deleteConfirmModal"
                                onclick="prepareDelete(<?= (int) $task['id'] ?>, <?= json_encode($task['title']) ?>)">
                            <i class="bi bi-trash"></i> Delete
                        </button>
                    </div>
                </article>
            <?php endforeach; ?>
        <?php endif; ?>
    </div>

    <!-- Kanban board view: same $tasks, grouped into 3 columns instead of
         one stacked list - a different lens on identical data, no extra
         database query. Hidden by default; toggled via showTaskView(). -->
    <div class="kanban-board is-hidden" id="boardView">
        <?php
            $boardColumns = [
                'todo'      => ['label' => 'To Do',     'icon' => 'bi-circle',            'tasks' => []],
                'urgent'    => ['label' => 'Urgent',     'icon' => 'bi-exclamation-triangle', 'tasks' => []],
                'completed' => ['label' => 'Completed',  'icon' => 'bi-check-circle',      'tasks' => []],
            ];
            foreach ($tasks as $task) {
                if ($task['status'] === 'Completed') {
                    $boardColumns['completed']['tasks'][] = $task;
                } elseif (isOverdue($task) || isDueSoon($task)) {
                    $boardColumns['urgent']['tasks'][] = $task;
                } else {
                    $boardColumns['todo']['tasks'][] = $task;
                }
            }
        ?>
        <?php foreach ($boardColumns as $column): ?>
            <div class="kanban-column">
                <div class="kanban-column-header">
                    <i class="bi <?= $column['icon'] ?>"></i> <?= e($column['label']) ?>
                    <span class="kanban-count"><?= count($column['tasks']) ?></span>
                </div>
                <?php if (empty($column['tasks'])): ?>
                    <p class="kanban-empty">Nothing here.</p>
                <?php else: ?>
                    <?php foreach ($column['tasks'] as $task): ?>
                        <div class="kanban-card priority-<?= strtolower($task['priority']) ?>">
                            <p class="kanban-card-title"><?= e($task['title']) ?></p>
                            <p class="kanban-card-subject"><i class="bi bi-journal-bookmark"></i> <?= e($task['subject']) ?></p>
                            <div class="kanban-card-footer">
                                <span class="badge-priority badge-priority-<?= strtolower($task['priority']) ?>"><?= e($task['priority']) ?></span>
                                <span class="kanban-card-deadline"><?= formatDeadline($task['deadline']) ?></span>
                            </div>
                        </div>
                    <?php endforeach; ?>
                <?php endif; ?>
            </div>
        <?php endforeach; ?>
    </div>
</section>

<!-- ============================================================
     Custom add/edit task dialog - plain HTML/CSS/JS overlay
     (NOT a Bootstrap modal) demonstrating z-index stacking from
     Unit II: the overlay sits above everything else in the page.
     ============================================================ -->
<div class="custom-modal-overlay" id="taskModalOverlay">
    <div class="custom-modal" role="dialog" aria-modal="true" aria-labelledby="taskModalTitle">
        <div class="custom-modal-header">
            <h2 id="taskModalTitle"><i class="bi bi-plus-circle"></i> Add New Task</h2>
            <button type="button" class="custom-modal-close" onclick="closeTaskModal()" aria-label="Close">&times;</button>
        </div>

        <form method="post" action="actions/tasks.php" id="taskForm" novalidate>
            <input type="hidden" name="task_action" id="taskFormAction" value="create">
            <input type="hidden" name="id" id="taskId" value="">

            <div class="mb-3">
                <label for="taskTitle" class="form-label">Task Title *</label>
                <input type="text" class="form-control" id="taskTitle" name="title" maxlength="150" required
                       onblur="validateField(this)">
                <small class="field-error" id="taskTitleError"></small>
            </div>

            <div class="mb-3">
                <label for="taskSubject" class="form-label">Subject / Course *</label>
                <input type="text" class="form-control" id="taskSubject" name="subject" maxlength="100" required
                       onblur="validateField(this)">
                <small class="field-error" id="taskSubjectError"></small>
            </div>

            <div class="mb-3">
                <label for="taskDescription" class="form-label">Description</label>
                <textarea class="form-control" id="taskDescription" name="description" rows="3" maxlength="1000"></textarea>
            </div>

            <div class="mb-3">
                <label for="taskDeadline" class="form-label">Deadline *</label>
                <input type="datetime-local" class="form-control" id="taskDeadline" name="deadline" required
                       onblur="validateField(this)">
                <small class="field-error" id="taskDeadlineError"></small>
            </div>

            <!-- fieldset + legend + radio buttons: Priority (Unit II requirement) -->
            <fieldset class="mb-3">
                <legend><i class="bi bi-flag"></i> Priority *</legend>
                <div class="form-check form-check-inline">
                    <input class="form-check-input" type="radio" name="priority" id="priorityLow" value="Low">
                    <label class="form-check-label" for="priorityLow">Low</label>
                </div>
                <div class="form-check form-check-inline">
                    <input class="form-check-input" type="radio" name="priority" id="priorityMedium" value="Medium" checked>
                    <label class="form-check-label" for="priorityMedium">Medium</label>
                </div>
                <div class="form-check form-check-inline">
                    <input class="form-check-input" type="radio" name="priority" id="priorityHigh" value="High">
                    <label class="form-check-label" for="priorityHigh">High</label>
                </div>
            </fieldset>

            <fieldset class="mb-3" id="statusFieldset">
                <legend><i class="bi bi-toggle2-on"></i> Status</legend>
                <div class="form-check form-check-inline">
                    <input class="form-check-input" type="radio" name="status" id="statusFormPending" value="Pending" checked>
                    <label class="form-check-label" for="statusFormPending">Pending</label>
                </div>
                <div class="form-check form-check-inline">
                    <input class="form-check-input" type="radio" name="status" id="statusFormCompleted" value="Completed">
                    <label class="form-check-label" for="statusFormCompleted">Completed</label>
                </div>
            </fieldset>

            <div class="custom-modal-footer">
                <button type="button" class="btn btn-outline-secondary" onclick="resetTaskForm()"><i class="bi bi-arrow-counterclockwise"></i> Reset</button>
                <button type="submit" class="btn btn-primary"><i class="bi bi-save"></i> Save Task</button>
            </div>
        </form>
    </div>
</div>

<!-- ============================================================
     Delete confirmation - Bootstrap modal plugin (data-bs-toggle)
     demonstrates a Bootstrap interactive component, distinct from
     the custom overlay above.
     ============================================================ -->
<div class="modal fade" id="deleteConfirmModal" tabindex="-1" aria-labelledby="deleteConfirmLabel" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="deleteConfirmLabel"><i class="bi bi-exclamation-triangle text-danger"></i> Delete Task</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <form method="post" action="actions/tasks.php">
                <div class="modal-body">
                    <p>Are you sure you want to delete <strong id="deleteTaskTitle"></strong>? This cannot be undone.</p>
                    <input type="hidden" name="task_action" value="delete">
                    <input type="hidden" name="id" id="deleteTaskId" value="">
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-danger"><i class="bi bi-trash"></i> Delete Task</button>
                </div>
            </form>
        </div>
    </div>
</div>

<?php if ($openNewModal): ?>
<script>document.addEventListener('DOMContentLoaded', function () { openTaskModal(); });</script>
<?php endif; ?>

<?php if ($openEditModal): ?>
<script>
document.addEventListener('DOMContentLoaded', function () {
    editTask({
        id: <?= (int) $editTask['id'] ?>,
        title: <?= json_encode($editTask['title']) ?>,
        subject: <?= json_encode($editTask['subject']) ?>,
        description: <?= json_encode($editTask['description']) ?>,
        deadline: <?= json_encode(date('Y-m-d\TH:i', strtotime($editTask['deadline']))) ?>,
        priority: <?= json_encode($editTask['priority']) ?>,
        status: <?= json_encode($editTask['status']) ?>
    });
});
</script>
<?php endif; ?>

<?php require __DIR__ . '/includes/footer.php'; ?>
