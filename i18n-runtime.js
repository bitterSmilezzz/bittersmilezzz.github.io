/* ============================================================
   运行时中英文切换器（双向）
   ------------------------------------------------------------
   源码里的文案中英混杂，所以两个方向都要处理：

   切英文：中文原文 -> 英文（I18N_EN）
   切中文：源码里的英文 -> 中文（I18N_ZH）
           中文原文保持不动

   还原策略：每次切换前先把「原始节点值」存进 WeakMap（只存第一次见到的值），
   之后所有写入都从原始值推导，避免来回切换后累积错乱。

   跳过 script/style/code/pre，代码示例永远原样。
   ============================================================ */
(function () {
  "use strict";

  var STORAGE_KEY = "lang";
  var SKIP_TAGS = { SCRIPT: 1, STYLE: 1, CODE: 1, PRE: 1, KBD: 1, SAMP: 1 };

  var textMemo = new WeakMap();   /* 文本节点 -> 源码原始字符串 */
  var htmlMemo = new WeakMap();   /* 富文本元素 -> 原始 innerHTML */
  var attrMemo = new WeakMap();   /* 元素 -> { attr: 原始值 } */

  function currentLang() {
    return document.documentElement.getAttribute("data-lang") === "en" ? "en" : "zh";
  }

  function norm(s) {
    return s.replace(/\s+/g, " ").trim();
  }

  function has(obj, k) {
    return obj && Object.prototype.hasOwnProperty.call(obj, k);
  }

  function textNodes(root) {
    var out = [];
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        var p = node.parentNode;
        if (!p || SKIP_TAGS[p.nodeName]) return NodeFilter.FILTER_REJECT;
        if (!norm(node.nodeValue)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var n;
    while ((n = walker.nextNode())) out.push(n);
    return out;
  }

  /* 记录首次见到的原始值 */
  function memo(node) {
    if (!textMemo.has(node)) textMemo.set(node, node.nodeValue);
    return textMemo.get(node);
  }

  /* 按原始值 + 目标语言算出应该显示的字符串 */
  function resolve(original, lang) {
    var key = norm(original);
    var dict = lang === "en" ? window.I18N_EN : window.I18N_ZH;
    if (!has(dict, key)) return original;
    /* 保留原节点的首尾空白，避免 inline 元素粘连或排版塌陷 */
    var lead = original.match(/^\s*/)[0];
    var trail = original.match(/\s*$/)[0];
    return lead + dict[key] + trail;
  }

  function applyText(lang) {
    textNodes(document.body).forEach(function (node) {
      var original = memo(node);
      node.nodeValue = resolve(original, lang);
    });
  }

  function applyRich(lang) {
    var dict = lang === "en" ? window.I18N_EN_HTML : window.I18N_ZH_HTML;
    document.querySelectorAll("[data-i18n-html]").forEach(function (el) {
      if (!htmlMemo.has(el)) htmlMemo.set(el, el.innerHTML);
      var key = el.getAttribute("data-i18n-html");
      if (has(dict, key)) el.innerHTML = dict[key];
      else el.innerHTML = htmlMemo.get(el);
    });
  }

  function applyAttr(lang) {
    var dict = lang === "en" ? window.I18N_EN_ATTR : window.I18N_ZH_ATTR;
    ["aria-label", "title", "alt"].forEach(function (attr) {
      document.querySelectorAll("[" + attr + "]").forEach(function (el) {
        var store = attrMemo.get(el) || {};
        if (!(attr in store)) store[attr] = el.getAttribute(attr);
        attrMemo.set(el, store);
        var original = store[attr];
        if (!original) return;
        el.setAttribute(attr, has(dict, norm(original)) ? dict[norm(original)] : original);
      });
    });

    document.querySelectorAll("[data-i18n-aria]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-aria");
      var textDict = lang === "en" ? window.I18N_EN : window.I18N_ZH;
      if (has(textDict, key)) {
        el.setAttribute("aria-label", textDict[key]);
      }
    });
  }

  function applyPage(lang) {
    var page = lang === "en"
      ? (document.documentElement.getAttribute("data-page") === "404"
        ? window.I18N_EN_404_PAGE : window.I18N_EN_PAGE)
      : null;
    if (!htmlMemo.has(document.head)) htmlMemo.set(document.head, document.title);
    document.title = page && page.title ? page.title : htmlMemo.get(document.head);

    var desc = document.querySelector('meta[name="description"]');
    if (desc) {
      if (!desc.hasAttribute("data-orig-desc")) {
        desc.setAttribute("data-orig-desc", desc.getAttribute("content"));
      }
      var orig = desc.getAttribute("data-orig-desc");
      desc.setAttribute("content", page && page.description ? page.description : orig);
    }
  }

  /* 弹窗内容是 JS 动态注入的，切换语言时要让它自己重绘 */
  function refreshOpenDialog() {
    var dlg = document.querySelector(".project-dialog");
    if (!dlg || !dlg.open) return;
    var id = dlg.getAttribute("data-project-id");
    if (id && typeof window.reopenProjectDialog === "function") {
      window.reopenProjectDialog(id);
    }
  }

  function render(lang) {
    applyText(lang);
    applyRich(lang);
    applyAttr(lang);
    applyPage(lang);
    document.documentElement.setAttribute("lang", lang === "en" ? "en" : "zh-CN");
    refreshOpenDialog();
  }

  function syncButtons(lang) {
    document.querySelectorAll("[data-lang-btn]").forEach(function (btn) {
      var on = btn.getAttribute("data-lang-btn") === lang;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  function setLang(lang) {
    var next = lang === "en" ? "en" : "zh";
    document.documentElement.setAttribute("data-lang", next);
    render(next);
    syncButtons(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch (e) {}
    /* 动态组件（灵动岛三态 / 空调模式 / 复习进度 / 筛选结果）
       的内容由脚本写入，不在 DOM 里，需要它们按新语言自行重绘。 */
    window.dispatchEvent(
      new CustomEvent("site:langchange", { detail: { lang: next } })
    );
  }

  /* 供脚本翻译「运行时才生成的字符串」。中文查 I18N_EN，英文查 I18N_ZH。 */
  window.tSiteText = function (text) {
    if (!text) return text;
    var dict = currentLang() === "en" ? window.I18N_EN : window.I18N_ZH;
    var key = norm(String(text));
    return has(dict, key) ? dict[key] : text;
  };

  function init() {
    var lang = currentLang();
    syncButtons(lang);
    /* 中文模式也要跑一遍：把源码里的英文换成中文 */
    render(lang);

    document.querySelectorAll("[data-lang-btn]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        setLang(btn.getAttribute("data-lang-btn"));
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.setSiteLanguage = setLang;
})();
