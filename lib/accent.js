function hexToRgb(hex) {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16)
  };
}

function accentBackground(hex) {
  const { r, g, b } = hexToRgb(hex);
  return `rgb(${Math.round(r * 0.1 + 14)}, ${Math.round(g * 0.1 + 14)}, ${Math.round(b * 0.1 + 20)})`;
}

function accentBar(hex) {
  const { r, g, b } = hexToRgb(hex);
  return `rgb(${Math.round(r * 0.08 + 12)}, ${Math.round(g * 0.08 + 12)}, ${Math.round(b * 0.08 + 18)})`;
}

module.exports = { hexToRgb, accentBackground, accentBar };
