# @dragcraft/core

Core is the framework engine that keeps UI shells decoupled from state and behavior. It owns the state container, command pipeline, registries, history, dnd state, and plugin lifecycle. All mutations must go through commands.

## Goals
- No UI dependency, usable by any Vue shell.
- Single source of truth for page, widget list, and global config.
- All changes are atomic commands and can be undone/redone.
- Registry-first design for widgets, configs, and renderers.
- Extensible via plugins and events.

## Architecture Overview
- engine: composition root that wires subsystems together.
- state: reactive store with snapshot/replace capability.
- registry: widget/config/renderer registries.
- schema: page and widget schema definitions.
- history: undo/redo snapshots.
- dnd: drag status storage (type, over index, data).
- event-bus: pub/sub for state and command events.
- plugin: plugin setup interface.
- commands: all atomic state mutations.
- types: shared types for schemas and definitions.

## State Model
- PageSchema: the current page configuration (default type is "page").
- WidgetSchema[]: a flat list of widgets (no nesting).
- GlobalConfigSchema[]: user-registered global configs.
- activeId: current selection, can be page, widget, or null.

## Core Concepts
- Widget definition: meta + default props/style + form schema + view.
- Config definition: meta + default props/style + form schema.
- Renderer definition: mapping type to renderer implementation.
- Commands: the only way to mutate state; each command pushes history.
- History: stores snapshots for undo/redo.
- DnD: stores drag type and index, emits events on changes.
- Event bus: emits `command:executed` and `state:changed`.
- Plugins: receive engine instance in `setup()` for registration.

## Command Rules
- Every state change must be implemented as a command.
- Command manager snapshots before execution, pushes history, and emits events.
- Use commands for: add/remove/move widgets, set active, update props/style,
  update page config, and upsert/remove global configs.

## Extension Points
- Registries
  - registerWidget(definition)
  - registerConfig(definition)
  - registerRenderer(definition)
- Plugins
  - setup(engine) to register commands, configs, or add side effects.
- Event Bus
  - listen to `state:changed`, `command:executed`, and dnd events.

## Non-Goals
- No UI rendering in core.
- No nested widget tree (flat list only).
- No Pinia dependency.

## Suggested Usage Flow
1. Create `CoreEngine` with initial schema or defaults.
2. Register widgets/configs/renderers via registry or plugins.
3. UI shell listens to event bus and uses commands for mutations.
4. Form generator reads form schema from registry definitions.
5. Renderer builds the view list from `widgets` and `page`.
