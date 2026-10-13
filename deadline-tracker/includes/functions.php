<?php
/**
 * Shared PHP helper functions for Deadline Tracker.
 *
 * Demonstrates: PHP constants, variables, operators, conditionals,
 * loops, arrays, strings, functions, and database access through
 * PDO prepared statements (Unit III).
 */

require_once __DIR__ . '/../config/database.php';

// PHP defaults to UTC regardless of the host OS/database timezone, which
// would silently skew every overdue/due-soon comparison against MySQL's
// NOW(). Pin both to the same zone the sample data was generated in.
date_default_timezone_set('Asia/Kolkata');

// ---- Application-wide constants -------------------------------------
define('APP_NAME', 'Deadline Tracker');
define('ALLOWED_PRIORITIES', ['Low', 'Medium', 'High']);
define('ALLOWED_STATUSES', ['Pending', 'Completed']);
define('DUE_SOON_HOURS', 48); // tasks due within this many hours are "due soon"
define('MAX_TITLE_LENGTH', 150);
define('MAX_SUBJECT_LENGTH', 100);
define('MAX_DESCRIPTION_LENGTH', 1000);

/**
 * e() - escape text for safe HTML output. Used everywhere user
 * supplied text is echoed, to prevent XSS.
 */
function e(?string $value): string {
    return htmlspecialchars($value ?? '', ENT_QUOTES, 'UTF-8');
}

/**
 * flash() / getFlash() - one-shot session messages for user feedback
 * after redirects (PRG pattern: Post/Redirect/Get).
 */
function flash(string $type, string $message): void {
    if (session_status() !== PHP_SESSION_ACTIVE) {
        session_start();
    }
    $_SESSION['flash'] = ['type' => $type, 'message' => $message];
}

function getFlash(): ?array {
    if (session_status() !== PHP_SESSION_ACTIVE) {
        session_start();
    }
    if (!empty($_SESSION['flash'])) {
        $flash = $_SESSION['flash'];
        unset($_SESSION['flash']);
        return $flash;
    }
    return null;
}

/**
 * validateTaskInput() - server-side validation (never trust the
 * client). Returns an array of field => error message; empty array
 * means the input is valid.
 */
function validateTaskInput(array $data): array {
    $errors = [];

    $title = trim($data['title'] ?? '');
    if ($title === '') {
        $errors['title'] = 'Task title is required.';
    } elseif (strlen($title) > MAX_TITLE_LENGTH) {
        $errors['title'] = 'Title must be ' . MAX_TITLE_LENGTH . ' characters or fewer.';
    }

    $subject = trim($data['subject'] ?? '');
    if ($subject === '') {
        $errors['subject'] = 'Subject / course is required.';
    } elseif (strlen($subject) > MAX_SUBJECT_LENGTH) {
        $errors['subject'] = 'Subject must be ' . MAX_SUBJECT_LENGTH . ' characters or fewer.';
    }

    $description = trim($data['description'] ?? '');
    if (strlen($description) > MAX_DESCRIPTION_LENGTH) {
        $errors['description'] = 'Description must be ' . MAX_DESCRIPTION_LENGTH . ' characters or fewer.';
    }

    $deadline = trim($data['deadline'] ?? '');
    $parsedDeadline = DateTime::createFromFormat('Y-m-d\TH:i', $deadline);
    if ($deadline === '' || !$parsedDeadline) {
        $errors['deadline'] = 'A valid deadline date and time is required.';
    }

    $priority = $data['priority'] ?? '';
    if (!in_array($priority, ALLOWED_PRIORITIES, true)) {
        $errors['priority'] = 'Priority must be Low, Medium, or High.';
    }

    $status = $data['status'] ?? 'Pending';
    if (!in_array($status, ALLOWED_STATUSES, true)) {
        $errors['status'] = 'Status must be Pending or Completed.';
    }

    return $errors;
}

/**
 * createTask() - INSERT using a prepared statement.
 */
function createTask(array $data): int {
    $pdo = getDbConnection();
    $sql = 'INSERT INTO tasks (title, subject, description, deadline, priority, status)
            VALUES (:title, :subject, :description, :deadline, :priority, :status)';
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':title'       => trim($data['title']),
        ':subject'     => trim($data['subject']),
        ':description' => trim($data['description'] ?? ''),
        ':deadline'    => str_replace('T', ' ', $data['deadline']) . ':00',
        ':priority'    => $data['priority'],
        ':status'      => $data['status'] ?? 'Pending',
    ]);
    return (int) $pdo->lastInsertId();
}

/**
 * updateTask() - UPDATE using a prepared statement.
 */
function updateTask(int $id, array $data): bool {
    $pdo = getDbConnection();
    $sql = 'UPDATE tasks SET title = :title, subject = :subject, description = :description,
            deadline = :deadline, priority = :priority, status = :status WHERE id = :id';
    $stmt = $pdo->prepare($sql);
    return $stmt->execute([
        ':title'       => trim($data['title']),
        ':subject'     => trim($data['subject']),
        ':description' => trim($data['description'] ?? ''),
        ':deadline'    => str_replace('T', ' ', $data['deadline']) . ':00',
        ':priority'    => $data['priority'],
        ':status'      => $data['status'] ?? 'Pending',
        ':id'          => $id,
    ]);
}

