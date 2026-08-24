# 科研工作台 V6 — 任务详情 + Markdown / LaTeX

## 核心变化

每个任务现在都有独立详情页，不再只是一句待办。

点击任务标题后，可以记录：

- 任务目标
- 详细推导
- 数值参数
- 公式
- 当前结论
- 每一次实际完成的工作
- 下一步

## Markdown / LaTeX

任务详情支持实时编辑和实时预览。

支持 Markdown：
- 标题
- 列表
- 加粗
- 引用
- 代码块
- 表格

支持 LaTeX：
- `$...$`
- `$$...$$`
- `\\(...\\)`
- `\\[...\\]`

示例：

```markdown
## 有效相互作用

$$
H_{\rm eff}
=
J_{XY}
(\sigma_1^+\sigma_2^-+\mathrm{H.c.})
+
J_{ZZ}\sigma_1^z\sigma_2^z .
$$

当前需要验证：

- $J_{XY}\to 0$
- $J_{ZZ}\neq 0$
```

## 分次工作记录

每次推进任务，都可以保存一条带时间戳的工作记录。

建议格式：

```markdown
## 今天做了什么

- 检查三模条件
- 重跑参数扫描

## 结果

得到……

## 下一步

- 检查……
```

## 导出

任务详情可以一键导出 `.md` 文件，包含：

- 任务元数据
- 任务说明
- LaTeX 原始公式
- 全部工作记录

## 数据兼容

无需修改 Supabase 表结构，也无需重新运行 SQL。

V5 原有任务会自动增加：
- `detailsMarkdown`
- `workLogs`

所有内容继续通过原来的 Supabase JSON 云同步。

## 更新 GitHub Pages

上传并覆盖：

- index.html
- style.css
- app.js
- config.js
- manifest.webmanifest
- README.md

然后 Commit changes。
