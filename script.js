/* ============================================================
   fangshoufanji · 个人项目与工具 · 核心交互
   去 AI 味 · 纯净利落 · 原生指针与语义交互
   ============================================================ */

const projectData = {
  "agent-island": {
    title: "AgentIsland",
    description:
      "把本机 Agent 的状态、正在执行的任务和权限确认放进灵动岛。不用来回切终端窗口，扫一眼屏幕顶部就知道它在干嘛，也能了解本地 Token 与成本。",
    tags: ["macOS Native", "Swift", "SwiftUI", "Agent Tooling"],
    url: "https://github.com/bitterSmilezzz/AgentIsland",
  },
  knowflick: {
    title: "KnowFlick",
    description:
      "自己的学习与复习工作台。把日常阅读、笔记和艾宾浩斯复习安排打通，支持跨端同步，打通自律闭环。",
    tags: ["macOS", "Android", "SwiftUI", "Kotlin"],
    url: "https://github.com/bitterSmilezzz/knowflick",
  },
  "mac-clean": {
    title: "MacClean",
    description:
      "用于清理开发与日常使用中堆积的缓存、卸载残留和重复文件。扫描项都有清楚的依据，清理流程保留安全撤回路径。",
    tags: ["macOS", "SwiftUI", "System utility"],
    url: "https://github.com/bitterSmilezzz/MacClean",
  },
  "haier-ac-mac": {
    title: "haier-ac-mac",
    description:
      "常驻 macOS 菜单栏的海尔智家空调控制器。在 Mac 上顺手调温度、切模式，不用每次找手机打开 App。",
    tags: ["macOS", "SwiftUI", "Menu bar", "Home"],
    url: "https://github.com/bitterSmilezzz/haier-ac-mac",
  },
};

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ============================================================
   1. 数字平滑数上去 (countUp with WeakMap cancel)
   ============================================================ */
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const COUNT_DURATION = 800;
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

  const start = performance.now();
  let finished = false;

  const guard = setTimeout(() => {
    if (finished) return;
    finished = true;
    activeCounters.delete(el);
    settle();
  }, COUNT_DURATION + 200);

  const cancel = () => {
    if (finished) return;
    finished = true;
    clearTimeout(guard);
    activeCounters.delete(el);
  };
  activeCounters.set(el, cancel);

  const step = (now) => {
    if (finished) return;
    const t = Math.min(1, (now - start) / COUNT_DURATION);
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
   2. 项目分类筛选与计数同步 (Project Filtering)
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

  document.querySelectorAll(".chip [data-count]").forEach((counter) => {
    const key = counter.dataset.count;
    counter.textContent = formatCount(counts[key] ?? 0);
  });

  filterButtons.forEach((btn) => {
    const key = btn.dataset.filter;
    const isEmpty = key !== "all" && (counts[key] ?? 0) === 0;
    btn.classList.toggle("is-empty", isEmpty);
    btn.setAttribute("aria-disabled", String(isEmpty));
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
   3. 项目详情弹窗 (Project Detail Modal)
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
   4. 主题切换 (Theme Wipe via View Transition API)
   ============================================================ */
const themeToggle = document.querySelector("[data-theme-toggle]");
const themeMeta = document.querySelector('meta[name="theme-color"]');
const THEME_UI_COLOR = { dark: "#0a0b0e", light: "#f8f9fb" };

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  if (themeMeta) themeMeta.setAttribute("content", THEME_UI_COLOR[theme] ?? THEME_UI_COLOR.dark);
}

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const next = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";

    const commit = () => {
      applyTheme(next);
      try {
        localStorage.setItem("theme", next);
      } catch (e) {}
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
}

/* ============================================================
   5. 导航高亮 (Nav Current Location Observer)
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
    { rootMargin: "-20% 0px -60% 0px", threshold: [0, 0.1, 0.25, 0.5] }
  );

  navSections.forEach((section) => navObserver.observe(section));
}

/* ============================================================
   6. 首屏指标静态计数 & 年份初始化
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
