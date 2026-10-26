# SVG Editor

高级软件开发技术 · Lab1 Phase 1：用 TypeScript 和面向对象设计实现 SVG 命令行编辑器。

**当前阶段：已完成需求阅读和开发规划，尚未实现 CLI。**

- 作业原文：[phase_cli_1.md](doc/requirements/phase_cli_1.md)
- 作业要求的提交文档：[doc/README.md](doc/README.md)
- 开发顺序与各阶段完成标准：[doc/PLAN.md](doc/PLAN.md)
- 功能验收清单：[doc/ACCEPTANCE.md](doc/ACCEPTANCE.md)
- PlantUML 架构图：[doc/architecture.puml](doc/architecture.puml)

## 项目范围

实现 REPL、六种内置图形（rect / circle / ellipse / line / text / g）、图形树编辑、undo/redo，以及 SVG 文件读写。必须使用 Command 模式，叶子图形与容器采用 Composite 语义。

`box`、动态插件、GUI 和鼠标交互留到后续阶段。

## 开发环境

2026-10-26 本机检查结果：Node.js `v24.20.0`、npm `11.19.0`、Git 可用。`.node-version` 固定当前已有的 Node 版本，不修改全局环境。

下一阶段在本项目安装 TypeScript 与所需依赖，提交 `package-lock.json`，后续用 `npm ci` 复现。计划使用 Node 自带的测试运行器，避免增加一套测试框架。当前没有 `package.json`，以下命令是后续要建立的入口，**现在尚不能运行**：

```sh
npm ci
npm run typecheck
npm run build
npm test
npm run cli
```

## Git 与交付

远程仓库地址：**待创建并填写**。

按实际开发阶段持续提交和推送；验收完成后，在截止时间前创建并推送 `final` 标签。当前不创建最终标签。

首个本地提交使用 Git 自动推断的本机身份；接入远程前需核对，并按需设置本仓库的提交身份，不修改全局 Git 配置。

作业材料没有给出截止时间，交付前需要补充确认。
