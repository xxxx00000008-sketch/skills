# Skills

[![License: MIT](https://img.shields.io/badge/License-MIT-22c55e.svg)](./LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/xxxx00000008-sketch/skills?style=social)](https://github.com/xxxx00000008-sketch/skills/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/xxxx00000008-sketch/skills?style=social)](https://github.com/xxxx00000008-sketch/skills/forks)

个人开发的 Codex Skills 开源集合。每个技能都是独立、可安装、可 Fork 和可贡献的目录。

> English: An open-source collection of independently installable Codex skills.

## 技能目录

| Skill | 说明 | 状态 |
|---|---|---|
| [jev-skill-router](./skills/jev-skill-router/) | 使用 Jev / System One 从大型本地技能目录中选择一个主技能 | 可用 |

## 仓库结构

```text
.
├── skills/
│   └── <skill-name>/
│       ├── SKILL.md
│       ├── README.md
│       └── ...
├── CONTRIBUTING.md
├── SECURITY.md
└── LICENSE
```

## 安装单个技能

Git 不直接支持只克隆一个普通子目录。可 Fork 或克隆整个仓库，再将目标目录复制到 `$CODEX_HOME/skills/`；也可以使用支持 GitHub 子目录安装的 Skill 安装器，目标路径为 `skills/<skill-name>`。

```powershell
git clone https://github.com/xxxx00000008-sketch/skills.git
Copy-Item -Recurse .\skills\skills\jev-skill-router "$env:USERPROFILE\.codex\skills\jev-skill-router"
```

安装后重启或刷新 Codex，使其重新发现技能。

## 添加新技能

新技能必须放在 `skills/<skill-name>/`，至少包含有效的 `SKILL.md`。目录名使用小写字母、数字和连字符。建议同时提供技能级 README，说明用途、依赖、安装、配置、示例、安全边界和许可证。

提交前请确认：

- 未包含 API Key、Token、`.env`、缓存或用户数据；
- `SKILL.md` 的 `name` 与目录名一致；
- frontmatter 包含清晰、可区分的 `description`；
- 脚本已实际运行验证；
- README 中列出了外部服务、网络访问与数据传输行为。

完整约定见 [CONTRIBUTING.md](./CONTRIBUTING.md)。

## 开源协作

欢迎 Star、Fork、Issues 和 Pull Requests。仓库采用 [MIT License](./LICENSE)。安全问题请遵循 [SECURITY.md](./SECURITY.md)，不要在公开 Issue 中披露未修复漏洞。
