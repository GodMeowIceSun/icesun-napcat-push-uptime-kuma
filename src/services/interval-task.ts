export class IntervalTask {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  private readonly intervalMs: number;
  private readonly task: () => Promise<void> | void;

  /**
   * 创建可中断的定时任务
   * @param intervalMs 间隔时间（毫秒），默认60秒
   * @param task 要执行的任务函数
   */
  public constructor(task: () => Promise<void> | void, intervalMs: number = 60000) {
    this.intervalMs = intervalMs;
    this.task = task;
  }

  /**
   * 启动定时任务
   */
  start(): void {
    if (this.isRunning) {
      console.warn('[IntervalTask#start] 任务已经在运行中');
      return;
    }

    this.isRunning = true;
    
    // 立即执行一次任务
    this.executeTask().then();
    
    // 设置定时器
    this.intervalId = setInterval(() => {
      this.executeTask().then();
    }, this.intervalMs);
    
    console.log(`[IntervalTask#start] 定时任务已启动，每 ${this.intervalMs / 1000} 秒执行一次`);
  }

  /**
   * 执行任务
   */
  private async executeTask(): Promise<void> {
    try {
      await this.task();
    } catch (error) {
      console.error('[IntervalTask#executeTask] 任务执行出错:', error);
    }
  }

  /**
   * 停止定时任务
   */
  stop(): void {
    if (!this.isRunning) {
      console.warn('[IntervalTask#stop] 任务未在运行');
      return;
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    this.isRunning = false;
    console.log('[IntervalTask#stop] 定时任务已停止');
  }

  /**
   * 检查任务是否正在运行
   */
  get running(): boolean {
    return this.isRunning;
  }
}