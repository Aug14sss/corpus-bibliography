(() => {
  "use strict";

  const dataElement = document.getElementById("bibliography-data");
  const resultCount = document.getElementById("result-count");
  const dataError = document.getElementById("data-error");
  let data;

  try {
    data = JSON.parse(dataElement.textContent);
    if (!data || !Array.isArray(data.records)) throw new Error("Invalid bibliography");
  } catch {
    resultCount.textContent = "书目暂未载入";
    dataError.hidden = false;
    return;
  }

  const records = data.records;
  const rows = document.getElementById("bibliography-rows");
  const printRows = document.getElementById("print-rows");
  const searchInput = document.getElementById("book-search");
  const clearButton = document.querySelector(".clear-search");
  const filterButtons = Array.from(document.querySelectorAll(".group-button"));
  const emptyState = document.getElementById("empty-state");
  const groupNames = {
    all: "全部语料",
    YAT: "青少年译本",
    ACT: "对应全译本",
    OCL: "原创儿童文学"
  };
  let selectedGroup = "all";

  const valueText = (value) => value == null ? "" : String(value);
  const normalize = (value) => valueText(value).normalize("NFKC").toLocaleLowerCase().trim();

  const searchableRecords = records.map((record) => ({
    record,
    search: normalize([
      record.id, record.title, record.englishTitle, record.author,
      record.translator, record.year, record.publisher, record.originalYear,
      record.sourceExtra, record.groupLabel
    ].map(valueText).join(" "))
  }));

  const setText = (id, value) => {
    if (value) document.getElementById(id).textContent = valueText(value);
  };

  setText("english-note", data.noteEnglishTitles);
  document.title = "语料书目";
  if (data.updatedAt) setText("updated-at", `更新于 ${valueText(data.updatedAt)}`);
  setText("print-summary", `全部语料 · 共 ${records.length} 部`);

  document.querySelectorAll("[data-count]").forEach((element) => {
    const group = element.dataset.count;
    element.textContent = String(group === "all" ? records.length : records.filter((record) => record.group === group).length);
  });

  const makeElement = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text != null) element.textContent = valueText(text);
    return element;
  };

  const makeTextCell = (value, className) => {
    const text = valueText(value);
    const cell = makeElement("td", className, text || "—");
    if (!text) cell.classList.add("missing-value");
    return cell;
  };

  const makeRow = (record) => {
    const row = document.createElement("tr");
    const numberCell = document.createElement("td");
    numberCell.append(makeElement("span", "record-number", record.id));

    const titleCell = document.createElement("td");
    titleCell.append(makeElement("p", "book-title", record.title));
    if (record.englishTitle) titleCell.append(makeElement("p", "english-title", record.englishTitle));
    if (record.originalYear || record.sourceExtra) {
      const detail = makeElement("p", "source-detail");
      if (record.originalYear) detail.append(makeElement("span", "", `原作初版 ${valueText(record.originalYear)}`));
      if (record.sourceExtra) detail.append(makeElement("span", "", valueText(record.sourceExtra)));
      titleCell.append(detail);
    }

    const yearCell = makeElement("td", "year-cell");
    const yearValue = makeElement("span", "year-value", record.year || "—");
    if (!record.year) yearValue.classList.add("missing-value");
    yearCell.append(yearValue);
    if (record.needsYearCheck) yearCell.append(makeElement("span", "year-check", "待核"));

    row.append(
      numberCell,
      titleCell,
      makeTextCell(record.author, "author-cell"),
      makeTextCell(record.translator, "translator-cell"),
      yearCell,
      makeTextCell(record.publisher, "publisher-cell"),
      makeTextCell(record.groupLabel || groupNames[record.group], "group-cell")
    );
    return row;
  };

  const render = () => {
    const query = normalize(searchInput.value);
    const terms = query.split(/\s+/).filter(Boolean);
    const filtered = searchableRecords.filter(({ record, search }) =>
      (selectedGroup === "all" || record.group === selectedGroup) &&
      terms.every((term) => search.includes(term))
    );
    const fragment = document.createDocumentFragment();
    filtered.forEach(({ record }) => fragment.append(makeRow(record)));
    rows.replaceChildren(fragment);
    emptyState.hidden = filtered.length !== 0;
    clearButton.hidden = searchInput.value.length === 0;
    const scope = selectedGroup === "all" ? "全部语料" : groupNames[selectedGroup];
    resultCount.textContent = `${scope} · 显示 ${filtered.length} / ${records.length} 部${query ? " · 检索结果" : ""}`;
    filterButtons.forEach((button) => {
      const active = button.dataset.group === selectedGroup;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  };

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      selectedGroup = button.dataset.group;
      render();
    });
  });
  searchInput.addEventListener("input", render);
  searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && searchInput.value) {
      event.preventDefault();
      searchInput.value = "";
      render();
    }
  });
  document.querySelector(".search-form").addEventListener("submit", (event) => event.preventDefault());
  clearButton.addEventListener("click", () => {
    searchInput.value = "";
    render();
    searchInput.focus();
  });
  document.querySelector(".reset-filters").addEventListener("click", () => {
    selectedGroup = "all";
    searchInput.value = "";
    render();
    searchInput.focus();
  });

  const printFragment = document.createDocumentFragment();
  records.forEach((record) => printFragment.append(makeRow(record)));
  printRows.append(printFragment);
  render();
})();
