/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useRef, useEffect, useState } from 'react';
import JsBarcode from 'jsbarcode';
import { Download, RefreshCw, Barcode, CheckCircle, AlertTriangle } from 'lucide-react';

export default function EanGenerator() {
  const [inputVal, setInputVal] = useState<string>('301721751103'); // Nutella's prefix as default for demo!
  const [error, setError] = useState<string | null>(null);
  const [checksum, setChecksum] = useState<number | null>(null);
  const [fullCode, setFullCode] = useState<string>('');
  
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Clean the input to only allow numbers and truncate to 12 characters
  const handleInputChange = (val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 12);
    setInputVal(cleaned);
  };

  // Generate a random 12-digit sequence
  const generateRandom12Digits = () => {
    let result = '';
    // Let's make it look like a standard product prefix (e.g., starting with 3 for France, or 50, etc.)
    // Standard French prefix: 300 to 379
    const prefixes = ['300', '315', '325', '340', '356', '370'];
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    result += randomPrefix;
    
    while (result.length < 12) {
      result += Math.floor(Math.random() * 10).toString();
    }
    setInputVal(result);
  };

  // Calculate checksum and full code
  useEffect(() => {
    if (inputVal.length === 12) {
      setError(null);
      
      let sumOdd = 0;  // 1st, 3rd, 5th, etc. (indices 0, 2, 4...)
      let sumEven = 0; // 2nd, 4th, 6th, etc. (indices 1, 3, 5...)

      for (let i = 0; i < 12; i++) {
        const digit = parseInt(inputVal[i], 10);
        if (i % 2 === 0) {
          sumOdd += digit;
        } else {
          sumEven += digit;
        }
      }

      const total = sumOdd + sumEven * 3;
      const calcChecksum = (10 - (total % 10)) % 10;
      setChecksum(calcChecksum);
      setFullCode(inputVal + calcChecksum);
    } else {
      setChecksum(null);
      setFullCode('');
      if (inputVal.length > 0 && inputVal.length < 12) {
        setError(`Veuillez saisir exactement 12 chiffres (actuel : ${inputVal.length})`);
      } else if (inputVal.length === 0) {
        setError('Le champ est vide. Saisissez 12 chiffres pour commencer.');
      }
    }
  }, [inputVal]);

  // Render barcode when fullCode changes
  useEffect(() => {
    if (fullCode.length === 13 && svgRef.current) {
      try {
        JsBarcode(svgRef.current, fullCode, {
          format: 'EAN13',
          width: 2,
          height: 100,
          displayValue: true,
          font: 'monospace',
          fontSize: 16,
          margin: 10,
          background: '#ffffff',
          lineColor: '#1f2937', // charcoal gray
        });
      } catch (err) {
        console.error('Erreur lors du rendu du code-barres:', err);
      }
    }
  }, [fullCode]);

  // Download Barcode as SVG
  const downloadSVG = () => {
    if (!svgRef.current || fullCode.length !== 13) return;

    try {
      const svgString = new XMLSerializer().serializeToString(svgRef.current);
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ean13_${fullCode}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Erreur lors de l'export SVG.");
    }
  };

  // Download Barcode as PNG
  const downloadPNG = () => {
    if (fullCode.length !== 13) return;

    try {
      // Create offscreen canvas for rendering high-res PNG
      const canvas = document.createElement('canvas');
      JsBarcode(canvas, fullCode, {
        format: 'EAN13',
        width: 3, // wider bars for higher res
        height: 120,
        displayValue: true,
        font: 'monospace',
        fontSize: 16,
        margin: 15,
        background: '#ffffff',
        lineColor: '#1f2937',
      });

      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = url;
      link.download = `ean13_${fullCode}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert("Erreur lors de l'export PNG.");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-7xl mx-auto" id="ean-generator-layout">
      {/* Left Column: Settings and Action Buttons */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        
        {/* Settings Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Paramètres du Code</h2>
          
          <div className="space-y-5">
            {/* 12-digit Input */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="ean-input" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  12 premiers chiffres
                </label>
                <span className="text-xs text-slate-400 font-mono font-medium">
                  {inputVal.length} / 12
                </span>
              </div>
              
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    id="ean-input"
                    type="text"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-lg text-slate-800 tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition"
                    placeholder="Ex: 301721751103"
                    value={inputVal}
                    onChange={(e) => handleInputChange(e.target.value)}
                  />
                </div>
                
                <button
                  onClick={generateRandom12Digits}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium text-sm flex items-center gap-2 transition active:scale-95"
                  title="Générer un code aléatoire"
                  id="btn-random-ean"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Calculated Checksum Badge */}
            {inputVal.length === 12 && checksum !== null ? (
              <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 flex justify-between items-center transition duration-150">
                <div className="flex flex-col">
                  <span className="text-xs text-indigo-700 font-semibold uppercase tracking-wider">Clé de contrôle</span>
                  <span className="text-[10px] text-indigo-500 font-medium">Calcul automatique réussi</span>
                </div>
                <span className="text-2xl font-black text-indigo-800 font-mono bg-white border border-indigo-150 px-3 py-1 rounded-lg">
                  {checksum}
                </span>
              </div>
            ) : null}

            {error && (
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800 leading-relaxed font-medium">
                  {error}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Téléchargement</h2>
          <div className="space-y-3 mt-auto">
            <button
              onClick={downloadPNG}
              disabled={fullCode.length !== 13}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white rounded-xl font-bold flex items-center justify-center gap-2 transition active:scale-[0.98] shadow-sm hover:shadow"
              id="btn-download-ean-png"
            >
              <Download className="w-4 h-4" />
              Télécharger PNG
            </button>
            <button
              onClick={downloadSVG}
              disabled={fullCode.length !== 13}
              className="w-full py-3.5 bg-white border border-slate-300 hover:bg-slate-50 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed text-slate-700 rounded-xl font-bold flex items-center justify-center gap-2 transition active:scale-[0.98] shadow-sm"
              id="btn-download-ean-svg"
            >
              <Download className="w-4 h-4" />
              Télécharger SVG
            </button>
          </div>
        </div>

      </div>

      {/* Right Column: Code Bar Preview */}
      <div className="lg:col-span-7 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-12 min-h-[350px]">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">
            Aperçu du Code-Barres
          </div>
          
          {fullCode.length === 13 ? (
            <div className="flex flex-col items-center bg-white p-6 rounded-xl border border-slate-100 shadow-sm max-w-full overflow-auto">
              <svg ref={svgRef} id="ean13-svg-element" className="max-w-full h-auto"></svg>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-400 py-12 px-6 border-2 border-dashed border-slate-200 rounded-2xl w-full max-w-md">
              <Barcode className="w-12 h-12 stroke-[1.2] mb-3 text-slate-300" />
              <p className="text-xs text-center leading-relaxed">
                Renseignez un code de 12 chiffres dans les paramètres de gauche pour afficher et exporter le code-barres.
              </p>
            </div>
          )}
        </div>
        
        {/* Metric Details Bottom Bar */}
        <div className="bg-slate-50 border-t border-slate-100 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Format</span>
              <span className="text-sm font-semibold text-slate-700">Standard EAN-13</span>
            </div>
            <div className="w-px h-8 bg-slate-200 hidden sm:block"></div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Dimensions estimées</span>
              <span className="text-sm font-semibold text-slate-700">37.29 x 25.93 mm</span>
            </div>
          </div>
          <div className="flex gap-2">
            <span className="px-2.5 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded uppercase tracking-wider">
              Conforme GS1
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
