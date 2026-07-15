/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import JSZip from 'jszip';
import { 
  Plus, 
  Trash2, 
  Download, 
  FileText, 
  Copy, 
  Check, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  HelpCircle,
  KeyRound,
  ExternalLink,
  Eye,
  X
} from 'lucide-react';
import { AccessCode } from '../types';

// Helper to render QR code dynamically in row cells (prevents lag by only generating on viewport render)
function QrCodeRowCell({ url, onClick }: { url: string; onClick: () => void }) {
  const [qrUrl, setQrUrl] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    QRCode.toDataURL(url, { width: 100, margin: 1, color: { dark: '#1e293b', light: '#ffffff' } })
      .then((res) => {
        if (isMounted) setQrUrl(res);
      })
      .catch((err) => console.error(err));
    return () => {
      isMounted = false;
    };
  }, [url]);

  if (!qrUrl) {
    return <div className="w-10 h-10 bg-slate-100 rounded-lg animate-pulse" />;
  }

  return (
    <button 
      onClick={onClick}
      className="group relative flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg"
      title="Cliquez pour agrandir"
    >
      <img 
        src={qrUrl} 
        alt="QR Code Mini" 
        className="w-10 h-10 object-contain rounded border border-slate-200 bg-white transition group-hover:scale-105 group-hover:border-indigo-300"
        referrerPolicy="no-referrer"
      />
      <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 rounded transition flex items-center justify-center">
        <Eye className="w-4 h-4 text-slate-800 bg-white/90 p-0.5 rounded-full shadow" />
      </div>
    </button>
  );
}

