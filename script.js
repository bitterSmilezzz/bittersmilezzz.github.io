/* ============================================================
   fangshoufanji · 独立工坊与数字实体 · Awwwards SOTD 交互核心
   3D 灵动岛核心 · 磁吸流体光标 · Web Audio 纯代码合成微音效 · 交互沙盒
   ============================================================ */

const projectData = {
  "agent-island": {
    title: "AgentIsland",
    description:
      "macOS 灵动岛原生 Agent 会话状态与算力监控器。集中查看运行状态、正在执行的任务和待处理的确认，也能了解本地 Token 与成本。",
    tags: ["macOS Native", "Swift 6.0", "SwiftUI", "Agent Tooling", "Dynamic Notch"],
    url: "https://github.com/bitterSmilezzz/AgentIsland",
  },
  knowflick: {
    title: "KnowFlick",
    description:
      "个人学习工作台。将碎片阅读、艾宾浩斯复习安排和渐进式沉淀放进跨端闭环，打通桌面端与移动端的高效自律工作流。",
    tags: ["macOS", "Android", "SwiftUI", "Kotlin", "Knowledge Graph"],
    url: "https://github.com/bitterSmilezzz/knowflick",
  },
  "mac-clean": {
    title: "MacClean",
    description:
      "整理 macOS 缓存、应用残留与重复文件的轻量工具。扫描项展示清晰判断依据，清理全流程保留安全撤回路径。",
    tags: ["macOS", "SwiftUI", "System Utility", "Disk Engine"],
    url: "https://github.com/bitterSmilezzz/MacClean",
  },
  "haier-ac-mac": {
    title: "haier-ac-mac",
    description:
      "用 SwiftUI 打造的 macOS 菜单栏原生应用。通过海尔智家云控制海尔和统帅空调，常驻菜单栏，一键调节温度、灯光、屏显与运行模式。",
    tags: ["macOS", "SwiftUI", "Menu Bar", "IoT Cloud", "HomeKit Style"],
    url: "https://github.com/bitterSmilezzz/haier-ac-mac",
  },
};

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isTouchDevice = window.matchMedia("(hover: none) or (pointer: coarse)").matches;

/* ============================================================
   1. Web Audio 原生合成纯代码微音效 (Zero external files)
   ============================================================ */
class SoundUI {
  constructor() {
    this.ctx = null;
    this.enabled = false;
  }

  init() {
    if (!this.ctx && typeof window.AudioContext !== "undefined") {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
  }

  toggle() {
    this.init();
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    this.enabled = !this.enabled;
    return this.enabled;
  }

  // 细腻轻微点按声 (如 macOS Haptic Click)
  click() {
    if (!this.enabled || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(1400, t);
      osc.frequency.exponentialRampToValueAtTime(800, t + 0.025);

      gain.gain.setValueAtTime(0.04, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.025);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.03);
    } catch (e) {}
  }

  // 气泡展开/变形声 (Bubble Pop / Morph)
  morph() {
    if (!this.enabled || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(450, t);
      osc.frequency.exponentialRampToValueAtTime(950, t + 0.06);

      gain.gain.setValueAtTime(0.05, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.08);
    } catch (e) {}
  }

  // 任务完成和弦 (Harmonic Success)
  success() {
    if (!this.enabled || !this.ctx) return;
    try {
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5 和弦
      notes.forEach((freq, idx) => {
        const t = this.ctx.currentTime + idx * 0.04;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.035, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.2);
      });
    } catch (e) {}
  }

  // 扫描雷达高频微声 (Scan Sweep)
  scan() {
    if (!this.enabled || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(1800, t);
      osc.frequency.exponentialRampToValueAtTime(2400, t + 0.12);

      gain.gain.setValueAtTime(0.025, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.15);
    } catch (e) {}
  }
}

const soundUI = new SoundUI();
const soundToggle = document.querySelector("[data-sound-toggle]");
if (soundToggle) {
  soundToggle.addEventListener("click", () => {
    const isNowOn = soundUI.toggle();
    soundToggle.setAttribute("aria-pressed", String(isNowOn));
    if (isNowOn) soundUI.morph();
  });
}

/* ============================================================
   2. 交互式发丝坐标网格粒子画板 (Interactive Canvas Grid)
   ============================================================ */
