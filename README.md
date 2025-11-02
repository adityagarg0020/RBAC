# RBAC User Management — Frontend-only

A compact frontend demo implementing role-based user management with plain HTML, CSS and JavaScript. Designed for learning and quick prototyping — no backend required.

## Quick overview (points)
- Single-page app (SPA) using only HTML, CSS, and vanilla JavaScript.
- Stores users and session in browser localStorage.
- Two roles: Admin and Student.
- Admin can create, list, and delete users; assign roles when creating.
- Students can register (student-only registration) and see a welcome page after login.
- Authentication flows: Register (student), Login, Logout, Change Password.
- Passwords hashed client-side with Web Crypto (SHA-256) before saving to localStorage.

## Features (at a glance)
- Login, Logout, Change Password
- Student registration (self-register)
- Admin dashboard: create user (assign role), list users, delete users
- Role-based routing & UI: only Admins see management tools
- Prevent duplicate registrations and validate password strength
- Guards: block self-delete and prevent deleting last Admin
- UI: sidebar, topbar, toasts, modal confirm, search/filter/sort in Admin

## How it works (simple steps)
- On first load the app seeds one Admin if no users exist.
- Registering or creating a user hashes the password, validates input, and saves the user to localStorage.
- Logging in verifies the provided password by hashing and comparing to the stored hash.
- After successful login, a small session object is saved in localStorage and the UI updates.
- Route guards (requireAuth / requireRole) and UI checks enforce role-based access on the client.

## Run locally (quick)
1. Download or clone the project files: `index.html`, `styles.css`, `app.js`, `README.md`.
2. Open `index.html` in a modern browser (Chrome, Edge, Firefox, Safari).
3. On first run an Admin user is automatically seeded.

## Seeded Admin (first-run)
- Email: `admin@example.com`  
- Password: `Admin@123`  
- Role: `Admin`

## Password policy
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one digit
- At least one special character

## Important file locations (quick edits)
- `script.js`
  - `seedAdminIfNeeded()` — change seeded admin credentials
  - `PW_REGEX` — change password policy
  - `USERS_KEY`, `SESSION_KEY` — localStorage keys
  - `createUser()` / `verifyCredentials()` / `deleteUser()` — user operations
  - `renderAdmin()` — Admin UI and user table logic
- `style.css` — theme colors and layout variables (`--accent`, `--primary`)
- `index.html` — DOM anchors: `#app`, `#sideNav`, `#nav`, `#confirmModal`, `#toastContainer`

## Demo checklist (for presentation)
- Open `index.html` and show seeded admin login.
- Register a Student and show duplicate-email prevention.
- Login as Admin, create users, use search/filter/sort.
- Attempt self-delete (blocked) and last-admin delete (blocked), then delete a different user and verify localStorage.
- Change a password and show sign-out behavior.

## Security & limitations (be ready to explain)
- This is a frontend-only demo. localStorage is not secure and data is visible to the user.
- Client-side hashing is for demo convenience, not a replacement for server-side salted hashing (bcrypt/argon2).
- For production: use a backend API, store salted hashes in a database, enforce RBAC serverside, use HTTPS and secure session mechanisms.

## Quick troubleshooting
- If seed admin is missing: clear site localStorage and reload.
- If delete doesn't appear to work: check DevTools → Application → localStorage → `rbac_users_v1`.
- If UI breaks: open DevTools Console for errors; ensure files loaded from same folder.

## Next steps (suggested improvements)
- Move storage to a server API with secure authentication and RBAC enforcement.
- Add user profile editing and server-side validation.
- Add export/import for users, pagination, and unit tests.
