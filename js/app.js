// ============================================
// MODULE 1: UI EFFECTS & ANIMATIONS
// ============================================
const UIEffects = (() => {
    const initStarfield = () => {
        const starfield = document.getElementById('starfield');
        starfield.innerHTML = '';
        
        for (let i = 0; i < 100; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            star.style.width = Math.random() * 3 + 'px';
            star.style.height = star.style.width;
            star.style.left = Math.random() * 100 + '%';
            star.style.top = Math.random() * 100 + '%';
            star.style.animationDelay = Math.random() * 3 + 's';
            starfield.appendChild(star);
        }
    };

    const initFloatingShapes = () => {
        const oldShapes = document.querySelectorAll('.floating-shape');
        oldShapes.forEach(shape => shape.remove());
        
        for (let i = 0; i < 5; i++) {
            const shape = document.createElement('div');
            shape.className = 'floating-shape';
            const size = Math.random() * 100 + 50;
            shape.style.width = size + 'px';
            shape.style.height = size + 'px';
            shape.style.left = Math.random() * 100 + '%';
            shape.style.top = Math.random() * 100 + '%';
            shape.style.borderColor = ['#ff9500', '#ffcc00', '#ff6b00'][Math.floor(Math.random() * 3)];
            shape.style.animationDelay = Math.random() * 3 + 's';
            shape.style.animationDuration = (Math.random() * 10 + 10) + 's';
            
            if (Math.random() > 0.5) {
                shape.style.borderRadius = '50%';
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
// MODULE 2: API SERVICE - HD QUALITY FIX
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
                
                // Build URL dengan parameter
                const requestUrl = `${api.url}?url=${encodeURIComponent(videoUrl)}`;
                
                const options = {
                    method: api.method,
                    url: requestUrl,
                    timeout: 20000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                };

                console.log(`📡 Request to: ${api.name}`);
                const response = await axios(options);
                
                console.log(`✅ Success with ${api.name}`);
                SecurityManager.setCachedData(videoUrl, response.data);
                return response.data;
                
            } catch (error) {
                console.warn(`❌ ${api.name} failed:`, error.message);
            }
        }

        throw new Error('Semua API gagal. Coba URL TikTok yang berbeda atau refresh halaman.');
    };

    const parseResponse = (data) => {
        console.log('📊 API Response:', data);
        
        let videoUrl = '';
        let quality = 'hd';
        
        // TikWM API format - Cari quality terbaik
        if (data && data.data) {
            // Prioritaskan HD/quality tertinggi
            if (data.data.play) {
                videoUrl = data.data.play; // Biasanya ini HD
                console.log('🎯 Using play URL (HD)');
            } else if (data.data.wmplay) {
                videoUrl = data.data.wmplay; // Watermark version
                console.log('🎯 Using wmplay URL');
            } else if (data.data.hdplay) {
                videoUrl = data.data.hdplay; // HD specific
                console.log('🎯 Using hdplay URL (HIGH QUALITY)');
            }
            
            if (videoUrl) {
                return {
                    url: videoUrl,
                    quality: quality,
                    watermark: false,
                    duration: data.data.duration,
                    author: data.data.author?.unique_id || data.data.author?.nickname,
                    description: data.data.title
                };
            }
        }
        
        // TikDown API format
        if (data && data.play) {
            return {
                url: data.play,
                quality: 'hd', 
                watermark: false,
                duration: data.duration,
                author: data.author,
                description: data.title
            };
        }

        // SnapTik API format  
        if (data && data.video_url) {
            return {
                url: data.video_url,
                quality: 'hd',
                watermark: false, 
                duration: data.duration,
                author: data.author,
                description: data.title
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
        document.getElementById('loading').classList.add('active');
        document.getElementById('statusMessage').style.display = 'none';
    };

    const hideLoading = () => {
        document.getElementById('loading').classList.remove('active');
    };

    const showSuccess = (videoInfo) => {
        const statusMsg = document.getElementById('statusMessage');
        statusMsg.className = 'status-message success';
        statusMsg.textContent = `✓ Download berhasil! Video dari @${videoInfo.author || 'unknown'}`;
    };

    const showError = (message) => {
        const statusMsg = document.getElementById('statusMessage');
        statusMsg.className = 'status-message error';
        statusMsg.textContent = `✗ Error: ${message}`;
    };

    const updateCounter = (count) => {
        const counter = document.getElementById('totalDownloads');
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
// MODULE 4: DOWNLOAD MANAGER - EXTREME HD VERSION
// ============================================
const DownloadManager = (() => {
    let downloadCount = 0;
    let isProcessing = false;

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
            
            // 🚀 SOLUSI EXTREME: Langsung gunakan external HD downloader
            console.log('🚀 Using extreme HD solution...');
            
            const hdServices = [
                `https://ssstik.io/en?url=${encodeURIComponent(cleanUrl)}`,
                `https://snaptik.app/process?url=${encodeURIComponent(cleanUrl)}`,
                `https://tikfast.io/en?url=${encodeURIComponent(cleanUrl)}`
            ];
            
            // Buka SEMUA HD services di tab baru dengan delay
            hdServices.forEach((service, index) => {
                setTimeout(() => {
                    window.open(service, '_blank');
                }, index * 500); // Delay 500ms antara setiap tab
            });
            
            downloadCount++;
            UIManager.updateCounter(downloadCount);
            
            // Show success message dengan info services
            const statusMsg = document.getElementById('statusMessage');
            statusMsg.className = 'status-message success';
            statusMsg.innerHTML = `
                ✓ <strong>HD Downloaders Dibuka!</strong><br>
                • SSSTik.io (HD Recommended)<br>
                • SnapTik.app<br>  
                • TikFast.io<br>
                <small>Silakan coba satu per satu untuk quality terbaik</small>
            `;

            return {
                url: hdServices[0],
                quality: 'ultra_hd',
                watermark: false,
                author: 'multiple_services',
                description: 'Multiple HD downloaders opened'
            };

        } catch (error) {
            console.error('Download error:', error);
            UIManager.showError('Error: ' + error.message);
            throw error;
        } finally {
            isProcessing = false;
            UIManager.hideLoading();
        }
    };

    const debouncedDownload = SecurityManager.debounce(processDownload, 1000);

    return { 
        processDownload: debouncedDownload,
        isProcessing: () => isProcessing
    };
})();

// ============================================
// MODULE 5: EVENT HANDLERS - QUALITY FIX
// ============================================
const EventHandlers = (() => {
    let selectedQuality = 'hd';

    const initQualitySelector = () => {
        document.querySelectorAll('.quality-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.quality-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                selectedQuality = this.dataset.quality;
                
                // Show quality feedback
                const statusMsg = document.getElementById('statusMessage');
                statusMsg.className = 'status-message success';
                statusMsg.textContent = `Quality set to: ${selectedQuality.toUpperCase()}`;
                statusMsg.style.display = 'block';
                
                setTimeout(() => {
                    statusMsg.style.display = 'none';
                }, 2000);
            });
        });
    };

    // ... rest of the code sama
})();

// ============================================
// MODULE 6: APP INITIALIZER
// ============================================
const App = (() => {
    const init = () => {
        SecurityManager.init();
        UIEffects.init();
        EventHandlers.init();

        console.log('🔒 Security features activated');
        
        addSecurityBadge();
    };

    const addSecurityBadge = () => {
        const badge = document.createElement('div');
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
        badge.innerHTML = '🍯 SECURED';
        badge.title = 'Protected by Honey Security';
        
        badge.onmouseover = () => {
            badge.style.background = 'rgba(255, 149, 0, 0.3)';
            badge.style.boxShadow = '0 0 20px rgba(255, 149, 0, 0.5)';
        };
        badge.onmouseout = () => {
            badge.style.background = 'rgba(255, 149, 0, 0.1)';
            badge.style.boxShadow = 'none';
        };
        
        document.body.appendChild(badge);
    };

    return { init };
})();

// Initialize App
App.init();