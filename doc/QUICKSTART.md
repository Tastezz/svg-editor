# 使用指南

## 安装与示例

需要 Node.js 24 和 npm 11.19.0。在项目根目录运行：

```sh
npm ci
npm run demo
```

示例输出到 `.artifacts/flowchart.svg`，可用浏览器打开。图中包含蓝色“开始”和橙色“处理数据 v2”两个节点及连接线。命令脚本见 [flowchart.commands](../examples/flowchart.commands)。

## 交互编辑

```sh
mkdir -p .artifacts
npm run cli
```

出现 `svg>` 后，逐行输入：

```text
init 400 200
create g scene
create rect r 20 30 100 50 red in scene
create text t 35 60 "示例节点" in scene
move scene 30 20
tree
undo
tree
save .artifacts/example.svg
undo
```

矩形和文字随 scene 一起移动；第一次 undo 恢复移动前的位置。save 将当前文档保存到指定文件，并设置 I/O 屏障，因此最后一次 undo 输出 `error: undo not allowed after io command`。

输入 `help` 查看完整命令语法，Ctrl-D 退出。带空格的文本和路径使用双引号；空行与整行注释会被忽略。单条命令失败后，会话继续接收输入。

## 脚本运行

```sh
npm run build
mkdir -p .artifacts
node dist/src/main.js < examples/flowchart.commands
```

交互和脚本使用同一命令入口。正常结果与导入警告输出到 stdout，`error:` 开头的错误输出到 stderr。

## 主要行为

- 每次成功编辑形成一个撤销单元。group 即使处理多个节点，也只需一次 undo；失败编辑不改变文档和历史。
- init/read/save/canvas 修改成功后清空并锁住旧历史，下一次成功编辑才能开始新的撤销记录。查询与失败命令不影响历史。
- move 使用父级坐标系；移动组会改变组的矩阵，子图形的原始 x/y 可以保持不变。
- 无参数 save 使用 read 时的路径；init 后需显式指定文件名，另存文件不改变原读入路径。
- line 是独立图形，移动节点不会自动调整连接线端点。

## 支持范围与验证

支持 rect、circle、ellipse、line、text 和 g，以及嵌套变换与常用样式。不支持 path、渐变、CSS 类、tspan 混排或相对长度；遇到不支持内容会明确报错。完整边界见 [COMPATIBILITY.md](COMPATIBILITY.md)。

```sh
npm run typecheck
npm run check:architecture
npm test
```

设计与实现见 [架构报告](README.md)，命令约定见 [实施决策](DECISIONS.md)，检查证据见 [验证记录](VALIDATION.md)。
