# 项目工作约定

1. 用最规范高效的方式管理本机开发环境。代码项目位于 `~/Projects`，数据集位于 `~/Data`；课程原始资料、提交材料位于 `~/Courses`，研究资料位于 `~/Research`。
2. 本项目位于 `~/Projects/svg-editor`。作业要求随仓库提交的工程文档保留在 `doc/`，课程原文保留在 `~/Courses/高级软件开发技术/Lab1`。
3. 开发前阅读 `doc/README.md`、`doc/PLAN.md` 和 `doc/ACCEPTANCE.md`。只推进当前授权的任务，功能完成情况按实际验证结果记录。
4. 按作业要求使用 TypeScript 面向对象、一类一文件、封装和多态。编辑使用 Command，容器使用 Composite；名称分派仅位于 CommandDispatcher 与 ShapeFactory。
5. 使用已有 Node 与项目内 npm 依赖，提交 package-lock.json。Git 身份与项目设置优先使用仓库级配置，避免修改全局环境。
6. 每个有实际进展的开发阶段在检查通过后提交，并同步到 `origin`；提交说明反映真实改动。先检查工作区，保留用户已有修改，不混入其他项目或数据集。
7. `origin` 为 `https://github.com/Tastezz/svg-editor.git`，当前仓库私有。验收完成且确定截止时间后才创建并推送 `final` 标签。
8. 这些约定用于后续开发任务中的 Git 管理；没有设置后台定时运行任务。
9. 本机 GitHub 连接需要沿用 macOS 系统代理。Git 已配置仓库级代理和 gh 凭据助手；直接调用 gh 时也需设置相应 HTTPS_PROXY。本次系统代理为 `http://127.0.0.1:7897`，网络变化时先核对 `scutil --proxy`，不盲目修改全局配置。
