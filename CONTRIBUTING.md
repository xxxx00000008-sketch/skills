# Contributing

感谢你改进这个 Skills 集合。

1. Fork 仓库并从 `main` 创建功能分支。
2. 将新技能放入 `skills/<skill-name>/`，并确保目录名与 `SKILL.md` 中的 `name` 一致。
3. 保持每个改动聚焦，避免提交密钥、缓存、生成目录或本地路径数据。
4. 对 Jev Skill Router 的改动运行以下检查：

   ```powershell
   node skills/jev-skill-router/scripts/build-catalog.mjs --output .cache/skills.catalog.json
   node skills/jev-skill-router/scripts/route-skill.mjs --request "分析销售表并制作汇报" --catalog .cache/skills.catalog.json --dry-run
   ```

5. 如果修改阈值或路由策略，请在 PR 中提供代表性输入、预期结果和实际结果。
6. 提交 PR，清楚说明动机、行为变化、兼容性和验证方式。

请通过 Issues 报告普通 Bug 或提出功能建议。安全漏洞不要公开披露，请遵循 [SECURITY.md](./SECURITY.md)。
