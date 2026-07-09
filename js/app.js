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

const Toast = (() => {
  let activeToast = null;

  const show = (message, type = "info", duration = 3000) => {
    if (activeToast) {
      activeToast.remove();
      activeToast = null;
    }

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    activeToast = toast;

    setTimeout(() => {
      toast.remove();
      if (activeToast === toast) activeToast = null;
    }, duration);
  };

  return { show };
})();

const SecurityManager = (() => {
  const rateLimiter = {
    requests: [],
    maxRequests: 10,
    timeWindow: 60000,

    canMakeRequest() {
      const now = Date.now();
      this.requests = this.requests.filter(
        (time) => now - time < this.timeWindow
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
        setTimeout(() => reject(new Error("Request timeout")), timeout)
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
    document.getElementById("downloadResult").style.display = "none";
  };

  const hideLoading = () => {
    document.getElementById("loading").classList.remove("active");
  };

  const showError = (message) => {
    const resultDiv = document.getElementById("downloadResult");
    resultDiv.style.display = "block";
    resultDiv.className = "download-result";
    resultDiv.innerHTML = `
      <div class="status-message error" style="display:block;">
        <div style="text-align:center">
          <div style="color:#ff0266;font-size:18px;margin-bottom:10px;">⚠️ DOWNLOAD GAGAL</div>
          <div style="color:#a0a0a0">${message}</div>
        </div>
      </div>
    `;
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

  return { showLoading, hideLoading, showError, updateCounter };
})();

const APIService = (() => {
  const parseResponse = (data) => {
    if (data && data.video) {
      return {
        video_url: data.video,
        title: data.title || "TikTok Video",
        author: data.author || "Unknown",
        duration: data.duration || "0",
      };
    } else if (data && data.download_url) {
      return {
        video_url: data.download_url,
        title: data.title || "TikTok Video",
        author: data.author || "Unknown",
      };
    } else if (data && data.data && data.data.play) {
      return {
        video_url: data.data.play,
        title: data.data.title || "TikTok Video",
        author: data.data.author || "Unknown",
        duration: data.data.duration || "0",
      };
    }
    return null;
  };

  const fetchVideo = async (videoUrl, quality = "hd") => {
    try {
      const params = new URLSearchParams({ url: videoUrl, quality });
      const response = await fetch(`/api/rapidapi?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `API error: ${response.status}`);
      }

      const result = parseResponse(data);
      if (result) return result;

      throw new Error("Format response tidak dikenali");
    } catch (error) {
      if (error.message === "Failed to fetch") {
        throw new Error("Tidak bisa terhubung ke server");
      }
      throw error;
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
        await showResult(cached);
        return;
      }

      const videoInfo = await APIService.fetchVideo(cleanUrl, quality);

      SecurityManager.setCachedData(cleanUrl, videoInfo);

      await showResult(videoInfo);
    } catch (error) {
      console.error("Download error:", error);
      showErrorResult(error.message, videoUrl);
    } finally {
      isProcessing = false;
      UIManager.hideLoading();
    }
  };

  const showResult = async (videoInfo) => {
    downloadCount++;
    UIManager.updateCounter(downloadCount);

    window.currentVideoInfo = videoInfo;

    const resultDiv = document.getElementById("downloadResult");
    resultDiv.style.display = "block";
    resultDiv.className = "download-result";
    resultDiv.innerHTML = `
      <div class="status-message success" style="display:block;">
        <div style="text-align:center">
          <div style="font-size:20px;color:#00ff88;margin-bottom:12px;">✅ VIDEO DITEMUKAN!</div>

          <div class="video-info-card">
            <div class="info-row"><strong>Judul:</strong> ${escHtml(videoInfo.title || "TikTok Video")}</div>
            <div class="info-row"><strong>Creator:</strong> ${escHtml(videoInfo.author || "Unknown")}</div>
            <div class="info-row"><strong>Durasi:</strong> ${escHtml(videoInfo.duration || "Unknown")}</div>
            <div class="info-row"><strong>Kualitas:</strong> No Watermark</div>
          </div>

          <div class="download-actions">
            <button class="btn-primary-dl" onclick="DownloadManager.triggerDownload()">
              ⬇️ DOWNLOAD VIDEO
            </button>
            <button class="btn-secondary-dl" onclick="DownloadManager.previewVideo()">
              👁️ PREVIEW
            </button>
          </div>
        </div>
      </div>
    `;

    resultDiv.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  const triggerDownload = async () => {
    const info = window.currentVideoInfo;
    if (!info || !info.video_url) {
      Toast.show("Tidak ada video untuk didownload", "error");
      return;
    }

    Toast.show("Memulai download...", "info");

    try {
      const response = await fetch(info.video_url, {
        mode: "cors",
        headers: { "Accept": "video/mp4,video/*,*/*" }
      });

      if (!response.ok) throw new Error("HTTP " + response.status);

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `tiktok_${Date.now()}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);

      Toast.show("✅ Download berhasil!", "success");
    } catch (e) {
      console.warn("Blob download failed, trying fallback:", e.message);
      fallbackDownload(info.video_url);
    }
  };

  const fallbackDownload = (url) => {
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    Toast.show("Jika download tidak dimulai, tap ⋮ lalu pilih Download", "info", 5000);
  };

  const previewVideo = () => {
    const info = window.currentVideoInfo;
    if (!info || !info.video_url) {
      Toast.show("Tidak ada video untuk dipreview", "error");
      return;
    }

    const overlay = document.createElement("div");
    overlay.className = "preview-overlay";
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
    overlay.innerHTML = `
      <div class="preview-modal">
        <div class="preview-header">
          <h3>▶ PREVIEW VIDEO</h3>
          <button class="preview-close" onclick="this.closest('.preview-overlay').remove()">✕</button>
        </div>
        <video class="preview-video" controls autoplay>
          <source src="${escHtml(info.video_url)}" type="video/mp4">
        </video>
        <div class="preview-footer">
          <button onclick="this.closest('.preview-overlay').remove(); DownloadManager.triggerDownload()">
            ⬇️ DOWNLOAD VIDEO
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  };

  const showErrorResult = (message, videoUrl) => {
    const resultDiv = document.getElementById("downloadResult");
    resultDiv.style.display = "block";
    resultDiv.className = "download-result";
    resultDiv.innerHTML = `
      <div class="status-message error" style="display:block;">
        <div style="text-align:center">
          <div style="color:#ff0266;font-size:18px;margin-bottom:12px;">⚠️ DOWNLOAD GAGAL</div>
          <div style="color:#a0a0a0;margin-bottom:15px;">${escHtml(message)}</div>

          <div class="download-actions">
            <button class="btn-primary-dl" style="background:#ff9500" onclick="DownloadManager.retry('${escHtml(videoUrl)}')">
              🔄 COBA LAGI
            </button>
            <button class="btn-secondary-dl" onclick="DownloadManager.showAlternatives('${escHtml(videoUrl)}')">
              📱 METODE LAIN
            </button>
          </div>
        </div>
      </div>
    `;
    resultDiv.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  const retry = (url) => {
    processDownload(url);
  };

  const showAlternatives = (url) => {
    const resultDiv = document.getElementById("downloadResult");
    resultDiv.style.display = "block";
    resultDiv.className = "download-result";
    resultDiv.innerHTML = `
      <div class="status-message success" style="display:block;">
        <div style="text-align:center">
          <div style="color:#00ff88;font-size:18px;margin-bottom:12px;">📱 DOWNLOADER ALTERNATIF</div>

          <div style="background:rgba(255,149,0,0.1);padding:12px;border-radius:8px;margin:12px 0;">
            <div style="color:#ff9500;font-weight:700;margin-bottom:6px;">URL TikTok:</div>
            <div style="background:rgba(0,0,0,0.3);padding:8px;border-radius:4px;font-size:12px;word-break:break-all;color:#a0a0a0;">
              ${escHtml(url)}
            </div>
          </div>

          <div class="alternative-grid">
            ${DirectDownload ? DirectDownload.renderCards() : ""}
          </div>

          <button onclick="DownloadManager.retry('${escHtml(url)}')"
                  style="width:100%;margin-top:12px;background:#00ff88;color:#0a0a12;border:none;padding:12px;border-radius:6px;font-family:'Rajdhani',sans-serif;font-weight:700;font-size:14px;cursor:pointer;">
            🔄 COBA RAPIDAPI LAGI
          </button>
        </div>
      </div>
    `;
  };

  const debouncedDownload = SecurityManager.debounce(processDownload, 1000);

  return {
    processDownload: debouncedDownload,
    triggerDownload,
    previewVideo,
    retry,
    showAlternatives,
    isProcessing: () => isProcessing,
  };
})();

function escHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

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
          Toast.show("URL berhasil dipaste!", "success");
        } else {
          Toast.show("URL TikTok tidak valid", "error");
        }
      } catch (error) {
        if (error.name === "NotAllowedError") {
          Toast.show("Izinkan akses clipboard di browser", "info", 4000);
        } else {
          Toast.show("Gagal membaca clipboard", "error");
        }
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
        const url = document.getElementById("tiktokUrl").value.trim();

        if (!url) {
          UIManager.showError("Masukkan URL TikTok terlebih dahulu!");
          document.getElementById("tiktokUrl").focus();
          return;
        }

        if (!URLValidator.validate(url)) {
          UIManager.showError(
            "URL TikTok tidak valid! Contoh: https://vm.tiktok.com/abc123"
          );
          return;
        }

        await DownloadManager.processDownload(url, selectedQuality);
      });

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

    console.log("HAFOURENAI TikTok Downloader Ready");
    console.log("RapidAPI Integration Activated");

    setTimeout(() => {
      Toast.show("HAFOURENAI TikTok Downloader Siap!", "success");
    }, 1000);

    addSecurityBadge();
  };

  const addSecurityBadge = () => {
    const badge = document.createElement("div");
    badge.id = "securityBadge";
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
    badge.innerHTML = "🔒 SECURED";
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

document.addEventListener("DOMContentLoaded", function () {
  App.init();
});
