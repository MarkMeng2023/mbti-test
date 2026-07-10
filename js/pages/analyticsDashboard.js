const funnelData = [
  ["访问首页", 2846],
  ["点击开始", 1328],
  ["完成 25%", 1164],
  ["完成 50%", 1042],
  ["完成 75%", 931],
  ["完成测试", 842],
  ["分享或复制", 391],
];

const popularPages = [
  ["首页", "2,846", "2,846", "44.5%"],
  ["测试页", "1,918", "1,328", "30.0%"],
  ["结果页", "1,024", "906", "16.0%"],
  ["人格详情页", "604", "512", "9.5%"],
];

const eventData = [
  ["快速版开始", "904"],
  ["专业版开始", "424"],
  ["快速版完成", "572"],
  ["专业版完成", "270"],
  ["正式结果生成", "842"],
  ["预览结果打开", "118"],
  ["生成分享图", "163"],
  ["复制结果", "286"],
  ["人格详情页打开", "604"],
];

function formatRate(value) {
  return `${Math.round(value * 10) / 10}%`;
}

function renderFunnel() {
  const list = document.getElementById("funnelList");
  const firstValue = funnelData[0][1];
  if (!list) return;

  list.innerHTML = funnelData
    .map(([label, value], index) => {
      const previousValue = index === 0 ? value : funnelData[index - 1][1];
      const stepRate = index === 0 ? 100 : (value / previousValue) * 100;
      const totalRate = (value / firstValue) * 100;
      const width = Math.max(8, totalRate);

      return `
        <div class="funnel-row">
          <div class="funnel-main">
            <span>${label}</span>
            <strong>${value.toLocaleString()}</strong>
          </div>
          <div class="funnel-track"><i style="width:${width}%"></i></div>
          <div class="funnel-rates">
            <span>上层 ${formatRate(stepRate)}</span>
            <span>整体 ${formatRate(totalRate)}</span>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderTable() {
  const body = document.getElementById("popularPages");
  if (!body) return;

  body.innerHTML = popularPages
    .map(
      ([name, pv, uv, ratio]) => `
        <tr>
          <td>${name}</td>
          <td>${pv}</td>
          <td>${uv}</td>
          <td>${ratio}</td>
        </tr>
      `
    )
    .join("");
}

function renderEvents() {
  const list = document.getElementById("eventList");
  if (!list) return;

  list.innerHTML = eventData
    .map(
      ([name, value]) => `
        <div>
          <span>${name}</span>
          <strong>${value}</strong>
        </div>
      `
    )
    .join("");
}

function bindFilters() {
  document.querySelectorAll(".segmented").forEach((group) => {
    group.addEventListener("click", (event) => {
      const button = event.target.closest("button");
      if (!button) return;

      group.querySelectorAll("button").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
    });
  });
}

function updateTime() {
  const target = document.getElementById("lastUpdated");
  if (!target) return;

  target.textContent = new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
}

renderFunnel();
renderTable();
renderEvents();
bindFilters();
updateTime();
