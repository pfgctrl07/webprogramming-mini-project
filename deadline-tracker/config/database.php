<?php
/**
 * Central database configuration.
 *
 * All connection details live here (constants) so the rest of the
 * application never hard-codes credentials. Copy this file's values
 * to match your local MySQL setup - do not commit real production
 * secrets in a public repository.
 */

define('DB_HOST', 'localhost');
define('DB_NAME', 'deadline_tracker');
define('DB_USER', 'dt_app');
define('DB_PASS', 'DtApp_2026!');
define('DB_CHARSET', 'utf8mb4');

/**
 * getDbConnection() returns a single shared PDO connection using
 * prepared-statement-friendly defaults. PDO is used throughout the
 * application (instead of mysqli) so every query in includes/functions.php
 * can rely on the same bound-parameter API.
 */
function getDbConnection(): PDO {
    static $pdo = null;

    if ($pdo !== null) {
        return $pdo;
    }

    $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=' . DB_CHARSET;

    try {
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
    } catch (PDOException $e) {
        // Never leak DSN/credentials or raw driver errors to the browser.
        error_log('Database connection failed: ' . $e->getMessage());
        http_response_code(500);
        die('<h1>Service unavailable</h1><p>The database could not be reached. Please try again later.</p>');
    }

    return $pdo;
}
