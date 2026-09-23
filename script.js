const projectData = {
  "agent-island": {
    title: "AgentIsland",
    description:
      "macOS 灵动岛风格的本机 Agent 会话监控器。集中查看运行状态、正在执行的任务和待处理的确认，也能了解本地 Token 与成本。",
    tags: ["macOS", "Swift", "Agent tooling"],
    url: "https://github.com/bitterSmilezzz/AgentIsland",
  },
  knowflick: {
    title: "KnowFlick",
    description:
      "个人学习工作台，把每日阅读、复习安排和知识管理放进同一个 macOS 应用，并继续完善 Android 版本。",
    tags: ["macOS", "Android", "SwiftUI", "Kotlin"],
    url: "https://github.com/bitterSmilezzz/knowflick",
  },
  "mac-clean": {
    title: "MacClean",
    description:
      "用于整理 macOS 缓存、应用残留和重复文件的工具。扫描项会说明判断依据，清理也尽量保留撤回路径。",
    tags: ["macOS", "SwiftUI", "System utility"],
    url: "https://github.com/bitterSmilezzz/MacClean",
  },
  barshelf: {
    title: "BarShelf",
    description:
      "macOS 菜单栏图标管理器，可以折叠不常用的图标，并查看菜单栏占用情况。当前没有公开的项目页。",
    tags: ["macOS", "Swift", "Menu bar"],
    url: "",
  },
  "hotel-cast": {
    title: "hotel-cast",
    description:
      "面向酒店电视的命令行投屏工具：由 Mac 完成电视网络认证，然后推送本地媒体或实时屏幕镜像。当前没有确认到公开项目页。",
    tags: ["macOS", "CLI", "DLNA", "HLS"],
    url: "",
  },
};

const filterButtons = [...document.querySelectorAll(".filter")];
const projectCards = [...document.querySelectorAll(".project-card")];
const emptyState = document.querySelector(".empty-state");

const formatCount = (count) => String(count).padStart(2, "0");

function updateProjectCounts() {
  const counts = { all: projectCards.length };

  projectCards.forEach((card) => {
    const category = card.dataset.category;
    counts[category] = (counts[category] ?? 0) + 1;
  });

  document.querySelectorAll("[data-count]").forEach((counter) => {
    counter.textContent = formatCount(counts[counter.dataset.count] ?? 0);
  });

  document.querySelector("#project-count").textContent = formatCount(projectCards.length);
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const selectedFilter = button.dataset.filter;
    let visibleCount = 0;

    filterButtons.forEach((item) => {
      const active = item === button;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-pressed", String(active));
    });

    projectCards.forEach((card) => {
      const visible = selectedFilter === "all" || card.dataset.category === selectedFilter;
      card.classList.toggle("is-hidden", !visible);
      visibleCount += Number(visible);
    });

    emptyState.hidden = visibleCount !== 0;
  });
});

const dialog = document.querySelector(".project-dialog");
const dialogTitle = document.querySelector("#dialog-title");
const dialogDescription = document.querySelector("#dialog-description");
const dialogTags = document.querySelector("#dialog-tags");
const dialogLink = document.querySelector("#dialog-link");
const dialogPrivate = document.querySelector("#dialog-private");

function openProject(projectId) {
  const project = projectData[projectId];
  if (!project) return;

  dialogTitle.textContent = project.title;
  dialogDescription.textContent = project.description;
  dialogTags.replaceChildren(
    ...project.tags.map((tag) => {
      const element = document.createElement("span");
      element.textContent = tag;
      return element;
    }),
  );

  const hasPublicPage = Boolean(project.url);
  dialogLink.hidden = !hasPublicPage;
  dialogLink.href = project.url || "#";
  dialogPrivate.hidden = hasPublicPage;
  dialog.showModal();
}

document.querySelectorAll("[data-project]").forEach((card) => {
  const openers = card.querySelectorAll(".project-open, .project-arrow");
  openers.forEach((opener) => {
    opener.addEventListener("click", () => openProject(card.dataset.project));
  });
});

document.querySelector(".dialog-close").addEventListener("click", () => dialog.close());

dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});

document.querySelector("#current-year").textContent = String(new Date().getFullYear());
updateProjectCounts();
