const UIEffects = (() => {
  const initStarfield = () => {
    const starfield = document.getElementById("starfield");
    starfield.innerHTML = "";

    for (let i = 0; i < 100; i++) {
      const star = document.createElement("div");
      star.className = "star";
      star.style.width = Math.random() * 3 + "px";
      star.style.height = star.style.width;
      star.style.left = Math.random() * 100 + "%";
      star.style.top = Math.random() * 100 + "%";
      star.style.animationDelay = Math.random() * 3 + "s";
      starfield.appendChild(star);
    }
  };

  const initFloatingShapes = () => {
    const oldShapes = document.querySelectorAll(".floating-shape");
    oldShapes.forEach((shape) => shape.remove());

    for (let i = 0; i < 5; i++) {
      const shape = document.createElement("div");
      shape.className = "floating-shape";
      const size = Math.random() * 100 + 50;
      shape.style.width = size + "px";
      shape.style.height = size + "px";
      shape.style.left = Math.random() * 100 + "%";
      shape.style.top = Math.random() * 100 + "%";
      shape.style.borderColor = ["#ff9500", "#ffcc00", "#ff6b00"][
        Math.floor(Math.random() * 3)
      ];
      shape.style.animationDelay = Math.random() * 3 + "s";
      shape.style.animationDuration = Math.random() * 10 + 10 + "s";

      if (Math.random() > 0.5) {
        shape.style.borderRadius = "50%";
      }

      document.body.appendChild(shape);
    }
  };

  const init = () => {
    initStarfield();
    initFloatingShapes();
  };

  return { init };
})();

const URLValidator = (() => {
  const patterns = [
    /https?:\/\/(www\.)?tiktok\.com\/@.+\/video\/\d+/,
    /https?:\/\/(vm\.|vt\.)?tiktok\.com\/.+/,
    /https?:\/\/tiktok\.com\/t\/[a-zA-Z0-9]+/,
    /https?:\/\/(m\.)?tiktok\.com\/v\/\d+\.html/,
  ];

  const validate = (url) => {
    try {
      const parsed = new URL(url);
      const cleanURL = parsed.href;

      return patterns.some((pattern) => pattern.test(cleanURL));
    } catch (error) {
      return false;
    }
  };

  return { validate };
})();

const SecurityManager = (() => {
  const rateLimiter = {
    requests: [],
    maxRequests: 10,
    timeWindow: 60000,

    canMakeRequest() {
      const now = Date.now();
      this.requests = this.requests.filter(
        (time) => now - time < this.timeWindow,
      );

      if (this.requests.length >= this.maxRequests) {
        return false;
      }

      this.requests.push(now);
      return true;
    },

    getWaitTime() {
      if (this.requests.length === 0) return 0;
      const oldestRequest = Math.min(...this.requests);
      const waitTime = this.timeWindow - (Date.now() - oldestRequest);
      return Math.max(0, Math.ceil(waitTime / 1000));
    },
  };

  let debounceTimer = null;
  const debounce = (func, delay = 1000) => {
    return (...args) => {
      clearTimeout(debounceTimer);
      return new Promise((resolve) => {
        debounceTimer = setTimeout(() => {
          resolve(func(...args));
        }, delay);
      });
    };
  };

  const urlCache = new Map();
  const CACHE_DURATION = 300000;

  const getCachedData = (url) => {
    const cached = urlCache.get(url);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
    return null;
  };

  const setCachedData = (url, data) => {
    urlCache.set(url, {
      data: data,
      timestamp: Date.now(),
    });
  };

  const sanitizeURL = (url) => {
    const cleaned = url.trim();
    const dangerous = /<script|javascript:|onerror=|onclick=/i;
    if (dangerous.test(cleaned)) {
      throw new Error("URL mengandung konten berbahaya!");
    }
    return cleaned;
  };

  const validateRequest = (url) => {
    if (!rateLimiter.canMakeRequest()) {
      const waitTime = rateLimiter.getWaitTime();
      throw new Error(`Terlalu banyak permintaan! Tunggu ${waitTime} detik.`);
    }

    const cleanURL = sanitizeURL(url);

    if (!URLValidator.validate(cleanURL)) {
      throw new Error("URL TikTok tidak valid!");
    }

    return cleanURL;
  };

  const honeypot = {
    element: null,

    create() {
      const input = document.createElement("input");
      input.type = "text";
      input.name = "website";
      input.style.position = "absolute";
      input.style.left = "-9999px";
      input.tabIndex = -1;
      input.autocomplete = "off";
      document.body.appendChild(input);
      this.element = input;
    },

    check() {
      return !this.element || this.element.value === "";
    },
  };

  const createTimeoutPromise = (promise, timeout = 15000) => {
    return Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Request timeout")), timeout),
      ),
    ]);
  };

  const init = () => {
    honeypot.create();
  };

  return {
    validateRequest,
    getCachedData,
    setCachedData,
    debounce,
    honeypot,
    createTimeoutPromise,
    rateLimiter,
    init,
  };
})();

