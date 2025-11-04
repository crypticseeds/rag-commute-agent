
import React, { useState, useRef, useEffect } from 'react';
import { SendIcon, InfoIcon } from './icons';
import type { ChatMessage } from '../types';
import { FileUpload } from './FileUpload';

const AssistantMessage: React.FC<{ content: string }> = ({ content }) => {
  const formattedContent = content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(?!`)(.*?)(?!`)\*/g, '<em>$1</em>')
    .replace(/\n\* (.*?)/g, '\n<li>$1</li>')
    .replace(/(\n<li>.*<\/li>)/gs, (match) => `<ul>${match.replace(/\n/g, '')}</ul>`);

  return (
    <div className="col-start-1 col-end-12 p-3 rounded-lg">
        <div className="flex flex-row items-start">
            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-indigo-500 flex-shrink-0 text-white font-bold">
                A
            </div>
            <div className="relative ml-3 text-sm bg-white py-2 px-4 shadow rounded-xl">
                <div className="prose prose-sm" dangerouslySetInnerHTML={{ __html: formattedContent }} />
            </div>
        </div>
    </div>
  );
};

const UserMessage: React.FC<{ content: string }> = ({ content }) => (
    <div className="col-start-2 col-end-13 p-3 rounded-lg">
        <div className="flex items-center justify-start flex-row-reverse">
            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-teal-500 flex-shrink-0 text-white font-bold">
                U
            </div>
            <div className="relative mr-3 text-sm bg-teal-100 py-2 px-4 shadow rounded-xl">
                <div>{content}</div>
            </div>
        </div>
    </div>
);

