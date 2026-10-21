/* ============================================================
   fangshoufanji · 个人作品集与工具
   核心交互逻辑：
   1. 探照灯光标追踪 (ui-research/creatives/01 Spotlight)
   2. 旗舰舞台 AgentIsland 多态交互 (任务态 / 待处理会话态 / 待机态)
   3. 空调微组件互动调节 (haier-ac-mac 温度步进)
   4. 在建项目 Bento 分类筛选
   5. 语义详情弹窗 (<dialog>) 全量项目元数据与焦点闭环 (WCAG 2.4.3)
   6. 深色 / 浅色模式切换 (View Transitions 圆形扩散)
   7. 年份自动更新
   8. 顶栏滚动高亮 (30% 判定线)
   9. 顶栏滚动让位与焦点唤回
   10. 首屏开发者头像加载容灾
   11. MacClean 存储分段与图例联动
   12. KnowFlick 复习打卡微交互

   渐进增强约定：可点语义（role / tabindex / aria-label）与指针手势都由 JS 注入，
   无 JS 时这些控件退化为纯展示内容，不做「点了没反应却看着能点」的假控件。
   ============================================================ */

const projectData = {
  "agent-island": {
    title: "AgentIsland",
    subtitle: "常驻刘海屏，全局尽在掌控 · macOS 智能体协同中心",
    tags: ["macOS Native", "Rust & Tauri", "Rust", "Agent Tooling"],
    description:
      "把本机各个智能体（Claude Code、Codex、DSH 等）的运行状态、正在执行的任务和高危权限确认集中放到屏幕顶部灵动岛。不用来回在终端窗口切来切去，看一眼屏幕顶部就知道它执行到哪一步了。支持点击展开卡片、只读查看会话来源，Token 消耗与内存指标常驻可视化；打开来源只是导航，不代替批准操作，完全消除多会话切屏心智负担。",
    url: "https://github.com/bitterSmilezzz/AgentIsland",
  },
  knowflick: {
    title: "KnowFlick",
    subtitle: "把阅读、思考与复习，收拢进同一个工作台 · 跨端自律闭环",
    tags: ["macOS", "Android", "SwiftUI", "Jetpack Compose"],
    description:
      "解决碎片化阅读与记忆复习割裂的顽疾。在电脑端深度归纳结构化资料与阅读手记，在移动端利用碎片化时间刷艾宾浩斯复习卡片。支持端到端离线加密双端同步，毫秒级卡片检索渲染，告别臃肿三方云笔记。",
    url: "https://github.com/bitterSmilezzz/knowflick",
  },
  "mac-clean": {
    title: "MacClean",
    subtitle: "只做有用功，每一项清理都有理有据 · 开发者专属深度清理",
    tags: ["macOS", "Swift 6", "AppKit", "Zero Telemetry"],
    description:
      "拒绝商业清理软件的恐吓式营销与黑盒盲删。专为开发者设计的缓存与残留扫描器，透视 Xcode DerivedData、npm 缓存、Homebrew 冗余与卸载残留。每一项都说明属于哪个软件、为什么能删，并保留完整的安全撤回路径。",
    url: "https://github.com/bitterSmilezzz/MacClean",
  },
  "haier-ac-mac": {
    title: "haier-ac-mac",
    subtitle: "抬头点一下，冷暖自知，何须找手机 · 菜单栏智能家居空调直控",
    tags: ["macOS", "SwiftUI", "Menu Bar", "Cloud Protocol"],
    description:
      "在电脑前写代码时，为了调 1 度空调何必翻找手机、解锁屏幕、打开臃肿 App。haier-ac-mac 常驻菜单栏极简微型温度控件，原生全局快捷键秒级切换温度、制冷/制热与风速模式，状态即时双向同步。",
    url: "https://github.com/bitterSmilezzz/haier-ac-mac",
  },
};

