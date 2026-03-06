// js/core/loader.js

export async function loadJSON(path) {
  const res = await fetch(path, { cache: "no-store" });

  // 先拿到文本，方便给出更具体报错（404页面也能看到）
  const text = await res.text();

  if (!res.ok) {
    throw new Error(
      `HTTP ${res.status} (${res.statusText}) when loading: ${path}\n` +
      `Response head: ${text.slice(0, 160)}`
    );
  }

  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error(`Invalid JSON in: ${path}\n${e.message}\nHead: ${text.slice(0, 160)}`);
  }
}