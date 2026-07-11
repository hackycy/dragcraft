# Default Widget Spacing Design

## Goal

Make widget layout spacing opt-in. Dragcraft themes and playground schemas must not add default external `padding` or `margin` around widgets. Users control those values through each node's `style.container` settings.

## Scope

- Remove the default `margin` and `padding` declarations from the theme's `.dc-node--widget` rule.
- Remove explicit root surface padding from all playground template schemas.
- Remove every playground template node's `style.container.padding` or `style.container.margin` declaration while preserving unrelated `style.content` declarations.
- Remove the divider widget's default container margin while preserving its content width.
- Preserve intrinsic component spacing such as input text padding, button hit areas, toolbar layout, navigation layout, and other internal widget CSS.
- Preserve renderer support for user-authored `node.style.container` spacing.

## Implementation

Delete spacing declarations at their sources rather than overriding them with zero or suppressing them in the renderer. This keeps exported schemas clean and allows user-authored spacing to flow through the existing style DSL unchanged.

## Verification

- Add a static regression test that inspects theme CSS, playground template schemas, and widget definitions for forbidden default external spacing.
- Verify the regression test fails before the source changes and passes afterward.
- Run the repository build, lint, and typecheck commands in the required order.

## Non-goals

- Redesigning the visual appearance of individual widgets.
- Removing intrinsic spacing inside controls or designer UI.
- Changing the style DSL or property-panel behavior.
