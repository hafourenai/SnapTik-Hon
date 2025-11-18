const APIConfig = (() => {
    const getAPIConfigs = () => {
        // 🔥 GUNAKAN APIs YANG SUPPORT HD
        const freeApis = [
            {
                name: 'TikWM API - HD',
                url: 'https://www.tikwm.com/api/',
                method: 'GET',
                noKey: true,
                quality: 'hd'
            },
            {
                name: 'TikDown API - HD', 
                url: 'https://api.tikdown.org/api',
                method: 'GET',
                noKey: true,
                quality: 'hd'
            },
            {
                name: 'TikMate API - HD',
                url: 'https://www.tikmate.cc/api/',
                method: 'GET',
                noKey: true, 
                quality: 'hd'
            },
            {
                name: 'SnapTik API - HD',
                url: 'https://snaptik.app/api/',
                method: 'GET',
                noKey: true,
                quality: 'hd'
            }
        ];

        return freeApis;
    };

    const validateConfig = () => {
        return {
            valid: true,
            message: '✅ Using HD TikTok APIs',
            hasBackup: true
        };
    };

    return {
        getAPIConfigs: getAPIConfigs,
        validateConfig: validateConfig
    };
})();