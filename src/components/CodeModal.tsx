import React, { useState, useEffect } from 'react';
import { X, Copy, Check, FileCode2, Download } from 'lucide-react';
import { getMechanismCode } from '../api';

interface CodeModalProps {
  mechanismId: string | null;
  onClose: () => void;
}

export const CodeModal: React.FC<CodeModalProps> = ({
  mechanismId,
  onClose,
}) => {
  const [files, setFiles] = useState<{ filename: string; content: string; language: string }[]>([]);
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!mechanismId) return;
    setLoading(true);
    getMechanismCode(mechanismId)
      .then((res) => {
        setFiles(res.files || []);
        setActiveFileIndex(0);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [mechanismId]);

  if (!mechanismId) return null;

  const currentFile = files[activeFileIndex];

  const handleCopy = () => {
    if (!currentFile) return;
    navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <FileCode2 className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Independent Mechanism Source Export
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                {mechanismId}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* File Tabs */}
        {files.length > 1 && (
          <div className="flex gap-2 border-b border-slate-100 pb-2 flex-shrink-0">
            {files.map((f, i) => (
              <button
                key={f.filename}
                onClick={() => setActiveFileIndex(i)}
                className={`px-3 py-1 text-xs font-mono rounded-lg transition-all cursor-pointer ${
                  activeFileIndex === i
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.filename}
              </button>
            ))}
          </div>
        )}

        {/* Code Content */}
        <div className="flex-1 overflow-auto bg-slate-950 text-slate-200 p-4 rounded-xl font-mono text-xs leading-relaxed border border-slate-800">
          {loading ? (
            <div className="text-slate-500 text-center py-10">Loading mechanism files...</div>
          ) : currentFile ? (
            <pre className="whitespace-pre">{currentFile.content}</pre>
          ) : (
            <div className="text-slate-500 text-center py-10">No file content available</div>
          )}
        </div>

        <div className="pt-2 flex items-center justify-between flex-shrink-0">
          <span className="text-[11px] text-slate-500">
            Conforms to Interchangeable Autonomous Mechanism Architecture
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
