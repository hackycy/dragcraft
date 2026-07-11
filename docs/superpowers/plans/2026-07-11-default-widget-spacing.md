# Default Widget Spacing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove all theme- and playground-provided external widget spacing while preserving user-authored container styles and intrinsic control spacing.

**Architecture:** Delete external spacing at each source: theme CSS, playground template schema data, and divider widget metadata. Add one repository-level static regression test that guards these source boundaries without changing renderer behavior.

**Tech Stack:** CSS, TypeScript schema fixtures, Vitest, pnpm workspace scripts.

## Global Constraints

- Default themes and playground schemas must not inject external widget `padding` or `margin`.
- Intrinsic component spacing and designer UI spacing remain unchanged.
- Renderer support for user-authored `node.style.container` remains unchanged.
- Run `pnpm build`, `pnpm lint`, and `pnpm typecheck` in that order.

---

### Task 1: Guard default external spacing

**Files:**
- Create: `tests/default-widget-spacing.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: theme CSS and playground TypeScript source files as text.
- Produces: a root `pnpm test` regression check for forbidden default external spacing.

- [ ] **Step 1: Write the failing test**

Create a Node test that reads `packages/themes/src/components/canvas.css`, every `playground/src/config/templates/*-schema.ts` file, and `playground/src/components/widgets/basic.ts`. Assert that `.dc-node--widget` has no margin or padding, templates have no root or container padding/margin, and divider defaults have no container margin.

- [ ] **Step 2: Register and run the test to verify it fails**

Change the root test script to `nr -r test && vitest run tests/*.test.mjs`.

Run: `pnpm exec vitest run tests/default-widget-spacing.test.mjs`

Expected: FAIL for the current theme rule, template spacing declarations, and divider default margin.

- [ ] **Step 3: Commit the red test with the implementation task**

Keep the failing test uncommitted until Task 2 makes it green so the branch never records a deliberately failing state.

### Task 2: Remove spacing sources

**Files:**
- Modify: `packages/themes/src/components/canvas.css`
- Modify: `playground/src/config/templates/ecommerce-schema.ts`
- Modify: `playground/src/config/templates/product-detail-schema.ts`
- Modify: `playground/src/config/templates/content-detail-schema.ts`
- Modify: `playground/src/components/widgets/basic.ts`

**Interfaces:**
- Consumes: existing CSS cascade and `node.style.container` DSL.
- Produces: spacing-free defaults while retaining explicit user overrides.

- [ ] **Step 1: Remove the theme declarations**

Delete the empty `.dc-node--widget` rule together with its section comment. Do not alter `.dc-node`, overlays, drop indicators, toolbars, or widget-internal CSS.

- [ ] **Step 2: Remove template declarations**

Delete `globalConfig.padding`, `root.style.surface.padding`, and all `style.container.padding`/`style.container.margin` properties from the three templates. When a style object also has `content`, retain it as `style: { content: ... }`; when container spacing is its only style, remove the `style` property.

- [ ] **Step 3: Remove divider default margin**

Change the divider default style from container plus content to `defaultStyle: { content: { width: '100%' } }`.

- [ ] **Step 4: Run the focused test**

Run: `pnpm exec vitest run tests/default-widget-spacing.test.mjs`

Expected: PASS with one passing test file and no failures.

- [ ] **Step 5: Commit the implementation**

Stage the test, root script, CSS, template schemas, widget definition, and plan. Commit as `fix: make widget spacing opt-in`.

### Task 3: Repository verification

**Files:**
- Verify only; no planned source changes.

**Interfaces:**
- Consumes: the completed implementation.
- Produces: evidence that workspace packages remain buildable, lint-clean, and type-safe.

- [ ] **Step 1: Run all tests**

Run: `pnpm test`

Expected: all workspace and root tests pass.

- [ ] **Step 2: Run required checks in order**

Run `pnpm build`, then `pnpm lint`, then `pnpm typecheck`.

Expected: every command exits with code 0 and introduces no errors.

- [ ] **Step 3: Inspect the final diff**

Run `git diff HEAD^ --check` and `git status --short`.

Expected: no whitespace errors and no unrelated working-tree changes.
