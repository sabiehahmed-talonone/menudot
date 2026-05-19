function wordCount(text) {
  return text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
}

function charCount(text) {
  return text.length;
}

module.exports = { wordCount, charCount };
