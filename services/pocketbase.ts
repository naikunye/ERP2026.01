
import PocketBase from 'pocketbase';

// ⚠️ 请将下方的 URL 替换为你腾讯云服务器的公网 IP 地址
// 例如: 'http://123.45.67.89:8090'
const SERVER_URL = 'http://YOUR_TENCENT_IP:8090'; 

export const pb = new PocketBase(SERVER_URL);

// Disable auto-cancellation for smoother dashboard loading
pb.autoCancellation(false);

export const isCloudConnected = async () => {
    try {
        const health = await pb.health.check();
        return health.code === 200;
    } catch (e) {
        return false;
    }
};
