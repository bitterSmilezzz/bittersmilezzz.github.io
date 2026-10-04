/* ============================================================
   fangshoufanji · 个人项目与工具 · 交互与动效逻辑
   Linear / Apple 级微动效 · 光标发光跟随 · 物理数字递增 · View Transition
   ============================================================ */

const projectData = {
  "agent-island": {
    title: "AgentIsland",
    description:
      "macOS 灵动岛风格的本机 Agent 会话监控器。集中查看运行状态、正在执行的任务和待处理的确认，也能了解本地 Token 与成本。",
    tags: ["macOS", "Swift", "SwiftUI", "Agent tooling"],
    url: "https://github.com/bitterSmilezzz/AgentIsland",
  },
  knowflick: {
    title: "KnowFlick",
    description:
      "个人学习工作台，把每日阅读、复习安排和知识管理放进同一个跨端工作流中，打通高效自律闭环。",
    tags: ["macOS", "Android", "SwiftUI", "Kotlin"],
    url: "https://github.com/bitterSmilezzz/knowflick",
  },
  "mac-clean": {
    title: "MacClean",
    description:
      "用于整理 macOS 缓存、应用残留和重复文件的工具。扫描项展示清晰依据，清理全流程保留安全撤回路径。",
    tags: ["macOS", "SwiftUI", "System utility"],
    url: "https://github.com/bitterSmilezzz/MacClean",
  },
  "haier-ac-mac": {
    title: "haier-ac-mac",
    description:
      "用 SwiftUI 写的 macOS 原生应用，通过海尔智家云控制海尔和统帅空调。常驻菜单栏，一键调节温度、灯光、屏显与运行模式。",
    tags: ["macOS", "SwiftUI", "Menu bar", "Home"],
    url: "https://github.com/bitterSmilezzz/haier-ac-mac",
  },
};

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const stateLabels = { working: "在开发", completed: "已发布", offline: "未公开" };

/* ============================================================
   1. 物理数字平滑数上去 (countUp with WeakMap cancel)
   ============================================================ */
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

const COUNT_DURATION = (() => {
  const raw = getComputedStyle(document.documentElement).getPropertyValue("--dur-count").trim();
  const ms = Number.parseFloat(raw);
  return Number.isFinite(ms) && ms > 0 ? ms : 850;
})();

const activeCounters = new WeakMap();

function countUp(el, target, pad = 2) {
  if (!el) return;

  const previous = activeCounters.get(el);
  if (previous) previous();

  const settle = () => {
    el.textContent = String(target).padStart(pad, "0");
  };

  if (reduceMotion || document.hidden) {
    settle();
    return;
  }

  const from = Number.parseInt(el.textContent, 10);
  const start0 = Number.isFinite(from) ? from : 0;
  if (start0 === target) {
    settle();
    return;
  }

  const span = Math.abs(target - start0);
  const duration = span <= 2 ? COUNT_DURATION * 0.45 : COUNT_DURATION;
  const start = performance.now();
  let finished = false;

  const guard = setTimeout(() => {
    if (finished) return;
    finished = true;
    activeCounters.delete(el);
    settle();
  }, duration + 250);

  const cancel = () => {
    if (finished) return;
    finished = true;
    clearTimeout(guard);
    activeCounters.delete(el);
  };
  activeCounters.set(el, cancel);

  const step = (now) => {
    if (finished) return;
    const t = Math.min(1, (now - start) / duration);
    el.textContent = String(Math.round(start0 + (target - start0) * easeOutCubic(t))).padStart(pad, "0");
    if (t < 1) {
      requestAnimationFrame(step);
    } else {
      finished = true;
      clearTimeout(guard);
      activeCounters.delete(el);
      settle();
    }
  };
  requestAnimationFrame(step);
}

/* ============================================================
   2. 主题切换 (Theme Wipe via View Transition API)
   ============================================================ */
const themeToggle = document.querySelector("[data-theme-toggle]");
const themeLabel = document.querySelector("[data-theme-label]");
const themeMeta = document.querySelector('meta[name="theme-color"]');
const THEME_UI_COLOR = { dark: "#08090d", light: "#f6f8fa" };

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  if (themeMeta) themeMeta.setAttribute("content", THEME_UI_COLOR[theme] ?? THEME_UI_COLOR.dark);
}

