# 实施计划

当前完成：M0–M2。2026-10-26：类型检查、构建和 19 项测试通过；M3–M7 待推进。

估计需要 6–8 个专注工作时段，每段约 1–2 小时；这是安排建议，不是已确认的截止日。每个阶段完成后先验证，再做一个或多个真实提交，不为了凑历史拆分同一份成品。

## M0：读清要求并留下方案（本次）

- 保存作业原文，建立 `doc/README.md`、架构图、实施计划和验收清单。
- 标明强制要求、后续阶段内容及未明确语义。
- 建立本地 Git 仓库，以 `main` 为主分支，首个提交只包含规划。
- GitHub 私有仓库已创建并关联：[Tastezz/svg-editor](https://github.com/Tastezz/svg-editor)。截止日仍待确认；后续按阶段持续同步。

完成标准：能解释每个模块的职责、依赖方向、Command 如何落地以及各阶段如何验证。

建议提交：`docs: plan SVG editor lab architecture and acceptance`

## M1：工具链与两个最小实验（约 1 时段）

- 建立 npm 工程与 TypeScript strict 配置，使用本机已有 Node，不全局安装工具。
- TypeScript、Node 类型声明等放项目 devDependencies；锁定实际安装版本并提交 lockfile。
- 已配置仓库级 GitHub 用户名和 noreply 邮箱；后续保持项目设置局部化，不改全局配置。
- 建立 `typecheck`、`build`、`test`、`cli` 脚本；使用编译后的 JS 运行，保证类型检查有独立入口。
- 小实验 A：XML 库能保留嵌套顺序、文本、中文、转义和缺省属性，并报告坏 XML。
- 小实验 B：阅读样本中的 translate/scale，验证嵌套后的移动、缩放及文本外观；记录支持范围和选定方案。

完成标准：编译与一条真实测试能通过；XML 选型和 transform 风险有实际样本依据。若变换方案影响模型，先修订架构再进入 M2。

建议提交：`chore: establish TypeScript build and test workflow`

## M2：图形树内核与模型不变量（约 1–2 时段）

- 一类一文件实现 Shape、Rect、Circle、Ellipse、Line、Text、Group、SvgDocument。
- 封装属性，以多态实现 move/scale/set、图形描述和输出能力。
- 管理全局 id、父子关系、有序 children；集中实现插入、删除、移入、分组与解组规则。
- 落实 group 的放置与顺序规则，拒绝祖先/后代同时分组、移入自身或后代。
- 实现模型深拷贝与恢复，避免快照共享可变 children/属性。

完成标准：六种图形与嵌套容器可在测试中操作；非法操作不破坏树；快照恢复后方法、父链、id 索引都有效。

建议提交：先 `feat: add polymorphic shapes and document tree`，再 `feat: implement safe grouping and reparenting`。

## M3：编辑命令与撤销重做（约 1 时段）

- 实现全部编辑命令：create/delete/move/scale/set/group/ungroup/addto/front/back。
- 引入 EditCommand、CommandHistory、EditorSession。
- 把编辑放在文档副本中执行，成功才提交状态和历史；命令保留前后快照。
- 实现 undo/redo 分支、I/O 屏障的状态机；先用内存中的存储替身验证屏障。

完成标准：嵌套分组、删除子树、重排均能一次撤销并完整重做；失败不清除 redo、不解禁屏障；新成功编辑会清 redo。

建议提交：`feat: add command history and atomic edits`

## M4：CLI 与输出（约 1 时段）

- Tokenizer 正确处理双引号、空文本、空行、整行注释、颜色参数与尾缀 in。
- 命令名只在 CommandDispatcher 分派；类型名只在 ShapeFactory 分派。
- 建立 `svg>` REPL，错误统一以 `error:` 开头，一行一条；错误后继续接收下一行。
- 补 tree/show/help、成功摘要、文档存在性检查，以及 stdin 脚本回放和 EOF 正常退出。
- 将作业会话固化成脚本输入，先跑不依赖文件的部分。

完成标准：`npm run cli` 能实际完成初始化、创建、嵌套、编辑、撤销和显示；CLI 不包含图形运算。

建议提交：`feat: expose editor commands through REPL`

## M5：SVG 文件读写与文档命令（约 1–2 时段）

- 用端口隔离文件和 XML；实现 read/save/init/canvas，保留本阶段要求的 SVG 结构与属性。
- 自动 id 两遍处理：先收集显式 id，再为缺 id 的图形分配未占用编号并警告。
- 读入在候选文档中完成；保存采用临时文件替换；路径或解析失败不动当前会话和历史。
- 无参数 save、canvas 查询/修改、默认画布尺寸和 I/O 屏障按确定后的规则落地。
- 验证 transform 方案及不支持内容的明确错误，不允许静默丢弃。

完成标准：回放作业第 6 节完整会话；导出 SVG 浏览器可见；read/save 往返保留语义；失败原子性和屏障集成测试通过。

建议提交：`feat: add SVG import export and document IO barriers`

## M6：回归、架构复核与提交文档（约 1 时段）

- 跑完 ACCEPTANCE.md，重点检查非正缩放、重复 id、循环嵌套、跨父级分组及错误后继续工作。
- 生成第 6.1 节版本 A 的两节点流程图，浏览器检查文本随容器移动和最终外观。
- 抽查依赖方向、封装、一类一文件、两处分派；实现偏离方案时同步修订。
- 渲染 PlantUML 架构图并检查，文档同时保留可查看的图与源文件。
- 按真实经历补过程记录：至少记录有价值的问题、判断和纠正证据，不预设数量和虚构情节。
- 将 doc/README.md 从方案草稿更新为真实实现说明，填入验证结果与已知限制。

完成标准：每条强制要求都有代码/测试/人工检查证据；不能把“计划验证”写成“已验证”。

建议提交：`test: verify assignment sessions and architecture`、`docs: record implementation decisions and validation`

## M7：远程与 final 交付（约半个时段）

- 确认远程仓库可访问、各阶段提交已推送，README 中填写真实 URL。
- 从干净检出运行 npm ci、类型检查、构建、测试、CLI 示例。
- 确认 doc/README.md 包含架构方案、过程记录、一致性自查和质量保证手段。
- 截止时间前对验收后的提交创建 `final` 标签并推送，检查远程标签确实存在。
- 提交课程要求的 README.md，内容带仓库地址；最终检查提交文件与 final 标签指向的版本一致。

完成标准：他人能从 final 获取代码并复现；文档有真实仓库 URL；本地与远程 final 指向同一提交。

## 当前下一步

开始 M3。图形树、矩阵与深拷贝已建立；现在接入编辑命令、历史分支和失败原子性。决策与依据见 DECISIONS.md。
