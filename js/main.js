import { loadJSON } from "./core/loader.js";
import { loadState, saveState, ensureDefaults, getMode } from "./core/storage.js";

import { initIndexPage } from "./pages/indexPage.js";
import { initQuizPage } from "./pages/quizPage.js";
import { initResultPage } from "./pages/resultPage.js";

import { buildTestFromBank } from "./features/questionEngine.js";

import { auditQuestionBank, printAuditReport } from "./core/bankAudit.js";
import { trackPageView } from "./core/analytics.js";

const MODE_TARGET = {
  quick: 40,
  pro: 120,
};

async function loadBank() {
  // 元信息（dimensions/scale 等）
  const meta = await loadJSON("tests/bank/meta.json");

  // 四个维度池
  const [EI, SN, TF, JP] = await Promise.all([
    loadJSON("tests/bank/EI.json"),
    loadJSON("tests/bank/SN.json"),
    loadJSON("tests/bank/TF.json"),
    loadJSON("tests/bank/JP.json"),
  ]);

  const bankReport = auditQuestionBank({ EI, SN, TF, JP });
  printAuditReport(bankReport);

  // bank questions：全部合并成一个数组
  const questions = []
    .concat(EI?.questions || [])
    .concat(SN?.questions || [])
    .concat(TF?.questions || [])
    .concat(JP?.questions || []);

  return {
    meta,
    questions,
  };
}

export async function bootstrap() {
  // state 统一结构
  const state = ensureDefaults(loadState());
  saveState(state);

  // 结果文案（16类型）
  const TYPE_TEXT = await loadJSON("results/mbti_types.json");

  const path = (location.pathname || "").toLowerCase();

  // index 页：不加载题库（更快）
  if (path.endsWith("index.html") || path.endsWith("/")) {
    trackPageView("home");
    initIndexPage({ TYPE_TEXT });
    return;
  }

  // quiz/result：加载 bank，再按模式抽题组装 TEST
  const bank = await loadBank();

  const mode = getMode(state); // quick | pro
  const targetCount = MODE_TARGET[mode] || 40;

  // buildTestFromBank 会：必要时抽题并写回 state.selectedIds / state.order
  const TEST = buildTestFromBank({
    bankMeta: bank.meta,
    bankQuestions: bank.questions,
    state,
    targetCount,
  });



  // 把 state 保存（因为可能刚生成了 selectedIds/order）
  saveState(state);

  if (path.endsWith("quiz.html")) {
    trackPageView("quiz");
    initQuizPage({ TEST, TYPE_TEXT });
    return;
  }

  if (path.endsWith("result.html")) {
    trackPageView("result");
    initResultPage({ TEST, TYPE_TEXT });
    return;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  bootstrap().catch((err) => {
    console.error(err);
    alert("加载失败：请确认使用 Live Server 打开，并检查 tests/bank/*.json 路径是否正确。");
  });
});
