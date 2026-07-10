import { trackPageView, trackPersonalityDetailOpened } from "../core/analytics.js";

function getTypeFromPath() {
  const fileName = (window.location.pathname || "").split("/").pop() || "";
  return fileName.replace(".html", "").toUpperCase();
}

trackPageView("personality_type");
trackPersonalityDetailOpened(getTypeFromPath());
