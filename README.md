# SVG Editor

高级软件开发技术 · Lab1 Phase 1：用 TypeScript 和面向对象设计实现 SVG 命令行编辑器。

**当前阶段：M3 Command 与历史已完成，32 项测试通过；下一步接入 CLI 和真实 SVG 文件。**

- 作业原文：[phase_cli_1.md](doc/requirements/phase_cli_1.md)
- 作业要求的提交文档：[doc/README.md](doc/README.md)
- 开发顺序与各阶段完成标准：[doc/PLAN.md](doc/PLAN.md)
- 功能验收清单：[doc/ACCEPTANCE.md](doc/ACCEPTANCE.md)
- PlantUML 架构图：[doc/architecture.puml](doc/architecture.puml)
- 学生待办与交接：[doc/STUDENT_HANDOFF.md](doc/STUDENT_HANDOFF.md)
- 实施决策与修订：[doc/DECISIONS.md](doc/DECISIONS.md)

## 项目范围

实现 REPL、六种内置图形（rect / circle / ellipse / line / text / g）、图形树编辑、undo/redo，以及 SVG 文件读写。必须使用 Command 模式，叶子图形与容器采用 Composite 语义。

`box`、动态插件、GUI 和鼠标交互留到后续阶段。

## 开发环境

2026-10-26 本机检查结果：Node.js `v24.20.0`、npm `11.19.0`、Git 可用。`.node-version` 固定当前已有的 Node 版本，不修改全局环境。

项目本地依赖已锁定在 `package-lock.json`：TypeScript 7.0.2、Node 24 类型、xmldom 0.9.12。测试使用 Node 自带运行器。安装和检查入口：

```sh
npm ci
npm run typecheck
npm run build
npm test
```

`npm run cli` 入口已预留，目前只提示仍在开发，不提供图形编辑；M4 完成后更新本节。

## Git 与交付

远程仓库地址：[Tastezz/svg-editor](https://github.com/Tastezz/svg-editor)（私有）。

按实际开发阶段持续提交和推送；验收完成后，在截止时间前创建并推送 `final` 标签。当前不创建最终标签。

本仓库使用 GitHub 用户名 `Tastezz` 和 GitHub noreply 邮箱作为提交身份，仅设置仓库级配置。后续开发按 [AGENTS.md](AGENTS.md) 维护分步提交、远程同步和文档。

作业材料没有给出截止时间，交付前需要补充确认。
