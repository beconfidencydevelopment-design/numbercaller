/**
 * Shared colour maths for the contrast checks.
 *
 * WCAG 2.1 relative luminance and contrast ratio, plus the small amount of
 * colour-space work needed to search for an accent that clears a threshold
 * without drifting off the brand hue.
 */

export function hexToRgb(hex) {
  const h = hex.replace("#", "").trim();
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
}

export const rgbToHex = (rgb) =>
  "#" + rgb.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");

const channel = (v) => {
  const s = v / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};

export function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map(channel);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

export const ratio = (a, b) => Math.round(contrast(a, b) * 100) / 100;

/* --- HSL, for hue-preserving searches ------------------------------------ */

export function hexToHsl(hex) {
  const [r, g, b] = hexToRgb(hex).map((v) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h * 360, s, l];
}

export function hslToHex(h, s, l) {
  h = ((h % 360) + 360) % 360 / 360;
  if (s === 0) {
    const v = Math.round(l * 255);
    return rgbToHex([v, v, v]);
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hue = (t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return rgbToHex([hue(h + 1 / 3) * 255, hue(h) * 255, hue(h - 1 / 3) * 255]);
}

/**
 * Darkest-is-not-best: walk lightness down from the brand colour and stop at
 * the first step that clears every requirement. That keeps the accent as
 * close to the real brand as the maths allows instead of over-correcting.
 */
export function findAccent(brandHex, requirements, { keepSaturation = true } = {}) {
  const [h, s, l] = hexToHsl(brandHex);
  for (let step = 0; step <= 600; step++) {
    const cand = hslToHex(h, keepSaturation ? s : Math.max(0.3, s - step * 0.0004), l - step * 0.001);
    if (requirements.every(({ against, min }) => contrast(cand, against) >= min)) return cand;
  }
  return null;
}
