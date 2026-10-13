import React, { useState } from 'react';
import {
  Github,
  X,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Download,
  Terminal,
} from 'lucide-react';
import { pushToGitHub } from '../api';
import { GitHubPushResponse } from '../types';

interface GitHubPushModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GitHubPushModal: React.FC<GitHubPushModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [repo, setRepo] = useState<string>('my-org/autonomous-mechanisms');
  const [branch, setBranch] = useState<string>('main');
  const [token, setToken] = useState<string>('');
  const [commitMessage, setCommitMessage] = useState<string>(
    'Feat: Export Autonomous Category Scanner mechanism and checkpoints'
  );
  const [includeScans, setIncludeScans] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [pushResult, setPushResult] = useState<GitHubPushResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  const handlePush = async () => {
    setIsLoading(true);
    setErrorMsg('');
    setPushResult(null);
    try {
      const res = await pushToGitHub({
        repo: repo.trim(),
        branch: branch.trim(),
        token: token.trim(),
        commitMessage: commitMessage.trim(),
        includeScans,
      });
      setPushResult(res);
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to push to GitHub');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
              <Github className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Push System Files to GitHub Repository
              </h3>
              <p className="text-xs text-slate-500">
                Exports mechanisms, contracts, and scan checkpoints safely
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Inputs */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              GitHub Repository (owner/repo)
            </label>
            <input
              type="text"
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              placeholder="e.g. username/omniprice-scanners"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Branch
              </label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="main"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                GitHub Personal Access Token (Optional)
              </label>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxx"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Commit Message
            </label>
            <input
              type="text"
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="includeScans"
              checked={includeScans}
              onChange={(e) => setIncludeScans(e.target.checked)}
              className="rounded accent-indigo-600 cursor-pointer"
            />
            <label htmlFor="includeScans" className="text-xs text-slate-700 cursor-pointer">
              Include latest category scan checkpoint JSON files (/data/category_scans/)
            </label>
          </div>
        </div>

        {/* Mechanism Architecture Boundary Notice */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-600 space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-slate-900">
            <FileCode className="w-3.5 h-3.5 text-indigo-600" />
            <span>Files Packaged for Export:</span>
          </div>
          <p className="text-[11px] text-slate-500">
            • <code>long_running_scanner_mechanism.py</code> (Autonomous Category Engine)<br />
            • <code>contracts.py</code> (Interchangeable Mechanism Contract)<br />
            • <code>execution_continuity_adapter.py</code> (403 Ingress Gateway)<br />
            • <code>crawler_mechanism.py</code> &amp; Checkpoints metadata
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {pushResult && (
          <div className="p-3.5 bg-emerald-50 text-emerald-900 text-xs rounded-xl border border-emerald-200 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-emerald-800">
              <CheckCircle2 className="w-4 h-4" />
              <span>{pushResult.message}</span>
            </div>

            {pushResult.git_commands && (
              <div className="bg-slate-900 text-slate-200 p-2.5 rounded-lg font-mono text-[11px] overflow-x-auto space-y-1">
                {pushResult.git_commands.map((cmd, i) => (
                  <div key={i}>{cmd}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer Buttons */}
        <div className="pt-2 flex items-center justify-between border-t border-slate-100">
          <a
            href="/api/github/export-bundle"
            download
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Download Ready Bundle</span>
          </a>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handlePush}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{isLoading ? 'Pushing Files...' : token ? 'Push to GitHub' : 'Prepare & Stage Files'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
