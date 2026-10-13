-- ============================================================
-- Deadline Tracker - Student Task Management System
-- Database schema (MySQL 5.7+ / 8.x compatible)
--
-- Setup:
--   mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS deadline_tracker;"
--   mysql -u root -p deadline_tracker < database/schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS deadline_tracker
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE deadline_tracker;

-- ------------------------------------------------------------
-- tasks: the single table backing the whole application.
-- priority/status use ENUM so only syllabus-allowed values can
-- ever be stored, enforced by the database itself.
-- ------------------------------------------------------------
DROP TABLE IF EXISTS tasks;

CREATE TABLE tasks (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title       VARCHAR(150)    NOT NULL,
    subject     VARCHAR(100)    NOT NULL,
    description VARCHAR(1000)   NOT NULL DEFAULT '',
    deadline    DATETIME        NOT NULL,
    priority    ENUM('Low', 'Medium', 'High') NOT NULL DEFAULT 'Medium',
    status      ENUM('Pending', 'Completed')  NOT NULL DEFAULT 'Pending',
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
                                ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_tasks_deadline (deadline),
    INDEX idx_tasks_status   (status),
    INDEX idx_tasks_priority (priority),
    INDEX idx_tasks_subject  (subject)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Demonstration data: a deliberate mix of overdue, due-soon,
-- upcoming and completed tasks across several subjects so the
-- dashboard has something meaningful to summarise immediately.
-- Dates are relative to NOW() so the demo stays realistic no
-- matter when it is imported.
-- ------------------------------------------------------------
INSERT INTO tasks (title, subject, description, deadline, priority, status, created_at) VALUES
('Submit DBMS Lab Record', 'Database Management Systems',
 'Complete all 10 SQL lab exercises and get the record signed by the lab instructor.',
 DATE_SUB(NOW(), INTERVAL 2 DAY), 'High', 'Pending', DATE_SUB(NOW(), INTERVAL 10 DAY)),

('Operating Systems Assignment 3', 'Operating Systems',
 'Solve the CPU scheduling numericals (FCFS, SJF, Round Robin) and submit a handwritten copy.',
 DATE_SUB(NOW(), INTERVAL 5 HOUR), 'High', 'Pending', DATE_SUB(NOW(), INTERVAL 6 DAY)),

('Web Programming Mini Project Review 1', 'Web Programming',
 'First review of the mini project: show working HTML/CSS/JS prototype to the panel.',
 DATE_ADD(NOW(), INTERVAL 18 HOUR), 'High', 'Pending', DATE_SUB(NOW(), INTERVAL 4 DAY)),

('Data Structures Assignment - Trees', 'Data Structures',
 'Implement AVL tree insertion, deletion and rotations in C with a short report.',
 DATE_ADD(NOW(), INTERVAL 2 DAY), 'Medium', 'Pending', DATE_SUB(NOW(), INTERVAL 3 DAY)),

('Mathematics Tutorial Sheet 4', 'Engineering Mathematics',
 'Solve the tutorial sheet on Laplace transforms, questions 1 to 12.',
 DATE_ADD(NOW(), INTERVAL 4 DAY), 'Low', 'Pending', DATE_SUB(NOW(), INTERVAL 2 DAY)),

('Compiler Design Lab - Lexical Analyzer', 'Compiler Design',
 'Write a lexical analyzer using Lex/Flex for a simplified C-like language.',
 DATE_ADD(NOW(), INTERVAL 7 DAY), 'Medium', 'Pending', DATE_SUB(NOW(), INTERVAL 1 DAY)),

('Computer Networks Quiz Preparation', 'Computer Networks',
 'Revise OSI layers, TCP/IP, and subnetting for the surprise quiz.',
 DATE_ADD(NOW(), INTERVAL 1 DAY), 'Medium', 'Pending', NOW()),

('Software Engineering Case Study', 'Software Engineering',
 'Prepare a case study on Agile vs Waterfall for the chosen mini project.',
 DATE_SUB(NOW(), INTERVAL 15 DAY), 'Medium', 'Completed', DATE_SUB(NOW(), INTERVAL 20 DAY)),

('DBMS Normalization Worksheet', 'Database Management Systems',
 'Normalize the given schema up to BCNF with justification for each step.',
 DATE_SUB(NOW(), INTERVAL 8 DAY), 'Low', 'Completed', DATE_SUB(NOW(), INTERVAL 12 DAY)),

('Web Programming HTML/CSS Exercise', 'Web Programming',
 'Build a static résumé page using semantic HTML and an external stylesheet.',
 DATE_SUB(NOW(), INTERVAL 20 DAY), 'Low', 'Completed', DATE_SUB(NOW(), INTERVAL 25 DAY)),

('End Semester Exam - Operating Systems', 'Operating Systems',
 'University theory examination covering all five units.',
 DATE_ADD(NOW(), INTERVAL 15 DAY), 'High', 'Pending', DATE_SUB(NOW(), INTERVAL 1 DAY)),

('Project Review 2 - Final Demo', 'Web Programming',
 'Final demonstration of the complete mini project with report submission.',
 DATE_ADD(NOW(), INTERVAL 21 DAY), 'High', 'Pending', NOW());
