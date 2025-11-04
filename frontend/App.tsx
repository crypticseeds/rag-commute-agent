import React, { useState } from 'react';
import { TransportCalculator } from './components/TransportCalculator';
import { Chat } from './components/Chat';
import { Toaster } from './components/Toast';
import { AIGeneratedIcon } from './components/icons';
import type { Toast } from './types';

// Base64 encoded logo
const logoSrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhmAAAD1ElEQVR4nO3ZsW1bUQBA0WfIZv8bL3gDJmACxgavZ/gcWAGlQFICV+B5a/75r3+9A4A7F/j8ANQACCAAgAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggg/d8ABb35v/5p89dAAAAAElFTkSuQmCC";

function App() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [sharedInvoiceFile, setSharedInvoiceFile] = useState<File | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    const newToast: Toast = {
      id: Date.now(),
      message,
      type,
    };
    setToasts(prev => [...prev, newToast]);
  };

  const dismissToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <div className="h-screen bg-gray-50 text-gray-800 flex flex-col overflow-hidden">
      <Toaster toasts={toasts} onDismiss={dismissToast} />
      
      <header className="bg-white shadow-sm flex-shrink-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <img src={logoSrc} alt="App Logo" className="h-8 w-8" />
              <h1 className="text-xl font-bold text-indigo-600">Work Transport & Document Assistant</h1>
            </div>
          </div>
        </div>
      </header>
      
      <main className="flex-1 min-h-0 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-6 overflow-hidden flex flex-col">
        <div className="flex-1 min-h-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
            
            <div className="w-full h-full min-h-0">
              <TransportCalculator showToast={showToast} onInvoiceFileShare={setSharedInvoiceFile} />
            </div>

            <div className="w-full h-full min-h-0">
              <Chat showToast={showToast} sharedInvoiceFile={sharedInvoiceFile} />
            </div>
          </div>
        </div>
      </main>

      <footer className="text-center py-3 text-sm text-gray-500 flex-shrink-0">
        <p className="mb-1 flex items-center justify-center gap-1">
          Built by Femi Akinlotan + <AIGeneratedIcon className="h-4 w-4 inline" />
        </p>
        <p>Powered by LangGraph + Langfuse.</p>
      </footer>
    </div>
  );
}

export default App;