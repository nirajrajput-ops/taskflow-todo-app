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

Based on what the app currently has and what's missing, present the user with a numbered list of **5-7 feature ideas** that would meaningfully extend the app.

**CRITICAL: Every proposed feature MUST include BOTH of the following — otherwise Novus's diff workflow will produce nothing:**

1. **Track events** — The feature must introduce at least one composite user action (form submission, CRUD operation, workflow completion, etc.) that Novus can detect as a track event candidate.
2. **Visitor/Account metadata** — The feature must introduce or update at least one user-level or organization-level property (e.g., user preferences, usage stats, role, plan info, onboarding status). These are properties *about the user or org*, NOT about the feature's data model (e.g., a `recurrencePattern` field on a Task does NOT count — but `totalRecurringTasksCreated` on the user DOES count).

**Do NOT propose features that only add UI or data model changes without surfacing new user/org metadata.**

Each feature should also:
- Be scoped to implement in a single session
- Build naturally on the existing architecture

For each feature, provide:
1. **Name** — short title
2. **Description** — 1-2 sentences explaining what it does
3. **Track events Novus would detect** — specific event names (e.g., `template_created`, `bulk_tasks_deleted`)
4. **Visitor/Account metadata Novus would detect** — specific user or org properties (e.g., `totalTemplatesCreated`, `preferredTheme`, `hasUsedBulkOps`)

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

**CRITICAL: The implementation MUST include code that stores or exposes visitor/account metadata.** This means the feature should persist user-level or org-level properties (e.g., in a user profile object, a settings/preferences store, or aggregated usage stats in localStorage) so that Novus's diff workflow can detect them as metadata candidates. Without this, the diff workflow will only find track events and miss the metadata entirely.

Examples of how to surface metadata in the implementation:
- Add a user profile or settings object that stores preferences (e.g., `{ theme: 'dark', notificationsEnabled: true }`)
- Track aggregated usage stats on the user (e.g., `totalTasksCreated`, `lastFeatureUsedAt`)
- Store onboarding/adoption flags (e.g., `hasUsedBulkOps`, `hasCreatedTemplate`)
- Add org/account properties if the feature introduces team concepts (e.g., `orgPlan`, `seatCount`)

## Step 4: Verify Changes

After implementation, run the build (`npm run build`) and fix any errors until the build passes cleanly.

## Step 5: Create Branch, Commit, and PR

Once the build is green:
1. Create a new branch from the default branch with a descriptive name (e.g., `feat/recurring-tasks`)
2. Stage and commit all changed files with a clear commit message
3. Push the branch and create a PR against the default branch using `gh pr create`
4. After the PR is created, switch back to the default branch (`git checkout main`) so the local workspace is ready for the next feature

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

### Visitor (User) Metadata (detectable from the diff)

List new **visitor-level** properties about the user that the diff introduces or exposes. These are properties Pendo uses to segment and target users — NOT feature data model fields.

For each, provide:

| name | description | source | dataType | pendoType | sampleValue | filePaths |
|------|-------------|--------|----------|-----------|-------------|-----------|

**What qualifies as visitor metadata:**
- User identifiers (userId, email, externalId)
- User role or permissions level
- User preferences or settings (theme, locale, notification preferences)
- Onboarding/adoption status (hasCompletedOnboarding, featuresUsed)
- Usage metrics stored on the user (totalTasksCreated, lastLoginAt)
- Account/plan information (planLevel, trialStatus, subscriptionTier)
- User profile fields (createdAt, department, jobTitle)

**What does NOT qualify as visitor metadata:**
- Feature data model fields (e.g., `recurrencePattern` on a Task is a task property, not a user property)
- Transient UI state (filter selections, modal open/closed)
- Individual record fields (task title, category color)

### Account (Organization) Metadata (detectable from the diff)

List new **account-level** properties about the organization/team that the diff introduces. Only applicable if the feature adds B2B/multi-tenant concepts.

For each, provide:

| name | description | source | dataType | pendoType | sampleValue | filePaths |
|------|-------------|--------|----------|-----------|-------------|-----------|

**What qualifies as account metadata:**
- Organization identifiers (orgId, tenantId, accountId)
- Plan/subscription tier, trial status
- Seat counts, user limits
- Company attributes (industry, size, region)
- Feature flags or entitlements at the org level

**pendoType** must be one of: `string`, `boolean`, `integer`, `float`, `time`, `list`
- If `time`: note the format (`milliseconds`, `seconds`, or `w3c_iso8601`)
- If `list`: note the elementType (`string`, `integer`, or `float`)

This summary format aligns with Novus's `TrackEventsStructuredOutput` and `VisitorMetadataStructuredOutput` schemas, ensuring the `processPullRequest` workflow will properly detect and create corresponding Pendo artifacts.
