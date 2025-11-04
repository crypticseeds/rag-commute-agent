
import React, { useState } from 'react';
import { Calendar } from './Calendar';
import { FileUpload } from './FileUpload';
import { InfoIcon, SpinnerIcon } from './icons';

interface TransportCalculatorProps {
  showToast: (message: string, type: 'success' | 'error') => void;
  onInvoiceFileShare: (file: File | null) => void;
}

export const TransportCalculator: React.FC<TransportCalculatorProps> = ({ showToast, onInvoiceFileShare }) => {
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [totalCost, setTotalCost] = useState<number | null>(null);
  const [enableChat, setEnableChat] = useState(false);

  const handleClear = () => {
    setSelectedDates([]);
    setUploadedFile(null);
    setTotalCost(null);
    setEnableChat(false);
    onInvoiceFileShare(null);
    showToast('Selection cleared', 'success');
  };

  const handleFileUpload = (file: File) => {
    setUploadedFile(file);
    if (enableChat) {
      onInvoiceFileShare(file);
    }
  };

  const handleFileRemove = () => {
    setUploadedFile(null);
    onInvoiceFileShare(null);
  };

  const handleToggleChat = (enabled: boolean) => {
    setEnableChat(enabled);
    if (enabled && uploadedFile) {
      onInvoiceFileShare(uploadedFile);
      showToast('Chat enabled with uploaded invoice', 'success');
    } else {
      onInvoiceFileShare(null);
      showToast('Chat disabled', 'success');
    }
  };

  const handleCalculate = async () => {
    if (!uploadedFile || selectedDates.length === 0) {
      showToast('Please upload an invoice and select dates.', 'error');
      return;
    }
    
    setIsLoading(true);
    setTotalCost(null);

    // TODO: Connect to LangGraph endpoint for transport calculation
    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('dates', JSON.stringify(selectedDates.map(d => d.toISOString().split('T')[0])));
      
      console.log('Submitting to backend:', {
        file: uploadedFile.name,
        dates: selectedDates.map(d => d.toISOString().split('T')[0])
      });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Example fetch:
      // const response = await fetch('/api/transport/calculate', {
      //   method: 'POST',
      //   body: formData,
      // });
      // if (!response.ok) throw new Error('Calculation failed');
      // const result = await response.json();
      
      const mockResult = { totalCost: selectedDates.length * 5.75 + (Math.random() * 10) };
      
      setTotalCost(mockResult.totalCost);
      showToast('Calculation successful!', 'success');
    } catch (error) {
      console.error(error);
      showToast('An error occurred during calculation.', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  const isButtonDisabled = !uploadedFile || selectedDates.length === 0 || isLoading;

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg h-full flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 flex-shrink-0 mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Transport Cost Calculator</h2>
        <div className="relative group">
            <InfoIcon className="h-5 w-5 text-gray-400 cursor-pointer" />
            <div className="absolute bottom-full mb-2 w-64 bg-gray-800 text-white text-xs rounded py-2 px-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
                Upload your TFL invoice (CSV/PDF) and select the days you went to work to calculate your total cost.
                <svg className="absolute text-gray-800 h-2 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255"><polygon className="fill-current" points="0,0 127.5,127.5 255,0"/></svg>
            </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-hidden">
        <div className="flex-1 min-h-0 space-y-2 overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-800">1. Select Work Days</h3>
            <Calendar selectedDates={selectedDates} onDateChange={setSelectedDates} />
        </div>

        <div className="space-y-2 flex-shrink-0">
           <FileUpload
              id="transport-invoice"
              title="2. Upload TFL Invoice"
              description="Upload your monthly or weekly transport invoice."
              uploadedFile={uploadedFile}
              onFileUpload={handleFileUpload}
              onFileRemove={handleFileRemove}
              acceptedTypes={['.csv', '.pdf']}
          />
          
          {uploadedFile && (
            <div className="flex items-center gap-3 mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <input
                type="checkbox"
                id="enable-chat-toggle"
                checked={enableChat}
                onChange={(e) => handleToggleChat(e.target.checked)}
                className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2"
              />
              <label htmlFor="enable-chat-toggle" className="text-sm font-medium text-gray-700 cursor-pointer">
                Enable chat with this invoice
              </label>
            </div>
          )}
        </div>

        {totalCost !== null && (
          <div className="bg-indigo-50 border-l-4 border-indigo-500 text-indigo-800 p-3 rounded-r-lg transition-all duration-500 flex-shrink-0">
            <p className="font-semibold text-sm">Total Estimated Cost:</p>
            <p className="text-2xl font-bold">£{totalCost.toFixed(2)}</p>
          </div>
        )}
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 flex-shrink-0 pt-4 mt-auto border-t border-gray-200">
        <button
          onClick={handleCalculate}
          disabled={isButtonDisabled}
          className="flex-grow flex items-center justify-center w-full bg-indigo-600 text-white font-semibold py-3 px-4 rounded-lg shadow-sm hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-all duration-300"
        >
          {isLoading ? (
            <>
              <SpinnerIcon className="animate-spin h-5 w-5 mr-3" />
              Calculating...
            </>
          ) : 'Calculate Transport Cost'}
        </button>
        <button
          onClick={handleClear}
          className="w-full sm:w-auto bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors duration-300"
        >
          Clear
        </button>
      </div>
    </div>
  );
};
