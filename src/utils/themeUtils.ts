export function getSliderTrackColor(): string {
  return localStorage.getItem("theme") === "dark" ? "#374151" : "#e5e7eb";
}
