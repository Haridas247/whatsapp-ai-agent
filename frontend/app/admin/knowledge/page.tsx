'use client';

import { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Trash2,
  RefreshCw,
  Sparkles,
  Search,
  CheckCircle2,
  Database,
  FileText,
} from 'lucide-react';
import { fetchApi } from '../../../lib/api';

interface KnowledgeDoc {
  id: string;
  title: string;
  content: string;
  status: string;
  created_at: string;
  _count?: {
    chunks: number;
  };
}

export default function KnowledgePage() {
  const [documents, setDocuments] = useState<KnowledgeDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [reindexingId, setReindexingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [saving, setSaving] = useState(false);

  // PDF Upload state
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfTitle, setPdfTitle] = useState('');
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const data = await fetchApi('/api/knowledge');
      setDocuments(data);
    } catch (err) {
      console.error('Failed to load knowledge documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim() || saving) return;

    try {
      setSaving(true);
      await fetchApi('/api/knowledge', {
        method: 'POST',
        body: JSON.stringify({
          title: newTitle.trim(),
          content: newContent.trim(),
        }),
      });
      setNewTitle('');
      setNewContent('');
      setShowModal(false);
      await loadDocuments();
    } catch (err) {
      console.error('Failed to create document:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleUploadPdf = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdfFile || uploadingPdf) return;

    try {
      setUploadingPdf(true);
      setUploadSuccess(null);

      const reader = new FileReader();
      reader.readAsDataURL(pdfFile);
      reader.onload = async () => {
        try {
          const base64Pdf = reader.result as string;
          const result = await fetchApi('/api/knowledge/upload-pdf', {
            method: 'POST',
            body: JSON.stringify({
              title: pdfTitle.trim() || pdfFile.name.replace(/\.pdf$/i, ''),
              filename: pdfFile.name,
              base64Pdf,
            }),
          });

          setUploadSuccess(`Extracted ${result.extractedPages || 1} pages & created ${result.indexedChunks} vector chunks!`);
          setTimeout(async () => {
            setPdfFile(null);
            setPdfTitle('');
            setShowPdfModal(false);
            setUploadSuccess(null);
            await loadDocuments();
          }, 1500);
        } catch (err: any) {
          alert(`PDF upload failed: ${err.message}`);
        } finally {
          setUploadingPdf(false);
        }
      };
    } catch (err: any) {
      console.error('Failed to process PDF:', err);
      setUploadingPdf(false);
    }
  };

  const handleReindex = async (id: string) => {
    try {
      setReindexingId(id);
      await fetchApi(`/api/knowledge/${id}/reindex`, { method: 'POST' });
      await loadDocuments();
    } catch (err) {
      console.error('Failed to reindex document:', err);
    } finally {
      setReindexingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this knowledge document and its vector embeddings?')) {
      return;
    }

    try {
      setDeletingId(id);
      await fetchApi(`/api/knowledge/${id}`, { method: 'DELETE' });
      await loadDocuments();
    } catch (err) {
      console.error('Failed to delete document:', err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Clinic Knowledge Base & RAG</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-200 flex items-center gap-1">
              <Database className="h-3 w-3" /> pgvector 768-dim
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Manage FAQs, clinic pricing, PDFs, and guidelines grounded into AI responses
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPdfModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition-colors shadow-sm"
          >
            <FileText className="h-4 w-4" />
            Upload PDF (.pdf)
          </button>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Add FAQ / Text
          </button>
        </div>
      </div>

      {/* Documents Grid */}
      {loading ? (
        <div className="p-16 flex flex-col items-center justify-center gap-3">
          <div className="h-6 w-6 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
          <p className="text-xs text-gray-500">Loading knowledge chunks...</p>
        </div>
      ) : documents.length === 0 ? (
        <div className="p-16 text-center rounded-md bg-gray-50 border border-gray-200 shadow-sm">
          <BookOpen className="h-10 w-10 text-gray-400 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-700">No knowledge documents indexed</p>
          <p className="text-xs text-gray-500 mt-1">Click Add FAQ / Document to add clinic info.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documents.map((doc) => {
            const chunkCount = doc._count?.chunks || 1;

            return (
              <div
                key={doc.id}
                className="p-5 rounded-md bg-white border border-gray-200 flex flex-col justify-between hover:shadow-md transition-shadow shadow-sm space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-purple-600" />
                      <h3 className="font-semibold text-sm text-gray-900">{doc.title}</h3>
                    </div>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-purple-50 text-purple-700 border border-purple-100">
                      {chunkCount} vector chunk{chunkCount > 1 ? 's' : ''}
                    </span>
                  </div>

                  <p className="text-xs text-gray-700 leading-relaxed line-clamp-4 bg-gray-50 p-3 rounded-md border border-gray-100">
                    {doc.content}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
                  <span className="text-[11px] text-gray-500 font-mono">
                    Indexed {new Date(doc.created_at).toLocaleDateString()}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleReindex(doc.id)}
                      disabled={reindexingId === doc.id}
                      className="px-2.5 py-1 rounded-md bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs flex items-center gap-1 transition-colors shadow-sm"
                    >
                      <RefreshCw className={`h-3 w-3 ${reindexingId === doc.id ? 'animate-spin' : ''}`} />
                      Re-index
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      disabled={deletingId === doc.id}
                      className="p-1 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Document Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-md max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-600" />
                Add Knowledge Document / FAQ
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-900 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDocument} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Document Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Root Canal Procedure & Post-Op Care"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Content / FAQs (English or Tanglish)
                </label>
                <textarea
                  rows={5}
                  placeholder="Write detailed clinic answers, doctor instructions, or FAQs here..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  required
                  className="w-full bg-white border border-gray-300 rounded-md p-3 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  Automatic 500-char chunking & Gemini text-embedding-004 will be generated automatically.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-md bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !newTitle.trim() || !newContent.trim()}
                  className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold transition-colors shadow-sm"
                >
                  {saving ? 'Chunking & Indexing...' : 'Save & Index Vector'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload PDF Modal */}
      {showPdfModal && (
        <div className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-md max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
                <FileText className="h-4 w-4 text-purple-600" />
                Upload PDF Document for AI RAG
              </h3>
              <button
                onClick={() => {
                  setShowPdfModal(false);
                  setPdfFile(null);
                  setUploadSuccess(null);
                }}
                className="text-gray-400 hover:text-gray-900 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadPdf} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Document Title (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Clinic Policy & Treatment Catalog (defaults to PDF filename)"
                  value={pdfTitle}
                  onChange={(e) => setPdfTitle(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Select PDF File (.pdf)
                </label>
                <div className="border-2 border-dashed border-gray-300 hover:border-purple-500/50 rounded-md p-6 text-center cursor-pointer bg-gray-50 transition-colors">
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setPdfFile(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                    id="pdf-upload-input"
                  />
                  <label htmlFor="pdf-upload-input" className="cursor-pointer block space-y-2">
                    <FileText className="h-8 w-8 text-purple-500 mx-auto opacity-80" />
                    {pdfFile ? (
                      <div>
                        <p className="text-xs font-semibold text-gray-900">{pdfFile.name}</p>
                        <p className="text-[11px] text-gray-500">
                          {(pdfFile.size / 1024).toFixed(1)} KB — Click to change
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs font-medium text-gray-700">
                          Click to browse or drop your <span className="text-purple-600 font-bold">PDF</span> here
                        </p>
                        <p className="text-[11px] text-gray-500">Supports text documents, price lists, clinic policies, FAQs</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {uploadSuccess && (
                <div className="p-3 rounded-md bg-green-50 border border-green-200 text-green-700 text-xs flex items-center gap-2 shadow-sm">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{uploadSuccess}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowPdfModal(false);
                    setPdfFile(null);
                    setUploadSuccess(null);
                  }}
                  className="px-4 py-2 rounded-md bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingPdf || !pdfFile}
                  className="px-4 py-2 rounded-md bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-semibold transition-colors shadow-sm"
                >
                  {uploadingPdf ? 'Extracting & Indexing...' : 'Upload & Index PDF'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
