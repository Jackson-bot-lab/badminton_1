import React, { useEffect, useState } from 'react';

export default function BossKeyOverlay() {
  const [logs, setLogs] = useState<string[]>([
    '[INFO] 正在初始化部署进程...',
    '[INFO] 连接到生产环境服务器...',
  ]);

  useEffect(() => {
    const msgs = [
      '[INFO] 检查依赖包状态...',
      '[OK] 所有依赖包已是最新版本.',
      '[INFO] 正在构建生产环境产物 (Production Bundle)...',
      '[INFO] 编译 TypeScript 模块...',
      '[INFO] 压缩 JavaScript 代码...',
      '[INFO] 优化静态资源...',
      '[OK] 构建成功.',
      '[INFO] 正在同步至云端高可用集群...'
    ];
    let i = 0;
    const interval = setInterval(() => {
      if (i < msgs.length) {
        setLogs(prev => [...prev, msgs[i]]);
        i++;
      } else {
        setLogs(prev => [
          ...prev, 
          `[LOG] 内存扫描块 0x${Math.floor(Math.random()*1000000).toString(16).toUpperCase()} 稳定性压测通过...`
        ]);
      }
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-[#0c0c0c] text-[#00ff00] font-mono p-6 flex flex-col w-full h-full cursor-default select-none">
      <div className="flex bg-[#222] text-[#ccc] text-xs px-3 py-2 mb-4 border-l-4 border-blue-500">
        <span>root@production_server: ~/system/deploy</span>
      </div>
      <div className="flex-1 overflow-hidden space-y-2 text-sm opacity-90">
        {logs.map((log, i) => (
          <div key={i}>{log}</div>
        ))}
        <div className="animate-pulse">_</div>
      </div>
      <div className="absolute top-4 right-6 text-[#555] text-xs border border-[#555] px-2 py-1 rounded">
        再次按下 空格键(SPACE) 退出
      </div>
    </div>
  );
}
