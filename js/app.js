// ============================================
// MODULE 1: UI EFFECTS & ANIMATIONS
// ============================================
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

// ============================================
// MODULE 2: API SERVICE - DIRECT DOWNLOAD
// ============================================
const APIService = (() => {
    const fetchVideo = async (videoUrl) => {
        const cachedData = SecurityManager.getCachedData(videoUrl);
        if (cachedData) {
            console.log('📦 Using cached data');
            return cachedData;
        }

        const apiConfigs = APIConfig.getAPIConfigs();
        
        for (const api of apiConfigs) {
            try {
                console.log(`🔄 Trying: ${api.name}`);
                
                const requestUrl = `${api.url}?url=${encodeURIComponent(videoUrl)}`;
                
                const options = {
                    method: api.method,
                    url: requestUrl,
                    timeout: 15000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                };

                const response = await axios(options);
                
                console.log(`✅ Success with ${api.name}`);
                SecurityManager.setCachedData(videoUrl, response.data);
                return response.data;
                
            } catch (error) {
                console.warn(`❌ ${api.name} failed:`, error.message);
            }
        }

        throw new Error('Semua API gagal. Coba lagi nanti.');
    };

    const parseResponse = (data) => {
        console.log('📊 API Response:', data);
        
        // TikWM API - Direct video URL
        if (data && data.data && data.data.play) {
            return {
                url: data.data.play,
                quality: 'hd',
                watermark: false,
                duration: data.data.duration,
                author: data.data.author?.unique_id,
                description: data.data.title,
                directDownload: true
            };
        }
        
        // TikDown API - Direct video URL
        if (data && data.play) {
            return {
                url: data.play,
                quality: 'hd', 
                watermark: false,
                duration: data.duration,
                author: data.author,
                description: data.title,
                directDownload: true
            };
        }

        // TikMate API - Direct video URL
        if (data && data.video && data.video.url) {
            return {
                url: data.video.url,
                quality: 'hd',
                watermark: false,
                duration: data.video.duration,
                author: data.video.author,
                description: data.video.description,
                directDownload: true
            };
        }
        
        throw new Error('URL download tidak ditemukan');
    };

    return { fetchVideo, parseResponse };
})();
// ============================================
// MODULE 3: UI MANAGER
// ============================================
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
    statusMsg.textContent = `✓ ${
      videoInfo.description || "Download berhasil!"
    }`;
  };

  const showError = (message) => {
    const statusMsg = document.getElementById("statusMessage");
    statusMsg.className = "status-message error";
    statusMsg.textContent = `✗ ${message}`;
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
// ============================================
// MODULE 4: DOWNLOAD MANAGER - DIRECT DOWNLOAD
// ============================================
const DownloadManager = (() => {
    let downloadCount = 0;
    let isProcessing = false;

    // Function untuk trigger download langsung
    const triggerDirectDownload = (videoUrl, filename) => {
        return new Promise((resolve) => {
            const downloadLink = document.createElement('a');
            downloadLink.href = videoUrl;
            downloadLink.download = filename;
            downloadLink.style.display = 'none';
            
            // Add to document dan click
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            
            resolve(true);
        });
    };

    // Fallback dengan blob method (jika direct gagal)
    const downloadWithBlob = async (videoUrl, filename) => {
        try {
            console.log('🔧 Trying blob download...');
            
            const response = await fetch(videoUrl, {
                mode: 'cors',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Referer': 'https://www.tiktok.com/'
                }
            });
            
            if (!response.ok) throw new Error('Fetch failed');
            
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            
            const downloadLink = document.createElement('a');
            downloadLink.href = blobUrl;
            downloadLink.download = filename;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            
            // Cleanup
            setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
            
            return true;
        } catch (error) {
            console.warn('Blob download failed:', error);
            return false;
        }
    };

    const processDownload = async (videoUrl, quality = 'hd') => {
        if (isProcessing) {
            UIManager.showError('Download sedang diproses, harap tunggu...');
            return;
        }

        if (!SecurityManager.honeypot.check()) {
            UIManager.showError('Aktivitas mencurigakan terdeteksi!');
            return;
        }

        isProcessing = true;
        UIManager.showLoading();

        try {
            const cleanUrl = SecurityManager.validateRequest(videoUrl);
            const data = await APIService.fetchVideo(cleanUrl);
            const videoInfo = APIService.parseResponse(data);

            console.log('🎯 Video info for download:', videoInfo);

            const filename = `tiktok_${videoInfo.author || 'video'}_${Date.now()}.mp4`;

            // Method 1: Coba direct download dulu
            console.log('🔄 Method 1: Direct download...');
            try {
                await triggerDirectDownload(videoInfo.url, filename);
                console.log('✅ Direct download success!');
            } catch (directError) {
                console.log('🔄 Direct failed, trying blob method...');
                
                // Method 2: Blob download
                const blobSuccess = await downloadWithBlob(videoInfo.url, filename);
                if (!blobSuccess) {
                    // Method 3: Buka URL di tab baru (fallback)
                    console.log('🔄 Opening video URL in new tab...');
                    window.open(videoInfo.url, '_blank');
                }
            }

            downloadCount++;
            UIManager.updateCounter(downloadCount);
            
            UIManager.showSuccess({
                author: videoInfo.author,
                description: `Video dari @${videoInfo.author} berhasil didownload!`
            });

            return videoInfo;

        } catch (error) {
            console.error('Download error:', error);
            UIManager.showError('Download gagal: ' + error.message);
        } finally {
            isProcessing = false;
            UIManager.hideLoading();
        }
    };

    const debouncedDownload = SecurityManager.debounce(processDownload, 1500);

    return { 
        processDownload: debouncedDownload,
        isProcessing: () => isProcessing
    };
})();
// ============================================
// MODULE 5: EVENT HANDLERS
// ============================================
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
        }
      } catch (error) {
        console.log("Clipboard access denied");
      }
    });
  };

  const initURLValidation = () => {
    document.getElementById("tiktokUrl").addEventListener("input", function () {
      const isValid = URLValidator.validate(this.value);
      this.style.borderColor = isValid ? "#ff9500" : "#ff6b00";
    });
  };

  const initDownloadButton = () => {
    document
      .getElementById("downloadBtn")
      .addEventListener("click", async () => {
        const url = document.getElementById("tiktokUrl").value;
        if (!url) {
          UIManager.showError("Masukkan URL TikTok terlebih dahulu!");
          return;
        }
        await DownloadManager.processDownload(url, selectedQuality);
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

// ============================================
// MODULE 6: APP INITIALIZER
// ============================================
const App = (() => {
  const init = () => {
    SecurityManager.init();
    UIEffects.init();
    EventHandlers.init();

    console.log("🔒 Security features activated");

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

// Initialize App
App.init();
