/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Download, QrCode, Sliders, Palette, Check } from 'lucide-react';

const COLOR_PRESETS = [
  { name: 'Noir Classique', dark: '#000000', light: '#FFFFFF' },
  { name: 'Bleu Royal', dark: '#1D4ED8', light: '#EFF6FF' },
  { name: 'Vert Émeraude', dark: '#047857', light: '#ECFDF5' },
  { name: 'Violet Ébène', dark: '#4C1D95', light: '#F5F3FF' },
  { name: 'Orange Solaire', dark: '#C2410C', light: '#FFF7ED' },
];

const SIZES = [
  { label: 'Petit (128x128)', value: 128 },
  { label: 'Moyen (256x256)', value: 256 },
  { label: 'Standard (384x384)', value: 384 },
  { label: 'Grand (512x512)', value: 512 },
];

export default function QrGenerator() {
  const [text, setText] = useState<string>('https://google.com');
  const [size, setSize] = useState<number>(384);
  const [fgColor, setFgColor] = useState<string>('#000000');
  const [bgColor, setBgColor] = useState<string>('#ffffff');
  const [qrPngUrl, setQrPngUrl] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Apply preset color combinations
  const applyPreset = (dark: string, light: string) => {
    setFgColor(dark);
    setBgColor(light);
  };

  // Generate QR Code as PNG data URL
  useEffect(() => {
    const generateQr = async () => {
      if (!text.trim()) {
        setQrPngUrl('');
        setError(null);
        return;
      }

      try {
        const url = await QRCode.toDataURL(text, {
          width: size,
          margin: 2,
          color: {
            dark: fgColor,
            light: bgColor,
          },
        });
        setQrPngUrl(url);
        setError(null);
      } catch (err: any) {
        console.error(err);
        setError("Impossible de générer le QR Code pour ce texte.");
      }
    };

    const timer = setTimeout(() => {
      generateQr();
    }, 150); // small debounce to prevent lag when typing rapidly

    return () => clearTimeout(timer);
  }, [text, size, fgColor, bgColor]);

  // Download SVG
  const downloadSVG = async () => {
    if (!text.trim()) return;
    try {
      const svgString = await QRCode.toString(text, {
        type: 'svg',
        width: size,
        margin: 2,
        color: {
          dark: fgColor,
          light: bgColor,
        },
      });

      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `qrcode_${Date.now()}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Erreur lors de l'export SVG.");
    }
  };

  // Download PNG
  const downloadPNG = () => {
    if (!qrPngUrl) return;
    const link = document.createElement('a');
    link.href = qrPngUrl;
    link.download = `qrcode_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 max-w-4xl mx-auto" id="qr-generator-card">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
          <QrCode className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Générateur de QR Code</h2>
          <p className="text-sm text-slate-500">Créez des QR codes personnalisés en temps réel à partir de textes ou de liens internet.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left column: inputs & customization */}
        <div className="lg:col-span-7 space-y-6">
          {/* Input field */}
          <div className="space-y-2">
            <label htmlFor="qr-text" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Texte ou URL du QR Code
            </label>
            <textarea
              id="qr-text"
              rows={3}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition resize-none"
              placeholder="Ex: https://monsite.com ou un message personnalisé..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>

          {/* Size option */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <Sliders className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Taille d'export</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {SIZES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setSize(s.value)}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold text-center transition ${
                    size === s.value
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Colors customization */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <Palette className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Palette de couleurs</span>
            </div>

            {/* Presets */}
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map((preset) => {
                const isSelected = fgColor.toLowerCase() === preset.dark.toLowerCase() && bgColor.toLowerCase() === preset.light.toLowerCase();
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => applyPreset(preset.dark, preset.light)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-slate-200/50 flex-shrink-0"
                      style={{
                        background: `linear-gradient(135deg, ${preset.dark} 50%, ${preset.light} 50%)`,
                      }}
                    />
                    <span>{preset.name}</span>
                    {isSelected && <Check className="w-3 h-3 ml-0.5 text-indigo-600" />}
                  </button>
                );
              })}
            </div>

            {/* Custom pickers */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <label htmlFor="fg-color" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Couleur du motif
                </label>
                <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50">
                  <input
                    id="fg-color"
                    type="color"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={fgColor.toUpperCase()}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="w-full bg-transparent border-0 font-mono text-sm text-slate-700 focus:outline-none uppercase"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="bg-color" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Arrière-plan
                </label>
                <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50">
                  <input
                    id="bg-color"
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={bgColor.toUpperCase()}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-full bg-transparent border-0 font-mono text-sm text-slate-700 focus:outline-none uppercase"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: visual preview & download */}
        <div className="lg:col-span-5 flex flex-col justify-center items-center">
          <div className="w-full max-w-[280px] sm:max-w-[320px] bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col items-center shadow-inner">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Aperçu du QR Code</h3>
            
            <div 
              className="p-4 rounded-xl border border-slate-200/50 shadow-sm transition-all overflow-hidden flex items-center justify-center max-w-full aspect-square"
              style={{ backgroundColor: bgColor }}
            >
              {qrPngUrl ? (
                <img
                  src={qrPngUrl}
                  alt="Aperçu QR Code"
                  className="max-w-full h-auto object-contain rounded-lg shadow-sm"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400 py-12 px-6">
                  <QrCode className="w-12 h-12 stroke-[1] mb-2 text-slate-300 animate-pulse" />
                  <p className="text-xs text-center leading-relaxed">Saisissez du texte pour générer le QR code.</p>
                </div>
              )}
            </div>

            {error && (
              <p className="mt-3 text-xs text-rose-500 font-medium text-center">{error}</p>
            )}

            {qrPngUrl && (
              <div className="mt-6 w-full space-y-2">
                <button
                  onClick={downloadPNG}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition shadow-sm active:scale-95"
                  id="btn-download-qr-png"
                >
                  <Download className="w-4 h-4" />
                  Télécharger PNG
                </button>
                <button
                  onClick={downloadSVG}
                  className="w-full py-2.5 px-4 bg-white border border-slate-300 text-slate-700 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition shadow-sm active:scale-95 hover:bg-slate-50"
                  id="btn-download-qr-svg"
                >
                  <Download className="w-4 h-4" />
                  Télécharger SVG
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