const UIManager = (() => {
  const showLoading = () => {
    document.getElementById("loading").classList.add("active");
    document.getElementById("statusMessage").style.display = "none";
  };

  const hideLoading = () => {
    document.getElementById("loading").classList.remove("active");
  };

  const showSuccess = (videoInfo) => {
    const statusMsg = document.getElementById("statusMessage");
    statusMsg.className = "status-message success";
    statusMsg.textContent = `✓ ${videoInfo.title || "Download berhasil!"}`;
    statusMsg.style.display = "block";
  };

  const showError = (message) => {
    const statusMsg = document.getElementById("statusMessage");
    statusMsg.className = "status-message error";
    statusMsg.textContent = `✗ ${message}`;
    statusMsg.style.display = "block";
  };

  const updateCounter = (count) => {
    const counter = document.getElementById("totalDownloads");
    let current = 0;
    const increment = Math.ceil(count / 20);

    const timer = setInterval(() => {
      current += increment;
      if (current >= count) {
        current = count;
        clearInterval(timer);
      }
      counter.textContent = current;
    }, 50);
  };

  return { showLoading, hideLoading, showSuccess, showError, updateCounter };
})();

const APIService = (() => {
  const RAPID_API_CONFIG = {
    host: process.env.RAPID_API_HOST || "tiktok-downloader-download-tiktok-videos-without-watermark.p.rapidapi.com",
    key: process.env.RAPID_API_KEY || "YOUR_API_KEY_HERE",
    endpoint: process.env.RAPID_API_ENDPOINT || "https://tiktok-downloader-download-tiktok-videos-without-watermark.p.rapidapi.com/rich_response/index",
  };

  const fetchVideo = async (videoUrl) => {
    console.log("  Using RapidAPI...");

    try {
      const response = await SecurityManager.createTimeoutPromise(
        axios({
          method: "GET",
          url: `${RAPID_API_CONFIG.endpoint}?url=${encodeURIComponent(videoUrl)}`,
          headers: {
            "x-rapidapi-host": RAPID_API_CONFIG.host,
            "x-rapidapi-key": RAPID_API_CONFIG.key,
          },
          timeout: 15000,
        }),
        20000,
      );

      console.log("  RapidAPI Response:", response.data);

      if (response.data && response.data.video) {
        return {
          video_url: response.data.video,
          title: response.data.title || "TikTok Video",
          author: response.data.author || "Unknown",
          duration: response.data.duration || "0",
        };
      } else if (response.data && response.data.download_url) {
        return {
          video_url: response.data.download_url,
          title: response.data.title || "TikTok Video",
          author: response.data.author || "Unknown",
        };
      } else {
        throw new Error("Format response tidak dikenali");
      }
    } catch (error) {
      console.error("  RapidAPI Error:", error);

      if (error.response) {
        if (error.response.status === 429) {
          throw new Error("Quota API habis, coba lagi nanti");
        } else if (error.response.status === 401) {
          throw new Error("API key tidak valid");
        } else {
          throw new Error(`API error: ${error.response.status}`);
        }
      } else if (error.request) {
        throw new Error("Tidak bisa terhubung ke API");
      } else {
        throw new Error(error.message);
      }
    }
  };

  return { fetchVideo };
})();

