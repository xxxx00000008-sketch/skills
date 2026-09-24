# Jev Skill Router

[![Codex Skill](https://img.shields.io/badge/Codex-Skill-111827)](./SKILL.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-22c55e.svg)](../../LICENSE)

使用 TypeSafe Jev / System One，从大型本地 Skill 目录中选择当前阶段最合适的一个主技能。

## 特点

- 用户显式调用 `$skill-name` 和确定性规则始终优先。
- 只发送技能的名称、描述和本地路径，不发送 `SKILL.md` 正文。
- 两阶段候选筛选，并按置信度返回 `activate`、`suggest` 或 `none`。
- 认证、限流、超时或响应错误时 fail closed，交还 Codex 原生选择流程。

## 安装

先克隆仓库，再复制本目录：

```powershell
git clone https://github.com/xxxx00000008-sketch/skills.git
Copy-Item -Recurse .\skills\skills\jev-skill-router "$env:USERPROFILE\.codex\skills\jev-skill-router"
```

要求 Node.js 18+、`TYPESAFE_API_KEY`，以及对 TypeSafe System One API 的网络访问。

## 使用

```powershell
node scripts/build-catalog.mjs --output .cache/skills.catalog.json
node scripts/route-skill.mjs --request "分析销售表并制作汇报" --catalog .cache/skills.catalog.json --dry-run
node scripts/route-skill.mjs --request "分析销售表并制作汇报" --catalog .cache/skills.catalog.json
```

可配置阈值：`JEV_ROUTER_ACTIVATE_CONFIDENCE`、`JEV_ROUTER_ACTIVATE_PROBABILITY`、`JEV_ROUTER_ACTIVATE_MARGIN` 和 `JEV_ROUTER_SUGGEST_CONFIDENCE`。详细策略见 [references/routing-policy.md](./references/routing-policy.md)。

## 安全

不要将 API Key 写入仓库、提示词、日志或生成文件。本地路径可能包含用户名；如不希望将其传给 API，请先在 Fork 中脱敏。

欢迎 Star、Fork、Issues 和 Pull Requests。本技能采用仓库根目录的 [MIT License](../../LICENSE)。
