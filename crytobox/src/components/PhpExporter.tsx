/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { PHP_CODE_FILES } from "./PhpExporterCode";
import { Copy, Check, FileCode, ArrowDownToLine, Info, Terminal, Database } from "lucide-react";

export default function PhpExporter() {
  const [selectedFileKey, setSelectedFileKey] = useState<string>("schema");
  const [copied, setCopied] = useState<boolean>(false);

  const selectedFile = PHP_CODE_FILES[selectedFileKey] || PHP_CODE_FILES.schema;

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSingle = () => {
    const blob = new Blob([selectedFile.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = selectedFile.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div id="php-exporter-panel" className="w-full glass-panel rounded-3xl border border-white/5 overflow-hidden shadow-glass">
      {/* Exporter Banner */}
      <div className="p-6 bg-gradient-to-r from-brand-primary/20 via-brand-secondary/10 to-transparent border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="px-2.5 py-1 text-[10px] font-bold text-brand-secondary border border-brand-secondary/20 bg-brand-secondary/5 rounded-full uppercase tracking-wider">
            InfinityFree & ProFreeHost Compatible
          </span>
          <h2 className="font-display font-bold text-2xl text-white mt-1.5">
            PHP & MySQL Shared Hosting Codebase
          </h2>
          <p className="text-gray-400 text-sm mt-1 leading-relaxed max-w-2xl">
            Download or copy the exact server-side PHP scripts and SQL schemas requested. These scripts require no Node.js/Docker and run natively on standard cPanel Apache environments.
          </p>
        </div>

        <button
          id="dl-schema-btn"
          onClick={() => {
            // Trigger download for all files sequentially or display a quick prompt
            const blob = new Blob([PHP_CODE_FILES.schema.content], { type: "text/plain" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "schema.sql";
            link.click();
          }}
          className="flex items-center gap-2 px-5 py-3 rounded-xl font-display font-bold text-xs text-brand-bg bg-brand-accent hover:opacity-90 transition-all cursor-pointer shadow-neon-green"
        >
          <Database className="w-4 h-4" />
          <span>Export MySQL Schema</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* Navigation files list */}
        <div className="lg:col-span-3 border-r border-white/5 bg-black/10 p-4">
          <span className="text-[10px] font-bold text-gray-500 font-mono tracking-wider uppercase block mb-3 px-2">
            Workspace Files
          </span>

          <div className="flex flex-col gap-1">
            {Object.entries(PHP_CODE_FILES).map(([key, item]) => {
              const isSelected = key === selectedFileKey;
              return (
                <button
                  key={key}
                  id={`file-tab-${key}`}
                  onClick={() => setSelectedFileKey(key)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs transition-all cursor-pointer ${
                    isSelected
                      ? "bg-brand-primary/10 border border-brand-primary/20 text-white font-semibold"
                      : "border border-transparent text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <FileCode className={`w-4 h-4 flex-shrink-0 ${isSelected ? "text-brand-secondary" : "text-gray-500"}`} />
                  <span className="truncate">{item.filename}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-8 p-4 bg-brand-secondary/5 border border-brand-secondary/10 rounded-2xl">
            <h5 className="text-white text-xs font-bold flex items-center gap-1.5 mb-2">
              <Info className="w-4 h-4 text-brand-secondary" />
              <span>Hosting Instructions</span>
            </h5>
            <ol className="text-[11px] text-gray-400 leading-relaxed list-decimal pl-4 space-y-2">
              <li>Import the <strong className="text-white">schema.sql</strong> in your cPanel phpMyAdmin database manager.</li>
              <li>Edit <strong className="text-white">db.php</strong> with your database name, host, user and passcode.</li>
              <li>Upload all files directly inside your host's <strong className="text-white">htdocs/</strong> or <strong className="text-white">public_html/</strong> directory.</li>
            </ol>
          </div>
        </div>

        {/* Code display screen */}
        <div className="lg:col-span-9 flex flex-col bg-brand-bg/50">
          {/* Action bar */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-white/5 bg-black/20">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-brand-primary" />
              <span className="text-xs font-mono text-gray-400">
                Viewing: <strong className="text-white">{selectedFile.filename}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="copy-code-btn"
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-white/5 bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 text-xs font-medium transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-brand-accent" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied!" : "Copy Code"}</span>
              </button>

              <button
                id="download-code-btn"
                onClick={handleDownloadSingle}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-brand-primary/20 bg-brand-primary/10 text-brand-secondary hover:bg-brand-primary/20 text-xs font-semibold transition-colors cursor-pointer"
              >
                <ArrowDownToLine className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>
            </div>
          </div>

          {/* Actual Code area */}
          <div className="p-6 overflow-auto max-h-[500px]">
            <pre className="text-left font-mono text-xs leading-normal text-gray-300 select-all whitespace-pre">
              <code>{selectedFile.content}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
