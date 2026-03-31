# Add Feature to ToDoApp

You are adding a new feature to this ToDoApp. First, analyze the current state of the app and propose features the user can choose from. Then implement the chosen feature and summarize what Novus's diff workflow should detect.

**Important:** Do NOT add any Pendo SDK calls (`pendo.track`, `pendo.initialize`, etc.) to the code. Novus's PR analysis workflow will detect the new patterns from the diff and create its own PR for Pendo instrumentation.

## Step 1: Analyze Current App State

Read the codebase to understand what currently exists:

- **Types**: `src/types/index.ts` — data models
- **State**: `src/context/TaskContext.tsx` — reducer actions and context methods
- **Notifications**: `src/context/NotificationContext.tsx`
- **Routing**: `src/App.tsx` — route definitions
- **Pages**: `src/pages/` — existing page components
- **Components**: `src/components/` — reusable UI components
- **Agent**: `src/agent/` — AI chat assistant
- **Utils**: `src/utils/` — storage, validators, helpers

## Step 2: Propose Features

Based on what the app currently has and what's missing, present the user with a numbered list of **5-7 feature ideas** that would meaningfully extend the app. Each feature should:

- Be scoped to implement in a single session
- Introduce new data fields, user actions, or workflows (so Novus's diff analysis has something to detect)
- Build naturally on the existing architecture

For each feature, provide:
1. **Name** — short title
2. **Description** — 1-2 sentences explaining what it does
3. **What Novus would detect** — brief note on the new track events and/or metadata fields the diff would introduce

Then ask the user: **"Which feature would you like me to implement? (pick a number)"**

**STOP here and wait for the user to respond before proceeding.**

## Step 3: Implement the Chosen Feature

After the user picks a feature, implement it by directly editing files under `/Users/chiseldeveloper/ToDoApp/`. Follow existing codebase patterns:
- Add new types/interfaces in `src/types/index.ts` if needed
- Add reducer actions and context methods in `src/context/TaskContext.tsx` if needed
- Create/update page components in `src/pages/`
- Create/update UI components in `src/components/`
- Add routes in `src/App.tsx` if needed
- Update agent commands in `src/agent/executor.ts` and `src/agent/parser.ts` if the feature should be accessible via the AI chat

## Step 4: Verify Changes

After implementation, run the build (`npm run build`) and fix any errors until the build passes cleanly.

## Step 5: Create Branch, Commit, and PR

Once the build is green:
1. Create a new branch from the default branch with a descriptive name (e.g., `feat/recurring-tasks`)
2. Stage and commit all changed files with a clear commit message
3. Push the branch and create a PR against the default branch using `gh pr create`

## Step 6: Pendo Diff Summary

After implementation, provide a summary of what Novus's PR analysis workflow (`processPullRequest`) should detect from the code changes.

### Track Events (detectable from the diff)

List composite user actions the diff introduces that Novus should detect as track event candidates. These are actions beyond simple clicks/navigations (which Pendo auto-captures).

For each, provide:

| eventName | productArea | status | description | suggestedMetadata | filePath | codeSnippet |
|-----------|-------------|--------|-------------|-------------------|----------|-------------|

**Detectable patterns include:**
- Form submission handlers (onSubmit success paths)
- CRUD operation completions (dispatch calls for ADD/UPDATE/DELETE actions)
- Bulk operations affecting multiple items
- Search/filter executions with meaningful query data
- Multi-step workflow completions
- Import/export handlers

**Naming**: snake_case, action-oriented (e.g., `task_created`, `category_deleted`, `bulk_tasks_archived`)

### Metadata Fields (detectable from the diff)

List new data model fields or visitor/account properties the diff introduces that Novus should detect as metadata candidates.

For each, provide:

| name | description | source | dataType | pendoType | sampleValue | filePaths |
|------|-------------|--------|----------|-----------|-------------|-----------|

**pendoType** must be one of: `string`, `boolean`, `integer`, `float`, `time`, `list`
- If `time`: note the format (`milliseconds`, `seconds`, or `w3c_iso8601`)
- If `list`: note the elementType (`string`, `integer`, or `float`)

**Detectable patterns include:**
- New fields on Task, Category, Subtask, or other interfaces
- New state properties in context providers
- New localStorage keys with structured data
- New user preference or settings fields

This summary format aligns with Novus's `TrackEventsStructuredOutput` and `VisitorMetadataStructuredOutput` schemas, ensuring the `processPullRequest` workflow will properly detect and create corresponding Pendo artifacts.
