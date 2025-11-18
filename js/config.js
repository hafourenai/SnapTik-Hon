const APIConfig = (() => {
    const getAPIConfigs = () => {
        const freeApis = [
            {
                name: 'TikWM Direct',
                url: 'https://www.tikwm.com/api/',
                method: 'GET',
                noKey: true
            },
            {
                name: 'TikDown Direct', 
                url: 'https://api.tikdown.org/api',
                method: 'GET',
                noKey: true
            },
            {
                name: 'TikMate Direct',
                url: 'https://www.tikmate.cc/api/',
                method: 'GET', 
                noKey: true
            }
        ];
        return freeApis;
    };

    return { getAPIConfigs };
})();