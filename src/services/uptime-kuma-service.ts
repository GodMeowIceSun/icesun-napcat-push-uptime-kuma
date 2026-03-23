import type {NapCatPluginContext} from 'napcat-types/napcat-onebot/network/plugin/types';
import {UptimeKumaPushParam} from '../types';
import {IntervalTask} from "./interval-task";
import {pluginState} from "../core/state";

export class UptimeKumaService {

    private pushTask: IntervalTask | null = null;

    constructor(private ctx: NapCatPluginContext) {
    }

    startPush(pushUrl: string, intervalS: number) {
        if (this.pushTask) {
            this.pushTask.stop();
            this.pushTask = null;
        }

        const pushParam = this.parsePushUrl(pushUrl);
        if (!pushParam) {
            this.ctx.logger.error('[UptimeKumaService#startPush] 无效的推送URL');
            return;
        }

        this.pushTask = new IntervalTask(() => {
            this.push({
                endpoint: pushParam.endpoint,
                pushToken: pushParam.token,
                payload: {
                    status: pluginState.ctx.core.selfInfo.online ? 'up' : 'down',
                    msg: pluginState.getUptimeFormatted(),
                    ping: pluginState.getUptime() / 1000
                }
            })
        }, intervalS * 1000)
        this.pushTask.start();
    }

    stopPush() {
        if (this.pushTask) {
            this.pushTask.stop();
            this.pushTask = null;
        }
    }


    parsePushUrl(url: string): { endpoint: string; token: string } | null {
        const regex = /^(https?:\/\/[^\/]+)\/api\/push\/([^?]+)/;
        const match = url.match(regex);

        if (!match) {
            return null;
        }

        return {
            endpoint: match[1],
            token: match[2]
        };
    }


    /**
     * 发送 Push 请求到 Uptime Kuma
     * @param param Push参数
     */
    async push(param: UptimeKumaPushParam): Promise<boolean> {
        try {
            // 构建 URL
            const baseUrl = param.endpoint.replace(/\/$/, '');
            const url = new URL(`${baseUrl}/api/push/${param.pushToken}`);

            // 添加查询参数
            url.searchParams.append('status', param.payload.status);
            url.searchParams.append('msg', param.payload.msg);
            url.searchParams.append('ping', param.payload.ping.toString());

            // 发送 GET 请求（Uptime Kuma Push 监控使用 GET）
            this.ctx.logger.log(`[UptimeKumaService#pushStatus] 发送推送请求: ${url.toString()}`);

            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: {
                    'User-Agent': 'icesun-napcat-push-uptime-kuma/1.0.0'
                }
            });

            if (response.ok) {
                this.ctx.logger.log('[UptimeKumaService#pushStatus] 推送成功');
                return true;
            } else {
                this.ctx.logger.error(`[UptimeKumaService#pushStatus] 推送失败: ${response.status} ${response.statusText}`);
                return false;
            }
        } catch (error) {
            this.ctx.logger.error(`[UptimeKumaService#pushStatus] 推送异常: ${error instanceof Error ? error.message : String(error)}`);
            return false;
        }
    }
}