const DownloadManager = (() => {
  let downloadCount = 0;
  let isProcessing = false;

  const processDownload = async (videoUrl, quality = "hd") => {
    if (isProcessing) {
      UIManager.showError("Download sedang diproses, harap tunggu...");
      return;
    }

    isProcessing = true;
    UIManager.showLoading();

    try {
      const cleanUrl = SecurityManager.validateRequest(videoUrl);

      const cached = SecurityManager.getCachedData(cleanUrl);
      if (cached) {
        console.log("  Using cached data");
        await handleDownloadResult(cached);
        return;
      }

      const videoInfo = await APIService.fetchVideo(cleanUrl);

      SecurityManager.setCachedData(cleanUrl, videoInfo);

      await handleDownloadResult(videoInfo);
    } catch (error) {
      console.error("Download error:", error);
      await handleDownloadError(error, videoUrl);
    } finally {
      isProcessing = false;
      UIManager.hideLoading();
    }
  };

  const handleDownloadResult = async (videoInfo) => {
    showVideoInfo(videoInfo);

    setTimeout(() => {
      createDownload(videoInfo);
      downloadCount++;
      UIManager.updateCounter(downloadCount);
    }, 2000);
  };

  const createDownload = (videoInfo) => {
    const link = document.createElement("a");
    link.href = videoInfo.video_url;
    link.download = `tiktok_${Date.now()}.mp4`;
    link.target = "_blank";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    UIManager.showSuccess({
      title: `  Download Berhasil! - ${videoInfo.title || "TikTok Video"}`,
    });
  };

  const showVideoInfo = (videoInfo) => {
    const statusMsg = document.getElementById("statusMessage");
    statusMsg.className = "status-message success";
    statusMsg.innerHTML = `
            <div style="text-align: center;">
                <div style="font-size: 24px; color: #00ff88; margin-bottom: 10px;">  VIDEO DITEMUKAN!</div>
                
                <div style="background: rgba(255,149,0,0.1); padding: 15px; border-radius: 8px; margin: 15px 0; text-align: left;">
                    <div style="color: #ff9500; font-weight: bold; margin-bottom: 8px;">📝 INFO VIDEO:</div>
                    <div style="color: #a0a0a0; font-size: 12px;">
                        <strong>Judul:</strong> ${videoInfo.title || "TikTok Video"}<br>
                        <strong>Creator:</strong> ${videoInfo.author || "Unknown"}<br>
                        <strong>Durasi:</strong> ${videoInfo.duration || "Unknown"}<br>
                        <strong>Kualitas:</strong> HD (No Watermark)
                    </div>
                </div>
                
                <div style="color: #00ff88; font-size: 14px; margin: 10px 0;">
                    ⬇️ Download akan dimulai otomatis dalam 2 detik...
                </div>
                
                <div style="display: flex; gap: 10px; justify-content: center; margin-top: 15px;">
                    <button onclick="forceDownload()" 
                            style="background: #00ff88; color: #0a0a12; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-weight: bold;">
                          DOWNLOAD SEKARANG
                    </button>
                    <button onclick="previewVideo()" 
                            style="background: #7e57c2; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
                        👁️ PREVIEW VIDEO
                    </button>
                </div>
            </div>
        `;
    statusMsg.style.display = "block";

    window.currentVideoInfo = videoInfo;
  };

  const handleDownloadError = async (error, videoUrl) => {
    console.log("Showing error solutions...");

    const statusMsg = document.getElementById("statusMessage");
    statusMsg.className = "status-message error";
    statusMsg.innerHTML = `
            <div style="text-align: center;">
                <div style="color: #ff0266; font-size: 18px; margin-bottom: 15px;">⚠️ DOWNLOAD GAGAL</div>
                <div style="color: #a0a0a0; margin-bottom: 20px;">${error.message}</div>
                
                <div style="background: rgba(255,149,0,0.1); padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <div style="color: #ff9500; font-weight: bold; margin-bottom: 10px;">🔄 SOLUSI:</div>
                    
                    <button onclick="retryDownload('${videoUrl}')" 
                            style="background: #ff9500; color: #0a0a12; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin: 5px; font-weight: bold;">
                        🔄 COBA LAGI
                    </button>
                    
                    <button onclick="showAlternativeMethod('${videoUrl}')" 
                            style="background: #7e57c2; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin: 5px;">
                        📱 METODE LAIN
                    </button>
                </div>
            </div>
        `;
    statusMsg.style.display = "block";
  };

  const debouncedDownload = SecurityManager.debounce(processDownload, 1000);

  return {
    processDownload: debouncedDownload,
    isProcessing: () => isProcessing,
  };
})();

