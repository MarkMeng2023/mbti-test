export function auditQuestionBank({ EI, SN, TF, JP }) {
  const groups = { EI, SN, TF, JP };
  const expectedDims = ["EI", "SN", "TF", "JP"];

  const report = {
    totalQuestions: 0,
    dimensionCounts: {},
    reverseCounts: {},
    duplicateIds: [],
    invalidDimensions: [],
    missingFields: [],
    tooShortTexts: [],
    emptyTexts: [],
    summary: [],
  };

  const allQuestions = [];
  const idMap = new Map();

  for (const dim of expectedDims) {
    const file = groups[dim];
    const questions = file?.questions || [];

    report.dimensionCounts[dim] = questions.length;
    report.reverseCounts[dim] = {
      true: questions.filter((q) => q.reverse === true).length,
      false: questions.filter((q) => q.reverse === false).length,
    };

    for (const q of questions) {
      allQuestions.push(q);

      // 检查重复 id
      if (idMap.has(q.id)) {
        report.duplicateIds.push(q.id);
      } else {
        idMap.set(q.id, true);
      }

      // 检查字段完整性
      if (!q.id || !q.dimension || typeof q.text !== "string" || typeof q.reverse !== "boolean") {
        report.missingFields.push(q);
      }

      // 检查 dimension 是否正确
      if (q.dimension !== dim) {
        report.invalidDimensions.push({
          id: q.id,
          expected: dim,
          actual: q.dimension,
        });
      }

      // 检查空文本 / 太短
      const text = (q.text || "").trim();
      if (!text) {
        report.emptyTexts.push(q.id);
      } else if (text.length < 8) {
        report.tooShortTexts.push({
          id: q.id,
          text,
        });
      }
    }
  }

  report.totalQuestions = allQuestions.length;

  // 生成 summary
  for (const dim of expectedDims) {
    const count = report.dimensionCounts[dim];
    const rev = report.reverseCounts[dim];
    const reverseRatio = count ? (rev.true / count * 100).toFixed(1) : "0.0";

    report.summary.push(
      `${dim}: ${count}题，reverse=true ${rev.true}题，reverse=false ${rev.false}题，reverse占比 ${reverseRatio}%`
    );
  }

  return report;
}

export function printAuditReport(report) {
  console.group("📘 Question Bank Audit");
  console.log("总题数:", report.totalQuestions);

  console.group("维度统计");
  for (const line of report.summary) {
    console.log(line);
  }
  console.groupEnd();

  if (report.duplicateIds.length) {
    console.group("⚠️ 重复 ID");
    console.table(report.duplicateIds);
    console.groupEnd();
  } else {
    console.log("✅ 没有重复 ID");
  }

  if (report.invalidDimensions.length) {
    console.group("⚠️ dimension 不匹配");
    console.table(report.invalidDimensions);
    console.groupEnd();
  } else {
    console.log("✅ dimension 全部正确");
  }

  if (report.missingFields.length) {
    console.group("⚠️ 字段缺失");
    console.table(report.missingFields);
    console.groupEnd();
  } else {
    console.log("✅ 字段完整");
  }

  if (report.emptyTexts.length) {
    console.group("⚠️ 空题目");
    console.table(report.emptyTexts);
    console.groupEnd();
  } else {
    console.log("✅ 没有空题目");
  }

  if (report.tooShortTexts.length) {
    console.group("⚠️ 题目过短");
    console.table(report.tooShortTexts);
    console.groupEnd();
  } else {
    console.log("✅ 没有明显过短题目");
  }

  console.groupEnd();
}