
import PocketBase from 'pocketbase';

// 1. 优先读取环境变量 (VITE_API_URL)
// 2. 如果没有环境变量，默认使用您提供的腾讯云 PocketBase 地址
// Fix: Property 'env' does not exist on type 'ImportMeta'
const SERVER_URL = (import.meta as any).env?.VITE_API_URL || 'http://119.28.72.106:8090';

console.log(`📡 Connecting to Cloud Server: ${SERVER_URL}`);

export const pb = new PocketBase(SERVER_URL);

// Disable auto-cancellation for smoother dashboard loading
pb.autoCancellation(false);

export const isCloudConnected = async () => {
    try {
        // 设置较短的超时时间，以免在服务器离线时阻塞页面太久
        // 注意：如果您的前端部署在 HTTPS 环境 (如 Vercel)，浏览器可能会阻止连接 HTTP 服务器 (混合内容错误)
        // 建议将来为您的腾讯云服务器配置 SSL 证书
        const health = await pb.health.check({ requestKey: null });
        return health.code === 200;
    } catch (e) {
        console.warn("Cloud Server Connection Failed:", e);
        return false;
    }
};
