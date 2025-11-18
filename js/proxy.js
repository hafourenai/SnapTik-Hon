const ProxyService = (() => {
    const CORS_PROXIES = [
        'https://cors-anywhere.herokuapp.com/',
        'https://api.codetabs.com/v1/proxy?quest=',
        'https://corsproxy.io/?'
    ];

    const withProxy = async (url, options = {}) => {
        for (let proxy of CORS_PROXIES) {
            try {
                const proxyUrl = proxy + encodeURIComponent(url);
                const response = await fetch(proxyUrl, {
                    method: options.method || 'GET',
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        ...options.headers
                    },
                    ...options
                });
                
                if (response.ok) {
                    return response;
                }
            } catch (error) {
                console.log(`Proxy ${proxy} failed:`, error.message);
                continue;
            }
        }
        throw new Error('All proxies failed');
    };

    return { withProxy };
})();