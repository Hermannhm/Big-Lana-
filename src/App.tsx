/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Barcode, QrCode, KeyRound, Layers } from 'lucide-react';
import EanGenerator from './components/EanGenerator';
import QrGenerator from './components/QrGenerator';
import AccessCodeGenerator from './components/AccessCodeGenerator';
import { TabType } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('ean');

  const tabs = [
    {
      id: 'ean' as TabType,
      label: 'Générateur EAN-13',
      icon: Barcode,
      description: 'Codes-barres produits'
    },
    {
      id: 'qr' as TabType,
      label: 'QR Code',
      icon: QrCode,
      description: 'URLs & textes'
    },
    {
      id: 'access' as TabType,
      label: 'Codes d\'Accès',
      icon: KeyRound,
      description: 'Lots & Export ZIP'
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans" id="app-root-container">
      {/* Upper Brand Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shrink-0" id="main-brand-header">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-600/15">
              <Layers className="w-5 h-5" />
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-xl font-bold tracking-tight text-slate-800">
                CodeCraft <span className="text-indigo-600">Pro</span>
              </h1>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">Générateurs certifiés de codes-barres & QR codes</p>
            </div>
          </div>
          
          <nav className="flex gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200/50">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`tab-btn-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 flex items-center gap-2 select-none focus:outline-none ${
                    isActive 
                      ? 'bg-white text-indigo-600 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 lg:px-8 py-8 space-y-8">
        
        {/* Dynamic Tab Panel Container with Animations */}
        <div className="w-full" id="tab-panel-display">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.15 }}
            >
              {activeTab === 'ean' && <EanGenerator />}
              {activeTab === 'qr' && <QrGenerator />}
              {activeTab === 'access' && <AccessCodeGenerator />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Elegant minimalist footer */}
      <footer className="shrink-0 px-8 py-4 bg-slate-100 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-xs text-slate-500 tracking-tight">© {new Date().getFullYear()} CodeCraft Studio — Outil de génération certifié conforme GS1 & ISO</p>
        <div className="flex gap-4">
          <span className="text-[10px] font-bold text-slate-400 bg-slate-200/60 px-2.5 py-1 rounded uppercase tracking-wider">Moteur Client Sécurisé</span>
        </div>
      </footer>
    </div>
  );
}
