const text = `
#Візуальна пауза
#![Візуал

Нонфарм: як знаходити щомісяця і які цифри брати](data:image/svg+xml;base64,PHN2Zy)
`;

const replaced = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (fullMatch, alt, rawUrl) => {
  const cleanAlt = alt.replace(/\s*\n\s*/g, ' ').trim();
  const cleanUrl = rawUrl.replace(/\s*\n\s*/g, '').trim();
  return `![${cleanAlt}](${cleanUrl})`;
});

console.log("REPLACED:", replaced);