// Force download manual
window.forceDownload = () => {
  if (window.currentVideoInfo && window.currentVideoInfo.video_url) {
    const link = document.createElement("a");
    link.href = window.currentVideoInfo.video_url;
    link.download = `tiktok_${Date.now()}.mp4`;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showTempMessage("  Download dimulai!", "success");
  }
};

// Preview video
window.previewVideo = () => {
  if (window.currentVideoInfo && window.currentVideoInfo.video_url) {
    const previewHTML = `
            <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 10000; display: flex; justify-content: center; align-items: center;">
                <div style="background: #0a0a12; padding: 20px; border-radius: 10px; border: 2px solid #00ff88; max-width: 90%; max-height: 90%;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <div style="color: #00ff88; font-weight: bold;">  PREVIEW VIDEO</div>
                        <button onclick="closePreview()" style="background: #ff0266; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">✕</button>
                    </div>
                    <video controls autoplay style="max-width: 100%; max-height: 70vh; border-radius: 5px;">
                        <source src="${window.currentVideoInfo.video_url}" type="video/mp4">
                        Browser tidak support video preview.
                    </video>
                    <div style="text-align: center; margin-top: 15px;">
                        <button onclick="forceDownload()" style="background: #00ff88; color: #0a0a12; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-weight: bold;">  DOWNLOAD VIDEO</button>
                    </div>
                </div>
            </div>
        `;

    const previewDiv = document.createElement("div");
    previewDiv.innerHTML = previewHTML;
    document.body.appendChild(previewDiv);
  }
};

window.closePreview = () => {
  const preview = document.querySelector(
    'div[style*="position: fixed; top: 0; left: 0"]',
  );
  if (preview) {
    preview.remove();
  }
};

window.retryDownload = (videoUrl) => {
  DownloadManager.processDownload(videoUrl);
};

window.showAlternativeMethod = (videoUrl) => {
  const statusMsg = document.getElementById("statusMessage");
  statusMsg.className = "status-message success";
  statusMsg.innerHTML = `
        <div style="text-align: center;">
            <div style="color: #00ff88; font-size: 20px; margin-bottom: 15px;">📱 METODE ALTERNATIF</div>
            
            <div style="background: rgba(255,149,0,0.1); padding: 15px; border-radius: 8px; margin: 15px 0;">
                <div style="color: #ff9500; font-weight: bold; margin-bottom: 10px;">URL TikTok Anda:</div>
                <div style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: 5px; font-size: 12px; word-break: break-all; color: #a0a0a0;">
                    ${videoUrl}
                </div>
            </div>

            <button onclick="copyTikTokUrl('${videoUrl}')" 
                    style="background: #ff9500; color: #0a0a12; border: none; padding: 12px; border-radius: 5px; cursor: pointer; font-weight: bold; font-size: 14px; width: 100%; margin: 5px 0;">
                📋 SALIN URL - UNTUK SCREEN RECORD
            </button>
            
            <button onclick="retryDownload('${videoUrl}')" 
                    style="background: #00ff88; color: #0a0a12; border: none; padding: 12px; border-radius: 5px; cursor: pointer; font-weight: bold; font-size: 14px; width: 100%; margin: 5px 0;">
                🔄 COBA RAPIDAPI LAGI
            </button>
        </div>
    `;
};

window.copyTikTokUrl = async (url) => {
  try {
    await navigator.clipboard.writeText(url);
    showTempMessage("  URL berhasil disalin!", "success");
  } catch (error) {
    showTempMessage("  Gagal menyalin URL", "error");
  }
};

