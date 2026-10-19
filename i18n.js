/* ============================================================
   中英文语言资源
   ------------------------------------------------------------
   设计：HTML 中的中文是唯一事实源（source of truth）。
   - I18N_EN      ：纯文本节点，键 = HTML 里那段中文原文
   - I18N_EN_HTML ：含内嵌标签（<code>/<strong> 等）的富文本，键 = data-i18n-html
   - I18N_EN_ATTR ：属性文案（aria-label / title）

   切到英文时按原文查表替换；切回中文时从 WeakMap 里保存的原文还原，
   因此不需要为中文再维护一份副本，也不会出现两种语言不一致。
   ============================================================ */
(function () {
  "use strict";

  window.I18N_EN = {
    /* ---- 导航 / 全局 ---- */
    "跳到主要内容": "Skip to main content",
    "旗舰": "Flagship",
    "项目": "Projects",
    "铁律": "Principles",
    "手记": "Notes",
    "开源": "Open Source",
    "（在新标签页打开）": "(opens in new tab)",

    /* ---- 首屏 ---- */
    "个人作品集 // 2026.10": "PORTFOLIO // 2026.10",
    "MACOS 原生架构 · 智能体工具 · 工程工艺": "MACOS NATIVE ARCHITECTURE · AGENT TOOLING · CRAFT",
    "系统在线 · 4 个应用 + 3 个开源项目": "SYS_ONLINE · 4 APPS + 3 REPOS",
    "个人开发者 · 专注 macOS 原生与智能体工具": "Independent Engineer · macOS Native & Agent Tooling",
    "[设计理念]": "[PHILOSOPHY]",
    "不解决伪需求。每个工具都运行在自己的工作流中，经历数千小时高频真实使用检验。零商业广告，极致原生性能。":
      "No synthetic demands. Every tool runs inside real daily workflows, battle-tested across thousands of hours. Zero ads, uncompromising native performance.",
    "[技术栈事实]": "[TOOLCHAIN FACTS]",
    "Rust · Swift · SwiftUI · AppKit · Kotlin · TypeScript · Python · Shell":
      "Rust · Swift · SwiftUI · AppKit · Kotlin · TypeScript · Python · Shell",
    "探索旗舰单品": "Explore Flagship",
    "GitHub 主页": "GitHub Profile",

    /* ---- 旗舰 ---- */
    "旗舰展台 // 01 · MACOS 原生": "FLAGSHIP SHOWCASE // 01 · MACOS NATIVE",
    "日常工作流活跃中": "ACTIVE IN WORKFLOW",
    "常驻刘海屏，全局尽在掌控。": "Always in your notch. Full control at a glance.",
    "[痛点直击]": "[THE TENSION]",
    "终端多智能体（Claude Code、Codex 等）来回切屏心智负担重，运行状态与用量散落各处，背景执行毫无知觉。":
      "Juggling several agent terminals carries a real mental tax: status and token usage scatter across windows, and background work is invisible.",
    "[雕琢解法]": "[THE CRAFT]",
    "与 macOS 刘海屏物理融为一体。悬停展开任务阶段与文件改动，Token 消耗与进程资源抬头一目了然。打开来源只是导航，不代替批准操作。":
      "Merged into the macOS notch. Hover to reveal task phases and file changes; token usage and process cost sit right at the top of the screen. Opening a source is navigation only, never a substitute for approving the operation.",
    "[规格切面]": "[THE SPEC]",
    "Rust / Tauri 常驻守护 · 系统级窗口控制与材质 · 轻量低占用 · 深度融合系统辅助功能。":
      "Rust / Tauri resident daemon · system-level window control and materials · lightweight footprint · deep accessibility integration.",
    "正在检索目录结构并构建依赖拓扑图": "Scanning directory structure and building dependency graph",
    "⚠️ 检测到待处理会话：高危指令等待在来源工具中确认":
      "⚠️ Pending session: a high-risk command is waiting for confirmation in its source tool",
    "打开工具": "Open Tool",
    "查看会话 ⏎": "View Session ⏎",
    "切换真实交互状态：": "Switch live interaction state:",
    "任务执行态": "Running",
    "待处理会话态": "Pending Session",
    "空闲待机态": "Idle Standby",
    "内存占用": "MEMORY FOOTPRINT",
    "CPU 占用": "CPU FOOTPRINT",
    "响应延迟": "LATENCY",
    "系统架构": "ARCHITECTURE",
    "APPLE 芯片": "APPLE SILICON",
    "macOS 原生": "macOS Native",
    "Rust & Tauri": "Rust & Tauri",
    "智能体通信协议": "Agent Protocol",
    "零常驻负担": "Zero Overhead",
    "查看完整架构细节": "Architecture Details",
    "访问 GitHub 源码": "GitHub Source",

    "[THE TENSION // 痛点直击]": "[THE TENSION]",
    "[THE CRAFT // 雕琢解法]": "[THE CRAFT]",
    "[THE SPEC // 极简切面]": "[THE SPEC]",
    "85% 已完成": "85% complete",
    "今日待复习 4 张卡片": "4 cards due today",
    "连续高效打卡 28 天": "28-day active streak",
    "查看详情": "View details",
    "制冷模式": "Cooling",
    "制热模式": "Heating",
    "当前分类暂无项目。": "No projects in this category yet.",

    /* ---- 在建项目 ---- */
    "在建项目": "Projects in Progress",
    "持续推进中的原生工具项目，每项都以可测量指标检验成果。":
      "Native tooling projects under active development, each validated against measurable engineering criteria.",
    "全部": "All",
    "macOS 原生工具": "macOS Native",
    "跨端工作台": "Cross-Platform",
    "命令行与网络": "CLI & Network",

    /* ---- KnowFlick ---- */
    "模块 02 · 双端工作台": "MODULE // 02 · MACOS + ANDROID",
    "把阅读、思考与复习，收拢进同一个工作台。":
      "Reading, thinking and reviewing, gathered into one workspace.",
    "碎片化阅读易失真，笔记与艾宾浩斯复习常常割裂。KnowFlick 在电脑端深度归纳结构化资料，移动端碎片时间复习卡片，离线加密双端同步。":
      "Fragmented reading loses fidelity, and notes drift away from spaced repetition. KnowFlick structures material on the desktop and surfaces cards on mobile, with encrypted offline sync across both.",
    "艾宾浩斯复习进度": "Spaced Repetition Progress",
    "SwiftUI": "SwiftUI",
    "Jetpack Compose": "Jetpack Compose",
    "离线优先": "Offline-First",

    /* ---- MacClean ---- */
    "模块 03 · 深度清理": "MODULE // 03 · MACOS UTILITY",
    "只做有用功，每一项清理都有理有据。": "Only useful work. Every cleanup item is justified.",
    "拒绝商业清理软件的恐吓营销与黑盒删除。专注透视开发缓存、DerivedData、npm 冗余和卸载残留，每项附带清晰依据与安全撤回路径。":
      "No scare marketing, no black-box deletion. Inspects build caches, DerivedData, npm leftovers and uninstall residue, each with a stated rationale and a safe undo path.",
    "扫描已就绪 · 沙盒隔离": "Scan ready · Sandboxed",
    "18.4 GB 可释放": "18.4 GB Reclaimable",
    "缓存 (52%)": "Cache (52%)",
    "残留 (28%)": "Residue (28%)",
    "大文件 (20%)": "Large files (20%)",
    "Swift 6": "Swift 6",
    "AppKit": "AppKit",
    "零数据回传": "Zero Telemetry",

    /* ---- haier-ac-mac ---- */
    "模块 04 · 空调直控": "MODULE // 04 · AC CONTROL",
    "抬头点一下，冷暖自知，何须找手机。": "A glance and a click. No phone required.",
    "写代码时调 1 度空调，何必翻找手机、解锁屏幕、打开臃肿 App。菜单栏常驻微型温度控件，原生全局快捷键秒级调节。":
      "Adjusting the AC by one degree should not mean finding a phone, unlocking it and opening a bloated app. A tiny temperature control lives in the menu bar, driven by native global shortcuts.",
    "自动风速": "Auto Fan",
    "云端协议逆向": "Cloud Protocol",

    /* ---- 三条铁律 ---- */
    "工程工艺与原则": "ENGINEERING CRAFT & PHILOSOPHY",
    "做工具的三条铁律": "Three Golden Rules of Toolcraft",
    "开发者准则": "DEVELOPER PRINCIPLES",
    "工艺 // 01": "CRAFT // 01",
    "从真实问题出发，按工程标准交付。": "Start from real problems, ship to engineering standards.",
    "必须源自自己每天遇到的真实痛点": "Must originate from friction you hit every day",
    "日常在 macOS 上写代码或用电脑时，碰到不顺手、反复折腾的地方，把它记下来。不解决伪需求，自己不想天天用的东西绝不动手写。":
      "Log every rough edge hit while coding on macOS. No synthetic requirements — never build something you would not use yourself, daily.",
    "用最快速度跑顺核心流程，立刻放进日常生产环境": "Get the core loop working fast, then put it into daily production",
    "先用最短的时间把最核心的交互和逻辑跑通，不预先设计庞大虚无的架构，第一时间放入日常主力机使用。":
      "Ship the essential interaction and logic first instead of pre-designing a grand architecture, and put it on the daily driver machine immediately.",
    "在日常几千小时高频使用里，慢慢磨出手感与克制": "Refine feel and restraint across thousands of hours of real use",
    "快捷键顺不顺、常驻内存占多大、唤起有没有延迟——极致的软件手感与零负担，都是在真实高频体验里一遍遍打磨出来的。":
      "Shortcut ergonomics, resident memory, launch latency — the last mile of feel and zero overhead is polished through repeated real use.",
    "亲身实测 · 每日主力 · 零商业广告": "SELF-USED · DAILY-DRIVEN · ZERO ADS",
    "技术栈规格": "TOOLCHAIN FACTS",
    "规格 // 02": "SPEC // 02",
    "系统规格与架构偏好": "System Specs & Architecture",
    "拒绝臃肿框架，按场景选择最高效的原生基建：":
      "No bloated frameworks; the leanest native build for each job:",
    "Rust / Tauri": "Rust / Tauri",
    "常驻守护进程、高性能本地监控与工作台":
      "Resident daemons, high-performance local monitoring and workbench",
    "Swift / SwiftUI / AppKit": "Swift / SwiftUI / AppKit",
    "macOS 原生深度清理工具与菜单栏系统集成":
      "macOS native deep-cleaning tools and menu bar integration",
    "Kotlin / Jetpack Compose": "Kotlin / Jetpack Compose",
    "Android 原生学习工作台与离线卡库":
      "Android native learning workspace and offline card library",
    "TypeScript / JavaScript": "TypeScript / JavaScript",
    "DeepSeek Harness 插件与通信契约":
      "DeepSeek Harness plugins and communication contracts",
    "Python 3 / Shell": "Python 3 / Shell",
    "网络握手逆向、投屏协议与自动化工具":
      "Network handshake reversing, screen-cast protocols and automation",
    "GitHub 公开仓库与深度工程实验": "GitHub public repositories and deep engineering experiments",

    /* ---- 手记 ---- */
    "工程手记": "FIELD NOTES",
    "做的时候踩到的坑": "Pits I Fell Into While Building This",
    "这一站本身就是作品。以下都是这个仓库里真实发生过、量出来过的。":
      "This site is itself part of the work. Every item below actually happened here and was measured.",
    "hidden 不是万能锁": "hidden is not a universal lock",
    "CSS · 属性优先级": "CSS · Specificity",
    "「永远深色」的块，别用会变色的墨":
      "An always-dark block must not use theme-following ink",
    "设计令牌 · 对比度": "Design tokens · Contrast",
    "过渡还没跑完，别急着读颜色": "Do not read colours mid-transition",
    "测量方法 · 假阳性": "Measurement · False positive",
    "「元素可见吗」不能只看它自己的 display":
      "Visibility cannot be judged from an element's own display",
    "可访问性 · 判定口径": "Accessibility · Criteria",
    "声明的对比度 ≠ 渲染出来的对比度":
      "Declared contrast is not rendered contrast",
    "测量方法 · 自我推翻": "Measurement · Self-refutation",
    "调 opacity 让内容「退后」，这条路走不通":
      "Lowering opacity to de-emphasise content is a dead end",
    "对比度 · 层次设计": "Contrast · Hierarchy",
    "2026-10": "2026-10",

    /* ---- 开源 ---- */
    "开源生态与基建": "OPEN SOURCE ECOSYSTEM",
    "开源智能体插件与基建": "Open Source Agent Tooling & Infrastructure",
    "DeepSeek Harness 插件生态与网络桥接基础设施。":
      "DeepSeek Harness plugin ecosystem and network bridge infrastructure.",
    "浏览全部公开仓库": "Browse all public repositories",
    "DSH 模型选择器插件，支持快捷模糊搜索、模型分组与推理强度平滑调节。":
      "DSH model selector plugin with fuzzy search, model grouping and smooth reasoning-effort control.",
    "为 DimAgent 桌面端提供本地 TLS 网络握手与网络认证桥接支持。":
      "Local TLS handshake and network authentication bridge for the DimAgent desktop app.",
    "DSH 插件伞仓库，规范插件契约标准并提供自动化测试与静态校验工具。":
      "DSH plugin umbrella repository standardising plugin contracts, with automated tests and static checks.",
    "TypeScript": "TypeScript",
    "JavaScript": "JavaScript",

    /* ---- 页脚 ---- */
    "把问题做成工具。": "Turning problems into tools.",
    "所有项目均在日常主力机持续高频使用并更新。如果有交流想法或反馈，欢迎在 GitHub 关注与讨论。":
      "Every project is used and updated on a daily driver machine. Thoughts and feedback are welcome on GitHub.",
    "关注 @bitterSmilezzz": "Follow @bitterSmilezzz",
    "以工程标准，持续交付。": "Engineering standards, delivered continuously.",
    "回到顶部 ↑": "Back to top ↑",

    "这条路走不通。": "This path leads nowhere.",
    "页面可能已经改名、下架，或者链接本身敲错了一个字符。回首页看看现在还在维护的那几个工具。":
      "The page may have been renamed or taken down, or one character in the link is off. Head back to the homepage to see the tools still under active maintenance.",
    "回到首页": "Back to home",
    "404 · NOT FOUND": "404 · NOT FOUND",

    /* ---- 弹窗 ---- */
    "访问 GitHub 代码仓库": "Visit GitHub Repository",
    "该项目暂未开放公开仓库。": "This project's repository is not public yet.",
    "关闭": "Close"
  };

  /* 富文本：键 = data-i18n-html 的值 */
  window.I18N_EN_HTML = {
    "hero.title":
      'Turn problems,<br /><span class="hero-title-accent">into tools.</span>',
    "hero.manifesto":
      'Start from real problems: ship a working implementation first, then verify and iterate against measurable criteria. <strong class="manifesto-kw">Verifiable · Maintainable · Sustainable.</strong>',

    "notes.n1Body":
      'Setting <code>display: flex</code> on a container overrides the browser default <code>[hidden] { display: none }</code>. The session subbar refused to hide in the running state — measured <strong>40.5px</strong> of height with <code>hidden=true</code>. Only an explicit <code>[hidden] { display: none }</code> really closes it.',
    "notes.n2Body":
      'The island capsule stays black while the accent ink followed the theme. In the light theme, <code>#059669</code> on a 12%-white black surface (rendered <code>rgb(31,31,31)</code>) composites to just <strong>4.39:1</strong> — 4.5 short of the line. Resolved by using ink that does not follow the theme.',
    "notes.n3Body":
      'While verifying the tri-state indicator, all three states read as an identical colour and nearly got "fixed" as a bug. The real cause: <code>getComputedStyle</code> returns <strong>interpolated values</strong> mid-transition — reading right after the click returns the starting colour. Sample after the transition settles and the three states hold.',
    "notes.n4Body":
      '<code>getComputedStyle(el).display</code> does <strong>not inherit</strong> an ancestor\'s <code>display: none</code>. With the parent hidden the child still reports <code>block</code>, so "dead controls without JS" counted three where the true answer was zero. Use a real render criterion such as <code>getClientRects().length</code>.',
    "notes.n5Body":
      'An earlier round fixed small text from <strong>1.49:1</strong> to <strong>4.63:1</strong>, wrote "readable", and added "a <code>blur(2px)</code> does not change measured contrast". <strong>That sentence was never verified, and it is wrong</strong> — contrast is computed from CSS colours, while <code>blur</code> changes rendered pixels. At 11.5px the CJK strokes are about 1px wide, so a 2px radius smears the glyphs. Only per-pixel luminance sampling measures it.',
    "notes.n6Body":
      'To de-emphasise inactive rows, alpha was swept from 0.30 to 1.00: clearing 4.5:1 for small text required alpha <strong>1.00</strong> (4.19:1 at 0.85). The ink tops out at <strong>5.42:1</strong> with <strong>no headroom to attenuate</strong>, and opacity dims the entire row. Switching to value-tiered ink moved the step from "1.49 vs 17.12" to "5.42 vs 17.12".'
  };

  /* 属性文案：键 = 中文 aria-label / title 原文 */
  window.I18N_EN_ATTR = {
    "查看 GitHub 个人主页（在新标签页打开）": "View GitHub profile (opens in new tab)",
    "切换深色 / 浅色模式": "Toggle dark / light mode",
    "语言切换 / Language Switcher": "Language switcher / 语言切换",
    "按项目类型筛选": "Filter by project category",
    "降低温度": "Decrease temperature",
    "升高温度": "Increase temperature",
    "关闭对话框": "Close dialog",
    "fangshoufanji 的头像": "fangshoufanji avatar"
  };

  /* 页面标题与描述 */
  window.I18N_EN_PAGE = {
    title: "fangshoufanji · Turning Problems into Tools",
    description:
      "Personal portfolio of fangshoufanji — macOS native engineering, agent tooling and daily productivity. Turning problems into tools with measurable engineering rigor."
  };
})();
