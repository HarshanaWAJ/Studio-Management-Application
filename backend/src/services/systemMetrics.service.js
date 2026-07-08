import os from "os";

// ─────────────────────────────────────────────────────────────────────────────
// Whole-server resource metrics for the Super Admin dashboard. Since every
// studio shares this single Node process, CPU/RAM is reported at the server
// level (not faked as per-tenant) — per-studio load is instead represented by
// its API request volume (see usage.service.js), which is the honest signal
// available in a shared-process deployment.
// ─────────────────────────────────────────────────────────────────────────────

let prevCpuSample = null;

// Non-blocking CPU usage % since the last time this was called (falls back to
// a short instantaneous sample on the very first call).
const sampleCpuUsagePercent = () => {
    const cpus = os.cpus();
    const totals = cpus.reduce(
        (acc, cpu) => {
            for (const t of Object.values(cpu.times)) acc.total += t;
            acc.idle += cpu.times.idle;
            return acc;
        },
        { idle: 0, total: 0 }
    );

    if (!prevCpuSample) {
        prevCpuSample = totals;
        return null; // no delta yet
    }

    const idleDiff = totals.idle - prevCpuSample.idle;
    const totalDiff = totals.total - prevCpuSample.total;
    prevCpuSample = totals;

    if (totalDiff <= 0) return null;
    return Math.max(0, Math.min(100, Math.round((1 - idleDiff / totalDiff) * 1000) / 10));
};

export const getSystemMetrics = () => {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const mem = process.memoryUsage();

    return {
        timestamp: new Date().toISOString(),
        cpu: {
            cores: os.cpus().length,
            model: os.cpus()[0]?.model || "unknown",
            usagePercent: sampleCpuUsagePercent(), // null on first call
            loadAverage1m: os.loadavg()[0],
        },
        memory: {
            totalMB: Math.round(totalMem / 1024 / 1024),
            usedMB: Math.round(usedMem / 1024 / 1024),
            freeMB: Math.round(freeMem / 1024 / 1024),
            usagePercent: Math.round((usedMem / totalMem) * 1000) / 10,
        },
        process: {
            uptimeSeconds: Math.round(process.uptime()),
            rssMB: Math.round(mem.rss / 1024 / 1024),
            heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
            heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
        },
        node: process.version,
        platform: `${os.platform()} ${os.release()}`,
    };
};