const canvas = document.getElementById("bg-canvas");
if (canvas && !reduceMotion) {
  const ctx = canvas.getContext("2d");
  let width, height;
  let mouseX = -1000, mouseY = -1000;
  let animFrameId = null;

  const resize = () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  };
  window.addEventListener("resize", resize, { passive: true });
  resize();

  window.addEventListener(
    "pointermove",
    (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    },
    { passive: true }
  );

  const GRID_STEP = 54;

  const draw = () => {
    ctx.clearRect(0, 0, width, height);

    const isDark = document.documentElement.getAttribute("data-theme") !== "light";
    const baseColor = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.05)";
    const highlightColor = isDark ? "rgba(0, 242, 254, 0.45)" : "rgba(2, 132, 199, 0.4)";

    ctx.fillStyle = baseColor;

    for (let x = 0; x < width; x += GRID_STEP) {
      for (let y = 0; y < height; y += GRID_STEP) {
        const dx = x - mouseX;
        const dy = y - mouseY;
        const distSq = dx * dx + dy * dy;
        const radius = 160;

        if (distSq < radius * radius) {
          const dist = Math.sqrt(distSq);
          const factor = 1 - dist / radius;
          ctx.fillStyle = highlightColor;
          ctx.beginPath();
          ctx.arc(x, y, 1.2 + factor * 1.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = baseColor;
        } else {
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }

    animFrameId = requestAnimationFrame(draw);
  };

  animFrameId = requestAnimationFrame(draw);
}

/* ============================================================
   3. 定制磁吸流体变形光标 (Magnetic Morphing Cursor)
   ============================================================ */
const cursorDot = document.querySelector(".cursor-dot");
const cursorHalo = document.querySelector(".cursor-halo");
const cursorLabel = document.querySelector(".cursor-label");

if (cursorDot && cursorHalo && !isTouchDevice && !reduceMotion) {
  let mouse = { x: -100, y: -100 };
  let halo = { x: -100, y: -100 };

  window.addEventListener(
    "pointermove",
    (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      cursorDot.style.transform = `translate(${mouse.x}px, ${mouse.y}px)`;
    },
    { passive: true }
  );

  const loopCursor = () => {
    // 弹性插值跟随
    halo.x += (mouse.x - halo.x) * 0.16;
    halo.y += (mouse.y - halo.y) * 0.16;
    cursorHalo.style.transform = `translate(${halo.x}px, ${halo.y}px)`;
    requestAnimationFrame(loopCursor);
  };
  requestAnimationFrame(loopCursor);

  // 磁吸与操作文字提示探测
  document.addEventListener("mouseover", (e) => {
    const target = e.target.closest("[data-cursor]");
    if (target) {
      cursorHalo.classList.add("is-hover");
      const label = target.getAttribute("data-cursor") || "View";
      if (cursorLabel) cursorLabel.textContent = label;
      soundUI.click();
    } else {
      cursorHalo.classList.remove("is-hover");
    }
  });
}

/* ============================================================
   4. 首屏 3D 交互式灵动岛核心 (Living Island Core Engine)
   ============================================================ */
const islandModeTabs = [...document.querySelectorAll("[data-island-tab]")];
const islandViews = [...document.querySelectorAll("[data-island-view]")];
const btnIslandSimulate = document.querySelector("#btn-island-simulate");
const agentRuntimeStatus = document.querySelector("#agent-runtime-status");
const liveTokenPill = document.querySelector("#live-token-pill");
const islandPodium = document.querySelector(".island-podium");

if (islandModeTabs.length > 0) {
  islandModeTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const viewKey = tab.dataset.islandTab;

      islandModeTabs.forEach((t) => t.classList.toggle("is-active", t === tab));
      islandViews.forEach((v) => v.classList.toggle("is-active", v.dataset.islandView === viewKey));

      soundUI.morph();
    });
  });
}

// 模拟任务运行微动效
if (btnIslandSimulate) {
  let isSimulating = false;
  btnIslandSimulate.addEventListener("click", (e) => {
    e.stopPropagation();
    if (isSimulating) return;
    isSimulating = true;
    soundUI.morph();

    btnIslandSimulate.textContent = "执行中...";
    if (agentRuntimeStatus) agentRuntimeStatus.textContent = "Dispatched Claude Code tool call...";

    setTimeout(() => {
      if (agentRuntimeStatus) agentRuntimeStatus.textContent = "Synthesizing Swift Native UI components...";
      if (liveTokenPill) liveTokenPill.textContent = "8,940 tokens";
      soundUI.click();
    }, 800);

    setTimeout(() => {
      if (agentRuntimeStatus) agentRuntimeStatus.textContent = "Task completed in 1.4s ✓";
      if (liveTokenPill) liveTokenPill.textContent = "12,410 tokens";
      btnIslandSimulate.textContent = "完成 ✓";
      soundUI.success();

      setTimeout(() => {
        btnIslandSimulate.textContent = "模拟任务";
        if (agentRuntimeStatus) agentRuntimeStatus.textContent = "Analyzing codebase AST...";
        isSimulating = false;
      }, 2000);
    }, 1800);
  });
}

