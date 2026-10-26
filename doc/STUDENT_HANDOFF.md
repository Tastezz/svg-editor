# 学生待办与项目交接

更新时间：2026-10-26。本文件随仓库更新；课程目录 `~/Courses/高级软件开发技术/Lab1/学生待办与交接.md` 是同内容副本。

## 你回来后先看这里

**代码与自主验收已完成到 M6，可作为提交候选版。** 55 项测试、架构检查、真实终端、浏览器预览和独立干净检出复现均通过。

仓库：[Tastezz/svg-editor](https://github.com/Tastezz/svg-editor)，目前私有。**final 标签尚未创建，课程平台尚未提交。** 剩余工作集中在你本人的复核、截止信息和教师访问权限。

## 你需要做的四件事

1. **确认截止时间和提交入口。** 告诉我准确日期、时间、课程平台，以及是否需要现场演示。原始文件没有给出日期。
2. **确定老师如何访问仓库。** 提供教师 GitHub 账号以便按你的决定邀请，或确认课程要求公开。当前没有公开仓库，也没有擅自增加成员。
3. **花约 20 分钟亲自复核并理解实现。** 按下面的步骤运行；阅读架构与过程记录，用自己的话解释选择和限制。文档中的 AI 验证不等于你本人已经验证。
4. **确认提交材料，然后完成课程平台提交。** 课程目录已有 README.md 候选稿。你确认后，我可检查最终版本、创建并推送 final 标签；课程平台的实际提交由你完成。

## 20 分钟复核路线

在终端执行：

```sh
cd ~/Projects/svg-editor
npm ci
npm run typecheck
npm run check:architecture
npm test
npm run demo
open .artifacts/flowchart.svg
```

预期：55 项测试通过；SVG 显示蓝色“开始”和橙色“处理数据 v2”两个节点及连接线。`open` 使用本机默认 SVG 查看应用；也可把文件拖入浏览器。

随后运行 `npm run cli`，输入：

```text
init 400 200
create g scene
create rect r 20 30 100 50 red in scene
create text t 35 60 "我的节点" in scene
move scene 30 20
tree
undo
tree
save .artifacts/my-check.svg
undo
```

最后一次 undo 应报 `error: undo not allowed after io command`。Ctrl-D 退出。查看保存的 SVG，确认矩形与文字的位置符合预期。

你应能回答：

- 为什么使用 Command？一条 group 为什么只撤销一次？
- 为什么 Group 与 Rect 都能 move/scale/set/delete？
- 为什么用快照恢复，而不是反向减坐标？代价是什么？
- 为什么保存成功后不能继续撤销旧历史？
- 为什么移动组后，子图形原始 x/y 可能不变，但画面会移动？
- 为什么移动节点后连接线不自动跟随？当前 line 是独立图形，没有端点吸附关系。
- 未来加入 box 时，哪两处分派需要重构？

## 还需你确认的作业解释

原文未完全规定的行为已经有一致实现和测试，详见 [DECISIONS.md](https://github.com/Tastezz/svg-editor/blob/main/doc/DECISIONS.md)：

| 问题 | 当前实现 | 你需要做什么 |
| --- | --- | --- |
| 跨父级 group | 最近公共祖先、原树先序、补偿矩阵 | 有课程补充说明时核对，否则确认接受此解释 |
| init 单参数 | 只给宽，高为 600 | 同上 |
| canvas 单参数 | 拒绝；修改须给完整宽高 | 同上 |
| 无参数 save | 读入路径；init 后须显式文件名 | 同上 |
| 无文档 help | 可用 | 同上 |

这些是实现选择，没有写成“老师已经明确规定”。若收到不同解释，可以据此定位修改，不必重做整个架构。

## 当前完成情况

| 阶段 | 状态 | 证据 |
| --- | --- | --- |
| M0 需求与规划 | 完成 | 原文、架构、计划、验收清单与 GitHub 仓库 |
| M1 工具链与实验 | 完成 | 锁文件、严格类型检查、XML/矩阵实验 |
| M2 图形树 | 完成 | 六种图形、id、层级、分组/解组、矩阵与快照 |
| M3 Command 与历史 | 完成 | 所有编辑命令、失败原子性、undo/redo 与 I/O 屏障 |
| M4 CLI | 完成 | REPL、引号/颜色/in、显示、错误处理与真实会话回放 |
| M5 SVG 文件 | 完成 | 严格导入导出、补 id、原子文件替换与支持范围说明 |
| M6 自主验收 | 完成 | 55 项测试；43 个源文件架构检查；浏览器与干净检出复现 |
| M7 最终交付 | 等待学生 | 截止时间、教师访问、本人验收、final 标签及平台提交 |

详细依据：[VALIDATION.md](https://github.com/Tastezz/svg-editor/blob/main/doc/VALIDATION.md)。本次独立检出验证的功能代码提交为 `0e89c6d`；其后的交接整理只改文档。

## 材料在哪里

- 工程与完整提交报告：`~/Projects/svg-editor/doc/README.md`。
- 课程提交候选稿：`~/Courses/高级软件开发技术/Lab1/README.md`，含真实仓库地址；尚未认定为最终提交。
- 实施与纠正记录：仓库 `doc/README.md`、`doc/DECISIONS.md`、`doc/VALIDATION.md`。
- 可运行演示：`npm run demo`；已生成示例在仓库 `examples/flowchart.svg`。

请重点复核过程记录是否符合你的真实参与。若你本人提出了新的质疑、确认了某个问题或改变了设计，再补入相应事实；不要编造讨论或把 AI 的检查写成你亲自完成。

## 已知边界

这是一份 Phase 1 编辑器，不是完整 SVG 标准实现。不支持任意 path、CSS 类、渐变、tspan 混排或相对长度；遇到不支持内容会明确失败。box、动态插件、GUI 和自动连线均不属于本阶段。跨容器移动遵循新的样式继承，解组不保证保留组级 opacity 等非继承效果。详见 [COMPATIBILITY.md](https://github.com/Tastezz/svg-editor/blob/main/doc/COMPATIBILITY.md)。
