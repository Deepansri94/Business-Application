# AGENTS.md

Instructions for any AI coding agent working in this project
(Claude Code, Cursor, Codex, Copilot). Read this whole file before doing anything.

## 01 Purpose

[Product name] is [one line from docs/PRD.md].
Your job is to extend it without breaking what exists, in the style already
established. When in doubt, match what is there.

## 02 Before you start

Do these in order, every session:

1. Read docs/PRD.md for what we are building and what is out of scope.
2. Read docs/DESIGN_SYSTEM.md for every visual decision. Use its tokens.
3. Read docs/ARCHITECTURE.md for where code lives and what may touch what.
4. Check the existing ui components before creating a new one.
5. Look at the open issues or task list before proposing new work.
6. Restate the task in one or two sentences and list the files you expect
   to touch. Wait for a go-ahead if that list is longer than five files.

## 03 General rules

- Follow the design system. If a value is not in DESIGN_SYSTEM.md, ask. Do not invent it.
- Keep responsibilities where ARCHITECTURE.md puts them. No business logic in pages or components.
- Reuse before creating. Search the codebase for an existing helper or component first.
- Small, focused changes. One task, one branch, one clear diff.
- Do not add dependencies, tables, environment variables, or third-party services without asking.
- Do not delete or rewrite working code the task does not require.
- Never "improve" anything listed under intentional decisions in ARCHITECTURE.md.
- Leave the project runnable after every change.

## 04 Code guidelines

- TypeScript strict. No `any`. No `@ts-ignore` without a comment saying why.
- Functional components, hooks, named exports.
- Validate every external input (forms, routes, webhooks) with a schema before it reaches a service.
- Name things by what they do: `sendInvoiceEmail`, not `handleEmail2`.
- Comments explain why, not what. Delete commented-out code.
- Every data-driven view handles loading, empty, and error states.
- UI copy follows the tone rules in DESIGN_SYSTEM.md: plain, short, no exclamation marks.
- Tests cover business logic in services. UI tests only for critical flows.
- Formatting is the formatter's job. Run it. Do not argue with it.

## 05 Security and best practices

- Secrets live in environment variables and are read on the server only.
  Never log them, never send them to the client.
- Authorization is checked on every server entry point, not just in the UI.
- Escape and validate everything that comes from a user, a webhook, or a third party.
- Rate limit public endpoints. Never trust a client-supplied user id or price.
- No new auth flow, payment path, or data deletion behavior without explicit approval.
- If docs/SECURITY.md exists in this project, it overrides this section.

## 06 Useful commands

```
npm install          install dependencies
npm run dev          start the dev server
npm run build        production build (must pass before a PR)
npm run lint         lint and type check
npm run test         unit tests
npm run test:e2e     end-to-end tests
```

Replace these with this project's real commands. If a command fails, report the
exact output. Do not work around it silently.

## 07 Definition of done

A task is done when all of these are true:
- The change does what the task asked, and nothing else.
- Build, lint, and tests pass locally.
- New UI matches DESIGN_SYSTEM.md and works at 375px wide.
- Docs are updated if a structure, a decision, or a component changed.
- The summary says what changed, what was not done, and what the user should check.

## 08 When to stop and ask

Stop and ask instead of guessing when:
- The task conflicts with the PRD, the design system, or an architectural boundary.
- Two reasonable readings of the task lead to different work.
- The change needs a new dependency, table, secret, or service.
- Something is broken that the task did not mention.

Ask with the specific question, the options you see, and your recommendation.
