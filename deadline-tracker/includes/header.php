<?php
/**
 * Shared page header / layout shell.
 * Expects $pageTitle (string) and $activePage (string) to be set
 * by the including page before this file is required.
 */
if (!isset($pageTitle)) {
    $pageTitle = APP_NAME;
}
if (!isset($activePage)) {
    $activePage = '';
}
$flash = getFlash();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= e($pageTitle) ?> | <?= e(APP_NAME) ?></title>

    <!-- Bootstrap 5 (grid, components, navbar, modal plugin) via CDN -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css">

    <!-- Bootstrap Icons (purely decorative - UI polish) -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">

    <!-- Google Fonts: Poppins for headings, Inter for body copy -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Space+Mono:wght@400;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">

    <!-- Project external stylesheet (Unit I: external CSS) -->
    <link rel="stylesheet" href="assets/css/style.css">
</head>
<body onload="initDashboard()">

<header class="app-topbar navbar navbar-expand-lg">
    <div class="container-fluid">
        <button class="btn btn-sidebar-toggle d-lg-none" type="button" id="sidebarToggle" aria-label="Toggle navigation">
            <i class="bi bi-list"></i>
        </button>
        <a class="navbar-brand app-brand" href="index.php">
            <span class="brand-mark"><i class="bi bi-check2-square"></i> DT</span> <?= e(APP_NAME) ?>
        </a>
        <div class="topbar-tagline d-none d-md-block"><i class="bi bi-mortarboard"></i> Student Task Management System</div>
    </div>
</header>

<div class="app-shell">
    <nav class="app-sidebar" id="appSidebar" aria-label="Primary navigation">
        <ul class="nav flex-column">
            <li class="nav-item">
                <a class="nav-link <?= $activePage === 'dashboard' ? 'active' : '' ?>" href="index.php"><i class="bi bi-speedometer2"></i> Dashboard</a>
            </li>
            <li class="nav-item">
                <a class="nav-link <?= $activePage === 'tasks' ? 'active' : '' ?>" href="tasks.php"><i class="bi bi-list-task"></i> My Tasks</a>
            </li>
            <li class="nav-item">
                <a class="nav-link <?= $activePage === 'insights' ? 'active' : '' ?>" href="insights.php"><i class="bi bi-lightbulb"></i> Insights</a>
            </li>
            <li class="nav-item">
                <a class="nav-link <?= $activePage === 'focus' ? 'active' : '' ?>" href="focus.php"><i class="bi bi-stopwatch"></i> Focus Mode</a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="actions/export_csv.php"><i class="bi bi-file-earmark-spreadsheet"></i> Export CSV Report</a>
            </li>
        </ul>
        <div class="sidebar-footer d-none d-lg-block">
            <p><i class="bi bi-person-circle"></i> Logged work for:<br><strong><?= e('jeevithamproject@gmail.com') ?></strong></p>
        </div>
    </nav>

    <main class="app-main">
        <?php if ($flash): ?>
            <div class="alert alert-<?= $flash['type'] === 'error' ? 'danger' : 'success' ?> alert-dismissible fade show app-flash" role="alert">
                <i class="bi <?= $flash['type'] === 'error' ? 'bi-exclamation-triangle' : 'bi-check-circle' ?>"></i>
                <?= e($flash['message']) ?>
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        <?php endif; ?>
