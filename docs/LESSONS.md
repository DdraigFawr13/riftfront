# Lessons

One line per mistake. Read the entries for an area before working in it. When a mistake repeats, bump its count; at ×2 it also becomes a rule (in DECISIONS, AGENTS.md, or proposed to AI-Master-Instructions). Mark retired entries SUPERSEDED; never delete them.

Format: `- <area> · <mistake> · <root cause> · <rule> · ×<n> (<YYYY-MM-DD>)`

- design · Recommended a collision rule ("fight across the gap") that deadlocks at melee range 1 · option written without checking it against the range rules · check every proposed rule against existing stats before offering it · ×1 (2026-10-31)
- tooling · Ran a 3-minute sim after an edit script had failed, so it measured the old cards · edit and run joined with `;` instead of `&&` · join an edit and the run that depends on it with `&&`, and check the edit applied before a long run · ×1 (2026-10-31)