window.showTempMessage = (message, type = "info") => {
  const tempMsg = document.createElement("div");
  tempMsg.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === "success" ? "#00ff88" : type === "error" ? "#ff0266" : "#ff9500"};
        color: ${type === "success" ? "#0a0a12" : "white"};
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 10000;
        font-weight: bold;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
    `;
  tempMsg.textContent = message;
  document.body.appendChild(tempMsg);

  setTimeout(() => {
    document.body.removeChild(tempMsg);
  }, 3000);
};

const EventHandlers = (() => {
  let selectedQuality = "hd";

  const initQualitySelector = () => {
    document.querySelectorAll(".quality-btn").forEach((btn) => {
      btn.addEventListener("click", function () {
        document
          .querySelectorAll(".quality-btn")
          .forEach((b) => b.classList.remove("active"));
        this.classList.add("active");
        selectedQuality = this.dataset.quality;
      });
    });
  };

  const initPasteButton = () => {
    document.getElementById("pasteBtn").addEventListener("click", async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (URLValidator.validate(text)) {
          document.getElementById("tiktokUrl").value = text;
          showTempMessage("📋 URL berhasil dipaste!", "success");
        } else {
          showTempMessage("⚠️ URL TikTok tidak valid", "error");
        }
      } catch (error) {
        showTempMessage("  Akses clipboard ditolak", "error");
      }
    });
  };

  const initURLValidation = () => {
    document.getElementById("tiktokUrl").addEventListener("input", function () {
      const isValid = URLValidator.validate(this.value);
      this.style.borderColor = isValid ? "#00ff88" : "#ff0266";

      if (this.value && !isValid) {
        this.style.background = "rgba(255, 2, 102, 0.1)";
      } else {
        this.style.background = "rgba(0, 255, 136, 0.05)";
      }
    });
  };

  const initDownloadButton = () => {
    document
      .getElementById("downloadBtn")
      .addEventListener("click", async () => {
        const url = document.getElementById("tiktokUrl").value;

        if (!url) {
          UIManager.showError("  Masukkan URL TikTok terlebih dahulu!");
          document.getElementById("tiktokUrl").focus();
          return;
        }

        if (!URLValidator.validate(url)) {
          UIManager.showError(
            "  URL TikTok tidak valid! Contoh: https://vm.tiktok.com/abc123",
          );
          return;
        }

        await DownloadManager.processDownload(url, selectedQuality);
      });

    // Enter key support
    document
      .getElementById("tiktokUrl")
      .addEventListener("keypress", function (e) {
        if (e.key === "Enter") {
          document.getElementById("downloadBtn").click();
        }
      });
  };

  const init = () => {
    initQualitySelector();
    initPasteButton();
    initURLValidation();
    initDownloadButton();
  };

  return { init };
})();

const App = (() => {
  const init = () => {
    SecurityManager.init();
    UIEffects.init();
    EventHandlers.init();

    console.log("  HAFOURENAI TikTok Downloader Ready");
    console.log("  RapidAPI Integration Activated");

    // Show welcome message
    setTimeout(() => {
      showTempMessage("🎉 HAFOURENAI TikTok Downloader Siap!", "success");
    }, 1000);

    addSecurityBadge();
  };

  const addSecurityBadge = () => {
    const badge = document.createElement("div");
    badge.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(255, 149, 0, 0.1);
            border: 2px solid #ff9500;
            padding: 10px 15px;
            border-radius: 5px;
            font-size: 12px;
            color: #ff9500;
            z-index: 9999;
            cursor: pointer;
            transition: all 0.3s;
        `;
    badge.innerHTML = "🍯 SECURED";
    badge.title = "Protected by Honey Security";

    badge.onmouseover = () => {
      badge.style.background = "rgba(255, 149, 0, 0.3)";
      badge.style.boxShadow = "0 0 20px rgba(255, 149, 0, 0.5)";
    };
    badge.onmouseout = () => {
      badge.style.background = "rgba(255, 149, 0, 0.1)";
      badge.style.boxShadow = "none";
    };

    document.body.appendChild(badge);
  };

  return { init };
})();

// Initialize App ketika DOM siap
document.addEventListener("DOMContentLoaded", function () {
  App.init();
});
