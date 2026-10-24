# Component checklist

Before merging a component:

- [ ] Slots documented and implemented (all M3-relevant slots)
- [ ] `::part()` names exposed (`container`, `label`, …)
- [ ] Lifecycle events if overlay/expansion/selection (`k3-*-start/end`, cancelable starts)
- [ ] i18n keys via `t()` — no hardcoded FR/EN in templates
- [ ] Touch target ≥ 48px / logical properties (RTL-safe)
- [ ] Forced-colors focus visible
- [ ] Form-associated when it is a form control
- [ ] Unit test (slots + primary events)
- [ ] Playground demo snippet
