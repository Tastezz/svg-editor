# 验收清单

2026-10-26：开发侧验收完成。以下勾选有对应代码、测试或实际操作依据；学生验收与最终提交仍保留为未完成。

## 强制交付与架构

- [x] TypeScript 面向对象；字段封装、一类一文件，文件名与类名一致。证据：43 个源文件结构检查及 Shape/Group/叶子类抽查。
- [x] Command 承载编辑与 undo/redo，容器/叶子通过 Composite 统一操作。证据：EditCommand、CommandHistory、Shapes/EditorSession 测试。
- [x] 命令/图形类型分派只位于 CommandDispatcher 和 ShapeFactory，文档登记后续重构点。数学与词法语法解析不承担图形类型分派。
- [x] 模块、依赖与方案一致，运行时无循环；ShapeReader/ShapeInput 端口修订、tests/cli/support 与 scripts 增补已记录。
- [x] doc/README.md 四个要求章节齐全，有真实过程记录、PlantUML 图与仓库地址。
- [ ] 分步提交和远程推送已有记录；**final 标签仍待截止时间与学生验收后创建**。

## 命令覆盖

测试简称：Shapes=tests/domain/Shapes.test.ts；Document=tests/domain/SvgDocument.test.ts；Session=tests/application/EditorSession.test.ts；Dispatcher=tests/cli/Dispatcher.test.ts；Codec/Store/Process=tests/integration 下同名测试。

| 命令 | 验收行为 | 结果与证据 |
| --- | --- | --- |
| init | 默认尺寸、自定义数值、替换文档、I/O 屏障 | 通过：Session、Dispatcher、Process；浮点由数值模型校验 |
| read | 六种类型、嵌套、缺 id、冲突、坏 XML、文件失败、旧状态保留 | 通过：Codec、Store、Process、Session |
| save | 显式/读入路径、无默认路径、不可写、原子替换、屏障 | 通过：Session、Store、Process |
| canvas | 查询不动历史，修改触发屏障，非法尺寸不动状态 | 通过：Session、Document |
| create | 六种参数、可选样式、in、空组、重名和未知类型 | 通过：ShapeFactory、Dispatcher、ErrorContract |
| delete | 叶子/子树、释放 id、撤销父级与顺序 | 通过：Document、Session |
| move | 负数/浮点、叶子和嵌套组、一个撤销单元 | 通过：Shapes、Session、浏览器 |
| scale | 位置/尺寸、递归恰好一次、非法数值和非正数 | 通过：Shapes、Session、Numeric 校验、ErrorContract |
| set | 公共样式、各类型白名单、文本内容、未知属性 | 通过：Shapes、Dispatcher、ErrorContract；抽查各叶子 setter |
| group | 同父级/跨父级、顺序、id 冲突、祖先后代拒绝、整体撤销 | 通过：Document、Session、180 次混合编辑 |
| ungroup | 子图形提升到原位置、顶层/非容器拒绝 | 通过：Document、Session、ErrorContract、asContainer 多态抽查 |
| addto | 末尾插入、原父级移除、循环拒绝、撤销 | 通过：Document、Session、混合编辑 |
| front/back | 仅同级重排，最前/最后和顺序保持 | 通过：Document、Session；单节点 insert/remove 路径抽查 |
| tree | 全树/子树、树枝、属性内联、空组/变换 | 通过：Dispatcher、Process、实际终端 |
| show | 类型/id/父级/几何/样式/文本 | 通过：Dispatcher、Process、实际终端 |
| help | 全命令语法，不动历史，启动可用 | 通过：Dispatcher；启动可用仍是已记录的暂定解释 |
| undo/redo | 精确恢复、新分支、I/O 屏障、空栈、失败不动历史 | 通过：Session、StatefulHistory、Store、Process |

## REPL 与错误输出

证据：Tokenizer、Dispatcher、ErrorContract、CliProcess 测试，以及实际 PTY 会话。

- [x] svg> 提示符；空行/整行注释和前导空白。
- [x] 引号中的空格、中文、空文本、路径；未闭合引号报错。
- [x] 颜色 #4a90d9 保留，文本 in 不误判为容器尾缀。
- [x] 编辑摘要、显示内容、单行 error: 输出，错误后继续执行。
- [x] 脚本与交互使用同一路径，EOF/Ctrl-D 正常结束。
- [x] 未 init/read 的文档命令输出规定的 no document 错误。
- [x] 4.2 中 Phase 1 适用错误逐字检查；create box 报 unknown shape type。

`cannot ungroup composite shape` 对应后续 box 插件，本阶段没有该类型，不冒充已实现插件语义。

## 历史与原子性重点序列

证据：EditorSession.test.ts、StatefulHistory.test.ts、FileDocumentStore.test.ts。

- [x] create → move → undo → redo，精确恢复浮点原值。
- [x] undo 后显示/查询仍可 redo。
- [x] undo 后失败编辑仍可 redo；成功新编辑清除旧分支。
- [x] 成功 save 后 undo/redo 均报 I/O 屏障错误。
- [x] 屏障后的失败编辑不解禁；成功编辑解禁但不能跨越 I/O。
- [x] canvas 查询/失败 save/read 不阻止撤销原编辑。
- [x] 混合 group/addto/delete/ungroup 后父链、id 和顺序保持正确；180 次混合序列逐次完整撤销重做。
- [x] 失败前后比较文档、路径、历史；失败写入保留原目标且清理临时文件。

## SVG 往返与可见效果

证据：SvgCodec/CliProcess 测试、examples 中脚本、浏览器对照，详见 VALIDATION.md。

- [x] 文本作为子文本；中文、emoji、&、<、引号、CR/LF/Tab 和非法字符边界。
- [x] 省略默认 fill/stroke；支持的显式样式与继承保存。
- [x] 缺 id 避开全文件后续显式 id，包括根 svg 既有 id。
- [x] 六种类型、层级、兄弟顺序、尺寸、viewBox 和支持的变换保留。
- [x] 不支持内容明确失败；兼容范围已记录，不静默丢弃图形。
- [x] save → read 比较模型语义，不要求原 XML 缩进或属性顺序。
- [x] 第 6 节完整会话与第 6.1 节版本 A 真实回放，版本 B 不纳入本阶段。
- [x] 浏览器检查文本随组移动、颜色、尺寸及嵌套变换；PlantUML 图可读。

## 最终复现与学生交付

- [x] 独立干净检出安装、typecheck、架构检查、55 项测试和 demo 全通过；没有改动跟踪文件，生成示例与提交文件相同。
- [x] README 与实际脚本一致，无占位 CLI；报告与自查有证据，限制如实说明。
- [x] 学生待办持续更新并在 Courses 保留副本，课程 README 候选稿含仓库地址。
- [ ] 学生本人复核、确认暂定语义和课程截止时间。
- [ ] 教师可访问当前私有仓库。
- [ ] 最终 final 标签创建并推送，标签与课程提交文档对应。
- [ ] 学生实际完成课程平台提交。
