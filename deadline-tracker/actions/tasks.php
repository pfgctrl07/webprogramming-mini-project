<?php
/**
 * Action handler: processes all task mutations (create, update,
 * delete, toggle status). All mutations arrive as POST requests and
 * redirect back to tasks.php (PRG pattern) with a flash message.
 */
require_once __DIR__ . '/../includes/functions.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: ../tasks.php');
    exit;
}

$action = $_POST['task_action'] ?? '';

switch ($action) {
    case 'create':
        $errors = validateTaskInput($_POST);
        if ($errors) {
            flash('error', 'Could not save task: ' . implode(' ', $errors));
            header('Location: ../tasks.php?action=new');
            exit;
        }
        createTask($_POST);
        flash('success', 'Task created successfully.');
        header('Location: ../tasks.php');
        exit;

    case 'update':
        $id = (int) ($_POST['id'] ?? 0);
        if ($id <= 0 || !getTaskById($id)) {
            flash('error', 'Task not found.');
            header('Location: ../tasks.php');
            exit;
        }
        $errors = validateTaskInput($_POST);
        if ($errors) {
            flash('error', 'Could not update task: ' . implode(' ', $errors));
            header('Location: ../tasks.php?action=edit&id=' . $id);
            exit;
        }
        updateTask($id, $_POST);
        flash('success', 'Task updated successfully.');
        header('Location: ../tasks.php');
        exit;

    case 'delete':
        $id = (int) ($_POST['id'] ?? 0);
        if ($id <= 0 || !getTaskById($id)) {
            flash('error', 'Task not found.');
        } else {
            deleteTask($id);
            flash('success', 'Task deleted.');
        }
        header('Location: ../tasks.php');
        exit;

    case 'toggle_status':
        $id = (int) ($_POST['id'] ?? 0);
        $newStatus = $_POST['new_status'] ?? '';
        if ($id <= 0 || !getTaskById($id)) {
            flash('error', 'Task not found.');
        } elseif (setTaskStatus($id, $newStatus)) {
            flash('success', $newStatus === 'Completed' ? 'Task marked complete.' : 'Task reopened.');
        } else {
            flash('error', 'Could not update task status.');
        }
        header('Location: ../tasks.php');
        exit;

    default:
        flash('error', 'Unknown action.');
        header('Location: ../tasks.php');
        exit;
}
