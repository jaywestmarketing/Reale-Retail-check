import React, { useState, useEffect } from 'react';
import { X, Copy, Check, FileCode, Download } from 'lucide-react';
import { exportMechanismFiles } from '../api';

interface CodeModalProps {
  mechanismId: string | null;
  onClose: () => void;
}

export const CodeModal: React.FC<CodeModalProps> = ({ mechanismId, onClose }) => {
  const [files, setFiles] = useState<{ filename: string; content: string; language: string }[]>([]);
  const [activeFileIdx, setActiveFileIdx] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!mechanismId) return;
    setIsLoading(true);
    exportMechanismFiles(mechanismId)
      .then((res) => {
        setFiles(res.files || []);
        setActiveFileIdx(0);
      })
      .catch((e) => console.error(e))
      .finally(() => setIsLoading(false));
  }, [mechanismId]);

  if (!mechanismId) return null;

  const currentFile = files[activeFileIdx];

  const handleCopy = () => {
    if (!currentFile) return;
    navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!currentFile) return;
    const blob = new Blob([currentFile.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFile.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-800 max-w-4xl w-full overflow-hidden transition-all flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold text-slate-200">
              Export Mechanism Source: <span className="font-mono text-amber-300">{mechanismId}</span>
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* File tabs bar */}
        <div className="px-5 py-2 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between gap-3 overflow-x-auto">
          <div className="flex items-center gap-1.5">
            {files.map((f, i) => (
              <button
                key={f.filename}
                onClick={() => setActiveFileIdx(i)}
                className={`px-3 py-1 text-xs font-mono rounded-md transition-colors cursor-pointer ${
                  activeFileIdx === i
                    ? 'bg-slate-800 text-amber-300 border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {f.filename}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors cursor-pointer"
            >
              <Download className="w-3 h-3" />
              <span>Download File</span>
            </button>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-900 bg-amber-400 hover:bg-amber-300 rounded transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3 h-3 text-slate-900" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy Code'}</span>
            </button>
          </div>
        </div>

        {/* Code View */}
        <div className="flex-1 p-5 overflow-auto bg-slate-950 font-mono text-xs text-slate-200">
          {isLoading ? (
            <div className="h-64 flex items-center justify-center text-slate-500">
              Loading source files...
            </div>
          ) : currentFile ? (
            <pre className="leading-relaxed whitespace-pre font-mono">
              {currentFile.content}
            </pre>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-500">
              No files available.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
