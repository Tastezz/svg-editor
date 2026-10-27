# 项目工作约定

## 发布约定

2026-10-27 已确认文档定稿，授权将本次定稿提交推送到 `origin/main`，并创建、推送 `final` 标签。保留分步提交历史，不强制推送，不覆盖已有 `final` 标签。

## 开发约定

1. 规范管理本机环境。代码项目放在 `~/Projects`，数据集放在 `~/Data`；课程资料放在 `~/Courses`，研究资料放在 `~/Research`。
2. 本项目位于 `~/Projects/svg-editor`，工程文档位于 `doc/`，原始需求和课程材料位于 `~/Courses/高级软件开发技术/Lab1`。保留原始需求，不修改其内容。
3. 开发前阅读 `doc/README.md`、`doc/PLAN.md` 和 `doc/ACCEPTANCE.md`。修改前检查工作区，保留已有手工修改，只处理当前授权范围。
4. 使用 TypeScript 面向对象、一类一文件、封装和多态。编辑使用 Command，容器使用 Composite；名称分派仅位于 CommandDispatcher 与 ShapeFactory。
5. 使用已有 Node 和项目内 npm 依赖，提交 package-lock.json。Git 身份与项目设置使用仓库级配置，避免修改全局环境。
6. 开发阶段检查通过后保留分步提交，提交说明反映实际改动；远程同步必须遵守上方发布约定。仅将实际执行的检查记录为通过。
7. `origin` 为 `https://github.com/Tastezz/svg-editor.git`，仓库公开。当前未设置后台定时同步任务。
8. 本机 GitHub 连接沿用系统代理。Git 已配置仓库级代理和 gh 凭据助手；直接调用 gh 时使用相应 HTTPS_PROXY。当前代理为 `http://127.0.0.1:7897`，网络变化时先核对 `scutil --proxy`。
9. 实现变更时同步更新报告、使用指南、决策与验证依据。课程目录 README.md 与使用指南由工程文档生成，链接调整为仓库 URL；同步前检查并保留副本中的独立修改。
