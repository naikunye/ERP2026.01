
import PocketBase from 'pocketbase';

// Key for LocalStorage
export const LS_SERVER_KEY = 'custom_server_url';

// 1. 优先读取 LocalStorage (用户在设置界面手动配置的地址)
// 2. 其次读取环境变量 (VITE_API_URL)
// 3. 最后回退到默认腾讯云地址
const getBaseUrl = () => {
    try {
        const custom = localStorage.getItem(LS_SERVER_KEY);
        if (custom) return custom;
    } catch(e) {}
    
    return (import.meta as any).env?.VITE_API_URL || 'http://119.28.72.106:8090';
}

export const SERVER_URL = getBaseUrl();

console.log(`📡 Connecting to Cloud Server: ${SERVER_URL}`);

export const pb = new PocketBase(SERVER_URL);

// Disable auto-cancellation for smoother dashboard loading
pb.autoCancellation(false);

export const isCloudConnected = async () => {
    try {
        // 设置较短的超时时间，以免在服务器离线时阻塞页面太久
        const health = await pb.health.check({ requestKey: null });
        return health.code === 200;
    } catch (e) {
        console.warn("Cloud Server Connection Failed:", e);
        return false;
    }
};

export const updateServerUrl = (url: string) => {
    localStorage.setItem(LS_SERVER_KEY, url);
    pb.baseUrl = url;
};
