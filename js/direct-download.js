const DirectDownload = (() => {
  const methods = [
    {
      name: "SSSTik.io",
      url: "https://ssstik.io",
      icon: "📥",
      description: "Download tanpa watermark",
    },
    {
      name: "SnapTik.app",
      url: "https://snaptik.app",
      icon: "⚡",
      description: "Cepat dan mudah",
    },
    {
      name: "MusicalDown",
      url: "https://musicaldown.com",
      icon: "🎵",
      description: "Support musik & video",
    },
    {
      name: "TikMate",
      url: "https://tikmate.online",
      icon: "🔥",
      description: "Download super cepat",
    },
  ];

  const renderCards = () => {
    return methods
      .map(
        (m) => `
      <div class="alternative-card" onclick="window.open('${m.url}','_blank')">
        <div class="alt-icon">${m.icon}</div>
        <div class="alt-name">${m.name}</div>
        <div class="alt-desc">${m.description}</div>
      </div>`
      )
      .join("");
  };

  return { renderCards };
})();
