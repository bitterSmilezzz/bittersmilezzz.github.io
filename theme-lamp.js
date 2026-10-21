/* ============================================================
   外观切换：单按钮一键切换 浅色 ⇄ 深色
   ------------------------------------------------------------
   默认值（经确认的口径）：
   - 首次访问（无 localStorage）：跟随系统偏好，兜底浅色
   - 系统外观变化：未手动选过时实时跟随
   - 一旦点击，写入 localStorage，此后固定为用户所选
   - UI 上只有一个灯泡按钮，点击即在浅/深之间切换

   灯泡动效沿用 slingshot-lamp 的手法：
   不对称速率、钨丝暖机抖动、光晕由暗到亮。
   ============================================================ */
(function () {
  "use strict";

  var STORAGE_KEY = "theme";
  var VALID = ["auto", "dark", "light"];

  var root = document.documentElement;
  var toggle = document.querySelector("[data-theme-toggle]");
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

  var bulbAnimation = null;
  var glowAnimation = null;
  var activeTransition = null;
  var selectedTheme = root.getAttribute("data-theme") || "light";

  function animateBulb(turningOn) {
    if (!bulb || !bulb.animate) return;
    if (bulbAnimation) bulbAnimation.cancel();
    if (glowAnimation) glowAnimation.cancel();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    /* 开灯与熄灯用同一时长：WAAPI 光晕与 CSS 玻璃渐变必须同拍，
       否则会出现「玻璃已灭、光晕还在收」的半拍脱节。 */
    var dur = 340;

    bulbAnimation = bulb.animate(
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
      glowAnimation = glow.animate(
        turningOn
          ? [
              { opacity: 0, transform: "translate(-50%, -50%) scale(0.4)" },
              { opacity: 0.9, transform: "translate(-50%, -50%) scale(1.2)", offset: 0.4 },
              { opacity: 0.55, transform: "translate(-50%, -50%) scale(1)" }
            ]
          : [
              { opacity: 0.55, transform: "translate(-50%, -50%) scale(1)" },
              { opacity: 0, transform: "translate(-50%, -50%) scale(0.4)" }
            ],
        { duration: dur, easing: "ease-out", fill: "none" }
      );
    }
  }

  function paintMeta(theme) {
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "light" ? "#f9fafb" : "#08090a");
  }

  function syncToggle(theme) {
    if (!toggle) return;
    toggle.setAttribute("aria-pressed", theme === "light" ? "true" : "false");
  }

  function apply(theme, opts) {
    root.setAttribute("data-theme", theme);
    syncToggle(theme);
    if (!(opts && opts.silent)) animateBulb(theme === "dark");
    paintMeta(theme);
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

    try {
      var t = document.startViewTransition(function () {
        root.setAttribute("data-theme", selectedTheme);
      });
      activeTransition = t;
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
      }).catch(function () {});
      if (t.finished) t.finished.then(function () {
        if (activeTransition === t) activeTransition = null;
      }, function () {
        if (activeTransition === t) activeTransition = null;
      });
    } catch (e) {
      root.setAttribute("data-theme", theme);
      return false;
    }
    return true;
  }

  function choose(theme, origin) {
    selectedTheme = theme;
    if (activeTransition) activeTransition.skipTransition();
    if (!wipeTo(theme, origin)) {
      apply(theme, { silent: false });
    } else {
      syncToggle(theme);
      animateBulb(theme === "dark");
      paintMeta(theme);
    }
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {}
  }

  function init() {
    var theme = resolve(storedMode());
    selectedTheme = theme;
    apply(theme, { silent: true });

    if (toggle) {
      toggle.addEventListener("click", function () {
        var cur = selectedTheme;
        choose(cur === "dark" ? "light" : "dark", toggle.getBoundingClientRect());
      });
    }

    var onSys = function () {
      if (storedMode() !== "auto") return;
      var next = systemTheme();
      if (next !== root.getAttribute("data-theme")) {
        selectedTheme = next;
        apply(next, { silent: false });
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

  window.setSiteTheme = function (t) {
    if (t === "light" || t === "dark") choose(t, null);
  };
})();
