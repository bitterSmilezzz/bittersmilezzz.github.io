/* ============================================================
   fangshoufanji · 个人作品集与工具
   核心交互逻辑：
   1. 探照灯光标追踪 (ui-research/creatives/01 Spotlight)
   2. 旗舰舞台 AgentIsland 多态交互 (任务态 / 审批态 / 待机态)
   3. 空调微组件互动调节 (haier-ac-mac 温度步进)
   4. 菜单栏图标收拢/展开 (BarShelf)
   5. 家族 Bento 分类筛选
   6. 语义详情弹窗 (<dialog>) 全量项目元数据
   7. 深色 / 浅色模式切换
   ============================================================ */

const projectData = {
  "agent-island": {
    title: "AgentIsland",
    subtitle: "常驻刘海屏，全局尽在掌控 · macOS 智能体协同中心",
    tags: ["macOS Native", "Swift 6", "AppKit & SwiftUI", "Agent Tooling"],
    description:
      "把本机各个智能体（Claude Code、Codex、DSH 等）的运行状态、正在执行的任务和高危权限确认集中放到屏幕顶部灵动岛。不用来回在终端窗口切来切去，看一眼屏幕顶部就知道它执行到哪一步了。支持点击展开卡片、快捷键秒级审批危险指令，Token 消耗与内存指标常驻可视化，完全消除多会话切屏心智负担。",
    url: "https://github.com/bitterSmilezzz/AgentIsland",
  },
  knowflick: {
    title: "KnowFlick",
    subtitle: "把阅读、思考与复习，收拢进同一个工作台 · 跨端自律闭环",
    tags: ["macOS", "Android", "SwiftUI", "Kotlin Multiplatform"],
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
  barshelf: {
    title: "BarShelf",
    subtitle: "给右上角留白，空间被谁占了一目了然 · 菜单栏图标折叠与诊断",
    tags: ["macOS", "AppKit Hook", "Menu Bar", "8MB RAM"],
    description:
      "随着常驻软件增多，MacBook 刘海屏两侧图标极易被截断遮挡。BarShelf 物理折叠不常用的菜单栏图标，并附带独立的屏幕空间诊断看板，直观可视化各进程图标的宽度占比，随时一键收拢或展开。",
    url: "https://github.com/bitterSmilezzz/BarShelf",
  },
  "haier-ac-mac": {
    title: "haier-ac-mac",
    subtitle: "抬头点一下，冷暖自知，何须找手机 · 菜单栏智能家居空调直控",
    tags: ["macOS", "SwiftUI", "Menu Bar", "Cloud Protocol"],
    description:
      "在电脑前写代码时，为了调 1 度空调何必翻找手机、解锁屏幕、打开臃肿 App。haier-ac-mac 常驻菜单栏极简微型温度控件，原生全局快捷键秒级切换温度、制冷/制热与风速模式，状态即时双向同步。",
    url: "https://github.com/bitterSmilezzz/haier-ac-mac",
  },
  "hotel-cast": {
    title: "hotel-cast",
    subtitle: "一行命令，打通酒店大屏的隔离隔阂 · 命令行自动化网络认证与投屏",
    tags: ["Command Line", "Python 3", "Networking", "DLNA / AirPlay"],
    description:
      "解决出差住酒店时电视网络认证繁琐、处于局域网隔离无法投屏的顽疾。通过终端命令行一键完成局域网设备握手与免密认证，自动建立高速投屏管道，无缝推送本地视频文件或实时镜像屏幕。",
    url: "https://github.com/bitterSmilezzz/hotel-cast",
  },
};

document.addEventListener("DOMContentLoaded", () => {
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

  const islandStates = {
    running: {
      agent: "Claude Code",
      task: "正在检索目录结构并构建依赖拓扑图",
      tokens: "4,280",
      badge: "RUNNING",
      badgeClass: "tag-running",
      showSubbar: false,
    },
    waiting: {
      agent: "Codex Runtime",
      task: "检测到高危指令，等待执行确认",
      tokens: "6,120",
      badge: "WAITING",
      badgeClass: "tag-waiting",
      showSubbar: true,
    },
    idle: {
      agent: "AgentIsland Daemon",
      task: "本机所有智能体会话已就绪 · 等待唤醒",
      tokens: "0",
      badge: "IDLE",
      badgeClass: "tag-idle",
      showSubbar: false,
    },
  };

  stageTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      stageTabs.forEach((t) => t.classList.remove("is-active"));
      tab.classList.add("is-active");

      const stateKey = tab.getAttribute("data-island-state");
      const config = islandStates[stateKey];
      if (!config) return;

      if (islandAgentText) islandAgentText.textContent = config.agent;
      if (islandTaskText) islandTaskText.textContent = config.task;
      if (islandTokenCount) islandTokenCount.textContent = config.tokens;
      if (islandStateBadge) {
        islandStateBadge.textContent = config.badge;
        islandStateBadge.className = `island-state-tag ${config.badgeClass}`;
      }
      if (islandActionSubbar) {
        islandActionSubbar.hidden = !config.showSubbar;
      }
    });
  });

  // 审批模拟按钮响应
  const btnApprove = document.getElementById("btn-demo-approve");
  const btnReject = document.getElementById("btn-demo-reject");
  if (btnApprove) {
    btnApprove.addEventListener("click", () => {
      btnApprove.textContent = "已批准 ✓";
      setTimeout(() => {
        const runningTab = document.querySelector('[data-island-state="running"]');
        if (runningTab) runningTab.click();
        btnApprove.textContent = "确认执行 ⏎";
      }, 600);
    });
  }
  if (btnReject) {
    btnReject.addEventListener("click", () => {
      btnReject.textContent = "已终止 ✕";
      setTimeout(() => {
        const idleTab = document.querySelector('[data-island-state="idle"]');
        if (idleTab) idleTab.click();
        btnReject.textContent = "拒绝";
      }, 600);
    });
  }

  // 3. 空调温度调节微交互 (haier-ac-mac)
  const acDegVal = document.getElementById("ac-deg-val");
  const btnTempDown = document.getElementById("btn-temp-down");
  const btnTempUp = document.getElementById("btn-temp-up");
  let currentTemp = 24;

  if (btnTempDown && acDegVal) {
    btnTempDown.addEventListener("click", () => {
      if (currentTemp > 16) {
        currentTemp--;
        acDegVal.textContent = String(currentTemp);
      }
    });
  }
  if (btnTempUp && acDegVal) {
    btnTempUp.addEventListener("click", () => {
      if (currentTemp < 30) {
        currentTemp++;
        acDegVal.textContent = String(currentTemp);
      }
    });
  }

  // 4. 菜单栏折叠/展开微交互 (BarShelf)
  const shelfToggleBtn = document.getElementById("btn-shelf-toggle");
  const shelfHiddenGroup = document.getElementById("shelf-hidden-group");
  if (shelfToggleBtn && shelfHiddenGroup) {
    shelfToggleBtn.addEventListener("click", () => {
      const isExpanded = shelfHiddenGroup.classList.toggle("is-expanded");
      shelfToggleBtn.textContent = isExpanded ? "收起图标" : "切换展开";
    });
  }

  // 5. 家族 Bento 分类筛选
  const filterTabs = document.querySelectorAll(".filter-tab");
  const projectCards = document.querySelectorAll("[data-project-grid] .spotlight-card");
  const emptyStateEl = document.querySelector(".empty-state");
  const filterStatusEl = document.getElementById("filter-status");

  filterTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
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

      if (emptyStateEl) {
        emptyStateEl.hidden = visibleCount > 0;
      }

      if (filterStatusEl) {
        const name = tab.querySelector("span")?.textContent || filter;
        filterStatusEl.textContent = `已筛选出 ${visibleCount} 个${name}项目`;
      }
    });
  });

  // 6. 项目详情语义弹窗 (<dialog>)
  const dialog = document.querySelector(".project-dialog");
  const dialogTitle = document.getElementById("dialog-title");
  const dialogSubtitle = document.getElementById("dialog-subtitle");
  const dialogDesc = document.getElementById("dialog-description");
  const dialogTags = document.getElementById("dialog-tags");
  const dialogLink = document.getElementById("dialog-link");
  const dialogPrivate = document.getElementById("dialog-private");
  const dialogCloseBtn = document.querySelector("[data-dialog-close]");

  function openProjectDialog(projectId) {
    const data = projectData[projectId];
    if (!data || !dialog) return;

    dialogTitle.textContent = data.title;
    dialogSubtitle.textContent = data.subtitle;
    dialogDesc.textContent = data.description;

    dialogTags.innerHTML = "";
    data.tags.forEach((tag) => {
      const span = document.createElement("span");
      span.className = "tech-tag";
      span.textContent = tag;
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

    if (typeof dialog.showModal === "function") {
      dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }
  }

  document.querySelectorAll("[data-open-project]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const pid = btn.getAttribute("data-open-project");
      openProjectDialog(pid);
    });
  });

  if (dialogCloseBtn && dialog) {
    dialogCloseBtn.addEventListener("click", () => {
      if (typeof dialog.close === "function") {
        dialog.close();
      } else {
        dialog.removeAttribute("open");
      }
    });
  }

  if (dialog) {
    dialog.addEventListener("click", (e) => {
      const rect = dialog.getBoundingClientRect();
      const inDialog =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;
      if (!inDialog) {
        if (typeof dialog.close === "function") {
          dialog.close();
        } else {
          dialog.removeAttribute("open");
        }
      }
    });
  }

  // 7. 深色 / 浅色模式切换
  const themeToggle = document.querySelector("[data-theme-toggle]");
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const root = document.documentElement;
      const current = root.getAttribute("data-theme") || "dark";
      const next = current === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      themeToggle.setAttribute("aria-pressed", next === "light" ? "true" : "false");

      try {
        localStorage.setItem("theme", next);
      } catch (e) {}

      const metaTheme = document.querySelector('meta[name="theme-color"]');
      if (metaTheme) {
        metaTheme.setAttribute("content", next === "light" ? "#f9fafb" : "#08090a");
      }
    });
  }

  // 8. 年份自动更新
  const yearEl = document.getElementById("current-year");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }
});
