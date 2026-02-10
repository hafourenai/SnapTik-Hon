const DirectDownload = (() => {
  const methods = [
    {
      name: "SSSTik.io",
      url: "https://ssstik.io",
      icon: "📥",
      description: "Download tanpa watermark",
      steps: [
        "Buka website SSSTik",
        "Paste URL TikTok",
        "Klik Download",
        "Simpan video",
      ],
    },
    {
      name: "SnapTik.app",
      url: "https://snaptik.app",
      icon: " ",
      description: "Cepat dan mudah",
      steps: [
        "Kunjungi SnapTik",
        "Tempel link video",
        "Download HD quality",
        "Tidak perlu install",
      ],
    },
    {
      name: "MusicalDown",
      url: "https://musicaldown.com",
      icon: "🎵",
      description: "Support musik dan video",
      steps: [
        "Buka MusicalDown",
        "Copy paste URL",
        "Download MP4/MP3",
        "Simpan di device",
      ],
    },
    {
      name: "TikMate",
      url: "https://tikmate.online",
      icon: "⚡",
      description: "Download super cepat",
      steps: [
        "Akses TikMate",
        "Input link TikTok",
        "Pilih quality",
        "Download langsung",
      ],
    },
  ];

  const showDirectOptions = () => {
    const html = `
            <div style="text-align: center;">
                <h3 style="color: #00ff88; margin-bottom: 15px;">  Pilih Downloader</h3>
                <p style="color: #a0a0a0; margin-bottom: 20px;">Klik salah satu opsi di bawah untuk download langsung:</p>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 20px;">
                    ${methods
                      .map(
                        (method) => `
                        <div style="
                            border: 2px solid #ff9500; 
                            padding: 15px; 
                            border-radius: 10px; 
                            background: rgba(255,149,0,0.05);
                            cursor: pointer;
                            transition: all 0.3s;
                        " onclick="window.open('${method.url}', '_blank')">
                            <div style="font-size: 24px; margin-bottom: 10px;">${method.icon}</div>
                            <div style="font-weight: bold; color: #ff9500; margin-bottom: 5px;">${method.name}</div>
                            <div style="font-size: 12px; color: #a0a0a0; margin-bottom: 10px;">${method.description}</div>
                            <div style="font-size: 10px; color: #666;">
                                ${method.steps.map((step) => `• ${step}`).join("<br>")}
                            </div>
                        </div>
                    `,
                      )
                      .join("")}
                </div>
                
                <div style="margin-top: 20px; padding: 15px; background: rgba(0,255,136,0.1); border-radius: 8px;">
                    <div style="color: #00ff88; font-weight: bold;">💡 Tips:</div>
                    <div style="color: #a0a0a0; font-size: 12px;">
                        • Copy URL TikTok sebelum klik opsi di atas<br>
                        • Paste URL di website downloader yang terbuka<br>
                        • Download video tanpa watermark!
                    </div>
                </div>
            </div>
        `;
    return html;
  };

  return { showDirectOptions };
})();
