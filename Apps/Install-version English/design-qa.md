# Design QA — dropdown menus

Date: 2026-08-20

## Inputs

- Reference: `D:\APPS_root\artifacts\dropdown-menu-audit-20260820\00-reference.png`
- Same-input comparison: `D:\APPS_root\artifacts\dropdown-menu-audit-20260820\08-reference-vs-implementation.png`
- English desktop implementation: `D:\APPS_root\artifacts\dropdown-menu-audit-20260820\05-english-full.png`
- English mobile implementation: `D:\APPS_root\artifacts\dropdown-menu-audit-20260820\07-english-mobile-menu.png`

## Comparison

The implementation preserves the reference hierarchy: a white container, concise heading and supporting copy, separated full-width rows, right-aligned chevrons, and a restrained violet selected state. The application shell applies the same pattern to navigation groups while keeping Home as the first direct action. One group is open at a time and the active route's group opens automatically.

The desktop and 412 px mobile states were exercised in the in-app Browser. The mobile drawer preserves the same order and single-open behavior. Selection controls use the shared dropdown component and open below their trigger. The contextual-help tooltip is suppressed inside modal navigation so it cannot cover the mobile menu.

## Findings

- P0: none.
- P1: none.
- P2: none.

The visible focus outline in the comparison is an intentional keyboard-accessibility state, not a styling defect. Row height is slightly larger than the reference to retain a reliable touch target.

## Final result

passed
