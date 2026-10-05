/* ============================================================
   fangshoufanji · 个人项目与工具
   核心交互逻辑：
   1. 探照灯光标追踪 (ui-research/creatives/01)
   2. 分类筛选与数字同步
   3. 微组件交互 (BarShelf 展开折叠等)
   4. 项目详情语义弹窗 (<dialog>)
   5. 深色 / 浅色模式切换
   ============================================================ */

const projectData = {
  "agent-island": {
    title: "AgentIsland",
    subtitle: "macOS 灵动岛风格的本机 Agent 会话监控与权限中心",
    tags: ["macOS Native", "Swift", "SwiftUI", "Agent Tooling"],
    description:
      "把本机各个智能体（Claude Code、Codex、DSH 等）的运行状态、正在执行的任务和权限确认集中放到屏幕顶部灵动岛。不用来回在终端窗口切来切去，看一眼屏幕顶部就知道它执行到哪一步了。支持点击展开卡片、快速审批危险操作以及查看 Token 消耗与内存指标。",
    url: "https://github.com/bitterSmilezzz/AgentIsland",
  },
  knowflick: {
    title: "KnowFlick",
    subtitle: "个人学习工作台与复习规划工具",
    tags: ["macOS", "Android", "SwiftUI", "Kotlin"],
    description:
      "把日常阅读、知识卡片与艾宾浩斯复习安排放进同一个工作台。电脑端深度归纳与管理阅读材料，移动端利用碎片化时间刷复习卡片，打通自律闭环。",
    url: "https://github.com/bitterSmilezzz/knowflick",
  },
  "mac-clean": {
    title: "MacClean",
    subtitle: "macOS 缓存与卸载残留清理工具",
    tags: ["macOS", "SwiftUI", "System Utility"],
    description:
      "整理开发和日常使用中堆积的应用缓存、卸载残留和重复文件。每一项都说明为什么能删、属于哪个软件残留，并保留安全撤回路径。",
    url: "https://github.com/bitterSmilezzz/MacClean",
  },
  barshelf: {
    title: "BarShelf",
    subtitle: "菜单栏图标折叠与空间诊断面板",
    tags: ["macOS", "AppKit", "Menu Bar"],
    description:
      "折叠不常用的菜单栏图标，让右上方不再臃肿。附带空间诊断面板，直观查看是哪个常驻软件在霸占刘海屏两侧的空间，随时一键收拢或展开。",
    url: "https://github.com/bitterSmilezzz/BarShelf",
  },
  "hotel-cast": {
    title: "hotel-cast",
    subtitle: "命令行酒店电视网络认证与流媒体推送",
    tags: ["Command Line", "Python", "Networking"],
    description:
      "解决出差住酒店时电视网络认证繁琐、无法投屏的痛点。通过终端命令行一键完成局域网设备握手与免密认证，支持推送本地视频或实时投屏至房间大屏。",
    url: "https://github.com/bitterSmilezzz/hotel-cast",
  },
};

document.addEventListener("DOMContentLoaded", () => {
  // 1. 探照灯光标追踪 (Spotlight Card Engine - ui-research/creatives/01)
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

  // 2. 分类筛选系统
  const filterTabs = document.querySelectorAll(".filter-tab");
  const projectCards = document.querySelectorAll("[data-project-grid] .spotlight-card");
  const counterEl = document.querySelector("[data-project-counter]");
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

      if (counterEl) {
        counterEl.textContent = String(visibleCount).padStart(2, "0");
      }

      if (emptyStateEl) {
        emptyStateEl.hidden = visibleCount > 0;
      }

      if (filterStatusEl) {
        const name = tab.querySelector("span")?.textContent || filter;
        filterStatusEl.textContent = `已筛选出 ${visibleCount} 个${name}项目`;
      }
    });
  });

  // 3. 微组件交互：BarShelf 展开折叠
  const shelfToggleBtn = document.getElementById("btn-shelf-toggle");
  const shelfHiddenGroup = document.getElementById("shelf-hidden-group");
  if (shelfToggleBtn && shelfHiddenGroup) {
    shelfToggleBtn.addEventListener("click", () => {
      const isExpanded = shelfHiddenGroup.classList.toggle("is-expanded");
      shelfToggleBtn.textContent = isExpanded ? "收起图标" : "切换展开";
    });
  }

  // 4. 项目详情弹窗 (<dialog>)
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

  // 5. 深色 / 浅色模式切换
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

  // 6. 年份自动更新
  const yearEl = document.getElementById("current-year");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }
});
