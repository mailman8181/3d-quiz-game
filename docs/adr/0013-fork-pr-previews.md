# ADR-0013: Preview deployments for PRs from forks, after maintainer approval

- **Status:** Accepted (owner request, 2026-11-07). Supersedes ADR-0005's consequence
  "PRs from forks get no preview"; the rest of ADR-0005 stays.
- **Date:** 2026-11-07
- **Deciders:** owner / agent

## Context
External contributors work from forks (ADR-0012). A `pull_request` run from a fork gets a
read-only token, so `pr-preview.yml` cannot publish to `gh-pages`, and reviewers can't try the
change on a phone.

Every preview is served from the **same origin as the real game** (`patst.github.io`). Code on a
preview page can read and change the IndexedDB/localStorage of the main site — the children's
saves — and can show anything under the owner's address. The save namespaces of ADR-0005 only
keep honest previews apart; they are no protection against a hostile one. So publishing a
fork's code is a trust decision.

## Options considered
1. **Keep "no previews for forks".** Safe, but reviewing outside contributions needs a local
   checkout.
2. **`pull_request_target` that builds the PR with a write token.** The well-known "pwn request":
   `npm ci` runs the fork's install scripts with write access to the repository and its caches.
3. **Build untrusted, deploy trusted, with approval.** The fork's code is built by a normal
   `pull_request` run (read-only token, no secrets, no cache). A separate `workflow_run`
   workflow, which never runs PR code, copies the built files to `gh-pages` — only after a
   maintainer approved the deployment environment for that exact commit.
4. **Previews on a separate origin** (another Pages repository or host). Best isolation, but a
   second repository, a deploy key, and different URLs; more than this project needs now.

## Decision
Option 3.
- `pr-preview-fork-build.yml` (fork PRs only): build with the preview base path, upload `dist/`
  and the PR number as an artifact (3 days).
- `pr-preview-fork-deploy.yml` (`workflow_run`): job in environment **`fork-preview`**, which
  must have **required reviewers**; the job refuses to run if the environment has no such rule.
  It checks that the artifact's PR number is an open fork PR whose head is the built commit,
  deploys to `gh-pages/pr-preview/pr-<N>/`, and comments the link.
- `pr-preview-fork-cleanup.yml` (`pull_request_target: closed`, forks only): removes the folder;
  it checks out only `gh-pages`.
- Same-repository PRs keep using `pr-preview.yml` unchanged.
- **Review before approving:** the approver reads the diff first (especially `src/app/`,
  `index.html`, `vite.config.ts`, `package.json`/lockfile and anything touching storage or the
  network). Each new push needs a new approval.

## Consequences
- **Owner action once:** Settings → Environments → New environment `fork-preview` → Required
  reviewers: the owner (optionally "Prevent self-review" off). Until then fork deploys fail
  with a clear error instead of publishing unreviewed code.
- Approving happens on the workflow run page ("Review deployments"). First-time contributors
  may additionally need "Approve and run" for the build (GitHub's fork workflow setting).
- The `workflow_run` and `pull_request_target` workflows only take effect from `main`.
- If previews of outside code become frequent, revisit option 4 (separate origin).
