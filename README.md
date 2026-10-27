# SVG Editor

用 TypeScript 和面向对象设计实现 SVG 命令行编辑器。

支持 REPL、六种内置图形（rect / circle / ellipse / line / text / g）、图形树编辑、undo/redo 和 SVG 文件读写。编辑操作采用 Command，叶子图形与容器通过 Composite 统一处理。

## 安装与运行

使用 Node.js 24，具体版本见 `.node-version`。npm 版本为 11.19.0，项目依赖由 `package-lock.json` 锁定。

```sh
npm ci
npm run cli
```

进入 `svg>` 交互环境后，输入 `help` 查看语法，Ctrl-D 退出。生成两节点流程图示例：

```sh
npm run demo
```

输出文件为 `.artifacts/flowchart.svg`，可用浏览器查看。示例命令和 SVG 位于 [examples/](examples/)。完整操作会话见 [使用指南](doc/QUICKSTART.md)。

正常结果与导入警告输出到 stdout；错误以 `error:` 开头输出到 stderr，单条错误不终止会话。命令约定与外部 SVG 支持范围见 [COMPATIBILITY.md](doc/COMPATIBILITY.md)。

## 验证

```sh
npm run typecheck
npm run check:architecture
npm test
```

已通过 55 项自动测试、43 个源文件的架构检查、交互终端与浏览器检查，以及独立干净检出复现。检查日期、覆盖范围和结果见 [验证记录](doc/VALIDATION.md)。

## 项目文档

- [架构与实现报告](doc/README.md)
- [使用指南](doc/QUICKSTART.md)
- [实施路线](doc/PLAN.md)
- [功能验收清单](doc/ACCEPTANCE.md)
- [实施决策与修订](doc/DECISIONS.md)
- [PlantUML 架构图](doc/architecture.puml)
- [原始需求](doc/requirements/phase_cli_1.md)

仓库：[Tastezz/svg-editor](https://github.com/Tastezz/svg-editor)。
