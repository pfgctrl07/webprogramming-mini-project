# Deadline Tracker — React Demo

A small, separate ReactJS demonstration of the same task-management
domain as the main PHP + MySQL application, built to cover the
**Unit IV (ReactJS)** and **Unit V (React Dataflow)** syllabus topics.
It is intentionally isolated: it does not read from or write to the
MySQL database, and the main PHP application does not load any of
this code. It uses a small in-memory starter dataset
(`src/data/initialTasks.js`) purely for demonstration.

## 1. React environment setup

Built with [Vite](https://vitejs.dev/) + React 18 (plain JavaScript/JSX,
no TypeScript). Requires Node.js (tested with Node 20) and npm.

```bash
cd react-demo
npm install
npm run dev        # starts a dev server, prints a local URL (e.g. http://localhost:5173)
```

Open the printed URL in a browser. Edits to any file under `src/`
hot-reload automatically.

To produce a static production build (plain HTML/CSS/JS, no server
needed to run it):

```bash
npm run build       # outputs to dist/
npm run preview      # serve the built dist/ folder locally to sanity-check it
```

## 2. What's demonstrated, and where

| Syllabus topic | File |
|---|---|
| JSX, functional components | `src/App.jsx`, `src/components/*.jsx` |
| React Component API / props | `TaskStats.jsx`, `TaskList.jsx` (data in via props) |
| Props validation | `propTypes` declared in every component, via the `prop-types` package |
| React state | `useState` for `tasks` and `view` in `App.jsx` |
| Hooks (`useState`, `useEffect`) | `App.jsx` (`useEffect` syncs `document.title`) |
| Class component, constructor, lifecycle | `UrgentTaskClock.jsx` — `constructor`, `componentDidMount`, `componentDidUpdate`, `componentWillUnmount` |
| Styling React | `src/styles.css` |
| Routing concepts (no router library) | the three nav buttons in `App.jsx` swap a `view` state value to show/hide sections |

## 3. React Developer Tools

[React Developer Tools](https://react.dev/learn/react-developer-tools)
is a browser extension (Chrome/Firefox) that adds a **Components** and
a **Profiler** tab to DevTools. With this demo running:

- The **Components** tab lets you click any rendered component
  (`App`, `TaskList`, `UrgentTaskClock`, ...) and inspect its current
  props and state live — e.g. watching `UrgentTaskClock`'s internal
  `now` state tick every second, or `App`'s `tasks` array update when
  you add a task.
- The **Profiler** tab records renders and shows which components
  re-rendered and why, useful for spotting unnecessary re-renders.

It only works on pages served by React in development mode (which
`npm run dev` provides); it does not attach to the PHP pages.

## 4. ReactJS vs. React Native

**ReactJS** (used here) renders components to the **browser DOM** —
`<div>`, `<button>`, etc. — and runs in a web page. **React Native**
uses the same component/JSX/state/props model but renders to **native
mobile UI primitives** (iOS/Android views) instead of the DOM, and
apps built with it run as native mobile apps, not in a browser. This
project is a web application, so only ReactJS is used; React Native
is not part of this codebase.

## 5. Deploying this demo to static hosting

Because `npm run build` outputs plain static files, this demo can be
hosted anywhere that serves static files — no Node.js server needed
in production. For example, with [Netlify](https://www.netlify.com/) or
[Vercel](https://vercel.com/) (both have a generous free tier):

```bash
npm run build
# Netlify CLI:
npx netlify-cli deploy --dir=dist --prod
# or Vercel CLI:
npx vercel --prod
```

Or with GitHub Pages: push the contents of `dist/` to a `gh-pages`
branch (or configure the repo's Pages settings to serve `dist/`).
Any of these is "hosting a website" in the Unit I sense — a server
somewhere simply returns the pre-built HTML/CSS/JS files as-is.

## 6. Case study: state, props, validation, styling, and hooks together

1. `App.jsx` owns two pieces of **state** via `useState`: the `tasks`
   array and the currently visible `view`.
2. It passes `tasks` down as a **prop** to `TaskStats` and `TaskList`,
   and passes callback props (`onAdd`, `onToggle`, `onDelete`) so
   children can request a change without touching `App`'s state
   directly — the standard one-way React dataflow.
3. Every component declares **props validation** with `prop-types`,
   so passing the wrong shape of data logs a clear console warning
   during development instead of failing silently.
4. All visual presentation lives in plain CSS (`styles.css`), kept
   separate from component logic.
5. `useEffect` reacts to `view` changing by updating
   `document.title` — a **Hook**-driven side effect, run only when
   its dependency actually changes.
6. `UrgentTaskClock` is the one **class component**, included
   specifically to demonstrate the constructor + lifecycle method API
   that functional components with Hooks have mostly replaced, but
   which the syllabus still covers explicitly.

Together these make the page dynamic: adding a task, marking one
complete, or switching tabs all re-render only the parts of the UI
that actually depend on the changed state.

## 7. Known limitation

`npm audit` reports a moderate-severity advisory in `esbuild`
(bundled inside Vite's dev server) affecting local development only —
it does not affect the production `dist/` build this demo ships.
Fixing it requires upgrading to Vite 6+, which was not done here to
avoid destabilizing a verified working setup; this can be replaced
by any syllabus-safe toolchain of your choice.
