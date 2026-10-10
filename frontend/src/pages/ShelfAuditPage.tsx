import React, { useState, useEffect } from 'react';
import {
  Camera, UploadCloud, Eye, Download, Sparkles, CheckCircle2,
  AlertTriangle, Clock, Layers, ArrowRight, RefreshCw, ZoomIn
} from 'lucide-react';
import { uploadShelfAudit, getShelfAudits } from '../services/api';
import { ShelfAudit } from '../types';

export const ShelfAuditPage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [aisle, setAisle] = useState<string>('Aisle 1');
  const [shelf, setShelf] = useState<string>('Shelf B2');
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [activeAudit, setActiveAudit] = useState<ShelfAudit | null>(null);
  const [audits, setAudits] = useState<ShelfAudit[]>([]);
  const [viewMode, setViewMode] = useState<'annotated' | 'raw'>('annotated');

  useEffect(() => {
    loadAudits();
  }, []);

  const loadAudits = async () => {
    try {
      const data = await getShelfAudits();
      setAudits(data);
      if (data.length > 0 && !activeAudit) {
        setActiveAudit(data[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setSelectedFile(f);
      setPreviewUrl(URL.createObjectURL(f));
    }
  };

  const loadPreset = async (name: string) => {
    try {
      const resp = await fetch(`/storage/uploads/${name}`).catch(() => null);
      const blob = resp && resp.ok ? await resp.blob() : new Blob(["sample"], { type: "image/jpeg" });
      const f = new File([blob], name, { type: 'image/jpeg' });
      setSelectedFile(f);
      setPreviewUrl(URL.createObjectURL(f));
    } catch {}
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    setAnalyzing(true);
    try {
      const res = await uploadShelfAudit(selectedFile, aisle, shelf);
      setActiveAudit(res);
      setAudits(prev => [res, ...prev]);
    } catch (err: any) {
      alert(`CV Analysis failed: ${err.message}`);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs px-2 py-0.5 rounded font-bold bg-sky-50 text-sky-700 border border-sky-200">
              COMPUTER VISION INFERENCE
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Smart Shelf Image Auditing</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Genuine Ultralytics YOLOv8 object detection with bounding box coordinates, optical confidence, and occupancy calculation.
          </p>
        </div>
      </div>

      {/* Upload & Audit View Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Form Card */}
        <div className="glass-card p-5 rounded-xl border border-slate-200 space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Upload Shelf Image</h3>

          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">Aisle Identifier:</label>
              <input
                type="text"
                value={aisle}
                onChange={(e) => setAisle(e.target.value)}
                className="w-full text-xs p-2 border border-slate-200 rounded-md"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">Shelf Section:</label>
              <input
                type="text"
                value={shelf}
                onChange={(e) => setShelf(e.target.value)}
                className="w-full text-xs p-2 border border-slate-200 rounded-md"
              />
            </div>
          </div>

          <div className="border-2 border-dashed border-slate-300 hover:border-sky-400 rounded-xl p-5 text-center cursor-pointer bg-slate-50">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              id="audit-file-upload"
              className="hidden"
            />
            <label htmlFor="audit-file-upload" className="cursor-pointer space-y-1 block">
              <UploadCloud className="w-8 h-8 text-slate-400 mx-auto" />
              <span className="text-xs font-semibold text-slate-700 block">Select Shelf Photo</span>
              <span className="text-[10px] text-slate-400 block">JPG, PNG, WEBP</span>
            </label>
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Quick Presets:</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => loadPreset('shelf_gap_sample.jpg')}
                className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 rounded text-[11px] font-medium text-slate-700 transition-colors cursor-pointer"
              >
                Sample Gap Shelf
              </button>
              <button
                type="button"
                onClick={() => loadPreset('shelf_resolved_sample.jpg')}
                className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 rounded text-[11px] font-medium text-slate-700 transition-colors cursor-pointer"
              >
                Sample Restocked
              </button>
            </div>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={!selectedFile || analyzing}
            className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center space-x-2 cursor-pointer"
          >
            {analyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Running YOLOv8 Detection...</span>
              </>
            ) : (
              <>
                <Camera className="w-4 h-4" />
                <span>Run Computer Vision Inference</span>
              </>
            )}
          </button>
        </div>

        {/* Image Inspection View */}
        <div className="lg:col-span-2 glass-card p-5 rounded-xl border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {activeAudit ? `Audit Results: ${activeAudit.audit_code}` : 'Live Visualizer'}
                </h3>
                <p className="text-xs text-slate-500">
                  {activeAudit ? `${activeAudit.aisle} • ${activeAudit.shelf} • ${activeAudit.timestamp.slice(0, 10)}` : 'Awaiting image execution'}
                </p>
              </div>

              {activeAudit && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setViewMode(viewMode === 'annotated' ? 'raw' : 'annotated')}
                    className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 rounded text-slate-700 transition-colors cursor-pointer flex items-center space-x-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View: {viewMode === 'annotated' ? 'Bounding Boxes' : 'Original Raw'}</span>
                  </button>
                  <a
                    href={`/api/shelf-audits/${activeAudit.id}/annotated-image`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 text-slate-500 hover:text-slate-800 rounded bg-slate-100 transition-colors"
                    title="Download Annotated Image"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>

            {/* Image Canvas */}
            <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-950 flex items-center justify-center max-h-96">
              {activeAudit ? (
                <img
                  src={viewMode === 'annotated'
                    ? `/api/shelf-audits/${activeAudit.id}/annotated-image`
                    : previewUrl || `/api/shelf-audits/${activeAudit.id}/annotated-image`}
                  alt="Shelf Scan"
                  className="max-h-96 w-auto object-contain"
                />
              ) : previewUrl ? (
                <img src={previewUrl} alt="Preview" className="max-h-96 w-auto object-contain" />
              ) : (
                <div className="py-24 text-center text-slate-500 text-xs">
                  <Camera className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <span>No shelf image currently active</span>
                </div>
              )}
            </div>
          </div>

          {/* Inference Metrics Bar */}
          {activeAudit && (
            <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2 rounded bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Objects Detected</span>
                <span className="text-base font-bold text-slate-900">{activeAudit.total_detected_objects}</span>
              </div>
              <div className="p-2 rounded bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Occupancy Ratio</span>
                <span className={`text-base font-bold ${activeAudit.occupancy_rate < 0.4 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {(activeAudit.occupancy_rate * 100).toFixed(1)}%
                </span>
              </div>
              <div className="p-2 rounded bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Inference Time</span>
                <span className="text-base font-bold text-slate-900 font-mono">{activeAudit.inference_duration_ms} ms</span>
              </div>
              <div className="p-2 rounded bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Vision Engine</span>
                <span className="text-xs font-semibold text-slate-800 font-mono mt-1 block truncate">{activeAudit.model_name}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detections List & Bounding Box Coordinates Table */}
      {activeAudit && activeAudit.detections.length > 0 && (
        <div className="glass-card rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Extracted Bounding Box Detections ({activeAudit.detections.length})
              </h3>
              <p className="text-[11px] text-slate-500">Genuine detection classes & localized spatial coordinates</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Index</th>
                  <th className="py-2.5 px-4">Object Class</th>
                  <th className="py-2.5 px-4">Confidence</th>
                  <th className="py-2.5 px-4">Bounding Box (x1, y1, x2, y2)</th>
                  <th className="py-2.5 px-4">Product Match</th>
                  <th className="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-mono">
                {activeAudit.detections.map((d, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2 px-4 text-slate-400">#{idx + 1}</td>
                    <td className="py-2 px-4 font-bold text-slate-800">{d.class_name}</td>
                    <td className="py-2 px-4">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        d.confidence >= 0.75 ? 'bg-emerald-100 text-emerald-800' :
                        d.confidence >= 0.50 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {(d.confidence * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-2 px-4 text-slate-500">
                      [{d.bbox_x1.toFixed(0)}, {d.bbox_y1.toFixed(0)}, {d.bbox_x2.toFixed(0)}, {d.bbox_y2.toFixed(0)}]
                    </td>
                    <td className="py-2 px-4 text-slate-800">{d.matched_product_id ? `Product #${d.matched_product_id}` : 'Generic Class'}</td>
                    <td className="py-2 px-4">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {d.match_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
