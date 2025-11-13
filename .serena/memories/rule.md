# AI-Driven Development — Common Guidelines



## Fundamental Principles of Development

* Don’t just write code that runs—always consider quality, maintainability, and safety.
* Strike the right balance for the project phase (prototype, MVP, production).
* When you find a problem, address it or explicitly record it—never leave it unattended.
* Boy Scout Rule: leave the codebase in a better state than you found it.

## Error-Handling Principles

* Resolve errors even if they appear only loosely related.
* Fix root causes rather than suppressing errors (e.g., `@ts-ignore`, swallowing exceptions in `try-catch`).
* Detect errors early and provide clear, actionable messages.
* Cover error cases in tests without exception.
* Always assume external APIs and networks can fail.

## Code Quality Standards

* DRY: avoid duplication; keep a single source of truth.
* Use meaningful names for variables and functions to convey intent.
* Maintain a consistent coding style across the project.
* Do not ignore small issues; fix them as soon as they are found (Broken Windows theory).
* Use comments to explain **why**; express **what** in code.

## Testing Discipline

* Do not skip tests; fix issues instead.
* Test behavior, not implementation details.
* Avoid inter-test dependencies; tests must run in any order.
* Keep tests fast and deterministic.
* Treat coverage as a metric; prioritize high-quality tests.

## Maintainability & Refactoring

* Consider improving existing code when adding new features.
* Split large changes into small, incremental steps.
* Proactively remove unused code.
* Update dependencies regularly (for security and compatibility).
* Record technical debt explicitly in comments and documentation.

## Security Mindset

* Manage API keys, passwords, etc. via environment variables (never hardcode).
* Validate **all** external inputs.
* Operate with the least privileges required (principle of least privilege).
* Avoid unnecessary dependencies.
* Run security auditing tools on a regular cadence.

## Performance Awareness

* Optimize based on **measurement**, not guesswork.
* Consider scalability from the early stages.
* Defer resource loading until needed.
* Define clear cache TTLs and invalidation strategies.
* Avoid N+1 queries and over-fetching.

## Ensuring Reliability

* Set appropriate timeouts.
* Implement retries (consider exponential backoff).
* Use the circuit breaker pattern where appropriate.
* Build resilience against transient failures.
* Ensure observability with adequate logs and metrics.

## Understanding Project Context

* Balance business and technical requirements.
* Determine the quality bar appropriate to the current phase.
* Maintain minimum quality standards even under time constraints.
* Choose implementations aligned with the team’s overall skill level.

## Recognizing Trade-offs

* Perfection is impossible (there is no silver bullet).
* Find the best balance within constraints.
* Prefer simplicity for prototypes and robustness for production.
* Document compromises and the reasons behind them.

## Git Workflow Basics

* Use Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`).
* Keep commits atomic, focused on a single change.
* Write clear, descriptive commit messages **in Japanese**.
* Avoid committing directly to `main`/`master`.

## Code Review Posture

* Receive review comments as constructive suggestions.
* Focus on the code, not the individual.
* Explain the reasons for changes and their impacts.
* Treat feedback as an opportunity to learn.

## Debugging Best Practices

* Establish reliable reproduction steps.
* Narrow the scope using binary search.
* Start investigation from recent changes.
* Use appropriate tools (debuggers, profilers, etc.).
* Record findings and solutions to share knowledge.

## Dependency Management

* Add only truly necessary dependencies.
* Always commit lockfiles (e.g., `package-lock.json`).
* Before adding a dependency, verify license, size, and maintenance status.
* Update regularly for security patches and bug fixes.

## Documentation Standards

* Clearly describe project overview, setup, and usage in the README.
* Keep docs in sync with code.
* Prefer examples over abstract descriptions.
* Record significant design decisions using ADRs (Architecture Decision Records).

## Continuous Improvement

* Carry lessons learned into the next project.
* Conduct regular retrospectives to improve process.
* Evaluate and adopt new tools and methods appropriately.
* Document knowledge for the team and future developers.
