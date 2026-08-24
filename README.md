# 科研工作台 V2

这是第二版个人科研工作台。

## V2 主要变化

### 1. 修复“添加任务”无法点击
V1 中文化时，JavaScript 中部分元素 ID 被错误汉化，导致页面初始化中断。V2 已统一并检查所有 HTML / JavaScript ID。

### 2. “今日重点”与“任务”统一
V2 不再维护两套独立数据。

- 一个任务可以被设为“今日重点”
- 今日重点最多 3 项
- 在“今日重点”完成任务，会同步进入“今日完成”
- 在“待办事项”完成任务，也会同步更新今日重点
- 本周总结和项目完成率均基于同一份任务数据

### 3. 自动迁移 V1 数据
继续使用原来的浏览器存储键 `research-desk-v1`。

第一次打开 V2 时，会自动把 V1 的独立“今日重点”迁移成真实任务，原有任务、项目、日志与随手记都会保留。

### 4. 减少缓存问题
V2 不再注册 Service Worker，并会主动清理 V1 的离线缓存。
`index.html` 也使用带版本号的 CSS / JS URL，今后更新 GitHub Pages 更容易立即生效。

## GitHub 更新方法

将 ZIP 解压后，把以下文件上传到 `kmhimy.github.io` 仓库根目录并覆盖旧文件：

- `index.html`
- `style.css`
- `app.js`
- `manifest.webmanifest`
- `README.md`

`service-worker.js` 在 V2 中已经不需要。即使 GitHub 仓库里暂时保留旧文件，也不会再被 V2 注册使用。

上传后 Commit，等待 GitHub Pages 更新，再刷新网站。
