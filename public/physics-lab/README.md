# 物理实验 3D（physics-lab）

十八个可交互的高中物理 3D 实验页面（力学 8、电磁学 5、光学 3、热学 2），纯静态文件，无需构建、无需后端。

## 目录结构

```
physics-lab/
├── index.html                 实验列表页（可选，网站有自己的导航时可不用）
├── experiments/               18 个实验页（文件名见下方表格）
└── lib/
    ├── three.min.js           three.js r128（UMD 全局 THREE）
    ├── OrbitControls.js       three.js r128 配套视角控制
    ├── rapier/rapier.es.js    Rapier 3D compat 0.12.0（ES 模块，WASM 已内嵌）
    ├── lab.css                共享样式与配色变量
    └── lab.js                 共享脚本（场景、主题、图表、Rapier 加载等）
```

每个实验页只依赖 `../lib/` 下的文件，页面之间互不依赖。实验页左上角的「返回实验列表」指向 `../index.html`。

## 接入网站

1. 把整个 `physics-lab/` 文件夹原样放进网站的静态资源目录（例如 `public/physics-lab/`），保持内部相对路径不变。
2. 必须通过 HTTP(S) 访问。直接双击用 `file://` 打开时，浏览器会拦截本地 ES 模块，Rapier 会退回内置算法，页面仍能运行但不是完整效果。
3. 链接方式二选一：
   - 直接跳转：`/physics-lab/experiments/projectile.html`
   - iframe 嵌入：
     ```html
     <iframe src="/physics-lab/experiments/projectile.html"
             style="width:100%;height:760px;border:0" loading="lazy"
             title="平抛运动 3D 实验"></iframe>
     ```
     宽度小于 860px 时页面自动变为上下布局，此时内容较长，iframe 高度建议设为 1400px 以上，或让 iframe 所在容器可滚动。

实验页左上角有「返回实验列表」链接，指向 `../index.html`。如果网站不使用 `index.html`，把各实验页里这一行的 `href` 改成网站自己的列表页地址即可。

## 主题（亮色 / 暗色）

默认跟随系统设置。网站可以强制指定：

- URL 参数：`projectile.html?theme=dark` 或 `?theme=light`
- iframe 内动态切换：
  ```js
  iframe.contentWindow.postMessage({ type: 'lab-theme', theme: 'dark' }, location.origin); // same-origin; 'light' | 'dark' | 'auto'
  ```

配色全部是 `lib/lab.css` 顶部的 CSS 变量（`--bg`、`--ink`、`--ghost` 等），改这里即可统一调整所有页面的颜色，3D 场景会同步。平抛页面在 `<style>` 里另有三条投影配色，同样使用这些变量。

## 依赖与网络

| 资源 | 来源 | 说明 |
|---|---|---|
| three.js r128、OrbitControls | 本地 `lib/` | 保持目录完整；本次网站版本不请求外部 CDN |
| Rapier 0.12.0 | 本地 `lib/rapier/` | 失败则改用内置算法，左上角徽标会提示 |
| 字体 | 本机系统字体 | 已去掉 Google Fonts 网络请求，使用 PingFang SC、微软雅黑等，不影响功能 |

本次网站集成已同步修改 `_src/build.py` 模板，重新生成新实验时不会恢复 Google Fonts 或外部 CDN。共享库还保留了网站的同源主题消息校验；最早六项实验保留上一版的平抛参数与符号修正，不用旧页面覆盖。

如果网站设置了 Content-Security-Policy：Rapier 需要 `script-src` 允许 `'wasm-unsafe-eval'`，否则会退回内置算法。

## 实验清单与数值方法

| 分类 | 文件 | 实验 | 方法 | 对照内容 |
|---|---|---|---|---|
| 力学 | projectile.html | 平抛运动 | Rapier，1/240 s | 落地时间、距离、速度；Δx 恒定与下落比 1:3:5 |
| 力学 | incline.html | 斜面上的物块 | 半隐式积分，1/1000 s | 分段解析解；逐差法求加速度 |
| 力学 | collision.html | 碰撞与动量守恒 | Rapier，1/240 s | 碰后速度、总动量、总动能 |
| 力学 | loop.html | 竖直面内的圆周运动 | RK4，1/2000 s | 最高点速度与压力；脱轨角 |
| 力学 | conical.html | 圆锥摆 | 球面摆 RK4，1/1000 s | 周期、半径、拉力；投影的简谐运动 |
| 力学 | kepler.html | 开普勒定律 | 速度 Verlet，1/40000 年 | 周期、半长轴、离心率、T²/a³；等时扇形面积 |
| 力学 | pendulum.html | 单摆 | RK4，1/600 s | 小角度周期、精确周期与测量周期；机械能 |
| 力学 | spring.html | 弹簧振子 | RK4，1/1000 s | 周期（含阻尼）；x–t 图像；机械能 |
| 电磁学 | efield.html | 点电荷的电场 | 电场线 RK2 追踪 | 叠加公式与电势数值梯度；电场线条数 |
| 电磁学 | deflect.html | 示波管 | SI 单位数值积分，0.2 ps | 出板偏移、屏上偏移、穿越时间 |
| 电磁学 | lorentz.html | 带电粒子在磁场中的运动 | Boris 积分 | 半径、周期、螺距、漂移速度 |
| 电磁学 | induction.html | 导体棒切割磁感线 | RK4，1/1000 s | 收尾速度、滑行距离、电荷量、能量守恒 |
| 电磁学 | generator.html | 交流发电机 | 有限差分 −NΔΦ/Δt | 峰值、有效值、平均功率、周期 |
| 光学 | refraction.html | 光的折射与全反射 | 矢量折射定律、菲涅耳公式 | 折射角、临界角；记录数据测折射率 |
| 光学 | lens.html | 透镜成像 | 几何光线追迹 | 像距、像高；光屏上的清晰度 |
| 光学 | doubleslit.html | 杨氏双缝干涉 | 精确光程差 | 由暗纹测得的条纹间距 |
| 热学 | gas.html | 理想气体的分子动理论 | 硬球分子动力学 | 压强、pV/NT、方均根速率、速率分布 |
| 热学 | brownian.html | 布朗运动 | 硬球碰撞 | 能量均分：微粒平均动能 = 3/2 kT |

热学两页的结果来自有限个分子的统计，读数会有几个百分点的涨落；播放时间越长越接近理论值。

斜面实验没有使用 Rapier：测试中 Rapier 的盒体摩擦在接近临界角时与库仑摩擦模型偏差过大，不适合做公式对照，所以改用自写积分。

## 许可

three.js 与 Rapier 的许可证分别位于 `lib/LICENSE-three.txt`、`lib/rapier/LICENSE-rapier.txt`（three.js 为 MIT，Rapier 为 Apache-2.0）。

## 源文件（可选）

`_src/` 里是第二批 12 个实验的页面源文件和生成脚本，网站运行时用不到，可以不上传。需要修改这些实验时，编辑对应的 `.src` 文件后运行 `python3 _src/build.py`，会重新生成 `experiments/` 下的 HTML。最早的 6 个实验直接编辑 HTML 即可。
