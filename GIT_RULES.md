# Git Rules for Multi-Agent Collaboration

This document outlines the git workflows and rules to ensure smooth collaboration between multiple agents (human or AI) on the FastTrack Elite project.

## 1. Branching Strategy

We use a simplified Gitflow workflow:

*   **`main`**: The single source of truth. content must always be production-ready.
*   **`feature/name-of-feature`**: For new functionality.
    *   Example: `feature/social-circles`, `feature/timer-update`
*   **`fix/issue-description`**: For bug fixes.
    *   Example: `fix/login-error`, `fix/nav-alignment`
*   **`refactor/scope`**: For code cleanup without behavioral changes.
    *   Example: `refactor/api-services`

## 2. Commit Convention (Conventional Commits)

All commit messages must follow the [Conventional Commits](https://www.conventionalcommits.org/) specification to allow for automated changelogs and clear history.

**Format:**
`type(scope): description`

**Types:**
*   `feat`: A new feature
*   `fix`: A bug fix
*   `docs`: Documentation only changes
*   `style`: Changes that do not affect the meaning of the code (white-space, formatting, etc)
*   `refactor`: A code change that neither fixes a bug nor adds a feature
*   `perf`: A code change that improves performance
*   `test`: Adding missing tests or correcting existing tests
*   `chore`: Changes to the build process or auxiliary tools

**Examples:**
*   `feat(timer): add server-side validation for end time`
*   `fix(auth): resolve nonce verification failure on login`
*   `style(css): fix indentation in dashboard component`

## 3. Workflow for Agents

1.  **Sync First**: Always pull the latest `main` before starting a task.
    ```bash
    git checkout main
    git pull origin main
    ```

2.  **Create Branch**: Create a descriptive branch for your task.
    ```bash
    git checkout -b feature/my-new-feature
    ```

3.  **Atomic Commits**: Make small, focused commits. Avoid massive "catch-all" commits.
    *   *Bad*: "Update frontend and backend"
    *   *Good*: "feat(api): add hydration endpoint" followed by "feat(ui): connect hydration store to api"

4.  **Verify Before Push**:
    *   Frontend: Run `npm run lint` (if available) and ensure `npm run build` passes.
    *   Backend: Ensure PHP syntax is valid.

5.  **Push**:
    ```bash
    git push origin feature/my-new-feature
    ```

## 4. Project-Specific Rules

### Ignored Files
*   **NEVER** force add files listed in `.gitignore`.
*   **NEVER** commit `.cursor/`, `.kilocode/`, or `.env` files.
*   **NEVER** commit `node_modules/` or `frontend/dist/`.

### Database & Architecture
*   Database schema changes must be reflected in `includes/class-fasttrack-activator.php`.
*   Frontend state must always sync with the WordPress REST API.

## 5. Conflict Resolution
*   If a conflict occurs, rebase your feature branch onto `main` instead of merging `main` into your branch (keeps history clean).
    ```bash
    git fetch origin
    git rebase origin/main
    ```
*   Resolve conflicts manually, then `git rebase --continue`.

## 6. Agent Persona & Context
*   Agents must respect the **Single Source of Truth** rule: The MySQL database is the master; `localStorage` is for UI preferences only.
*   Agents should read `README.md` and `SHARED_USER_DATA_SPEC.md` if unsure about data structures.

