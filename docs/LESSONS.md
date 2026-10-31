# Lessons

One line per mistake. Read the entries for an area before working in it. When a mistake repeats, bump its count; at ×2 it also becomes a rule (in DECISIONS, AGENTS.md, or proposed to AI-Master-Instructions). Mark retired entries SUPERSEDED; never delete them.

Format: `- <area> · <mistake> · <root cause> · <rule> · ×<n> (<YYYY-MM-DD>)`

- design · Recommended a collision rule ("fight across the gap") that deadlocks at melee range 1 · option written without checking it against the range rules · check every proposed rule against existing stats before offering it · ×1 (2026-10-31)
- tooling · Pattern-based edit scripts silently missed text that Prettier had already reflowed (an engine export, then a UI ticker) · patterns written from the pre-format text · after formatting, edit with the Edit tool or re-read first, assert every replacement, and join edit and dependent run with `&&` · ×2 (2026-10-31), now an AGENTS.md rule