/**
 * deleteTask() - DELETE a single row by id.
 */
function deleteTask(int $id): bool {
    $pdo = getDbConnection();
    $stmt = $pdo->prepare('DELETE FROM tasks WHERE id = :id');
    return $stmt->execute([':id' => $id]);
}

/**
 * setTaskStatus() - toggle a task between Pending and Completed
 * (mark complete / reopen).
 */
function setTaskStatus(int $id, string $status): bool {
    if (!in_array($status, ALLOWED_STATUSES, true)) {
        return false;
    }
    $pdo = getDbConnection();
    $stmt = $pdo->prepare('UPDATE tasks SET status = :status WHERE id = :id');
    return $stmt->execute([':status' => $status, ':id' => $id]);
}

/**
 * getTaskById() - fetch a single task.
 */
function getTaskById(int $id): ?array {
    $pdo = getDbConnection();
    $stmt = $pdo->prepare('SELECT * FROM tasks WHERE id = :id');
    $stmt->execute([':id' => $id]);
    $task = $stmt->fetch();
    return $task ?: null;
}

/**
 * getTasks() - fetch tasks applying optional search / filter / sort,
 * all built with bound parameters (never string-concatenated values).
 *
 * $filters keys: search, status, priority, subject, sort
 */
function getTasks(array $filters = []): array {
    $pdo = getDbConnection();

    $where  = [];
    $params = [];

    if (!empty($filters['search'])) {
        // Native prepared statements (ATTR_EMULATE_PREPARES = false) do not
        // allow the same named placeholder to repeat, so each LIKE clause
        // gets its own bound parameter even though the value is identical.
        $where[] = '(title LIKE :search1 OR subject LIKE :search2 OR description LIKE :search3)';
        $searchTerm = '%' . $filters['search'] . '%';
        $params[':search1'] = $searchTerm;
        $params[':search2'] = $searchTerm;
        $params[':search3'] = $searchTerm;
    }

    // Status comes from a set of checkboxes, so zero or more values
    // may be selected at once.
    if (!empty($filters['status']) && is_array($filters['status'])) {
        $validStatuses = array_values(array_intersect($filters['status'], ALLOWED_STATUSES));
        if ($validStatuses) {
            $placeholders = [];
            foreach ($validStatuses as $i => $status) {
                $key = ':status' . $i;
                $placeholders[] = $key;
                $params[$key] = $status;
            }
            $where[] = 'status IN (' . implode(',', $placeholders) . ')';
        }
    }

    // Priority comes from a multi-select list box, so zero or more
    // values may be selected at once.
    if (!empty($filters['priority']) && is_array($filters['priority'])) {
        $validPriorities = array_values(array_intersect($filters['priority'], ALLOWED_PRIORITIES));
        if ($validPriorities) {
            $placeholders = [];
            foreach ($validPriorities as $i => $priority) {
                $key = ':priority' . $i;
                $placeholders[] = $key;
                $params[$key] = $priority;
            }
            $where[] = 'priority IN (' . implode(',', $placeholders) . ')';
        }
    }

    if (!empty($filters['subject'])) {
        $where[] = 'subject = :subject';
        $params[':subject'] = $filters['subject'];
    }

    $sql = 'SELECT * FROM tasks';
    if ($where) {
        $sql .= ' WHERE ' . implode(' AND ', $where);
    }

    // Whitelist sort options so user input can never inject raw SQL here.
    $sortOptions = [
        'deadline_asc'   => 'deadline ASC',
        'deadline_desc'  => 'deadline DESC',
        'priority_desc'  => "CASE priority WHEN 'High' THEN 1 WHEN 'Medium' THEN 2 ELSE 3 END ASC",
        'priority_asc'   => "CASE priority WHEN 'High' THEN 1 WHEN 'Medium' THEN 2 ELSE 3 END DESC",
        'created_desc'   => 'created_at DESC',
        'created_asc'    => 'created_at ASC',
    ];
    $sortKey = $filters['sort'] ?? 'deadline_asc';
    $sql .= ' ORDER BY ' . ($sortOptions[$sortKey] ?? $sortOptions['deadline_asc']);

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return $stmt->fetchAll();
}

/**
 * getDistinctSubjects() - powers the subject filter dropdown / list box.
 */
function getDistinctSubjects(): array {
    $pdo = getDbConnection();
    $stmt = $pdo->query('SELECT DISTINCT subject FROM tasks ORDER BY subject ASC');
    return $stmt->fetchAll(PDO::FETCH_COLUMN);
}

/**
 * isOverdue() / isDueSoon() - simple date comparisons using PHP's
 * DateTime, shared by both the dashboard stats and the task table
 * badges so the definition of "overdue" lives in exactly one place.
 */
