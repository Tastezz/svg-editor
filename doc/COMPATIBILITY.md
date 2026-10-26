# 命令语义与 SVG 支持范围

## Phase 1 的边界

内置 rect、circle、ellipse、line、text、g 六种类型，全部按唯一、大小写敏感的 id 寻址。`box`、动态插件、GUI 不属于本阶段。

create/group 必须显式给 id；导入时缺 id 才补号，并预先避开整个文件的显式 id。根 svg 的既有 id 会保留并参与重名检查，但不作为可编辑图形。

## 已实现的 SVG 能力

- 合法 SVG 命名空间；根 width/height、viewBox、version、preserveAspectRatio；数字或 px 长度，缺尺寸时优先采用 viewBox 尺寸，否则为 800×600。
- 六种元素的几何属性、文本、父子层级与兄弟顺序。text 的内容写成子文本。
- 公共 fill、stroke、stroke-width，以及字号、字体、text-anchor、透明度等支持的展示属性；data-/aria- 元数据和 xml:space。
- translate、scale、rotate（可带中心）、matrix、skewX、skewY 及它们的嵌套组合。导出统一为等价 matrix，不要求原 XML 排版或变换字符串不变。
- 简单的内联展示 style 会转换成属性，优先级高于同名展示属性；set 后不会被遗留 style 覆盖。
- 中文、emoji、XML 转义和 CR/LF/Tab 文本；非法 XML 字符在编辑或导入时拒绝。

不写入省略的 fill/stroke；由 SVG 的缺省和继承规则决定外观。不是完整 SVG 实现：path、defs/渐变、CSS 类或样式表、tspan 混合文本、脚本、外部链接、百分比/相对长度、复杂 CSS 和未知属性都会明确失败。注释与 XML 排版空白不属于图形内容，不保留原始格式。

## 编辑细节

- move 的 dx/dy 使用图形所在父级坐标系。容器整体平移用矩阵表示，所以组内原始 x/y 可能不变；tree 会显示组的变换。
- scale 乘全部几何位置和尺寸，并缩放矩阵平移量；不额外修改 stroke-width 或 font-size。
- group 同父级时占最早被选位置；跨父级时放在最近公共祖先，子节点按原树先序收入。换父级会补偿变换矩阵。
- ungroup 仅允许非顶层 g；子节点升至原位置，保留变换并接收原组可继承的样式。移入新容器遵循新的样式继承；组级 opacity 等非继承效果在解组后不保证保留。
- front 是兄弟列表末尾，back 是开头，符合 SVG 后绘制者覆盖先绘制者的顺序。
- 无法求逆且确实需要逆矩阵的移动/换父级会明确失败；共享祖先为奇异矩阵时，group/ungroup 仍可通过相对矩阵完成。

## 文档与会话

- init 零参默认 800×600；单参只改宽，高为 600；canvas 修改必须同时给宽高，零参只查询。
- 无参数 save 使用 read 时的路径；init 后必须显式给路径；显式另存不会更改原读入路径。
- init/read/save/canvas 修改成功后清空并锁住历史；下一条成功编辑才解禁，不能跨越 I/O。查询、失败命令不改变历史。
- 带空格参数使用双引号，转义按 JSON 字符串处理，如 `\"`、`\\` 和 `\n`。只把整行起始的 # 当注释，不把颜色当注释。
- 错误输出至 stderr，一行一个 error:；正常结果和导入警告至 stdout。单条错误后继续处理下一行，EOF 正常结束会话。
- 保存先在目标目录写临时文件再替换；失败保留原文件。已有符号链接跟随到真实目标，保留链接本身。

init/canvas 单参数、跨父级 group 与默认保存路径属于原文未完全明确的部分，以上规则是当前实现选择，学生仍应按课程反馈确认。