export default function AccessCodeGenerator() {
  const [quantity, setQuantity] = useState<number>(50);
  const [baseUrl, setBaseUrl] = useState<string>('https://monsite.com/acces');
  const [codes, setCodes] = useState<AccessCode[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // States for actions
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedUrlId, setCopiedUrlId] = useState<string | null>(null);
  const [isZipping, setIsZipping] = useState<boolean>(false);
  const [zipProgress, setZipProgress] = useState<number>(0);
  
  // Modal for QR Code preview
  const [selectedItem, setSelectedItem] = useState<AccessCode | null>(null);
  const [selectedQrLarge, setSelectedQrLarge] = useState<string>('');

  // Generate a code with A3F9-K2M1 format
  // Excluding confusing characters like 0, O, 1, I for perfect legibility in physical books/materials
  const generateUniqueCode = (existingCodes: Set<string>): string => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    do {
      let block1 = '';
      let block2 = '';
      for (let i = 0; i < 4; i++) {
        block1 += chars.charAt(Math.floor(Math.random() * chars.length));
        block2 += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      code = `${block1}-${block2}`;
    } while (existingCodes.has(code));
    return code;
  };

  const handleGenerateCodes = () => {
    // Basic validation
    if (quantity < 1 || quantity > 500) {
      alert("Veuillez saisir un nombre entre 1 et 500 codes.");
      return;
    }
    
    // Check if base URL is filled
    const trimmedBase = baseUrl.trim() || 'https://monsite.com/acces';

    const newCodesSet = new Set<string>();
    const generatedList: AccessCode[] = [];

    for (let i = 0; i < quantity; i++) {
      const uniqueCode = generateUniqueCode(newCodesSet);
      newCodesSet.add(uniqueCode);
      
      // Ensure clean parameter query handling
      const separator = trimmedBase.includes('?') ? '&' : '?';
      const url = `${trimmedBase}${separator}code=${uniqueCode}`;

      generatedList.push({
        id: crypto.randomUUID(),
        code: uniqueCode,
        url: url
      });
    }

    setCodes(generatedList);
    setCurrentPage(1); // Reset page to first
  };

  // Filtered codes based on search query
  const filteredCodes = codes.filter(
    (item) => 
      item.code.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination bounds
  const totalPages = Math.ceil(filteredCodes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCodes = filteredCodes.slice(startIndex, startIndex + itemsPerPage);

  // Auto handle page overflow when changing filter
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [filteredCodes.length, totalPages, currentPage]);

  // Copy to clipboard helper
  const handleCopy = (text: string, id: string, type: 'code' | 'url') => {
    navigator.clipboard.writeText(text);
    if (type === 'code') {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } else {
      setCopiedUrlId(id);
      setTimeout(() => setCopiedUrlId(null), 2000);
    }
  };

  // Open QR modal
  const openQrModal = async (item: AccessCode) => {
    try {
      const dataUrl = await QRCode.toDataURL(item.url, {
        width: 350,
        margin: 2,
        color: { dark: '#1f2937', light: '#ffffff' }
      });
      setSelectedItem(item);
      setSelectedQrLarge(dataUrl);
    } catch (err) {
      console.error(err);
    }
  };

  // Download individual QR code from modal
  const downloadModalQr = (type: 'png' | 'svg') => {
    if (!selectedItem) return;

    if (type === 'png') {
      const link = document.createElement('a');
      link.href = selectedQrLarge;
      link.download = `qr_${selectedItem.code}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Generate SVG
      QRCode.toString(selectedItem.url, {
        type: 'svg',
        width: 350,
        margin: 2,
        color: { dark: '#1f2937', light: '#ffffff' }
      }).then((svgString) => {
        const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `qr_${selectedItem.code}.svg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      });
    }
  };

  // Export as CSV
  const handleExportCSV = () => {
    if (codes.length === 0) return;

    const csvHeader = 'Code,URL\n';
    const csvRows = codes.map(item => `"${item.code}","${item.url}"`).join('\n');
    const fullCSV = csvHeader + csvRows;

    // Excel compatible UTF-8 BOM
    const blob = new Blob(['\uFEFF' + fullCSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `codes_acces_uniques_${codes.length}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Download all QR Codes as a single ZIP archive using JSZip
  const handleExportZIP = async () => {
    if (codes.length === 0) return;

    setIsZipping(true);
    setZipProgress(0);

    try {
      const zip = new JSZip();
      const qrFolder = zip.folder("codes_qr_png");

      for (let i = 0; i < codes.length; i++) {
        const item = codes[i];
        
        // Generate a standard high-quality QR code PNG Data URL (500x500px)
        const qrDataUrl = await QRCode.toDataURL(item.url, {
          width: 500,
          margin: 2,
          color: { dark: '#1f2937', light: '#ffffff' }
        });

        // Convert base64 data to binary ZIP item
        const base64Data = qrDataUrl.split(',')[1];
        qrFolder?.file(`qr_${item.code}.png`, base64Data, { base64: true });

        // Update Progress
        setZipProgress(Math.round(((i + 1) / codes.length) * 100));
      }

      // Generate Zip blob
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `lot_qr_codes_${codes.length}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (err) {
      console.error(err);
      alert("Une erreur s'est produite lors du regroupement dans l'archive ZIP.");
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="space-y-6" id="access-code-generator-wrapper">
      {/* Settings Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Générateur de Codes d'Accès Uniques</h2>
            <p className="text-sm text-slate-500">
              Générez un lot de codes sécurisés et leurs QR codes correspondants pour lier des livres physiques ou billets à vos services numériques.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
          {/* Base URL Input */}
          <div className="md:col-span-6 space-y-2">
            <div className="flex items-center gap-1.5">
              <label htmlFor="base-url" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                URL d'accès de base (sans le code)
              </label>
              <div className="group relative">
                <HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-slate-800 text-white text-xs p-2.5 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition shadow z-10 leading-relaxed">
                  Cette adresse sera encodée dans chaque QR code, suivie de son paramètre d'identification unique (ex: ?code=A3F9-K2M1).
                </div>
              </div>
            </div>
            <input
              id="base-url"
              type="url"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition"
              placeholder="Ex: https://monsite.com/acces"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
            />
          </div>

          {/* Quantity Input */}
          <div className="md:col-span-3 space-y-2">
            <label htmlFor="code-qty" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Nombre de codes (1 - 500)
            </label>
            <input
              id="code-qty"
              type="number"
              min={1}
              max={500}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 0)}
            />
          </div>

          {/* Action button */}
          <div className="md:col-span-3">
            <button
              onClick={handleGenerateCodes}
              disabled={isZipping}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition shadow-sm hover:shadow active:scale-[0.98]"
              id="btn-generate-batch"
            >
              <Plus className="w-4 h-4" />
              Générer le lot
            </button>
          </div>
        </div>
      </div>

      {/* Main Results Table & Actions */}
      {codes.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden" id="access-codes-results-panel">
          {/* Dashboard Header Bar */}
          <div className="p-5 md:p-6 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
                {codes.length} codes uniques générés
              </span>
            </div>

            {/* Quick Export Tools */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleExportCSV}
                className="py-2 px-3.5 bg-white border border-slate-250 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold text-xs flex items-center gap-2 transition shadow-sm"
                title="Exporter la table au format CSV"
                id="btn-export-csv"
              >
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                Exporter CSV
              </button>

              <button
                onClick={handleExportZIP}
                disabled={isZipping}
                className="py-2 px-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl font-bold text-xs flex items-center gap-2 transition shadow-sm hover:shadow"
                title="Télécharger l'ensemble des QR codes au format ZIP"
                id="btn-export-zip"
              >
                {isZipping ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Création ZIP ({zipProgress}%)</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Télécharger ZIP</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setCodes([])}
                className="p-2 text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-xl transition"
                title="Vider la liste actuelle"
                id="btn-clear-codes"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sub Header Search & Density */}
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-3 items-center justify-between bg-white">
            <div className="relative w-full sm:max-w-xs">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition"
                placeholder="Rechercher un code ou une URL..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-medium text-slate-400 uppercase text-[10px] tracking-wider">Afficher par page :</span>
              <select
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 focus:outline-none focus:border-indigo-500"
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(parseInt(e.target.value, 10));
                  setCurrentPage(1);
                }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          {/* Responsive Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  <th className="py-3 px-4 w-16 text-center">N°</th>
                  <th className="py-3 px-4 w-40">Code Unique</th>
                  <th className="py-3 px-4">URL Encodée</th>
                  <th className="py-3 px-4 w-28 text-center">QR Code</th>
                  <th className="py-3 px-4 w-40 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm text-slate-700">
                {paginatedCodes.length > 0 ? (
                  paginatedCodes.map((item, index) => {
                    const rowNumber = startIndex + index + 1;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/40 transition">
                        {/* Num */}
                        <td className="py-3 px-4 text-center font-mono text-xs text-slate-400">
                          {rowNumber}
                        </td>
                        
                        {/* Code */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold text-slate-900 bg-slate-100 border border-slate-200/50 px-2 py-1 rounded text-xs select-all">
                              {item.code}
                            </span>
                            <button
                              onClick={() => handleCopy(item.code, item.id, 'code')}
                              className="p-1 text-slate-400 hover:text-indigo-600 rounded transition"
                              title="Copier le code"
                            >
                              {copiedId === item.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* URL */}
                        <td className="py-3 px-4 max-w-xs md:max-w-md truncate">
                          <div className="flex items-center gap-2 group">
                            <span className="font-mono text-xs text-slate-500 truncate select-all" title={item.url}>
                              {item.url}
                            </span>
                            <button
                              onClick={() => handleCopy(item.url, item.id, 'url')}
                              className="p-1 text-slate-400 hover:text-indigo-600 rounded transition shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100"
                              title="Copier l'URL complète"
                            >
                              {copiedUrlId === item.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* QR Code preview cell */}
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center">
                            <QrCodeRowCell url={item.url} onClick={() => openQrModal(item)} />
                          </div>
                        </td>

                        {/* Row Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
                              title="Ouvrir le lien"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                            <button
                              onClick={() => openQrModal(item)}
                              className="px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 rounded-lg transition"
                              title="Afficher et télécharger"
                            >
                              Aperçu
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      Aucun code ne correspond à votre recherche.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50/30 text-xs">
              <span className="text-slate-500">
                Affichage de <span className="font-semibold text-slate-700">{startIndex + 1}</span> à{' '}
                <span className="font-semibold text-slate-700">
                  {Math.min(startIndex + itemsPerPage, filteredCodes.length)}
                </span>{' '}
                sur <span className="font-semibold text-slate-700">{filteredCodes.length}</span> codes
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  title="Page précédente"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg font-medium text-slate-700">
                  {currentPage} / {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  title="Page suivante"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Large QR Code Preview Modal */}
      {selectedItem && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in"
          onClick={() => setSelectedItem(null)}
          id="qr-preview-modal"
        >
          <div 
            className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-sm w-full p-6 text-center space-y-5 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button 
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-lg font-semibold text-slate-900">Aperçu du QR Code</h3>
              <p className="text-xs text-slate-400 font-mono mt-1">Code : {selectedItem.code}</p>
            </div>

            {/* Large Image Box */}
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 inline-flex items-center justify-center mx-auto shadow-inner">
              <img 
                src={selectedQrLarge} 
                alt="QR Code Agrandit" 
                className="w-48 h-48 object-contain rounded-lg shadow-sm"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Target URL Info */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-left">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">URL encodée :</p>
              <p className="text-xs font-mono text-slate-600 truncate mt-0.5">{selectedItem.url}</p>
            </div>

            {/* Modal Download buttons */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => downloadModalQr('png')}
                className="py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                Télécharger PNG
              </button>
              <button
                onClick={() => downloadModalQr('svg')}
                className="py-2 px-3 bg-slate-850 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                Télécharger SVG
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
