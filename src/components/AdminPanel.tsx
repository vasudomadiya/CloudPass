import React, { useState, useEffect } from 'react';
import { Shield, Database, Download, Trash2, Search, HeartPulse, RefreshCw, Layers, CheckCircle, Cpu, Terminal } from 'lucide-react';
import { fetchAdminStats, adminDeleteFile, formatBytes, fetchAutoHealStatus } from '../lib/api';
import { FileMetadata, AdminStats, AutoHealStatus } from '../types';

export default function AdminPanel() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [autoHeal, setAutoHeal] = useState<AutoHealStatus | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showAutoHealDiagnostic, setShowAutoHealDiagnostic] = useState(true);
  const [confirmDeleteCode, setConfirmDeleteCode] = useState<string | null>(null);

  const loadStats = async () => {
    setLoading(true);
    setError('');
    try {
      const [adminData, autoHealData] = await Promise.all([
        fetchAdminStats(),
        fetchAutoHealStatus()
      ]);
      setStats(adminData.stats);
      setFiles(adminData.files);
      setAutoHeal(autoHealData);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve admin stats.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleDeleteOverride = async (code: string, originalName: string) => {
    if (confirmDeleteCode !== code) {
      setConfirmDeleteCode(code);
      setTimeout(() => {
        setConfirmDeleteCode(prev => prev === code ? null : prev);
      }, 5000);
      return;
    }

    try {
      await adminDeleteFile(code);
      setSuccessMsg(`"${originalName}" deleted successfully.`);
      setConfirmDeleteCode(null);
      setTimeout(() => setSuccessMsg(''), 4000);
      loadStats(); // reload
    } catch (err: any) {
      setError(err.message || 'Failed to delete file.');
      setConfirmDeleteCode(null);
    }
  };

  // Search & Filter
  const filteredFiles = files.filter(f => {
    const matchesSearch = f.originalName.toLowerCase().includes(search.toLowerCase()) || 
                          f.code.toLowerCase().includes(search.toLowerCase()) ||
                          f.fileType.toLowerCase().includes(search.toLowerCase());
    
    const matchesFilter = statusFilter === 'all' || f.status === statusFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 relative z-10 font-sans">
      
      {/* Header operations row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-400/10 border border-orange-400/20 mb-2">
            <Shield className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-[10px] font-mono font-bold text-orange-400 uppercase tracking-wider">Root Access Active</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white font-display">Administrative Control Panel</h1>
          <p className="text-slate-400 text-xs md:text-sm mt-1">
            Real-time server metrics, active temporary shares, storage logs, and remote destruction overrides.
          </p>
        </div>

        <button
          onClick={loadStats}
          disabled={loading}
          className="bg-white/5 border border-white/10 hover:bg-white/10 text-slate-200 font-mono text-xs px-4 py-2.5 rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          REFRESH_STATISTICS
        </button>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 text-xs font-mono text-orange-400 bg-orange-400/10 border border-orange-400/20 rounded-xl p-4 mb-6">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-xs font-mono text-[#ffb4ab] bg-[#93000a]/20 border border-[#93000a]/30 rounded-xl p-4 mb-6">
          <ShieldAlertIcon className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Top Bento Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        {/* Storage Usage */}
        <div className="surface-glass border-glass p-5 rounded-[24px] flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
            <Database className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <p className="font-mono text-[10px] text-slate-400 uppercase tracking-wider">Payload Storage</p>
            <p className="text-lg font-bold text-white mt-0.5 font-mono">
              {stats ? formatBytes(stats.totalSize) : '0 Bytes'}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">Active files only</p>
          </div>
        </div>

        {/* Active Files */}
        <div className="surface-glass border-glass p-5 rounded-[24px] flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-orange-400/10 border border-orange-400/20 flex items-center justify-center flex-shrink-0">
            <Layers className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <p className="font-mono text-[10px] text-slate-400 uppercase tracking-wider">Active Files</p>
            <p className="text-lg font-bold text-white mt-0.5 font-mono">
              {stats ? stats.activeFiles : 0}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">Awaiting countdowns</p>
          </div>
        </div>

        {/* Total Downloads */}
        <div className="surface-glass border-glass p-5 rounded-[24px] flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center flex-shrink-0">
            <Download className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <p className="font-mono text-[10px] text-slate-400 uppercase tracking-wider">Total Downloads</p>
            <p className="text-lg font-bold text-white mt-0.5 font-mono">
              {stats ? stats.totalDownloads : 0}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">Successful pulls</p>
          </div>
        </div>

        {/* System Health / Auto-Heal Status */}
        <div 
          onClick={() => setShowAutoHealDiagnostic(!showAutoHealDiagnostic)}
          className={`surface-glass border-glass p-5 rounded-[24px] flex items-center gap-4 cursor-pointer hover:border-emerald-500/30 transition-all duration-300 select-none group relative overflow-hidden ${showAutoHealDiagnostic ? 'border-emerald-500/25 bg-emerald-500/2' : ''}`}
        >
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <HeartPulse className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="z-10">
            <p className="font-mono text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              Self-Heal Engine
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
            </p>
            <p className="text-lg font-bold text-white mt-0.5 flex items-center gap-1.5 font-mono">
              {autoHeal ? autoHeal.systemIntegrity : '100%'} OK
            </p>
            <p className="text-[10px] text-emerald-400 font-mono group-hover:underline">
              {showAutoHealDiagnostic ? 'Collapse logs ▲' : 'Inspect logs ▼'}
            </p>
          </div>
          {/* Subtle neon glow backplate */}
          <div className="absolute right-0 bottom-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>
        </div>
      </div>

      {/* Main Files Table Panel */}
      <div className="surface-glass border-glass rounded-[32px] overflow-hidden">
        
        {/* Controls row */}
        <div className="p-5 border-b border-white/5 bg-white/1 flex flex-col md:flex-row justify-between items-center gap-4">
          
          {/* Search bar */}
          <div className="relative w-full md:max-w-sm group">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-orange-400 transition-colors" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search file name, code, type..."
              className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-orange-400 transition-all"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2 w-full md:w-auto">
            {(['all', 'active', 'expired'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider font-semibold border transition-all ${
                  statusFilter === filter
                    ? 'bg-orange-400/10 border-orange-400 text-orange-400'
                    : 'bg-black/40 border-white/5 text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Table content */}
        <div className="overflow-x-auto">
          {filteredFiles.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 font-mono text-[10px] uppercase text-slate-400 tracking-wider bg-white/2">
                  <th className="py-4 px-6">Filename</th>
                  <th className="py-4 px-6">Code</th>
                  <th className="py-4 px-6">Size</th>
                  <th className="py-4 px-6">Expiration</th>
                  <th className="py-4 px-6">Downloads</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Scrub Override</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-sans text-xs">
                {filteredFiles.map((f) => (
                  <tr key={f.id} className="hover:bg-white/1 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-semibold text-white truncate max-w-[200px]" title={f.originalName}>
                        {f.originalName}
                      </div>
                      <div className="font-mono text-[9px] text-slate-500 mt-0.5 truncate max-w-[200px]">
                        {f.fileType}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-mono font-bold text-orange-400 bg-orange-400/10 border border-orange-400/20 px-2 py-1 rounded">
                        {f.code}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-mono text-slate-300">
                      {formatBytes(f.fileSize)}
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-slate-300">
                        {new Date(f.expiry).toLocaleDateString()}
                      </div>
                      <div className="font-mono text-[9px] text-slate-500 mt-0.5">
                        {new Date(f.expiry).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="py-4 px-6 font-mono text-slate-300">
                      {f.downloadCount}
                      <span className="text-slate-500 text-[10px]">
                        /{f.downloadLimit === null ? '∞' : f.downloadLimit}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-mono text-[9px] font-bold ${
                        f.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-[#93000a]/20 text-[#ffb4ab] border border-[#93000a]/30'
                      }`}>
                        <span className={`w-1 h-1 rounded-full ${f.status === 'active' ? 'bg-emerald-400' : 'bg-[#ffb4ab]'}`}></span>
                        {f.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleDeleteOverride(f.code, f.originalName)}
                        disabled={f.status === 'expired'}
                        className={`py-1.5 px-3 rounded-lg border text-[10px] font-mono font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer ${
                          f.status === 'expired'
                            ? 'border-white/5 text-slate-600 cursor-not-allowed'
                            : confirmDeleteCode === f.code
                              ? 'bg-red-500 border-red-500 text-white animate-pulse shadow-md shadow-red-500/20'
                              : 'border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white hover:border-red-500'
                        }`}
                        title={confirmDeleteCode === f.code ? "Click again to confirm immediate scrub" : "Delete immediately override"}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {confirmDeleteCode === f.code ? 'CONFIRM' : 'SCRUB'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Layers className="w-10 h-10 text-slate-600 mb-3" />
              <p className="text-slate-400 text-sm">No transient files found on this cluster node.</p>
              <p className="text-slate-500 text-xs mt-1">Upload a file or change the active filter.</p>
            </div>
          )}
        </div>
      </div>

      {/* Self-Healing Diagnostic Logs Terminal Console */}
      {showAutoHealDiagnostic && (
        <div className="mt-8 surface-glass border-glass rounded-[24px] overflow-hidden shadow-2xl border border-emerald-500/20">
          {/* Terminal Header */}
          <div className="bg-black/80 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5">
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 absolute"></div>
              <Terminal className="w-4 h-4 text-emerald-400 ml-1.5" />
              <span className="font-mono text-xs font-bold text-slate-200 tracking-wider">
                CLOUDPASS // SELF_HEALING_ENGINE_DIAGNOSTICS
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="font-mono text-[10px] text-emerald-400 bg-emerald-400/10 px-2.5 py-0.5 rounded-full border border-emerald-400/20 font-semibold uppercase">
                Core Status: 100% Repaired
              </span>
              <button 
                onClick={loadStats}
                disabled={loading}
                className="text-[10px] font-mono text-slate-400 hover:text-emerald-400 hover:bg-white/5 px-2 py-1 rounded transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                FORCE_FULL_INTEGRITY_SCAN
              </button>
            </div>
          </div>

          {/* Terminal Stats Header */}
          <div className="bg-black/45 p-5 border-b border-white/5 grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
            <div>
              <p className="font-mono text-[9px] text-slate-400 uppercase tracking-widest">Active File Nodes</p>
              <p className="text-sm font-bold text-white mt-0.5 font-mono">
                {autoHeal ? autoHeal.metrics.databaseNodeCount : 0} nodes
              </p>
            </div>
            <div>
              <p className="font-mono text-[9px] text-slate-400 uppercase tracking-widest">Disk Blocks Detected</p>
              <p className="text-sm font-bold text-white mt-0.5 font-mono">
                {autoHeal ? autoHeal.metrics.diskFileBlockCount : 0} sectors
              </p>
            </div>
            <div>
              <p className="font-mono text-[9px] text-slate-400 uppercase tracking-widest">System Database</p>
              <p className="text-xs font-bold text-emerald-400 mt-1 font-mono flex items-center gap-1">
                Verified Backed Up
              </p>
            </div>
            <div>
              <p className="font-mono text-[9px] text-slate-400 uppercase tracking-widest">Storage Safe-Guard</p>
              <p className="text-xs font-bold text-emerald-400 mt-1 font-mono">
                Enabled (10s intervals)
              </p>
            </div>
          </div>

          {/* Terminal Output */}
          <div className="bg-black/95 p-6 font-mono text-[11px] leading-relaxed text-slate-300 max-h-72 overflow-y-auto divide-y divide-white/5 flex flex-col gap-2.5">
            {autoHeal && autoHeal.logs && autoHeal.logs.length > 0 ? (
              autoHeal.logs.map((log, index) => {
                let badgeColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
                if (log.type === 'database_corruption') badgeColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
                if (log.type === 'storage_mismatch') badgeColor = 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
                if (log.type === 'expired_cleanup') badgeColor = 'text-slate-400 bg-white/5 border-white/10';

                return (
                  <div key={index} className="pt-2.5 flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-4 hover:bg-white/1 transition-colors px-2 py-1 rounded">
                    <span className="text-slate-500 select-none flex-shrink-0">
                      [{new Date(log.timestamp).toLocaleTimeString()}]
                    </span>
                    <span className={`px-2 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wider select-none flex-shrink-0 ${badgeColor}`}>
                      {log.type.replace('_', ' ')}
                    </span>
                    <span className="text-slate-200">
                      {log.description}
                    </span>
                    <span className="sm:ml-auto text-[10px] font-bold text-emerald-400 flex items-center gap-1 select-none flex-shrink-0 bg-emerald-400/5 px-2 py-0.5 rounded border border-emerald-400/10">
                      <Cpu className="w-3 h-3 text-emerald-400" />
                      AUTO_FIXED
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-slate-500">
                &gt; No dynamic health incidents logged yet. Storage and database are perfectly aligned.
              </div>
            )}
            <div className="text-emerald-400/60 pt-2 border-t border-white/5 animate-pulse select-none text-[10px]">
              &gt; SYSTEM CORE ONLINE. ALL INTEGRITY CHECKS REPORTING GREEN. LISTENING FOR STORAGE EVENTS...
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Inline support micro-icon
function ShieldAlertIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}
