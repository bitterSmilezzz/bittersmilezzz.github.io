/* ============================================================
   外观切换：浅色 / 深色 两个按钮
   ------------------------------------------------------------
   内部仍保留 auto 作为「用户从未手动选择」的隐式默认：
   - 首次访问（无 localStorage）：跟随系统偏好，兜底浅色
   - 系统外观变化：未手动选过时实时跟随
   - 一旦手动点选，即写入 localStorage，不再被系统覆盖
   - UI 只渲染两段：浅色 / 深色，不出现「跟随系统」

   灯泡动效沿用 slingshot-lamp 的三条手法：
   不对称速率、钨丝暖机抖动、光晕由暗到亮。
   ============================================================ */
(function () {
  "use strict";

  var STORAGE_KEY = "theme";
  var VALID = ["auto", "dark", "light"];

  var root = document.documentElement;
  var buttons = document.querySelectorAll("[data-theme-btn]");
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
    return VALID.indexOf(v) >= 0 ? v : "auto";
  }

  function resolve(mode) {
    return mode === "auto" ? systemTheme() : mode;
  }

  function animateBulb(turningOn) {
    if (!bulb) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    var dur = turningOn ? 340 : 520;

    bulb.animate(
      turningOn
        ? [
            { filter: "brightness(0.4)", offset: 0 },
            { filter: "brightness(1.55)", offset: 0.18 },
            { filter: "brightness(0.62)", offset: 0.34 },
            { filter: "brightness(1.35)", offset: 0.52 },
            { filter: "brightness(0.92)", offset: 0.72 },
            { filter: "brightness(1)", offset: 1 }
          ]
        : [
            { filter: "brightness(1)", offset: 0 },
            { filter: "brightness(1.2)", offset: 0.12 },
            { filter: "brightness(0.35)", offset: 1 }
          ],
      { duration: dur, easing: "ease-out", fill: "none" }
    );

    var glow = document.querySelector("[data-theme-glow]");
    if (glow) {
      glow.animate(
        turningOn
          ? [
              { opacity: 0, transform: "scale(0.4)" },
              { opacity: 0.9, transform: "scale(1.2)", offset: 0.4 },
              { opacity: 0.55, transform: "scale(1)" }
            ]
          : [
              { opacity: 0.55, transform: "scale(1)" },
              { opacity: 0, transform: "scale(0.4)" }
            ],
        { duration: dur, easing: "ease-out", fill: "none" }
      );
    }
  }

  function paintMeta(theme) {
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "light" ? "#f9fafb" : "#08090a");
  }

  function wipeTo(theme, origin) {
    if (
      !document.startViewTransition ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !origin
    ) {
      return false;
    }
    var x = origin.left + origin.width / 2;
    var y = origin.top + origin.height / 2;
    var endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    var t = document.startViewTransition(function () {
      root.setAttribute("data-theme", theme);
    });
    t.ready.then(function () {
      root.animate(
        {
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

  function syncUI(theme) {
    buttons.forEach(function (btn) {
      var on = btn.getAttribute("data-theme-btn") === theme;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  function apply(theme, opts) {
    root.setAttribute("data-theme", theme);
    syncUI(theme);
    if (!(opts && opts.silent)) animateBulb(theme === "light");
    paintMeta(theme);
  }

  function choose(theme, origin) {
    var wiped = wipeTo(theme, origin);
    if (!wiped) {
      apply(theme, { silent: false });
    } else {
      syncUI(theme);
      animateBulb(theme === "light");
      paintMeta(theme);
    }
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {}
  }

  function init() {
    var mode = storedMode();
    var theme = resolve(mode);
    apply(theme, { silent: true });

    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var next = btn.getAttribute("data-theme-btn");
        if (next === root.getAttribute("data-theme")) return;
        choose(next, btn.getBoundingClientRect());
      });
    });

    var onSys = function () {
      if (storedMode() !== "auto") return;
      var next = systemTheme();
      if (next !== root.getAttribute("data-theme")) apply(next, { silent: false });
    };
    if (mql.addEventListener) mql.addEventListener("change", onSys);
    else if (mql.addListener) mql.addListener(onSys);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.setSiteTheme = function (t) {
    if (t === "light" || t === "dark") choose(t, null);
  };
})();
