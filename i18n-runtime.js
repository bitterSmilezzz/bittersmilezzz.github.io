/* ============================================================
   运行时中英文切换器
   ------------------------------------------------------------
   中文原文是唯一事实源：
   - 切英文：遍历文本节点，用中文原文查 I18N_EN 替换
   - 切中文：从 WeakMap 还原原始节点内容（零副本、零漂移）
   - 富文本走 data-i18n-html，属性和 title 走 I18N_EN_ATTR
   跳过 script/style/code（代码示例必须保持原样）。
   ============================================================ */
(function () {
  "use strict";

  var STORAGE_KEY = "lang";
  var SKIP_TAGS = { SCRIPT: 1, STYLE: 1, CODE: 1, PRE: 1, KBD: 1, SAMP: 1 };

  /* 原文备忘：文本节点 -> 原始字符串；元素 -> 原始 innerHTML / 属性值 */
  var textMemo = new WeakMap();
  var htmlMemo = new WeakMap();
  var attrMemo = new WeakMap();

  function currentLang() {
    return document.documentElement.getAttribute("data-lang") === "en" ? "en" : "zh";
  }

  function norm(s) {
    return s.replace(/\s+/g, " ").trim();
  }

  /* ---------- 遍历所有可翻译文本节点 ---------- */
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

  function toEnglish() {
    var dict = window.I18N_EN || {};

    /* 1. 纯文本节点 */
    textNodes(document.body).forEach(function (node) {
      if (!textMemo.has(node)) textMemo.set(node, node.nodeValue);
      var original = textMemo.get(node);
      var key = norm(original);
      if (Object.prototype.hasOwnProperty.call(dict, key)) {
        /* 保留原节点的前后空白，避免排版塌陷 */
        var lead = original.match(/^\s*/)[0];
        var trail = original.match(/\s*$/)[0];
        node.nodeValue = lead + dict[key] + trail;
      }
    });

    /* 2. 富文本节点 */
    var htmlDict = window.I18N_EN_HTML || {};
    document.querySelectorAll("[data-i18n-html]").forEach(function (el) {
      if (!htmlMemo.has(el)) htmlMemo.set(el, el.innerHTML);
      var key = el.getAttribute("data-i18n-html");
      if (Object.prototype.hasOwnProperty.call(htmlDict, key)) {
        el.innerHTML = htmlDict[key];
      }
    });

    /* 3. 属性文案 */
    var attrDict = window.I18N_EN_ATTR || {};
    ["aria-label", "title", "alt"].forEach(function (attr) {
      document.querySelectorAll("[" + attr + "]").forEach(function (el) {
        var store = attrMemo.get(el) || {};
        if (!(attr in store)) store[attr] = el.getAttribute(attr);
        attrMemo.set(el, store);
        var original = store[attr];
        if (original && Object.prototype.hasOwnProperty.call(attrDict, norm(original))) {
          el.setAttribute(attr, attrDict[norm(original)]);
        }
      });
    });

    /* 4. 页面标题与描述 */
    var page = window.I18N_EN_PAGE || {};
    if (!htmlMemo.has(document.head)) htmlMemo.set(document.head, document.title);
    if (page.title) document.title = page.title;
    var desc = document.querySelector('meta[name="description"]');
    if (desc && page.description) {
      if (!desc.hasAttribute("data-orig-desc")) {
        desc.setAttribute("data-orig-desc", desc.getAttribute("content"));
      }
      desc.setAttribute("content", page.description);
    }

    document.documentElement.setAttribute("lang", "en");
  }

  function toChinese() {
    /* 文本节点：还原备忘的原文 */
    textNodes(document.body).forEach(function (node) {
      if (textMemo.has(node)) node.nodeValue = textMemo.get(node);
    });

    /* 富文本 */
    document.querySelectorAll("[data-i18n-html]").forEach(function (el) {
      if (htmlMemo.has(el)) el.innerHTML = htmlMemo.get(el);
    });

    /* 属性 */
    ["aria-label", "title", "alt"].forEach(function (attr) {
      document.querySelectorAll("[" + attr + "]").forEach(function (el) {
        var store = attrMemo.get(el);
        if (store && attr in store) el.setAttribute(attr, store[attr]);
      });
    });

    /* 标题与描述 */
    if (htmlMemo.has(document.head)) document.title = htmlMemo.get(document.head);
    var desc = document.querySelector('meta[name="description"]');
    if (desc && desc.hasAttribute("data-orig-desc")) {
      desc.setAttribute("content", desc.getAttribute("data-orig-desc"));
    }

    document.documentElement.setAttribute("lang", "zh-CN");
  }

  /* ---------- 应用语言（不落盘，供初始化调用） ---------- */
  function render(lang) {
    if (lang === "en") toEnglish();
    else toChinese();
  }

  /* ---------- 切换并持久化 ---------- */
  function setLang(lang) {
    var next = lang === "en" ? "en" : "zh";
    document.documentElement.setAttribute("data-lang", next);
    render(next);
    syncButtons(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch (e) {}
  }

  function syncButtons(lang) {
    document.querySelectorAll("[data-lang-btn]").forEach(function (btn) {
      var on = btn.getAttribute("data-lang-btn") === lang;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  /* ---------- 初始化 ---------- */
  function init() {
    var lang = currentLang();
    syncButtons(lang);
    if (lang === "en") render("en");

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

  /* 暴露给调试与外部调用 */
  window.setSiteLanguage = setLang;
})();
