# Deadline Tracker — Student Task Management System

A Web Programming mini project: students track assignments, lab
submissions, project reviews, and exams, with deadline/priority
tracking, search/filter/sort, and a dashboard with a Canvas-drawn
status chart. Built with **HTML5, CSS3, vanilla JavaScript, PHP, and
MySQL**, with **Bootstrap** for layout/components, plus a separate
**ReactJS** demonstration of the same domain.

## 1. Project status

Complete and verified locally: PHP syntax-checked on every file,
every CRUD action and the CSV export exercised against a live MySQL
database (not mocked), and the React demo built successfully with
Vite. See [§8 Tests actually run](#8-tests-actually-run) for exactly
what was and wasn't verified.

## 2. Directory layout

```
deadline-tracker/
├── index.php              Dashboard (stats, Canvas chart, upcoming deadlines)
├── tasks.php              Task list + search/filter/sort + add/edit/delete UI
├── about.php              Unit I web concepts + React vs React Native, etc.
├── includes/
│   ├── header.php         Shared layout shell (topbar + sidebar)
│   ├── footer.php         Closes layout, loads Bootstrap JS + app.js
│   └── functions.php      All PHP business logic (validation, CRUD, stats)
├── config/
│   └── database.php       DB credentials + PDO connection helper
├── actions/
│   ├── tasks.php          POST handler: create/update/delete/toggle
│   └── export_csv.php     Streams a generated CSV report (file handling)
├── assets/
│   ├── css/style.css      External stylesheet
│   ├── js/app.js          External JavaScript (DOM, events, Canvas, etc.)
│   └── images/            SVG diagram used on the About page
├── database/
│   └── schema.sql         Table definition + demo data
├── reports/               Generated CSV reports land here (gitignored)
├── react-demo/            Separate ReactJS demonstration (see its own README)
├── .gitignore
└── README.md
```

## 3. Requirements

- PHP 8.1+ with the `pdo_mysql` extension (verified with PHP 8.5.11)
- MySQL 5.7+/8.x (verified with MySQL 9.5.0)
- Node.js 18+ and npm, only for the separate React demo (verified with Node 20.20.2)

## 4. Database setup

```bash
# 1. Create the database and load the schema + demo data in one step:
mysql -u root -p < database/schema.sql

# 2. Create a dedicated, least-privilege application user
#    (replace the password, and use the same one in config/database.php):
mysql -u root -p -e "
  CREATE USER IF NOT EXISTS 'dt_app'@'localhost' IDENTIFIED BY 'your_password_here';
  GRANT ALL PRIVILEGES ON deadline_tracker.* TO 'dt_app'@'localhost';
  FLUSH PRIVILEGES;
"
```

Then edit `config/database.php` and set `DB_USER`/`DB_PASS` to match.
Credentials are centralized in that one file; nothing else in the
app hard-codes them. (This local setup actually used `dt_app` /
`DtApp_2026!` while building and testing this project — change it
before any real deployment.)

## 5. Running the PHP application

```bash
cd deadline-tracker
php -S localhost:8089
```

Then open `http://localhost:8089/index.php`. No build step — PHP's
built-in development server serves the files directly. (For a more
production-like setup, point Apache/Nginx's document root at this
folder instead.)

## 6. Running the React demo

```bash
cd deadline-tracker/react-demo
npm install
npm run dev
```

Open the printed local URL (typically `http://localhost:5173`). Full
details, including building for production and deploying to static
hosting, are in `react-demo/README.md`.

## 7. Feature list

- Dashboard: total/pending/completed/overdue/due-soon counts, priority
  distribution, a Canvas-drawn bar chart, and an upcoming-deadlines list
- Full task CRUD: add, view, edit, delete (with confirmation), mark
  complete / reopen
- Search by title/subject/description; filter by status (checkboxes)
  and priority (multi-select list box); filter by subject and sort by
  deadline/priority/created date (pulldown menus)
- Client-side + server-side form validation with clear error messages
- CSV report export (real file generated on disk, then downloaded)
- Responsive sidebar navigation, flash messages, empty states,
  overdue/due-soon badges, hover/tooltip feedback
- Separate ReactJS demo of the same domain (dashboard, task list,
  add-task form, live countdown clock)

## 8. Tests actually run

All of the following were executed against the **real** MySQL
database (`deadline_tracker`) started locally during development —
nothing here was mocked or assumed:

- `php -l` on every `.php` file — no syntax errors
- PHP's built-in server started (`php -S localhost:8089`) and
  `index.php`, `tasks.php`, `about.php` fetched via `curl` — all
  returned `200` with no PHP warnings/notices/fatals in the output
- Task **create**, **update**, **toggle status** (complete/reopen),
  and **delete** exercised via raw `POST` requests against
  `actions/tasks.php`, each verified by re-querying MySQL directly
- Server-side **validation** confirmed to reject an empty title
  (no row inserted)
- **Search**, **status filter**, and **priority sort** confirmed via
  both a direct PHP function call and a full HTTP request
- **CSV export** downloaded via `curl`, confirmed to contain a header
  row plus all 12 demo tasks, with correct `Content-Disposition`
- Found and fixed two real bugs during this testing: (1) a timezone
  mismatch between PHP (defaulted to UTC) and MySQL/system (IST) that
  silently miscounted overdue tasks — fixed by pinning PHP's timezone;
  (2) a repeated named placeholder (`:search`) in the search query
  that MySQL's native prepared statements reject — fixed by giving
  each `LIKE` clause its own placeholder
- React demo: `npm install` and `npm run build` both completed with
  zero errors (42 modules transformed); `npm run dev` started and
  responded to HTTP requests for the page and `App.jsx`

**Not verified:** actual browser rendering/clicking (no browser
automation tool was available in this environment) — the custom
modal dialog's z-index stacking, the Canvas chart's visual output,
and the React app's on-screen interactivity were reviewed by code
inspection and server-side response checks only, not watched running
in a real browser. If you have a browser available, load
`index.php`/`tasks.php` and `react-demo`'s dev URL to confirm the
visual behavior matches.

## 9. Git basics (Unit I)

This project is a plain directory, not yet a Git repository. To
start tracking it:

```bash
git init
git add .
git commit -m "Initial commit: Deadline Tracker mini project"
```

Common commands used day-to-day while developing it further:

| Command | Purpose |
|---|---|
| `git status` | see what's changed / staged |
| `git add <file>` | stage a file's changes |
| `git commit -m "message"` | save staged changes as a new commit |
| `git log --oneline` | view commit history |
| `git branch <name>` / `git checkout <name>` | create / switch branches |
| `git remote add origin <url>` | link to a remote (e.g. GitHub) repo |
| `git push -u origin main` | upload commits to the remote |

### Static hosting, briefly

The PHP application needs a server that can *execute* PHP (Apache/Nginx
+ PHP-FPM, or a managed PHP host) — it cannot be hosted on purely
static hosting. The React demo, once built with `npm run build`, is
plain static HTML/CSS/JS and *can* be hosted anywhere that just
serves files as-is (GitHub Pages, Netlify, Vercel) — see
`react-demo/README.md` for exact steps.

## 10. Syllabus coverage map

| Unit | Topic | Where it's demonstrated |
|---|---|---|
| I | Web fundamentals, ISP/IP/URL/DNS, search engines, web vs. app server | `about.php` |
| I | Semantic HTML (`header`/`nav`/`main`/`section`/`article`/`aside`/`footer`) | `includes/header.php`, `includes/footer.php`, `index.php`, `tasks.php`, `about.php` |
| I | External CSS, selectors, box model, color/typography | `assets/css/style.css` |
| I | Git commands, hosting | this README §9 |
| II | Hello World, buttons/functions/variables/objects | `about.php` "JavaScript basics, live" panel → `sayHello()` in `assets/js/app.js` |
| II | DOM, forms, controls, `reset()`/`focus()` | `tasks.php` add/edit form → `openTaskModal`/`resetTaskForm` in `assets/js/app.js` |
| II | `onchange`, `onmouseover`, `onload`, `onblur` | `tasks.php` (priority list box `onchange`), `index.php` (stat cards `onmouseover`), `includes/header.php` (`<body onload>`), `tasks.php`/modal fields (`onblur`) |
| II | `for` / `do...while` loops | `assets/js/app.js` (`editTask`, `drawStatusChart`); also in PHP, `includes/functions.php` `computeStats()` |
| II | Radio buttons, checkboxes, `fieldset`/`legend` | `tasks.php` (priority radios, status filter checkboxes, both grouped in `fieldset`) |
| II | CSS manipulation via JS, `z-index` | `assets/js/app.js` (`highlightSelectedPriorities`, sidebar toggle); `.custom-modal-overlay` in `assets/css/style.css` |
| II | Pulldown menus, list boxes | `tasks.php` (subject/sort `<select>`, priority multi-select list box) |
| II | Canvas drawing | `index.php` `#statusChart` → `drawStatusChart()` in `assets/js/app.js` |
| II | Event handlers/listeners | inline handlers throughout + `addEventListener` in `initDashboard()` |
| III | PHP variables/constants/operators/loops/arrays/strings/functions | `includes/functions.php` |
| III | File handling | `exportTasksToCsv()` in `includes/functions.php`, served by `actions/export_csv.php` |
| III | PHP + HTML, database with PHP, prepared statements | `index.php`, `tasks.php`, `config/database.php`, `includes/functions.php` |
| III | Bootstrap grid/components/menus/plugins/flexbox | `includes/header.php` (sidebar `.nav`), `tasks.php` (modal plugin, grid, forms), `index.php` (grid, flexbox) |
| IV | React setup, JSX, components, Component API | `react-demo/src/App.jsx`, `react-demo/src/components/*.jsx` |
| IV | Component lifecycle, constructor | `react-demo/src/components/UrgentTaskClock.jsx` |
| IV | React DevTools, ReactJS vs. React Native | `about.php`, `react-demo/README.md` |
| V | State, props, props validation, styling, Hooks | `react-demo/src/App.jsx` + every component's `propTypes` |
| V | Routing concepts (no router library) | `react-demo/src/App.jsx` nav buttons |
| V | Deployment, case study | `react-demo/README.md` §5–6 |

## 11. Demonstration order for a project review

1. Open the **Dashboard** (`index.php`) — point out the live counts,
   the Canvas chart, and the upcoming-deadlines list.
2. Go to **My Tasks** — show search, the status checkboxes, the
   priority list box, and sorting.
3. Click **+ Add New Task** — show the custom modal dialog (point out
   the radio buttons for priority, the checkboxes/list box filters on
   the page behind it staying inert while the modal is open — that's
   the `z-index` stacking), submit it, and show the success flash
   message.
4. Click **Edit** on a task, change something, save; click **Mark
   Complete** on another; click **Delete** and show the Bootstrap
   confirmation modal before confirming.
5. Click **Export CSV Report** in the sidebar and show the downloaded
   file's contents.
6. Open **About / Web Concepts** — show the Hello World button, the
   client-server diagram, and the ReactJS vs. React Native note.
7. Switch to the **React demo** (`npm run dev` in `react-demo/`) —
   show the Dashboard/Tasks/About buttons swapping views, add a task,
   and point out the live countdown clock ticking.

## 12. Likely viva questions

1. **Why PDO with prepared statements instead of just concatenating SQL strings?**
   Prepared statements separate SQL structure from data, so user input
   is always treated as a value, never as executable SQL — this is the
   standard defense against SQL injection.

2. **Where exactly is user input validated, and why both client- and server-side?**
   Client-side (`assets/js/app.js` `validateField()`) gives instant
   feedback without a round trip; server-side (`validateTaskInput()`
   in `includes/functions.php`) is the one that's actually trusted,
   since client-side JS can be bypassed or disabled entirely.

3. **How does the app decide a task is "overdue" vs. "due soon"?**
   `isOverdue()`/`isDueSoon()` in `includes/functions.php` compare the
   task's deadline to the current time; overdue means the deadline has
   passed and the task isn't completed, due-soon means it's within the
   next 48 hours (the `DUE_SOON_HOURS` constant).

4. **What's the difference between the custom modal and the delete confirmation modal?**
   The add/edit dialog is a hand-built overlay (`.custom-modal-overlay`)
   purely in HTML/CSS/JS, demonstrating manual `z-index` stacking. The
   delete confirmation reuses Bootstrap's own modal plugin
   (`data-bs-toggle="modal"`), demonstrating a Bootstrap component
   instead.

5. **Why does `getTasks()` build its `WHERE` clause with a whitelist for sorting instead of accepting any column name?**
   Bound parameters can only substitute *values*, not column/clause
   names, so sort options are matched against a fixed whitelist array
   (`$sortOptions`) rather than interpolated directly — this prevents
   arbitrary SQL from being injected through the sort parameter.

6. **How does the dashboard's Canvas chart get its numbers?**
   PHP computes the counts in `computeStats()` and injects them into a
   small inline `<script>` block as `window.DASHBOARD_STATS`; `app.js`
   reads that object and draws bars proportional to each value.

7. **Why is the React demo kept completely separate from the PHP pages?**
   The syllabus and project architecture require PHP/MySQL to be the
   primary application and React to be an educational demo of the
   same domain — mixing React rendering into PHP-rendered DOM would
   blur that boundary and isn't something the PHP app depends on to
   function.

8. **What's the difference between the `useState` Hook and the class component's `this.state`?**
   They store equivalent data, but `useState` is used inside a
   function component and returns a getter/setter pair, while
   `this.state`/`this.setState()` is the older API available only in
   class components (`UrgentTaskClock.jsx` here) alongside lifecycle
   methods like `componentDidMount`.

9. **What happens, step by step, when you click "Mark Complete"?**
   The button submits a small `<form>` via POST to
   `actions/tasks.php` with `task_action=toggle_status`; that script
   calls `setTaskStatus()`, which runs a prepared `UPDATE`, sets a
   flash message, and redirects back to `tasks.php` (POST/redirect/GET
   pattern, so refreshing the page doesn't resubmit the form).

10. **Why use an ENUM for `priority`/`status` in the database instead of a plain VARCHAR?**
    It makes the database itself reject any value outside
    `Low/Medium/High` or `Pending/Completed`, as a second line of
    defense even if application-level validation were ever bypassed.

## 13. Known limitations

- No real browser was available while building this project, so
  visual/interactive behavior (modal animations, Canvas rendering,
  React UI) was verified by code review and HTTP-level checks only,
  not by watching it run in an actual browser — see §8.
- `npm audit` flags a moderate advisory in Vite's bundled dev-only
  `esbuild`; it does not affect the production build and was left
  unresolved to avoid a breaking Vite major-version upgrade (see
  `react-demo/README.md` §7).
- The MySQL root account on this machine had no password set when
  this project began; it was reset to a known password as part of
  setup so the schema could be loaded and tested. If this matters for
  your environment, change it again afterward.