export const Chat: React.FC<{ 
  showToast: (message: string, type: 'success' | 'error') => void;
  sharedInvoiceFile?: File | null;
}> = ({ showToast, sharedInvoiceFile }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Hello! Upload a document and ask me anything about it.' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [ragFile, setRagFile] = useState<File | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Use shared invoice file if available, otherwise use manually uploaded file
  const activeFile = sharedInvoiceFile || ragFile;

  useEffect(() => {
    if (sharedInvoiceFile) {
      setMessages(prev => {
        if (prev.length === 1 && prev[0].role === 'assistant' && prev[0].content.includes('Upload a document')) {
          return [{ role: 'assistant', content: 'Hello! I\'m ready to answer questions about your TFL invoice. What would you like to know?' }];
        }
        return prev;
      });
    } else if (!sharedInvoiceFile && !ragFile) {
      // Reset to initial message if both files are removed
      setMessages([{ role: 'assistant', content: 'Hello! Upload a document and ask me anything about it.' }]);
    }
  }, [sharedInvoiceFile, ragFile]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    if (!activeFile) {
        showToast('Please upload a document to chat with.', 'error');
        return;
    }

    const userMessage: ChatMessage = { role: 'user', content: inputValue };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // TODO: Connect to LangGraph RAG endpoint
    try {
        const formData = new FormData();
        formData.append('file', activeFile);
        formData.append('message', userMessage.content);
        
        console.log("Sending chat message:", { message: userMessage.content, file: activeFile.name });

      // Simulate API call and streaming response
      await new Promise(resolve => setTimeout(resolve, 500));
      const fullResponse = "Based on your document, the total spend for the first week of November was **£34.50**. The most frequent journey was from *Waterloo to Canary Wharf*. \n\nHere are some other key points:\n* There were 5 peak-hour journeys.\n* 2 journeys were made on the weekend.\n* The average cost per journey was £3.45.";
      
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      for (let i = 0; i < fullResponse.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 15));
        setMessages(prev => {
          const lastMsg = prev[prev.length - 1];
          const newMessages = [...prev.slice(0, -1)];
          newMessages.push({ ...lastMsg, content: fullResponse.substring(0, i + 1) });
          return newMessages;
        });
      }

    } catch (error) {
      console.error(error);
      showToast('Failed to get response from assistant.', 'error');
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I ran into an error. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleFileUploaded = (file: File) => {
    setRagFile(file);
    showToast(`${file.name} is ready for chat.`, 'success');
  };
  
  const handleFileRemoved = () => {
    setRagFile(null);
    showToast(`File removed.`, 'success');
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg h-full flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 mb-4 flex-shrink-0">
        <h2 className="text-2xl font-bold text-gray-800">Document Assistant</h2>
        <div className="relative group">
            <InfoIcon className="h-5 w-5 text-gray-400 cursor-pointer" />
            <div className="absolute bottom-full mb-2 w-64 bg-gray-800 text-white text-xs rounded py-2 px-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
                This is a RAG system. Upload a document to start asking questions about its content.
                <svg className="absolute text-gray-800 h-2 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255"><polygon className="fill-current" points="0,0 127.5,127.5 255,0"/></svg>
            </div>
        </div>
      </div>
      
      {!sharedInvoiceFile && (
        <div className="mb-4 flex-shrink-0">
            <FileUpload
              id="rag-file"
              title="Upload Document for Chat"
              description="Upload a document to provide context for the assistant."
              uploadedFile={ragFile}
              onFileUpload={handleFileUploaded}
              onFileRemove={handleFileRemoved}
              acceptedTypes={['.csv', '.pdf', '.txt', '.docx']}
            />
        </div>
      )}
      
      {sharedInvoiceFile && (
        <div className="mb-4 flex-shrink-0 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
          <p className="text-sm text-indigo-800 font-medium">
            💬 Chatting with TFL invoice: <span className="font-semibold">{sharedInvoiceFile.name}</span>
          </p>
          <p className="text-xs text-indigo-600 mt-1">
            This file was uploaded in the Transport Calculator. Toggle it off there to upload a different document here.
          </p>
        </div>
      )}

      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        <div className="flex flex-col flex-1 min-h-0 rounded-2xl bg-gray-100 p-4 overflow-hidden">
          <div className="flex flex-col flex-1 min-h-0 overflow-y-auto mb-4">
            <div className="grid grid-cols-12 gap-y-2">
              {messages.map((msg, index) =>
                msg.role === 'user' ? (
                  <UserMessage key={index} content={msg.content} />
                ) : (
                  <AssistantMessage key={index} content={msg.content} />
                )
              )}
              {isLoading && (
                 <div className="col-start-1 col-end-12 p-3 rounded-lg">
                    <div className="flex flex-row items-center">
                        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-indigo-500 flex-shrink-0 text-white font-bold">A</div>
                        <div className="relative ml-3 text-sm bg-white py-2 px-4 shadow rounded-xl">
                           <div className="flex items-center space-x-1">
                                <span className="text-gray-500">Thinking</span>
                                <div className="bg-gray-400 w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                <div className="bg-gray-400 w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                <div className="bg-gray-400 w-1.5 h-1.5 rounded-full animate-bounce"></div>
                           </div>
                        </div>
                    </div>
                </div>
              )}
               <div ref={chatEndRef} />
            </div>
          </div>
          <form onSubmit={handleSendMessage} className="flex flex-row items-center h-16 flex-shrink-0 rounded-xl bg-white w-full px-4">
            <div className="flex-grow">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="flex w-full border rounded-xl focus:outline-none focus:border-indigo-300 pl-4 h-10"
                placeholder={activeFile ? "Ask about your document..." : "Upload a document first"}
                disabled={!activeFile}
              />
            </div>
            <div className="ml-4">
              <button
                type="submit"
                disabled={isLoading || !activeFile}
                className="flex items-center justify-center bg-indigo-500 hover:bg-indigo-600 rounded-xl text-white px-4 py-2 flex-shrink-0 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors"
              >
                <span>Send</span>
                <span className="ml-2">
                  <SendIcon className="w-4 h-4 transform rotate-45 -mt-px" />
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
