# 科研工作台 V4 — 私人登录 + 云同步

## 新增功能

- Supabase 邮箱/密码登录
- 首次创建账号
- 邮箱确认
- 忘记密码 / 密码重置
- 未登录时不显示科研工作台
- Supabase 云同步
- 办公室电脑 / 家里电脑 / 手机使用同一份数据
- 本地仍保留缓存，短暂断网时不会立刻丢数据
- “立即同步”按钮
- 同步状态提示
- 退出登录
- 保留 V3 的专注模式、Esc 退出、任务/重点统一、项目、日志、周总结

## 第一次使用

1. 上传 V4 到 GitHub Pages。
2. 打开 `https://kmhimy.github.io`
3. 点击“首次使用：创建账号”。
4. 用你自己的邮箱和密码注册。
5. 如果 Supabase 要求邮箱确认，到邮箱中点击确认链接。
6. 返回网站登录。
7. 如果当前浏览器里已经有 V3 数据，并且云端还没有数据，V4 会自动上传本机数据。
8. 确认登录和同步成功后，到 Supabase Authentication 设置中关闭 **Allow new users to sign up**。

关闭注册以后：
- 你的已有账号仍然可以登录
- 其他人无法再创建新账号

## 隐私与安全

前端中的以下两项是可公开的：
- Supabase Project URL
- `sb_publishable_...` Publishable key

真正的数据安全依靠数据库中的 Row Level Security (RLS)。

绝对不要把以下内容放到 GitHub：
- `sb_secret_...`
- `service_role`
- 数据库密码

## GitHub Pages 更新

解压 ZIP 后上传并覆盖：

- `index.html`
- `style.css`
- `app.js`
- `config.js`
- `manifest.webmanifest`
- `README.md`

然后 Commit changes。

## 数据同步逻辑

- 第一次登录，如果云端没有记录：上传当前浏览器已有数据。
- 新设备第一次登录：从云端加载。
- 修改任务、项目、日志或随手记：本地立即保存，然后自动同步云端。
- 页面重新获得焦点或每隔约 30 秒：检查云端是否有更新。
- 若短暂断网：本地数据仍保留，恢复网络后可点“立即同步”。
