const zodiacMap = {
  aries: "白羊",
  taurus: "金牛",
  gemini: "双子",
  cancer: "巨蟹",
  leo: "狮子",
  virgo: "处女",
  libra: "天秤",
  scorpio: "天蝎",
  sagittarius: "射手",
  capricorn: "摩羯",
  aquarius: "水瓶",
  pisces: "双鱼",
};

const ageBandMap = {
  u18: "18岁以下",
  "18_24": "18-24",
  "25_34": "25-34",
  "35_44": "35-44",
  "45_54": "45-54",
  "55p": "55+",
};

export function profileHint(profile) {
  const p = profile || {};
  const parts = [];

  if (p.gender) {
    parts.push(`性别：${p.gender === "male" ? "男" : p.gender === "female" ? "女" : "其他"}`);
  }

  if (p.ageBand) {
    parts.push(`年龄段：${ageBandMap[p.ageBand] || p.ageBand}`);
  }

  if (p.zodiac) {
    parts.push(`星座：${zodiacMap[p.zodiac] || p.zodiac}`);
  }

  if (p.blood) {
    parts.push(`血型：${p.blood}`);
  }

  return parts.length ? `（你的输入：${parts.join(" / ")}）` : "";
}

export function profileHintPlain(profile) {
  // 给分享图用：去掉括号，更像卡片文案
  return profileHint(profile).replace(/[（）]/g, "");
}