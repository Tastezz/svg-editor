# 验证记录

检查日期：2026-10-26。记录自动测试、真实终端、浏览器显示与独立检出复现的结果。

## 检查结果

| 检查 | 结果 | 证据 |
| --- | --- | --- |
| 严格类型检查 | 通过 | npm run typecheck |
| 生产代码架构检查 | 通过，43 个源文件 | npm run check:architecture；检查层次、ports 边界、运行时循环、类文件名和 tag/type switch |
| 自动测试 | 55 项通过 | npm test，包含真实 Node 子进程和真实临时文件 |
| 作业第 6 节会话 | 通过 | CliProcess.test.ts；包括两条预期错误、缺 id 警告和保存/读入 |
| 作业第 6.1 节版本 A | 通过 | CliProcess.test.ts；8 个元素，节点内容与 move/undo 正确 |
| 交互终端 | 通过 | 实际 PTY 启动 npm run cli；见 svg>，创建/移动/撤销/显示后 Ctrl-D 正常退出 |
| SVG 浏览器显示 | 通过样例检查 | 流程图、下移节点、嵌套变换原图与读写后图 |
| PlantUML 图 | 本地渲染并浏览器检查通过 | architecture.puml → architecture.svg；中文、模块和依赖箭头显示完整 |
| 干净检出复现 | 通过 | 独立临时检出执行 npm ci、typecheck、架构检查、55 项测试与 demo；工作区干净、示例逐字一致 |

## 自动测试覆盖的关键约束

- [EditorSession.test.ts](../tests/application/EditorSession.test.ts)：编辑单元、快照撤销、失败原子性、redo 分支、I/O 屏障、路径与历史。
- [StatefulHistory.test.ts](../tests/application/StatefulHistory.test.ts)：180 次确定性混合编辑，每步检验不变量、SVG 往返，再逐次完整 undo/redo。
- [SvgDocument.test.ts](../tests/domain/SvgDocument.test.ts)：id、顺序、跨父级分组、循环拒绝、解组、重排与快照。
- [ErrorContract.test.ts](../tests/cli/ErrorContract.test.ts)：逐字检查 Phase 1 指定错误；box 被明确排除。
- [CliProcess.test.ts](../tests/integration/CliProcess.test.ts)：运行真实入口并回放作业会话。
- [SvgCodec.test.ts](../tests/integration/SvgCodec.test.ts)：缺 id 与冲突、变换、Unicode/XML 字符、样式、viewBox、往返和不支持内容。
- [FileDocumentStore.test.ts](../tests/integration/FileDocumentStore.test.ts)：实际文件替换、不可写/不存在目录、符号链接、临时文件清理与失败保留。

自动架构脚本只覆盖当前静态 import 与类声明，不代替设计评审。另外阅读了 Shape/Group 的多态、Command 的副本文档事务、ShapeFactory 的单一类型表，以及 SvgCodec 对 ShapeReader 端口的依赖。

独立检出验证提交：`0e89c6da1229a4f086388466e26b74090eb26fb1`；生产源码树：`09cdd79a692c511be513ff7f102e55e2000a7d55`。安装命令为 `npm ci --no-audit --no-fund`，其余检查均为上表命令；所有退出码为 0。该记录对应上述源码版本；文档整理未改变生产源码。

## 浏览器看到的结果

1. 两节点流程图的蓝色/橙色矩形、中文文字和连线均可见，文字未溢出。
2. `move node2 0 100` 后矩形与文字一起下移；连线是独立图形，保持原坐标，未实现自动吸附端点。
3. 嵌套 translate/scale 的原图和读写后图在样例检查中外观一致，包括白色 End 文字。
4. 本地 PlantUML 图的中文说明、模块和依赖箭头可读，无裁切。

生成示例：[flowchart.svg](../examples/flowchart.svg)。

## 关键修正

- XML 库默认可序列化并重新读入 NUL，但浏览器要求合法 XML；增加字符规则与严格序列化，CR 用字符引用保持往返。
- 直接依赖具体工厂违反了 ports 边界；改为 ShapeReader 接口。
- 直接求世界矩阵的逆会不必要地拒绝共享奇异祖先的分组；改为相对祖先矩阵。
- 实际终端检查发现 undo 的反馈还显示旧操作后的坐标；现改为显示恢复后的属性、父级与顺序。