// 3D 陀螺仪透视倾斜
if (islandPodium && !reduceMotion && !isTouchDevice) {
  islandPodium.addEventListener("pointermove", (e) => {
    const rect = islandPodium.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const rotX = -(y / rect.height) * 12;
    const rotY = (x / rect.width) * 12;
    islandPodium.style.transform = `rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg)`;
  });

  islandPodium.addEventListener("pointerleave", () => {
    islandPodium.style.transform = "rotateX(0deg) rotateY(0deg)";
  });
}

/* ============================================================
   5. 四大项目专属深度可操作微沙盒 (Playable Sandboxes)
   ============================================================ */

// 【沙盒 1: AgentIsland】
const btnTestIsland = document.getElementById("btn-test-island");
const notchStatusTxt = document.getElementById("notch-status-txt");
const notchMetricVal = document.getElementById("notch-metric-val");
const notchPreview = document.getElementById("notch-preview");

if (btnTestIsland) {
  let isNotchRunning = false;
  btnTestIsland.addEventListener("click", () => {
    if (isNotchRunning) return;
    isNotchRunning = true;
    soundUI.morph();

    if (notchPreview) {
      notchPreview.style.borderColor = "var(--signal)";
      notchPreview.style.boxShadow = "0 0 20px rgba(0, 242, 254, 0.4)";
    }
    if (notchStatusTxt) notchStatusTxt.textContent = "Claude: 观测屏幕中...";
    if (notchMetricVal) notchMetricVal.textContent = "Active";

    setTimeout(() => {
      soundUI.click();
      if (notchStatusTxt) notchStatusTxt.textContent = "生成辅助功能输入流...";
      if (notchMetricVal) notchMetricVal.textContent = "18 ops/s";
    }, 900);

    setTimeout(() => {
      soundUI.success();
      if (notchStatusTxt) notchStatusTxt.textContent = "自动化任务已达成 ✓";
      if (notchMetricVal) notchMetricVal.textContent = "Done";

      setTimeout(() => {
        if (notchPreview) {
          notchPreview.style.borderColor = "";
          notchPreview.style.boxShadow = "";
        }
        if (notchStatusTxt) notchStatusTxt.textContent = "Agent 就绪 (Idle)";
        if (notchMetricVal) notchMetricVal.textContent = "Ready";
        isNotchRunning = false;
      }, 2200);
    }, 2000);
  });
}

// 【沙盒 2: KnowFlick 打卡复习】
const btnCheckinKf = document.getElementById("btn-checkin-kf");
const kfFillBar = document.getElementById("kf-fill-bar");
const kfBadgeRate = document.getElementById("kf-badge-rate");
const kfStatTxt = document.getElementById("kf-stat-txt");

if (btnCheckinKf) {
  let isCompleted = false;
  btnCheckinKf.addEventListener("click", () => {
    soundUI.success();
    isCompleted = !isCompleted;
    if (isCompleted) {
      if (kfFillBar) kfFillBar.style.width = "100%";
      if (kfBadgeRate) kfBadgeRate.textContent = "100% 已达标 🎉";
      if (kfStatTxt) kfStatTxt.textContent = "全部 24 个记忆点已全部巩固";
      btnCheckinKf.textContent = "已完成 ✓";
      btnCheckinKf.style.borderColor = "var(--state-completed)";
      btnCheckinKf.style.color = "var(--state-completed)";
    } else {
      if (kfFillBar) kfFillBar.style.width = "85%";
      if (kfBadgeRate) kfBadgeRate.textContent = "85% 已完成";
      if (kfStatTxt) kfStatTxt.textContent = "待复习: 3 个要点";
      btnCheckinKf.textContent = "打卡完成 ✓";
      btnCheckinKf.style.borderColor = "";
      btnCheckinKf.style.color = "";
    }
  });
}

// 【沙盒 3: MacClean 扫描与清理】
const btnScanMc = document.getElementById("btn-scan-mc");
const cleanMetaTxt = document.getElementById("clean-meta-txt");
const storageBarMc = document.getElementById("storage-bar-mc");

