/* ============================================================
   灯泡式主题切换（三态：跟随系统 / 深色 / 浅色）
   ------------------------------------------------------------
   手法取自 ui-research 的 slingshot-lamp 案例：
   1. 过渡速率不对称：亮起来快、暗下去慢（灯丝有余热）
   2. 点亮初期暖机抖动：目标亮度随机跳变，模拟钨丝预热
   3. 光用「挖」而不是「叠」：光锥从暗层里 destination-out 挖除

   这里用 CSS + Web Animations 实现，不引 canvas：
   灯泡元素负责图标态，覆盖层负责光锥擦除。
   ============================================================ */
(function () {
  "use strict";

  var STORAGE_KEY = "theme";
  var MODES = ["auto", "dark", "light"];

  var root = document.documentElement;
  var toggle = document.querySelector("[data-theme-toggle]");
  var label = document.querySelector("[data-theme-label]");
  var bulb = document.querySelector("[data-theme-bulb]");

  var mql = window.matchMedia("(prefers-color-scheme: light)");

  function systemTheme() {
    return mql.matches ? "light" : "dark";
  }

  function storedMode() {
    var v = null;
    try {
      v = localStorage.getItem(STORAGE_KEY);
    } catch (e) {}
    return MODES.indexOf(v) >= 0 ? v : "auto";
  }

  function resolve(mode) {
    return mode === "auto" ? systemTheme() : mode;
  }

  /* ---------- 灯泡本体的开合动画 ---------- */
  function animateBulb(turningOn) {
    if (!bulb) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    /* 不对称速率：点亮 34 / 熄灭 16（与 lamp.js 同比例） */
    var dur = turningOn ? 340 : 520;

    bulb.animate(
      turningOn
        ? [
            { filter: "brightness(0.35)", offset: 0 },
            /* 暖机抖动：目标亮度随机跳变三次 */
            { filter: "brightness(1.55)", offset: 0.18 },
            { filter: "brightness(0.62)", offset: 0.34 },
            { filter: "brightness(1.35)", offset: 0.52 },
            { filter: "brightness(0.92)", offset: 0.72 },
            { filter: "brightness(1)", offset: 1 }
          ]
        : [
            { filter: "brightness(1)", offset: 0 },
            { filter: "brightness(1.25)", offset: 0.12 },
            { filter: "brightness(0.3)", offset: 1 }
          ],
      { duration: dur, easing: "ease-out", fill: "none" }
    );

    /* 灯泡背后的光晕：点亮时先过冲再回落 */
    var glow = document.querySelector("[data-theme-glow]");
    if (glow) {
      glow.animate(
        turningOn
          ? [
              { opacity: 0, transform: "scale(0.4)" },
              { opacity: 0.85, transform: "scale(1.18)", offset: 0.4 },
              { opacity: 0.5, transform: "scale(1)" }
            ]
          : [
              { opacity: 0.5, transform: "scale(1)" },
              { opacity: 0, transform: "scale(0.4)" }
            ],
        { duration: dur, easing: "ease-out", fill: "none" }
      );
    }
  }

  /* ---------- 光锥挖除：从点击处扩散 ---------- */
  function wipeTo(nextTheme, origin) {
    if (
      !document.startViewTransition ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return false;
    }

    var r = origin || (toggle ? toggle.getBoundingClientRect() : null);
    if (!r) return false;
    var x = r.left + r.width / 2;
    var y = r.top + r.height / 2;
    var endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    var transition = document.startViewTransition(function () {
      root.setAttribute("data-theme", nextTheme);
    });

    transition.ready.then(function () {
      root.animate(
        {
          /* 光锥：先用较小的圆，再扩张；缓动前快后慢，像灯亮起来 */
          clipPath: [
            "circle(0px at " + x + "px " + y + "px)",
            "circle(" + endRadius + "px at " + x + "px " + y + "px)"
          ]
        },
        {
          duration: 480,
          easing: "cubic-bezier(0.16, 1, 0.3, 1)",
          pseudoElement: "::view-transition-new(root)"
        }
      );
    });

    return true;
  }

  /* ---------- 应用 ---------- */
  function apply(mode, opts) {
    var next = resolve(mode);
    var prev = root.getAttribute("data-theme") || systemTheme();
    var turningOn = next === "light";

    /* data-theme 是实际生效的外观，必须在这里落定；
       之前只在 cycle() 里设置，导致系统外观变化时主题不跟随。 */
    root.setAttribute("data-theme", next);
    root.setAttribute("data-theme-mode", mode);

    if (toggle) {
      toggle.setAttribute("aria-pressed", next === "light" ? "true" : "false");
      toggle.setAttribute("data-mode", mode);
    }
    if (label) {
      var dict = window.I18N_EN || {};
      var zhText = { auto: "跟随系统", dark: "深色", light: "浅色" }[mode] || "跟随系统";
      var enText = { auto: "System", dark: "Dark", light: "Light" }[mode] || "System";
      var isEn = root.getAttribute("data-lang") === "en";
      label.textContent = isEn ? enText : zhText;
      /* 记进备忘，切语言时由 i18n 覆盖 */
      label.setAttribute("data-theme-label-mode", mode);
    }
    toggle && toggle.setAttribute("title", label ? label.textContent : "");

    if (!(opts && opts.silent)) {
      animateBulb(turningOn);
    }

    if (opts && opts.persist) {
      try {
        localStorage.setItem(STORAGE_KEY, mode);
      } catch (e) {}
    }

    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", next === "light" ? "#f9fafb" : "#08090a");
  }

  function cycle() {
    var cur = root.getAttribute("data-theme-mode") || storedMode();
    var nextMode = MODES[(MODES.indexOf(cur) + 1) % MODES.length];
    var nextTheme = resolve(nextMode);

    if (!wipeTo(nextTheme, null)) {
      root.setAttribute("data-theme", nextTheme);
    }
    apply(nextMode, { persist: true, silent: false });
  }

  /* ---------- 初始化 ---------- */
  function init() {
    var mode = storedMode();
    /* 未显式设置时，head 脚本已按系统偏好铺好 data-theme，这里只补 mode 标记 */
    if (mode === "auto" && !root.getAttribute("data-theme")) {
      root.setAttribute("data-theme", systemTheme());
    }
    apply(mode, { silent: true });

    if (toggle) {
      toggle.addEventListener("click", cycle);
    }

    /* 跟随系统：系统外观变化时实时响应 */
    var onSys = function () {
      if ((root.getAttribute("data-theme-mode") || "auto") === "auto") {
        apply("auto", { silent: false });
      }
    };
    if (mql.addEventListener) mql.addEventListener("change", onSys);
    else if (mql.addListener) mql.addListener(onSys);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.cycleSiteTheme = cycle;
})();
