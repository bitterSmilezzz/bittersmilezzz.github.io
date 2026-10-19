/* ============================================================
   fangshoufanji · 个人作品集与工具
   核心交互逻辑：
   1. 探照灯光标追踪 (ui-research/creatives/01 Spotlight)
   2. 旗舰舞台 AgentIsland 多态交互 (任务态 / 待处理会话态 / 待机态)
   3. 空调微组件互动调节 (haier-ac-mac 温度步进)
   4. 家族 Bento 分类筛选
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
      if (islandCpuVal && config.cpu) islandCpuVal.textContent = config.cpu;
      if (islandLatencyVal && config.latency) islandLatencyVal.textContent = config.latency;
      if (hwLed) {
        hwLed.classList.toggle("led-waiting", config.led === "led-waiting");
        hwLed.classList.toggle("led-idle", config.led === "led-idle");
      }
      if (islandStateBadge) {
        islandStateBadge.textContent = config.badge;
        islandStateBadge.className = `island-state-tag ${config.badgeClass}`;
      }
      if (islandActionSubbar) {
        islandActionSubbar.hidden = !config.showSubbar;
      }
    });
  });

  // 会话入口模拟按钮响应：只读动作，不代批准（与仓库口径一致）
  const btnApprove = document.getElementById("btn-demo-primary");
  const btnReject = document.getElementById("btn-demo-secondary");
  if (btnApprove) {
    btnApprove.addEventListener("click", () => {
      btnApprove.textContent = "已打开会话 ✓";
      setTimeout(() => {
        const runningTab = document.querySelector('[data-island-state="running"]');
        if (runningTab) runningTab.click();
        btnApprove.textContent = "查看会话 ⏎";
      }, 600);
    });
  }
  if (btnReject) {
    btnReject.addEventListener("click", () => {
      btnReject.textContent = "已打开工具 ✓";
      setTimeout(() => {
        const idleTab = document.querySelector('[data-island-state="idle"]');
        if (idleTab) idleTab.click();
        btnReject.textContent = "打开工具";
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

  const setAcMode = (cooling) => {
    isCooling = cooling;
    if (acModeToggle) {
      acModeToggle.textContent = isCooling ? "制冷模式" : "制热模式";
      acModeToggle.classList.toggle("is-heat", !isCooling);
    }
  };

  if (acModeToggle) {
    // 可点语义由 JS 注入：无 JS 时它是纯文本，不该被读屏当成按钮、也不该被 Tab 聚焦
    acModeToggle.setAttribute("role", "button");
    acModeToggle.setAttribute("tabindex", "0");
    acModeToggle.setAttribute("aria-label", "切换空调冷暖模式");

    const toggleAcMode = () => setAcMode(!isCooling);
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
      // 温度 >= 26 自动感知切为制热模式，<= 25 自动感知切为制冷模式
      if (currentTemp >= 26 && isCooling) {
        setAcMode(false);
      } else if (currentTemp <= 25 && !isCooling) {
        setAcMode(true);
      }
    }
  };

  if (btnTempDown) {
    btnTempDown.addEventListener("click", () => handleTempStep(-1));
  }
  if (btnTempUp) {
    btnTempUp.addEventListener("click", () => handleTempStep(1));
  }

  // 4. 家族 Bento 分类筛选
  const filterTabs = document.querySelectorAll(".filter-tab");
  const projectCards = document.querySelectorAll("[data-project-grid] .spotlight-card");
  const emptyStateEl = document.querySelector(".empty-state");
  const filterStatusEl = document.getElementById("filter-status");

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

      if (emptyStateEl) {
        emptyStateEl.hidden = visibleCount > 0;
      }

      if (filterStatusEl) {
        const name = tab.querySelector("span")?.textContent || filter;
        filterStatusEl.textContent = `已筛选出 ${visibleCount} 个${name}项目`;
      }
    });
  });

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

  function openProjectDialog(projectId, triggerEl) {
    const data = projectData[projectId];
    if (!data || !dialog) return;

    lastDialogTrigger = triggerEl || document.activeElement;

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
    // Escape / 关闭键 / 背景点击 全部收敛到 close 事件，一处解锁并精确还原焦点
    dialog.addEventListener("close", () => {
      document.documentElement.classList.remove("is-dialog-open");
      if (lastDialogTrigger && typeof lastDialogTrigger.focus === "function") {
        try {
          lastDialogTrigger.focus();
        } catch (e) {}
      }
    });
  }

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

  // 6. 深色 / 浅色模式切换（写入收敛到单一来源 applyTheme）
  const themeToggle = document.querySelector("[data-theme-toggle]");
  const readSavedTheme = () => {
    try {
      const saved = localStorage.getItem("theme");
      return saved === "light" || saved === "dark" ? saved : null;
    } catch (e) {
      return null;
    }
  };

  const applyTheme = (next, options) => {
    const root = document.documentElement;
    root.setAttribute("data-theme", next);
    if (themeToggle) {
      themeToggle.setAttribute("aria-pressed", next === "light" ? "true" : "false");
    }
    if (options && options.persist) {
      try {
        localStorage.setItem("theme", next);
      } catch (e) {}
    }
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute("content", next === "light" ? "#f9fafb" : "#08090a");
    }
  };

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme") || "dark";
      const next = current === "dark" ? "light" : "dark";

      if (
        !document.startViewTransition ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        applyTheme(next, { persist: true });
        return;
      }

      const rect = themeToggle.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      );

      const transition = document.startViewTransition(() => {
        applyTheme(next, { persist: true });
      });

      transition.ready.then(() => {
        document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${endRadius}px at ${x}px ${y}px)`
            ]
          },
          {
            duration: 440,
            easing: "cubic-bezier(0.16, 1, 0.3, 1)",
            pseudoElement: "::view-transition-new(root)"
          }
        );
      });
    });
  }

  // 系统外观变化时跟随——但用户显式选过主题就不再打扰
  const schemeQuery = window.matchMedia("(prefers-color-scheme: light)");
  const onSchemeChange = (event) => {
    if (readSavedTheme()) return;
    applyTheme(event.matches ? "light" : "dark");
  };
  if (typeof schemeQuery.addEventListener === "function") {
    schemeQuery.addEventListener("change", onSchemeChange);
  } else if (typeof schemeQuery.addListener === "function") {
    schemeQuery.addListener(onSchemeChange);
  }

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
          if (top <= probe && top > bestTop) {
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

    const advanceProgress = () => {
      stepIndex = (stepIndex + 1) % steps.length;
      const s = steps[stepIndex];
      kfRate.textContent = `${s.rate}% 已完成`;
      kfFill.style.width = `${s.rate}%`;
      kfCards.textContent = s.cardsText;
      kfStreak.textContent = s.streakText;

      kfFill.classList.add("is-pulsing");
      setTimeout(() => kfFill.classList.remove("is-pulsing"), 300);
    };

    // 同上：可点语义只在 JS 可用时存在
    kfBox.setAttribute("role", "button");
    kfBox.setAttribute("tabindex", "0");
    kfBox.setAttribute("aria-label", "点击模拟完成今日卡片复习");

    kfBox.addEventListener("click", advanceProgress);
    kfBox.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        advanceProgress();
      }
    });
  }
});