document.addEventListener("DOMContentLoaded", () => {
  /* 动态注入的文案由脚本写入，必须走同一个翻译源，
     否则英文页面里切换灵动岛状态 / 空调模式会出现中英混排。 */
  const t = (text) => (typeof window.tSiteText === "function" ? window.tSiteText(text) : text);
  /* 中文提示里的分类名要用中文原文，不能直接用已被翻译成英文的标签文本 */
  /* 分类名用固定映射，不读标签文本——标签会被语言切换改写，
     读它会导致「英文句式 + 中文分类名」的混排。 */
  const FILTER_NAMES = {
    all: { zh: "全部", en: "all" },
    macos: { zh: "macOS 原生工具", en: "macOS Native" },
    cross: { zh: "跨端工作台", en: "Cross-Platform" },
    cli: { zh: "命令行与网络", en: "CLI & Network" },
  };
  const filterStatusText = (count, key) => {
    const isEn = document.documentElement.getAttribute("data-lang") === "en";
    const names = FILTER_NAMES[key] || FILTER_NAMES.all;
    if (isEn) {
      return key === "all"
        ? `Showing all ${count} projects`
        : `Showing ${count} ${names.en} ${count === 1 ? "project" : "projects"}`;
    }
    return key === "all" ? `显示全部 ${count} 个项目` : `已筛选出 ${count} 个${names.zh}项目`;
  };

  // 首屏精选作品点击联动：若目标项目当前被分类筛选隐藏，先自动重置为全部
  document.querySelectorAll(".hero-work-item, .hero-work-all").forEach((item) => {
    item.addEventListener("click", () => {
      const targetId = item.getAttribute("data-target-project");
      if (item.classList.contains("hero-work-all")) {
        document.querySelector('[data-filter="all"]')?.click();
        return;
      }
      if (!targetId || targetId === "agent-island") return;
      const targetCard = document.querySelector(`[data-project="${targetId}"]`);
      if (targetCard && targetCard.hidden) {
        const allBtn = document.querySelector('[data-filter="all"]');
        if (allBtn) allBtn.click();
      }
    });
  });

  // 1. 探照灯光标追踪 (ui-research/creatives/01)
  const isTouchDevice = window.matchMedia("(hover: none)").matches;
  if (!isTouchDevice) {
    const spotlightCards = document.querySelectorAll(".spotlight-card");
    spotlightCards.forEach((card) => {
      card.addEventListener(
        "mousemove",
        (e) => {
          const rect = card.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          card.style.setProperty("--mouse-x", `${x}px`);
          card.style.setProperty("--mouse-y", `${y}px`);
        },
        { passive: true }
      );
    });
  }

  // 2. 旗舰舞台 AgentIsland 多态互动展示
  const stageTabs = document.querySelectorAll("[data-island-state]");
  const islandAgentText = document.getElementById("island-agent-text");
  const islandTaskText = document.getElementById("island-task-text");
  const islandTokenCount = document.getElementById("island-token-count");
  const islandStateBadge = document.getElementById("island-state-badge");
  const islandActionSubbar = document.getElementById("island-action-subbar");
  const islandCpuVal = document.getElementById("island-cpu-val");
  const islandLatencyVal = document.getElementById("island-latency-val");
  // 拟真刘海硬件指示灯：与三态联动（执行=绿 / 待处理=橙 / 待机=熄灭）
  const hwLed = document.querySelector(".green-indicator");

  const islandStates = {
    running: {
      agent: "Claude Code",
      task: "正在检索目录结构并构建依赖拓扑图",
      tokens: "4,280",
      cpu: "4.8% (ACTIVE)",
      latency: "0.4 ms",
      led: "",
      badge: "RUNNING",
      badgeClass: "tag-running",
      showSubbar: false,
    },
    waiting: {
      agent: "Codex Runtime",
      task: "检测到待处理会话，等待在来源工具中确认",
      tokens: "6,120",
      cpu: "1.2% (WAITING)",
      latency: "0.8 ms",
      led: "led-waiting",
      badge: "WAITING",
      badgeClass: "tag-waiting",
      showSubbar: true,
    },
    idle: {
      agent: "AgentIsland Daemon",
      task: "本机所有智能体会话已就绪 · 等待唤醒",
      tokens: "0",
      cpu: "0.4% (IDLE)",
      latency: "1.2 ms",
      led: "led-idle",
      badge: "IDLE",
      badgeClass: "tag-idle",
      showSubbar: false,
    },
  };

  let currentIslandState = "running";

  const renderIsland = () => {
    const config = islandStates[currentIslandState];
    if (!config) return;

    stageTabs.forEach((tab) => {
      const active = (tab.getAttribute("data-island-state") || "running") === currentIslandState;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-pressed", active ? "true" : "false");
    });

    if (islandAgentText) islandAgentText.textContent = t(config.agent);
    if (islandTaskText) islandTaskText.textContent = t(config.task);
    if (islandTokenCount) islandTokenCount.textContent = config.tokens;
    if (islandCpuVal && config.cpu) islandCpuVal.textContent = config.cpu;
    if (islandLatencyVal && config.latency) islandLatencyVal.textContent = config.latency;
    if (hwLed) {
      hwLed.classList.toggle("led-waiting", config.led === "led-waiting");
      hwLed.classList.toggle("led-idle", config.led === "led-idle");
    }
    if (islandStateBadge) {
      islandStateBadge.textContent = t(config.badge);
      islandStateBadge.className = `island-state-tag ${config.badgeClass}`;
    }
    if (islandActionSubbar) {
      islandActionSubbar.hidden = !config.showSubbar;
    }
  };

  window.addEventListener("site:langchange", renderIsland);

  stageTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      stageTabs.forEach((x) => {
        x.classList.remove("is-active");
        x.setAttribute("aria-pressed", "false");
      });
      tab.classList.add("is-active");
      tab.setAttribute("aria-pressed", "true");
      currentIslandState = tab.getAttribute("data-island-state") || "running";
      renderIsland();
    });
  });

  // 会话入口模拟按钮响应：只读动作，不代批准（与仓库口径一致）
  const btnApprove = document.getElementById("btn-demo-primary");
  const btnReject = document.getElementById("btn-demo-secondary");
  if (btnApprove) {
    btnApprove.addEventListener("click", () => {
      btnApprove.textContent = t("已打开会话 ✓");
      setTimeout(() => {
        const runningTab = document.querySelector('[data-island-state="running"]');
        if (runningTab) runningTab.click();
        btnApprove.textContent = t("查看会话 ⏎");
      }, 600);
    });
  }
  if (btnReject) {
    btnReject.addEventListener("click", () => {
      btnReject.textContent = t("已打开工具 ✓");
      setTimeout(() => {
        const idleTab = document.querySelector('[data-island-state="idle"]');
        if (idleTab) idleTab.click();
        btnReject.textContent = t("打开工具");
      }, 600);
    });
  }

  // 3. 空调温度与冷暖模式微交互 (haier-ac-mac)
  const acDegVal = document.getElementById("ac-deg-val");
  const btnTempDown = document.getElementById("btn-temp-down");
  const btnTempUp = document.getElementById("btn-temp-up");
  const acModeToggle = document.getElementById("ac-mode-toggle");
  let currentTemp = 24;
  let isCooling = true;

  let isManualMode = false;

  const updateTempButtons = () => {
    if (btnTempDown) {
      btnTempDown.disabled = currentTemp <= 16;
      btnTempDown.setAttribute("aria-disabled", currentTemp <= 16 ? "true" : "false");
    }
    if (btnTempUp) {
      btnTempUp.disabled = currentTemp >= 30;
      btnTempUp.setAttribute("aria-disabled", currentTemp >= 30 ? "true" : "false");
    }
  };

  const setAcMode = (cooling, manual = false) => {
    isCooling = cooling;
    if (manual) isManualMode = true;
    if (acModeToggle) {
      acModeToggle.textContent = t(isCooling ? "制冷模式" : "制热模式");
      acModeToggle.classList.toggle("is-heat", !isCooling);
    }
  };

  if (acModeToggle) {
    // 可点语义由 JS 注入：无 JS 时它是纯文本，不该被读屏当成按钮、也不该被 Tab 聚焦
    acModeToggle.setAttribute("role", "button");
    acModeToggle.setAttribute("tabindex", "0");
    acModeToggle.setAttribute("aria-label", t("切换空调冷暖模式"));

    const toggleAcMode = () => setAcMode(!isCooling, true);
    acModeToggle.addEventListener("click", toggleAcMode);
    acModeToggle.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggleAcMode();
      }
    });
  }

  const handleTempStep = (delta) => {
    const next = currentTemp + delta;
    if (next >= 16 && next <= 30) {
      currentTemp = next;
      if (acDegVal) acDegVal.textContent = String(currentTemp);
      updateTempButtons();
      // 只有在未手动指定冷暖模式时，才根据温度阈值自动推荐模式
      if (!isManualMode) {
        if (currentTemp >= 26 && isCooling) {
          setAcMode(false, false);
        } else if (currentTemp <= 25 && !isCooling) {
          setAcMode(true, false);
        }
      }
    }
  };

  // 语言切换后重绘模式徽章（它是脚本写入的文本，不在 DOM 字典里）
  updateTempButtons();

  window.addEventListener("site:langchange", () => {
    setAcMode(isCooling, isManualMode);
    if (acModeToggle) acModeToggle.setAttribute("aria-label", t("切换空调冷暖模式"));
    if (kfBox) kfBox.setAttribute("aria-label", t("点击模拟完成今日卡片复习"));
  });

  if (btnTempDown) {
    btnTempDown.addEventListener("click", () => handleTempStep(-1));
  }
  if (btnTempUp) {
    btnTempUp.addEventListener("click", () => handleTempStep(1));
  }

  // 4. 在建项目 Bento 分类筛选
  const filterTabs = document.querySelectorAll(".filter-tab");
  const projectCards = document.querySelectorAll("[data-project-grid] .spotlight-card");
  const emptyStateEl = document.querySelector(".empty-state");
  const filterStatusEl = document.getElementById("filter-status");
  let lastFilter = null;

  /* 计数从卡片实测，不信任 HTML 里的硬编码数字：加/删项目后药丸不会说谎 */
  {
    const tally = { all: projectCards.length };
    projectCards.forEach((card) => {
      const c = card.getAttribute("data-category");
      if (c) tally[c] = (tally[c] || 0) + 1;
    });
    document.querySelectorAll("[data-count]").forEach((pill) => {
      const key = pill.getAttribute("data-count");
      pill.textContent = String(tally[key] || 0).padStart(2, "0");
    });
    /* 某分类若从 0 变为有项目，取消禁用，避免出现「能点却无反应」 */
    filterTabs.forEach((tab) => {
      const key = tab.getAttribute("data-filter");
      if (key === "all") return;
      const n = tally[key] || 0;
      const empty = n === 0;
      tab.classList.toggle("is-empty", empty);
      tab.disabled = empty;
      tab.setAttribute("aria-disabled", empty ? "true" : "false");
    });
  }

  filterTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      if (tab.getAttribute("aria-disabled") === "true") return;
      const filter = tab.getAttribute("data-filter");

      filterTabs.forEach((t) => {
        t.classList.remove("is-active");
        t.setAttribute("aria-pressed", "false");
      });
      tab.classList.add("is-active");
      tab.setAttribute("aria-pressed", "true");

      let visibleCount = 0;
      projectCards.forEach((card) => {
        const cat = card.getAttribute("data-category");
        const match = filter === "all" || cat === filter;
        if (match) {
          card.hidden = false;
          card.style.display = "";
          visibleCount++;
        } else {
          card.hidden = true;
          card.style.display = "none";
        }
      });

      /* 防御性空态：当前唯一 0 计数分类 (cli) 已被 disabled，正常点击到不了这里；
         保留是因为 D2 的实测计数可能把某个分类重新启用。 */
      if (emptyStateEl) {
        emptyStateEl.hidden = visibleCount > 0;
      }

      lastFilter = { count: visibleCount, key: filter };

      if (filterStatusEl) {
        filterStatusEl.textContent = filterStatusText(lastFilter.count, lastFilter.key);
      }
    });
  });

  window.addEventListener("site:langchange", () => {
    if (lastFilter && filterStatusEl) {
      filterStatusEl.textContent = filterStatusText(lastFilter.count, lastFilter.key);
    }
  });

  /* 弹窗标签中英文映射：保证中文模式下不显示纯英文标签 */
  const TAG_I18N = {
    zh: {
      "macOS Native": "macOS 原生",
      "Rust & Tauri": "Rust & Tauri",
      "Rust": "Rust",
      "Agent Tooling": "智能体工具",
      "SwiftUI": "SwiftUI",
      "Jetpack Compose": "Jetpack Compose",
      "macOS": "macOS",
      "Android": "Android",
      "Offline-First": "离线优先",
      "Swift 6": "Swift 6",
      "AppKit": "AppKit",
      "Zero Telemetry": "零数据回传",
      "Menu Bar": "菜单栏",
      "Cloud Protocol": "云端协议",
    },
    en: {
      "macOS Native": "macOS Native",
      "Rust & Tauri": "Rust & Tauri",
      "Rust": "Rust",
      "Agent Tooling": "Agent Tooling",
      "SwiftUI": "SwiftUI",
      "Jetpack Compose": "Jetpack Compose",
      "macOS": "macOS",
      "Android": "Android",
      "Offline-First": "Offline-First",
      "Swift 6": "Swift 6",
      "AppKit": "AppKit",
      "Zero Telemetry": "Zero Telemetry",
      "Menu Bar": "Menu Bar",
      "Cloud Protocol": "Cloud Protocol",
    }
  };

  // 5. 项目详情语义弹窗 (<dialog>) 与焦点恢复闭环 (WCAG 2.4.3)
  const dialog = document.querySelector(".project-dialog");
  const dialogTitle = document.getElementById("dialog-title");
  const dialogSubtitle = document.getElementById("dialog-subtitle");
  const dialogDesc = document.getElementById("dialog-description");
  const dialogTags = document.getElementById("dialog-tags");
  const dialogLink = document.getElementById("dialog-link");
  const dialogPrivate = document.getElementById("dialog-private");
  const dialogCloseBtn = document.querySelector("[data-dialog-close]");
  let lastDialogTrigger = null;
  let dialogCloseTimer = null;
  const dialogMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function finishDialogClose() {
    clearTimeout(dialogCloseTimer);
    dialogCloseTimer = null;
    dialog.classList.remove("is-closing");
    if (typeof dialog.close === "function") {
      if (dialog.open) dialog.close();
    } else {
      dialog.removeAttribute("open");
    }
    /* 状态恢复不依赖 close 事件是否送达：遮罩点击与 Escape 的时序不同，
       只在 close 回调里解锁会留下 is-dialog-open 残留（背景滚动锁死）。 */
    restoreDialogContext();
  }

  function requestDialogClose() {
    if (!dialog || !dialog.open || dialogCloseTimer !== null) return;
    if (dialogMotion.matches) {
      finishDialogClose();
      return;
    }
    dialog.classList.add("is-closing");
    // Fixed upper bound: focus and scroll unlock never depend on animation events.
    dialogCloseTimer = setTimeout(finishDialogClose, 140);
  }

  function restoreDialogContext() {
    clearTimeout(dialogCloseTimer);
    dialogCloseTimer = null;
    dialog.classList.remove("is-closing");
    document.documentElement.classList.remove("is-dialog-open");
    document.documentElement.style.removeProperty("--scrollbar-w");
    if (lastDialogTrigger && lastDialogTrigger.isConnected) {
      lastDialogTrigger.focus({ preventScroll: true });
    }
  }

  /* 语言切换时需要按新语言重绘已打开的弹窗 */
  window.reopenProjectDialog = function (projectId) {
    openProjectDialog(projectId, lastDialogTrigger);
  };

  function openProjectDialog(projectId, triggerEl) {
    const data = projectData[projectId];
    if (!data || !dialog) return;

    const wasOpen = dialog.open;
    const keepScroll = wasOpen ? dialog.scrollTop : 0;
    clearTimeout(dialogCloseTimer);
    dialogCloseTimer = null;
    dialog.classList.remove("is-closing");
    if (!wasOpen) lastDialogTrigger = triggerEl || document.activeElement;
    dialog.setAttribute("data-project-id", projectId);

    /* 按当前语言取文案：中文用原文，英文查 I18N_EN 表 */
    const isEn = document.documentElement.getAttribute("data-lang") === "en";
    const tr = (s) => {
      if (!isEn || !s) return s;
      const key = s.replace(/\s+/g, " ").trim();
      const dict = window.I18N_EN || {};
      return Object.prototype.hasOwnProperty.call(dict, key) ? dict[key] : s;
    };

    dialogTitle.textContent = tr(data.title);
    dialogSubtitle.textContent = tr(data.subtitle);
    dialogDesc.textContent = tr(data.description);

    dialogTags.innerHTML = "";
    const curLang = document.documentElement.getAttribute("data-lang") === "en" ? "en" : "zh";
    const tagDict = TAG_I18N[curLang] || TAG_I18N.zh;
    data.tags.forEach((tag) => {
      const span = document.createElement("span");
      span.className = "tech-tag";
      span.textContent = tagDict[tag] || tr(tag);
      dialogTags.appendChild(span);
    });

    if (data.url) {
      dialogLink.href = data.url;
      dialogLink.hidden = false;
      dialogPrivate.hidden = true;
    } else {
      dialogLink.hidden = true;
      dialogPrivate.hidden = false;
    }

    if (wasOpen) {
      /* 语言刷新：保留弹窗内的滚动位置与焦点，不重放入场动效 */
      dialog.scrollTop = keepScroll;
      return;
    }
    dialog.scrollTop = 0;
    if (typeof dialog.showModal === "function") {
      document.documentElement.style.setProperty(
        "--scrollbar-w",
        window.innerWidth - document.documentElement.clientWidth + "px"
      );
      document.documentElement.classList.add("is-dialog-open");
      dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }
  }

  document.querySelectorAll("[data-open-project]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const pid = btn.getAttribute("data-open-project");
      openProjectDialog(pid, btn);
    });
  });

  if (dialog) {
    dialog.addEventListener("close", restoreDialogContext);
    /* Escape 键触发原生 cancel：先接管，走统一的 140ms 退场动效路径。
       若已有正在进行的关闭定时器，不重复启动。 */
    dialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      requestDialogClose();
    });
    const onDialogMotionChange = () => {
      if (dialogMotion.matches && dialogCloseTimer !== null) finishDialogClose();
    };
    if (dialogMotion.addEventListener) dialogMotion.addEventListener("change", onDialogMotionChange);
    else if (dialogMotion.addListener) dialogMotion.addListener(onDialogMotionChange);
  }

  if (dialogCloseBtn && dialog) {
    dialogCloseBtn.addEventListener("click", requestDialogClose);
  }

  if (dialog) {
    dialog.addEventListener("click", (e) => {
      /* 只有点击原生 ::backdrop 时 e.target 才严格是 dialog 本身。
         键盘 Enter 触发的合成 click 坐标为 (0,0) 且 target 是内部元素，
         若不先判 target 就会被当成「点了背景」而误关弹窗。 */
      if (e.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      const inDialog =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;
      if (!inDialog) requestDialogClose();
    });
  }

  // 6. 深色 / 浅色 / 跟随系统 三态切换已迁至 theme-lamp.js（灯泡动效）
  //    这里不再重复绑定，避免两套逻辑互相覆盖。

  // 7. 年份自动更新
  const yearEl = document.getElementById("current-year");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  // 8. 顶栏滚动高亮：判定线取视口 30% 高度处，高亮「上沿已越过判定线的
  //    最后一个区块」；顶部 hero 与页脚区域无区块越线 → 全部取消。
  //    不用 IntersectionObserver 的相交占比：区块高矮不一时占比会偏袒矮者
  //    （实测 suite 位置上 flagship 尾部以 0.081 vs 0.067 抢走高亮），
  //    「最后越线者」是确定性的。rAF 节流，读几何与写状态不同帧交错。
  const navLinks = Array.from(document.querySelectorAll(".nav-link"));
  if (navLinks.length) {
    const linkBySection = new Map();
    navLinks.forEach((link) => {
      const href = link.getAttribute("href");
      if (!href) return;
      const section = document.querySelector(href);
      if (section) linkBySection.set(section, link);
    });

    if (linkBySection.size) {
      const applyCurrent = () => {
        const probe = window.innerHeight * 0.3;
        let best = null;
        let bestTop = -Infinity;
        linkBySection.forEach((_link, section) => {
          const top = section.getBoundingClientRect().top;
          if (top <= probe && section.getBoundingClientRect().bottom > probe && top > bestTop) {
            bestTop = top;
            best = section;
          }
        });
        linkBySection.forEach((link, section) => {
          if (section === best) {
            link.setAttribute("aria-current", "true");
          } else {
            link.removeAttribute("aria-current");
          }
        });
      };

      // 不做 rAF 节流：4 个区块每次滚动事件读一次几何，开销可忽略；
      // 且 rAF 在后台标签页会被停掉（旧档 countUp 兜底同源教训），
      // 节流器一旦卡住高亮就永远停在过期位置。
      window.addEventListener("scroll", applyCurrent, { passive: true });
      window.addEventListener("resize", applyCurrent, { passive: true });
      applyCurrent();
    }
  }

  // 9. 顶栏滚动隐藏：向下滚让位、向上滚回归。
  //     键盘焦点在顶栏内时始终显示（否则 Tab 会落在看不见的链接上）；
  //     回到页顶也始终显示。位移量 <4px 视为抖动不响应。
  const navHeader = document.querySelector(".island-nav-header");
  if (navHeader) {
    let lastY = window.scrollY;
    const setNavHidden = (hidden) => {
      document.documentElement.classList.toggle("nav-hidden", hidden);
    };

    window.addEventListener(
      "scroll",
      () => {
        const y = window.scrollY;
        const delta = y - lastY;
        if (Math.abs(delta) < 4) return;
        lastY = y;

        if (navHeader.contains(document.activeElement) || y < 120) {
          setNavHidden(false);
          return;
        }
        setNavHidden(delta > 0);
      },
      { passive: true }
    );

    navHeader.addEventListener("focusin", () => setNavHidden(false));
  }

  // 10. 首屏开发者头像加载失败容灾（离线或 GitHub 资源受阻时优雅降级为品牌微标识）
  const devAvatar = document.querySelector(".developer-avatar");
  if (devAvatar) {
    devAvatar.addEventListener(
      "error",
      () => {
        devAvatar.src =
          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Crect width='48' height='48' rx='24' fill='%2312151b'/%3E%3Cpath d='M25.6 27.4a4.4 4.4 0 1 1 0-8.8h.9v3h-.9a1.4 1.4 0 1 0 0 2.8h2.4v-2h-2.2v-3h5.2v5.1c0 1.9-1.5 3.4-3.4 3.4z' fill='%2310b981'/%3E%3C/svg%3E";
        devAvatar.alt = "fangshoufanji 默认标识";
      },
      { once: true }
    );
  }

  // 11. MacClean 存储分段条与图例联动微交互
  const segCache = document.querySelector(".seg-cache");
  const segResidue = document.querySelector(".seg-residue");
  const segDup = document.querySelector(".seg-dup");
  const legendItems = document.querySelectorAll(".storage-legend span");

  if (legendItems.length >= 3) {
    const pairs = [
      { seg: segCache, legend: legendItems[0] },
      { seg: segResidue, legend: legendItems[1] },
      { seg: segDup, legend: legendItems[2] },
    ];

    pairs.forEach(({ seg, legend }) => {
      if (!seg || !legend) return;
      const activate = () => {
        seg.classList.add("is-hovered");
        legend.classList.add("is-hovered");
      };
      const deactivate = () => {
        seg.classList.remove("is-hovered");
        legend.classList.remove("is-hovered");
      };
      seg.addEventListener("mouseenter", activate);
      seg.addEventListener("mouseleave", deactivate);
      legend.addEventListener("mouseenter", activate);
      legend.addEventListener("mouseleave", deactivate);
    });
  }

  // 12. KnowFlick 艾宾浩斯复习卡片打卡微交互体验
  const kfBox = document.getElementById("knowflick-box");
  const kfRate = document.getElementById("kf-rate");
  const kfFill = document.getElementById("kf-fill");
  const kfCards = document.getElementById("kf-cards");
  const kfStreak = document.getElementById("kf-streak");

  if (kfBox && kfRate && kfFill && kfCards && kfStreak) {
    const steps = [
      { rate: 85, cardsText: "今日待复习 4 张卡片", streakText: "连续高效打卡 28 天" },
      { rate: 90, cardsText: "今日待复习 3 张卡片", streakText: "连续高效打卡 28 天" },
      { rate: 95, cardsText: "今日待复习 2 张卡片", streakText: "连续高效打卡 28 天" },
      { rate: 98, cardsText: "今日待复习 1 张卡片", streakText: "连续高效打卡 28 天" },
      { rate: 100, cardsText: "今日复习已全部完成 ✨", streakText: "连续高效打卡 29 天" },
    ];
    let stepIndex = 0;

    const renderKf = () => {
      const s = steps[stepIndex];
      kfRate.textContent = t(`${s.rate}% 已完成`);
      kfFill.style.width = `${s.rate}%`;
      kfCards.textContent = t(s.cardsText);
      kfStreak.textContent = t(s.streakText);
    };

    window.addEventListener("site:langchange", renderKf);

    const advanceProgress = () => {
      stepIndex = (stepIndex + 1) % steps.length;
      renderKf();

      kfFill.classList.add("is-pulsing");
      setTimeout(() => kfFill.classList.remove("is-pulsing"), 300);
    };

    // 同上：可点语义只在 JS 可用时存在
    kfBox.setAttribute("role", "button");
    kfBox.setAttribute("tabindex", "0");
    kfBox.setAttribute("aria-label", t("点击模拟完成今日卡片复习"));

    kfBox.addEventListener("click", advanceProgress);
    kfBox.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        advanceProgress();
      }
    });
  }
});


/* 一次性进场提示；内容可见性不依赖 JS、观察比例或动画完成。 */
(function () {
  "use strict";
  var motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (motion.matches || !("IntersectionObserver" in window)) return;

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-entering");
      entry.target.addEventListener("animationend", function (event) {
        if (event.target !== entry.target || event.animationName !== "section-enter") return;
        entry.target.classList.remove("is-entering");
      }, { once: false });
      observer.unobserve(entry.target);
    });
  }, { threshold: 0, rootMargin: "0px 0px 40px 0px" });

  document.querySelectorAll("main > section").forEach(function (section) {
    var rect = section.getBoundingClientRect();
    if (rect.top < innerHeight && rect.bottom > 0) return;
    observer.observe(section);
  });

  function onMotionChange(event) {
    if (!event.matches) return;
    observer.disconnect();
    document.querySelectorAll(".is-entering").forEach(function (section) {
      section.classList.remove("is-entering");
    });
  }

  /* Safari ≤13.9 uses addListener */
  if (typeof motion.addEventListener === "function") motion.addEventListener("change", onMotionChange);
  else if (typeof motion.addListener === "function") motion.addListener(onMotionChange);
})();
