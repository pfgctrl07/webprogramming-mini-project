<?php
require_once __DIR__ . '/includes/functions.php';

$pageTitle  = 'About / Web Concepts';
$activePage = 'about';

require __DIR__ . '/includes/header.php';
?>

<section class="page-section" aria-labelledby="aboutHeading">
    <h1 id="aboutHeading" class="page-title"><i class="bi bi-info-circle"></i> About &amp; Web Concepts</h1>
    <p class="page-intro">
        A short, practical tour of the foundational Web Programming concepts
        this project is built on. Full explanations and setup notes live in
        the project <code>README.md</code>.
    </p>

    <article class="panel-card">
        <h2 class="panel-title"><i class="bi bi-globe2"></i> The World Wide Web, in brief</h2>
        <p>
            The <strong>World Wide Web</strong> began in 1989 as a way to share linked
            documents over the Internet; it has since evolved from static pages
            to the dynamic, database-backed applications like this tracker.
            Related Internet services include <strong>Email</strong> (message
            delivery via SMTP/IMAP), <strong>Telnet</strong> (remote terminal
            access), and <strong>FTP</strong> (file transfer) &mdash; all predate the
            Web but still run over the same Internet infrastructure. Modern
            uses built on top of the Web include <strong>e-commerce</strong>,
            <strong>cloud computing</strong> (renting storage/compute instead of
            owning servers), and <strong>video conferencing</strong>.
        </p>
    </article>

    <article class="panel-card">
        <h2 class="panel-title"><i class="bi bi-diagram-3"></i> How a request reaches this application</h2>
        <img src="assets/images/client-server-diagram.svg"
             alt="Diagram: a browser sends an HTTP request through the Internet to a PHP web server, which queries a MySQL database and returns an HTML response."
             class="concept-diagram">
        <ul class="concept-list">
            <li><strong>ISP (Internet Service Provider):</strong> the company that connects your device to the Internet backbone.</li>
            <li><strong>IP address:</strong> the numeric address (e.g. <code>127.0.0.1</code>) a server is reached at.</li>
            <li><strong>URL:</strong> a human-readable address such as <code>http://localhost/deadline-tracker/index.php</code> that identifies a resource.</li>
            <li><strong>DNS (Domain Name Server):</strong> translates a domain name into the IP address it maps to.</li>
            <li><strong>Web browser:</strong> the client that sends HTTP requests and renders the HTML/CSS/JS response (Chrome, Firefox, Safari...).</li>
            <li><strong>Search engine:</strong> a separate service (e.g. Google) that crawls and indexes pages so users can find them by keyword.</li>
        </ul>
    </article>

    <div class="row g-4">
        <div class="col-lg-6">
            <article class="panel-card h-100">
                <h2 class="panel-title"><i class="bi bi-hdd-network"></i> Web server vs. application server</h2>
                <p>A <strong>web server</strong> (Apache, Nginx, or PHP's built-in server)
                   accepts HTTP requests and returns static files or hands dynamic
                   requests off for processing. An <strong>application server</strong>
                   executes the business logic &mdash; here, that's PHP reading/writing
                   the <code>tasks</code> table via PDO. In this project PHP's
                   built-in development server plays both roles locally.</p>
            </article>
        </div>
        <div class="col-lg-6">
            <article class="panel-card h-100">
                <h2 class="panel-title"><i class="bi bi-phone"></i> ReactJS vs. React Native</h2>
                <p><strong>ReactJS</strong> renders to the browser DOM and is used
                   for web applications &mdash; see the <code>react-demo/</code> folder
                   in this project. <strong>React Native</strong> uses the same
                   component/JSX model but renders to native mobile UI
                   components (iOS/Android) instead of the DOM, and is not
                   used anywhere in this project since it targets mobile apps,
                   not the Web.</p>
            </article>
        </div>
    </div>

    <article class="panel-card">
        <h2 class="panel-title"><i class="bi bi-code-slash"></i> JavaScript basics, live</h2>
        <p>A tiny, self-contained demo of the fundamentals from Unit II:
            a button wired to a function, a variable, and a plain JavaScript
            object, all defined in the external file
            <code>assets/js/app.js</code>.</p>
        <button type="button" class="btn btn-outline-primary" onclick="sayHello()"
                onmouseover="this.classList.add('btn-primary'); this.classList.remove('btn-outline-primary')"
                onmouseout="this.classList.add('btn-outline-primary'); this.classList.remove('btn-primary')">
            <i class="bi bi-hand-index-thumb"></i> Say Hello
        </button>
        <p id="helloOutput" class="mt-3 mb-0 text-muted">Click the button to run a JavaScript function.</p>
    </article>

    <article class="panel-card">
        <h2 class="panel-title"><i class="bi bi-git"></i> Hosting, Git, and React DevTools</h2>
        <p>Static hosting (for the React demo) simply means a server returns
            the pre-built <code>index.html</code>/JS/CSS files as-is; see
            <code>react-demo/README.md</code> for exact deployment steps. The
            root <code>README.md</code> also documents the handful of Git
            commands (<code>init</code>, <code>add</code>, <code>commit</code>,
            <code>push</code>) used to version this project, and explains the
            React Developer Tools browser extension used to inspect the
            component tree and state while the React demo is open.</p>
    </article>
</section>

<?php require __DIR__ . '/includes/footer.php'; ?>