if (btnScanMc) {
  let isCleaned = false;
  btnScanMc.addEventListener("click", () => {
    if (isCleaned) return;
    isCleaned = true;
    soundUI.scan();

    btnScanMc.textContent = "分析中...";
    if (cleanMetaTxt) cleanMetaTxt.textContent = "正在校验缓存安全校验和...";

    setTimeout(() => {
      soundUI.success();
      if (storageBarMc) {
        storageBarMc.innerHTML = '<div class="seg" style="width: 100%; background: #10b981;"></div>';
      }
      if (cleanMetaTxt) cleanMetaTxt.textContent = "已释放 18.4 GB · 性能已达最佳 ⚡";
      btnScanMc.textContent = "已极致精简 ✓";
      btnScanMc.style.borderColor = "var(--state-completed)";
      btnScanMc.style.color = "var(--state-completed)";
    }, 1200);
  });
}

// 【沙盒 4: haier-ac-mac 菜单栏温控表盘】
const btnAcDown = document.getElementById("btn-ac-down");
const btnAcUp = document.getElementById("btn-ac-up");
const acTempVal = document.getElementById("ac-temp-val");
const acModeBtns = [...document.querySelectorAll("[data-ac-mode]")];

let currentAcTemp = 24;

if (btnAcDown && btnAcUp && acTempVal) {
  btnAcDown.addEventListener("click", () => {
    if (currentAcTemp > 16) {
      currentAcTemp -= 1;
      acTempVal.textContent = currentAcTemp;
      soundUI.click();
    }
  });

  btnAcUp.addEventListener("click", () => {
    if (currentAcTemp < 30) {
      currentAcTemp += 1;
      acTempVal.textContent = currentAcTemp;
      soundUI.click();
    }
  });
}

if (acModeBtns.length > 0) {
  acModeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      acModeBtns.forEach((b) => b.classList.toggle("is-active", b === btn));
      soundUI.morph();

      const mode = btn.dataset.acMode;
      if (acTempVal) {
        if (mode === "cool") acTempVal.style.color = "#00f2fe";
        else if (mode === "heat") acTempVal.style.color = "#f59e0b";
        else acTempVal.style.color = "#a855f7";
      }
    });
  });
}

/* ============================================================
   6. 数字平滑数上去 (countUp with WeakMap cancel)
   ============================================================ */
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const COUNT_DURATION = 850;
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
   7. 项目分类筛选与读数更新 (Project Filtering & Count Sync)
   ============================================================ */
const projCards = [...document.querySelectorAll(".proj-card")];
const filterButtons = [...document.querySelectorAll(".chip")];
const emptyState = document.querySelector(".empty");
const filterStatus = document.querySelector("#filter-status");
const readoutNum = document.querySelector(".readout [data-count]");
const readoutDetail = document.querySelector("[data-readout-detail]");

const filterLabels = {
  all: "全部作品",
  system: "系统工具",
  learning: "学习平台",
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

    soundUI.click();
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
   8. 项目详情弹窗 (Accessible Project Modal)
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

  soundUI.morph();
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
  dialogCloseBtn.addEventListener("click", () => {
    soundUI.click();
    dialog.close();
  });
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) {
      soundUI.click();
      dialog.close();
    }
  });
}

/* ============================================================
   9. 主题切换 (Theme Wipe via View Transition API)
   ============================================================ */
const themeToggle = document.querySelector("[data-theme-toggle]");
const themeMeta = document.querySelector('meta[name="theme-color"]');
const THEME_UI_COLOR = { dark: "#06070a", light: "#f4f6fa" };

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  if (themeMeta) themeMeta.setAttribute("content", THEME_UI_COLOR[theme] ?? THEME_UI_COLOR.dark);
}

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    soundUI.morph();
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
   10. 导航当前项高亮 & 视口滚动淡入 (Scroll & Nav Observers)
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

// 滚动淡入
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
      { rootMargin: "140px 0px", threshold: 0.05 }
    );
    revealTargets.forEach((el) => {
      if (!el.classList.contains("is-in")) revealObserver.observe(el);
    });
  } else {
    revealTargets.forEach((el) => el.classList.add("is-in"));
  }
}

/* ============================================================
   11. 首屏指标静态计数 & 年份初始化
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
  filterStatus.textContent = `当前显示全部 ${projCards.length} 个作品`;
}
