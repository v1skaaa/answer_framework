# K12教育软件手机端系统
## K12教育软件手机端系统路由分析
### 一、路由结构说明（基于src目录）
src/pages.json：路由的主配置文件

### 二、路由加载方式
本项目基于 UniApp 框架，页面路由采用文件目录自动注册的方式。
所有页面均放在 src/pages 目录下
页面跳转通过 uni.navigateTo、uni.switchTab、uni.redirectTo、uni.reLaunch 等 API 实现。

### 三、路由守卫实现
项目实现了全局路由守卫，用于控制页面访问权限。
具体做法是在 src/utils/permission.js 中，利用 uni.addInterceptor 对所有页面跳转方法进行拦截：

### 四、路由白名单
项目设置了路由白名单，允许未登录用户访问的页面：
`const whiteList = [
  '/pages/login/index',
  '/pages/register/index'
];`

只有白名单内的页面（如登录、注册）可以在未登录状态下访问。
未登录自动重定向
如果用户未登录（即未获取到 token），且访问的页面不在白名单内，则会自动弹出提示并重定向到登录页
