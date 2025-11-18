const SecurityManager = (() => {
    const rateLimiter = {
        requests: [],
        maxRequests: 5,
        timeWindow: 60000,
        
        canMakeRequest() {
            const now = Date.now();
            this.requests = this.requests.filter(time => now - time < this.timeWindow);
            
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
        }
    };

    let debounceTimer = null;
    const debounce = (func, delay = 2000) => {
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
            timestamp: Date.now()
        });
    };

    const sanitizeURL = (url) => {
        const cleaned = url.trim();
        const dangerous = /<script|javascript:|onerror=|onclick=/i;
        if (dangerous.test(cleaned)) {
            throw new Error('URL mengandung konten berbahaya!');
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
            throw new Error('URL TikTok tidak valid!');
        }

        return cleanURL;
    };

    const honeypot = {
        element: null,
        
        create() {
            const input = document.createElement('input');
            input.type = 'text';
            input.name = 'website';
            input.style.position = 'absolute';
            input.style.left = '-9999px';
            input.tabIndex = -1;
            input.autocomplete = 'off';
            document.body.appendChild(input);
            this.element = input;
        },
        
        check() {
            return !this.element || this.element.value === '';
        }
    };

    const createTimeoutPromise = (promise, timeout = 15000) => {
        return Promise.race([
            promise,
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Request timeout')), timeout)
            )
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
        init
    };
})();

const URLValidator = (() => {
    const patterns = [
        /https?:\/\/(www\.)?tiktok\.com\/@.+\/video\/\d+/,
        /https?:\/\/(vm\.|vt\.)?tiktok\.com\/.+/,
        /https?:\/\/tiktok\.com\/t\/[a-zA-Z0-9]+/
    ];

    const validate = (url) => {
        return patterns.some(pattern => pattern.test(url));
    };

    return { validate };
})();