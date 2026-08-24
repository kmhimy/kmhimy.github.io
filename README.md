# 科研工作台 V7 — Overleaf 风格科研笔记

V7 把每个任务的“任务说明与推导”升级成更接近 Overleaf 的科研笔记编辑器。

## 核心界面

默认采用：

**左侧 58% 源码 + 右侧 42% 实时预览**

并支持三种模式：

- 分栏
- 仅编辑
- 仅预览

系统会记住你上一次选择的模式。

## 公式

公式直接使用 LaTeX：

行内：

```text
$J_{XY}=0$
```

或：

```text
\(J_{XY}=0\)
```

独立公式：

```text
\[
J_{XY}
=
\sum_m
\frac{g_{1m}g_{2m}}{2}
\left(
\frac{1}{\Delta_{1m}}
+
\frac{1}{\Delta_{2m}}
\right)
\]
```

## 快捷按钮

编辑器顶部新增：

- 章节
- 小节
- 加粗
- 列表
- 行内公式
- 独立公式
- aligned 公式
- 代码块

## 快捷键

- `Ctrl + S` / `Cmd + S`：立即保存科研笔记
- `Tab`：插入两个空格

同时仍然保留自动保存与 Supabase 云同步。

## 为什么仍然保留 Markdown

用户界面不再强调 Markdown。

实际使用时可以把它理解为：

- 普通文字直接写
- 标题用 `##`
- 列表用 `-`
- 数学完全用 LaTeX

这样比完整 LaTeX 文档更适合每天记录科研过程，同时公式书写方式与论文保持一致。

## 数据兼容

无需修改 Supabase 数据表。
无需重新注册账号。
V6.1 的任务、项目、科研日志、公式和工作记录全部兼容。

## GitHub Pages 更新

覆盖上传：

- index.html
- style.css
- app.js
- config.js
- manifest.webmanifest
- README.md

然后 Commit changes。
