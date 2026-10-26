# 实施决策与修订

## ADR-001：保留 SVG 变换矩阵（2026-10-26）

作业背景样例包含嵌套 translate/scale。若读入时只改坐标，文字字形和描边受到的缩放会丢失；若连字号和描边一起展开，处理继承样式又会变复杂。

因此，每个图形保留不可变的仿射矩阵，几何属性仍是 SVG 局部坐标。导入/导出保留变换语义。矩阵相乘遵循 SVG 的组合顺序；例中的外层 translate(60,40) 和内层 translate(200,0) scale(0.8) 把 (60,38) 映射为 (308,70.4)。

- move 作用于图形所在父坐标系；叶子可通过逆线性变换更新几何，容器用平移矩阵整体移动。
- scale 同乘几何属性与所有节点矩阵的平移分量；保留线性变换，不额外缩放 stroke-width 或 text 的 font-size。
- 改变父容器时，使用 `newParentWorld.inverse × oldParentWorld × local` 补偿矩阵，防止因为归属变化而跳位。
- 导入的奇异矩阵可保留并显示；无法求逆的编辑应明确失败，不能默默产生无穷或 NaN。
- 变换字符串的数学语法解析与图形类型分派是不同职责；图形类型仍只在 ShapeFactory 分派，不在渲染和编辑中增加 switch(tag)。

当前证据：[Transform 测试](../tests/domain/Transform.test.ts) 验证顺序、逆变换和重分组补偿；[XML 实验](../tests/integration/XmlLibrary.test.ts) 验证文本、顺序、缺省属性与坏文件报错。实际图形操作、文件往返与浏览器检查留到后续阶段。

参考：[SVG transform 文档](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/transform)。

## ADR-002：未明确语义的暂定规则（2026-10-26）

这些规则用于继续实现并固定可复现行为，不代替教师解释；学生待办中保留了确认事项。

| 问题 | 暂定实现 |
| --- | --- |
| group 同父级 | 按原兄弟顺序收入，新组占最早被选节点的位置 |
| group 跨父级 | 放在最近公共祖先中，按原树先序排列子节点；不允许同时选择祖先与后代 |
| init 单参数 | 宽度使用该参数，高度取默认 600；零参为 800×600 |
| canvas 单参数 | 拒绝，修改画布须同时给出宽高，零参只查询 |
| 无文档 help | 可用；文档相关命令仍报 no document |
| save 无参数 | 使用 read 时的路径；init 后没有默认路径，显式 save 不替换原读入路径 |
| 编辑空栈 | undo/redo 分别报 nothing to undo / nothing to redo，仍以 error: 开头 |
| 几何边界 | 画布尺寸为正；宽高/半径/描边宽不为负；坐标允许负数；所有数必须有限 |

## ADR-003：最小本地工具链（2026-10-26）

使用已有 Node 24，项目内锁定 TypeScript、Node 类型与 xmldom；使用 Node 内置测试运行器。先编译再运行，保留独立 typecheck。未加入前端框架、全局 TypeScript 或另一套测试框架。

M1 验证结果：typecheck、build 通过；5 项测试通过。npm 安装检查未报告依赖漏洞。CLI 入口目前明确提示开发中，不把脚手架冒充编辑器。