if (themeToggle) {
  const syncLabel = () => {
    const isDark = document.documentElement.getAttribute("data-theme") !== "light";
    if (themeLabel) themeLabel.textContent = isDark ? "深色" : "浅色";
    themeToggle.setAttribute("aria-pressed", String(!isDark));
  };

  themeToggle.addEventListener("click", () => {
    const next = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";

    const commit = () => {
      applyTheme(next);
      try {
        localStorage.setItem("theme", next);
      } catch (e) {}
      syncLabel();
    };

    const startWipe = () => {
      const rect = themeToggle.getBoundingClientRect();
      const root = document.documentElement;
      root.style.setProperty("--wipe-x", `${rect.left + rect.width / 2}px`);
      root.style.setProperty("--wipe-y", `${rect.top + rect.height / 2}px`);
    };

    const canWipe = typeof document.startViewTransition === "function" && !reduceMotion;
    if (!canWipe) {
      commit();
      return;
    }

    startWipe();
    const transition = document.startViewTransition(commit);
    transition.finished.finally(() => {
      document.documentElement.style.removeProperty("--wipe-x");
      document.documentElement.style.removeProperty("--wipe-y");
    });
  });

  syncLabel();
}

/* ============================================================
   3. 终端状态胶囊时钟 (Dev Status Terminal Clock)
   ============================================================ */
const logClock = document.querySelector("[data-log-clock]");
if (logClock) {
  let clockTimer = null;
  const tick = () => {
    logClock.textContent = new Date().toLocaleTimeString("zh-CN", { hour12: false });
  };
  const start = () => {
    if (clockTimer) return;
    tick();
    clockTimer = setInterval(tick, 1000);
  };
  const stop = () => {
    if (!clockTimer) return;
    clearInterval(clockTimer);
    clockTimer = null;
  };

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(
      ([entry]) => (entry.isIntersecting && !document.hidden ? start() : stop()),
      { threshold: 0 },
    ).observe(logClock);
  } else {
    start();
  }

  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
}

/* ============================================================
   4. 导航当前项高亮 (Nav Current Location Observer)
   ============================================================ */
const navLinks = [...document.querySelectorAll('.nav a[href^="#"]')];
if ("IntersectionObserver" in window && navLinks.length > 0) {
  const navSections = navLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  const sectionRatios = new Map();
  const setCurrent = (id) => {
    navLinks.forEach((link) => {
      if (id && link.hash === `#${id}`) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  };

  const navObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        sectionRatios.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0);
      });

      let best = null;
      sectionRatios.forEach((ratio, id) => {
        if (ratio > 0 && (!best || ratio > best.ratio)) best = { id, ratio };
      });
      setCurrent(best ? best.id : null);
    },
    { rootMargin: "-20% 0px -60% 0px", threshold: [0, 0.1, 0.25, 0.5] },
  );

  navSections.forEach((section) => navObserver.observe(section));
}

/* ============================================================
   5. 视口滚动淡入 (Scroll Reveal Animation)
   ============================================================ */
const revealTargets = [...document.querySelectorAll("[data-reveal]")];
if (revealTargets.length > 0) {
  const nearViewport = window.innerHeight * 1.3;
  revealTargets.forEach((el) => {
    if (el.getBoundingClientRect().top < nearViewport) el.classList.add("is-in");
  });

  if (!reduceMotion && "IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          revealObserver.unobserve(entry.target);
        });
      },
      { rootMargin: "160px 0px", threshold: 0.05 },
    );

    revealTargets.forEach((el) => {
      if (!el.classList.contains("is-in")) revealObserver.observe(el);
    });
  } else {
    revealTargets.forEach((el) => el.classList.add("is-in"));
  }
}

/* ============================================================
   6. 光标微发光跟随 (Spotlight Hover Tracking)
   ============================================================ */
if (!reduceMotion) {
  const spotlightTargets = document.querySelectorAll(
    ".bento-shell, .dev-card-shell, .philo-shell, .repo-shell, .contact-shell"
  );

  spotlightTargets.forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty("--mouse-x", `${x}px`);
      card.style.setProperty("--mouse-y", `${y}px`);
    });
  });
}

/* ============================================================
   7. 项目分类筛选与读数更新 (Project Filtering & Count Sync)
   ============================================================ */
const projCards = [...document.querySelectorAll(".proj-card")];
const filterButtons = [...document.querySelectorAll(".chip")];
const emptyState = document.querySelector(".empty");
const filterStatus = document.querySelector("#filter-status");
const readoutNum = document.querySelector(".readout [data-count]");
const readoutDetail = document.querySelector("[data-readout-detail]");

const filterLabels = {
  all: "全部",
  system: "系统工具",
  learning: "学习工具",
  command: "命令行",
};

