<?php
/**
 * Streams a freshly generated CSV report of all tasks as a file
 * download. Demonstrates PHP file handling (Unit III): the report is
 * written to reports/ on disk, then read back and sent to the browser.
 */
require_once __DIR__ . '/../includes/functions.php';

$tasks = getTasks(['sort' => 'deadline_asc']);

try {
    $filepath = exportTasksToCsv($tasks);
} catch (RuntimeException $e) {
    error_log('CSV export failed: ' . $e->getMessage());
    http_response_code(500);
    die('Could not generate the report. Please try again.');
}

header('Content-Type: text/csv');
header('Content-Disposition: attachment; filename="' . basename($filepath) . '"');
header('Content-Length: ' . filesize($filepath));
readfile($filepath);
exit;
