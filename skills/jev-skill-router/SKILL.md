---
name: jev-skill-router
description: Use Jev to select one primary Codex skill from a large local skill catalog when no explicit skill or deterministic file/app rule already decides the choice. Do not use for ordinary tasks with an obvious skill, for executing the selected skill, or when the user explicitly invoked a skill.
---

# Jev Skill Router

Select one primary skill while keeping user intent and Codex's normal skill loading semantics in control.

## Routing order

1. Honor an explicit `$skill-name` invocation without calling Jev.
2. Prefer a deterministic match when a file type, mentioned app, or unique identifier makes the skill unambiguous.
3. Use the router only when several skills plausibly match or the catalog is too large to inspect reliably.
4. Load the selected skill's complete `SKILL.md` only after routing. The router selects; it never executes the selected workflow.

## Run the router

Build or refresh the metadata-only catalog when skills change:

```powershell
node scripts/build-catalog.mjs --output .cache/skills.catalog.json
```

Route a request:

```powershell
node scripts/route-skill.mjs --request "分析销售表并制作汇报" --catalog .cache/skills.catalog.json
```

`TYPESAFE_API_KEY` must be available in the server or local process environment. Never put it in prompts, catalog files, logs, or generated source. Use `--dry-run` to inspect the first-stage questions without making a network request.

Interpret the JSON result:

- `activate`: read the selected skill's `SKILL.md` completely, then follow it.
- `suggest`: treat the result as evidence and make the final choice using the current task and available skill descriptions.
- `none`: continue without injecting a routed skill.

Do not recursively route this skill. Activate at most one primary skill per phase. For multi-artifact work, finish the current phase and route the next phase separately.

For thresholds, response fields, catalog safety, and evaluation guidance, read [references/routing-policy.md](references/routing-policy.md).