const formatCount = (n) => String(n).padStart(2, "0");

function visibleCards() {
  return projCards.filter((card) => !card.classList.contains("is-hidden"));
}

function updateProjectCounts(animate) {
  const counts = { all: projCards.length };
  projCards.forEach((card) => {
    counts[card.dataset.category] = (counts[card.dataset.category] ?? 0) + 1;
  });

  // 更新各分类芯片数量
  document.querySelectorAll(".chip [data-count]").forEach((counter) => {
    const key = counter.dataset.count;
    counter.textContent = formatCount(counts[key] ?? 0);
  });

  // 处理空分类状态
  filterButtons.forEach((btn) => {
    const key = btn.dataset.filter;
    const isEmpty = key !== "all" && (counts[key] ?? 0) === 0;
    btn.classList.toggle("is-empty", isEmpty);
    btn.setAttribute("aria-disabled", String(isEmpty));
  });

  // 更新状态统计 (如在开发数量)
  const states = { working: 0, completed: 0, offline: 0 };
  projCards.forEach((card) => {
    states[card.dataset.state] = (states[card.dataset.state] ?? 0) + 1;
  });

  Object.entries(states).forEach(([key, val]) => {
    const el = document.querySelector(`[data-count-state="${key}"]`);
    if (el) {
      if (animate) countUp(el, val, 1);
      else el.textContent = String(val);
    }
  });

  const visibleCount = visibleCards().length;
  if (animate) countUp(readoutNum, visibleCount, 2);
  else if (readoutNum) readoutNum.textContent = formatCount(visibleCount);

  if (readoutDetail) {
    const workingCount = visibleCards().filter((c) => c.dataset.state === "working").length;
    readoutDetail.textContent = `${workingCount} 个在开发`;
  }
}

filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    if (btn.getAttribute("aria-disabled") === "true") return;

    const selected = btn.dataset.filter;

    filterButtons.forEach((item) => {
      const active = item === btn;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-pressed", String(active));
    });

    projCards.forEach((card) => {
      const isVisible = selected === "all" || card.dataset.category === selected;
      card.classList.toggle("is-hidden", !isVisible);
    });

    const count = visibleCards().length;
    if (emptyState) emptyState.hidden = count !== 0;
    if (filterStatus) {
      filterStatus.textContent = `已筛选到${filterLabels[selected]}，共 ${count} 个项目`;
    }
    updateProjectCounts(true);
  });
});

/* ============================================================
   8. 项目详情弹窗 (Accessible Project Dialog)
   ============================================================ */
const dialog = document.querySelector(".project-dialog");
const dialogTitle = document.querySelector("#dialog-title");
const dialogDescription = document.querySelector("#dialog-description");
const dialogTags = document.querySelector("#dialog-tags");
const dialogLink = document.querySelector("#dialog-link");
const dialogPrivate = document.querySelector("#dialog-private");

function openProjectModal(id) {
  const project = projectData[id];
  if (!project || !dialog) return;

  dialogTitle.textContent = project.title;
  dialogDescription.textContent = project.description;
  dialogTags.replaceChildren(
    ...project.tags.map((tag) => {
      const span = document.createElement("span");
      span.textContent = tag;
      return span;
    })
  );

  const hasUrl = Boolean(project.url);
  dialogLink.hidden = !hasUrl;
  dialogLink.href = project.url || "#";
  dialogPrivate.hidden = hasUrl;

  dialog.showModal();
}

// 容器事件委托打开弹窗
const projContainer = document.querySelector("[data-proj]");
if (projContainer) {
  projContainer.addEventListener("click", (e) => {
    const cta = e.target.closest(".proj-cta");
    if (!cta) return;
    const card = cta.closest(".proj-card");
    if (card && card.dataset.project) {
      openProjectModal(card.dataset.project);
    }
  });
}

const dialogCloseBtn = document.querySelector(".dialog-close");
if (dialogCloseBtn && dialog) {
  dialogCloseBtn.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) dialog.close();
  });
}

/* ============================================================
   9. 首屏规格条静态计数 & 年份初始化
   ============================================================ */
document.querySelectorAll("[data-count-to]").forEach((el) => {
  countUp(el, Number(el.dataset.countTo), Number(el.dataset.pad ?? 2));
});

const currentYearEl = document.querySelector("#current-year");
if (currentYearEl) {
  currentYearEl.textContent = String(new Date().getFullYear());
}

updateProjectCounts(true);
if (filterStatus) {
  filterStatus.textContent = `当前显示全部 ${projCards.length} 个项目`;
}
