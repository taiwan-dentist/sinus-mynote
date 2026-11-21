const chapterMenu = document.querySelector("#chapter-nav");
const menuButton = document.querySelector(".menu-toggle");
const narrowScreen = window.matchMedia("(max-width: 44rem)");

function setMenu(open) {
  menuButton.hidden = !narrowScreen.matches;
  menuButton.setAttribute("aria-expanded", String(narrowScreen.matches && open));
  chapterMenu.hidden = narrowScreen.matches && !open;
}

menuButton.closest(".site-header").classList.add("nav-enabled");
setMenu(false);
menuButton.addEventListener("click", () => setMenu(chapterMenu.hidden));
narrowScreen.addEventListener("change", () => setMenu(false));
chapterMenu.addEventListener("click", (event) => {
  if (event.target.closest("a")) setMenu(false);
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && menuButton.getAttribute("aria-expanded") === "true") {
    setMenu(false);
    menuButton.focus();
  }
});

const viewer = document.querySelector("#figure-viewer");
const viewerImage = document.querySelector("#enlarged-figure");
const viewerTitle = document.querySelector("#figure-title");
const closeFigure = document.querySelector("#close-figure");
let activeFigure = null;

document.addEventListener("click", (event) => {
  const link = event.target.closest("a[data-zoom]");
  if (!link || !viewer.showModal || event.defaultPrevented ||
      event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

  const image = link.querySelector("img");
  event.preventDefault();
  activeFigure = link;
  viewerImage.alt = image.alt;
  viewerImage.src = link.href;
  viewerTitle.textContent = link.previousElementSibling.querySelector("span").textContent;
  viewer.showModal();
  closeFigure.focus();
});

closeFigure.addEventListener("click", () => viewer.close());
viewer.addEventListener("close", () => {
  viewerImage.removeAttribute("src");
  activeFigure?.focus({ preventScroll: true });
  activeFigure = null;
});

const referenceSection = document.querySelector("#references");
const referenceSearch = document.querySelector("#reference-search");
const query = document.querySelector("#paper-query");
const clearQuery = document.querySelector("#clear-query");
const status = document.querySelector("#search-status");
const noPapers = document.querySelector("#no-papers");

function normalize(text) {
  return text.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("zh-TW");
}

const paperGroups = [...referenceSection.querySelectorAll(".paper-group")].map((group) => ({
  element: group,
  jumpLink: referenceSection.querySelector(`.reference-jump a[href="#${group.id}"]`),
  papers: [...group.querySelectorAll(".paper")].map((paper) => ({
    element: paper,
    searchable: normalize(`${group.querySelector("h3").textContent} ${paper.textContent}`),
  })),
}));

function filterPapers() {
  const words = normalize(query.value).trim().split(/\s+/).filter(Boolean);
  let shown = 0;
  for (const group of paperGroups) {
    let groupCount = 0;
    for (const paper of group.papers) {
      const matches = words.every((word) => paper.searchable.includes(word));
      paper.element.hidden = !matches;
      if (matches) groupCount++;
    }
    group.element.hidden = groupCount === 0;
    group.jumpLink.hidden = groupCount === 0;
    shown += groupCount;
  }
  status.textContent = words.length ? `找到 ${shown} 篇文獻` : "60 篇課前文獻與 12 篇補充來源";
  noPapers.hidden = shown !== 0;
}

function revealCitedPaper() {
  const cited = document.getElementById(location.hash.slice(1));
  if (cited?.classList.contains("paper") && cited.hidden) {
    query.value = "";
    filterPapers();
    cited.scrollIntoView();
  }
}

referenceSearch.hidden = false;
query.addEventListener("input", filterPapers);
clearQuery.addEventListener("click", () => {
  query.value = "";
  filterPapers();
  query.focus();
});
window.addEventListener("hashchange", revealCitedPaper);
filterPapers();
revealCitedPaper();

window.addEventListener("beforeprint", () => {
  for (const image of document.querySelectorAll('main img[loading="lazy"]')) {
    image.loading = "eager";
  }
});

if (location.protocol === "http:" || location.protocol === "https:") {
  Promise.all([import("./motion.js"), import("./moments/moments.js")])
    .catch((error) => console.warn("頁面動效未載入", error));
}
