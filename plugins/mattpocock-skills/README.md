# mattpocock-skills

All 38 skills from Matt Pocock's [Skills For Real Engineers](https://github.com/mattpocock/skills) repo (MIT, see LICENSE), packaged as one plugin.

- **Automatic** skills load on their own when a request matches.
- **You call it** skills run only when you ask for them by name, e.g. `/grill-me` or "run to-spec".
- New to the set? Start with `/ask-matt`, which tells you which skill or flow fits. The engineering skills that use an issue tracker expect `/setup-matt-pocock-skills` to be run once per repo.

Changes from the original repo: skills are flattened into one `skills/` folder, and the Codex-only `agents/openai.yaml` files are left out. Skill text is unchanged.

## Skills

### Engineering

- **ask-matt** (you call it): Ask which skill or flow fits your situation. A router over the skills in this repo.
- **code-review** (automatic): Review the changes since a fixed point (commit, branch, tag, or merge-base) along two axes: Standards (does the code follow this repo's documented coding standards?) and Spec (does the code match what the originating issue/spec asked for?). Runs both reviews in parallel sub-agents and reports them side by side.
- **codebase-design** (automatic): Shared vocabulary for designing deep modules.
- **diagnosing-bugs** (automatic): Diagnosis loop for hard bugs and performance regressions.
- **domain-modeling** (automatic): Build and sharpen a project's domain model.
- **grill-with-docs** (you call it): A relentless interview to sharpen a plan or design, which also creates docs (ADR's and glossary) as we go.
- **implement** (you call it): Implement a piece of work based on a spec or set of tickets.
- **implement-spec** (you call it): Implement the result of /to-spec and /to-tickets in code.
- **improve-codebase-architecture** (you call it): Scan a codebase for deepening opportunities, present them as a visual HTML report, then grill through whichever one you pick.
- **pr** (automatic): Use when writing a PR body.
- **prototype** (automatic): Build a throwaway prototype to answer a design question.
- **research** (automatic): Investigate a question against high-trust primary sources and capture the findings as a Markdown file in the repo.
- **retro** (you call it): Conduct a retrospective on a coding session.
- **setup-matt-pocock-skills** (you call it): Configure this repo for the engineering skills: set up its issue tracker, triage label vocabulary, and domain doc layout. Run once before first use of the other engineering skills.
- **tdd** (automatic): Test-driven development.
- **to-spec** (you call it): Turn the current conversation into a spec and publish it to the project issue tracker: no interview, just synthesis of what you've already discussed.
- **to-tickets** (you call it): Break a plan, spec, or the current conversation into a set of tracer-bullet tickets, each declaring its blocking edges, published to the configured tracker (edges as text in one file per ticket locally, or native blocking links on a real tracker).
- **triage** (you call it): Move issues and external PRs through a state machine of triage roles, categorise, verify, grill if needed, and write agent-ready briefs.
- **wayfinder** (you call it): Plan a huge chunk of work (more than one agent session can hold) as a shared map of decision tickets on your issue tracker, and resolve them one at a time until the way to the destination is clear.
- **wizard** (automatic): Generate an interactive bash wizard that walks a human through steps only they can perform.

### Productivity

- **grill-me** (you call it): A relentless interview to sharpen a plan or design.
- **grilling** (automatic): Grill the user relentlessly about a plan, decision, or idea.
- **handoff** (you call it): Compact the current conversation into a handoff document for another agent to pick up.
- **teach** (you call it): Teach the user a new skill or concept, within this workspace.
- **to-questionnaire** (you call it): Turn a decision you can't fully answer into a questionnaire for someone else to fill in.
- **wait-what** (you call it): Stop. That last message did not land: re-pitch it.
- **writing-for-agents** (automatic): Writing documents for agents.

### Misc (rarely used, TypeScript / Claude Code specific)

- **git-guardrails-claude-code** (automatic): Set up Claude Code hooks to block dangerous git commands (push, reset --hard, clean, branch -D, etc.) before they execute.
- **migrate-to-shoehorn** (automatic): Migrate test files from `as` type assertions to @total-typescript/shoehorn.
- **scaffold-exercises** (automatic): Create exercise directory structures with sections, problems, solutions, and explainers that pass linting.
- **setup-pre-commit** (automatic): Set up Husky pre-commit hooks with lint-staged (Prettier), type checking, and tests in the current repo.

### In progress (beta, the author marks these as unfinished)

- **chief-of-staff** (you call it): Pursue a long-running goal in a single session by co-ordinating subagents.
- **claude-handoff** (you call it): Hand the current conversation off to a fresh background agent that picks up the work immediately.
- **loop-me** (you call it): Grill me about specs for the workflows I want to build, within this workspace.
- **setup-ts-deep-modules** (you call it): Wire dependency-cruiser into a TypeScript repo so each package is a deep module, with implementation hidden in subfolders and reachable only through its entry-point files. User-invoked.
- **writing-beats** (you call it): Writing, exploit; assemble raw material into a journey of beats, grounding each term before a beat leans on it.
- **writing-fragments** (you call it): Writing, explore: mine raw fragments, no structure yet.
- **writing-shape** (you call it): Writing, exploit: shape raw material into an article, paragraph by paragraph.