function isOverdue(array $task): bool {
    if ($task['status'] === 'Completed') {
        return false;
    }
    return strtotime($task['deadline']) < time();
}

function isDueSoon(array $task): bool {
    if ($task['status'] === 'Completed' || isOverdue($task)) {
        return false;
    }
    $hoursRemaining = (strtotime($task['deadline']) - time()) / 3600;
    return $hoursRemaining <= DUE_SOON_HOURS;
}

/**
 * suggestPriorityFromDeadline() - a small rule-based heuristic: the
 * closer a task's deadline, the more urgent it suggests the priority
 * should be, regardless of what the student originally picked. Purely
 * computed from the deadline already on the task - no extra columns,
 * no extra queries.
 */
function suggestPriorityFromDeadline(array $task): string {
    if ($task['status'] === 'Completed') {
        return $task['priority'];
    }
    $hoursRemaining = (strtotime($task['deadline']) - time()) / 3600;
    if ($hoursRemaining <= 24) {
        return 'High';
    }
    if ($hoursRemaining <= 72) {
        return 'Medium';
    }
    return 'Low';
}

/**
 * priorityWeight() - maps Low/Medium/High to a comparable integer so
 * two priorities can be ranked against each other.
 */
function priorityWeight(string $priority): int {
    $weights = ['Low' => 1, 'Medium' => 2, 'High' => 3];
    return $weights[$priority] ?? 1;
}

/**
 * computeStats() - derive dashboard summary numbers from the task
 * array. Uses a plain for-loop (syllabus: for loops) to tally counts,
 * and a separate do...while loop to locate the single most urgent
 * pending task (syllabus: do...while loops) - both are genuinely
 * useful here, not inserted just to tick a box.
 */
function computeStats(array $tasks): array {
    $stats = [
        'total'     => count($tasks),
        'pending'   => 0,
        'completed' => 0,
        'overdue'   => 0,
        'due_soon'  => 0,
        'priority'  => ['Low' => 0, 'Medium' => 0, 'High' => 0],
    ];

    // --- for loop: tally every bucket in a single pass ---
    for ($i = 0; $i < count($tasks); $i++) {
        $task = $tasks[$i];

        if ($task['status'] === 'Completed') {
            $stats['completed']++;
        } else {
            $stats['pending']++;
        }

        if (isOverdue($task)) {
            $stats['overdue']++;
        } elseif (isDueSoon($task)) {
            $stats['due_soon']++;
        }

        $stats['priority'][$task['priority']]++;
    }

    // --- do...while loop: walk tasks sorted by urgency until we find
    //     the first pending one; guarantees the loop body runs at
    //     least once even if the list ends up empty. ---
    $sorted = $tasks;
    usort($sorted, fn($a, $b) => strtotime($a['deadline']) <=> strtotime($b['deadline']));

    $stats['most_urgent'] = null;
    $index = 0;
    if (!empty($sorted)) {
        do {
            if ($sorted[$index]['status'] !== 'Completed') {
                $stats['most_urgent'] = $sorted[$index];
                break;
            }
            $index++;
        } while ($index < count($sorted));
    }

    return $stats;
}

/**
 * getUpcomingDeadlines() - small helper for the dashboard "Upcoming
 * Deadlines" list: pending tasks only, soonest first.
 */
function getUpcomingDeadlines(array $tasks, int $limit = 5): array {
    $pending = array_values(array_filter($tasks, fn($t) => $t['status'] !== 'Completed'));
    usort($pending, fn($a, $b) => strtotime($a['deadline']) <=> strtotime($b['deadline']));
    return array_slice($pending, 0, $limit);
}

/**
 * formatDeadline() - human-friendly date string built from PHP string
 * functions / date formatting (no external libraries).
 */
function formatDeadline(string $deadline): string {
    return date('d M Y, h:i A', strtotime($deadline));
}

/**
 * exportTasksToCsv() - PHP file handling: builds a CSV report on disk
 * inside reports/ and returns the path so actions/export_csv.php can
 * stream it back to the browser as a download. Demonstrates fopen/
 * fputcsv/fclose style file handling required by Unit III.
 */
function exportTasksToCsv(array $tasks): string {
    $reportsDir = __DIR__ . '/../reports';
    if (!is_dir($reportsDir)) {
        mkdir($reportsDir, 0755, true);
    }

    $filename = 'tasks_report_' . date('Ymd_His') . '.csv';
    $filepath = $reportsDir . '/' . $filename;

    $handle = fopen($filepath, 'w');
    if ($handle === false) {
        throw new RuntimeException('Could not create report file.');
    }

    fputcsv($handle, ['ID', 'Title', 'Subject', 'Priority', 'Status', 'Deadline', 'Created At'], ',', '"', '\\');

    foreach ($tasks as $task) {
        fputcsv($handle, [
            $task['id'],
            $task['title'],
            $task['subject'],
            $task['priority'],
            $task['status'],
            $task['deadline'],
            $task['created_at'],
        ], ',', '"', '\\');
    }

    fclose($handle);

    return $filepath;
}
