
import React, { useState, useCallback, useRef } from 'react';
import { UploadIcon, CsvIcon, PdfIcon, FileIcon, CloseIcon } from './icons';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  onFileRemove: () => void;
  uploadedFile: File | null;
  acceptedTypes: string[];
  title: string;
  description: string;
  id: string;
}

const getFileIcon = (fileName: string) => {
  if (fileName.endsWith('.csv')) return <CsvIcon className="h-10 w-10 text-teal-500" />;
  if (fileName.endsWith('.pdf')) return <PdfIcon className="h-10 w-10 text-red-500" />;
  return <FileIcon className="h-10 w-10 text-gray-500" />;
};

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileUpload,
  onFileRemove,
  uploadedFile,
  acceptedTypes,
  title,
  description,
  id
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (files: FileList | null) => {
    if (files && files.length > 0) {
      const file = files[0];
      if (acceptedTypes.some(type => file.name.endsWith(type))) {
        onFileUpload(file);
      } else {
        alert(`Invalid file type. Please upload one of: ${acceptedTypes.join(', ')}`);
      }
    }
  };

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);
  
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFileChange(e.dataTransfer.files);
  }, [acceptedTypes]);

  const handleBrowseClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      <p className="text-sm text-gray-500 mb-4">{description}</p>
      {uploadedFile ? (
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between transition-all duration-300">
          <div className="flex items-center gap-4">
            {getFileIcon(uploadedFile.name)}
            <div>
              <p className="font-medium text-gray-800 truncate max-w-[200px]">{uploadedFile.name}</p>
              <p className="text-sm text-gray-500">{(uploadedFile.size / 1024).toFixed(2)} KB</p>
            </div>
          </div>
          <button onClick={onFileRemove} className="text-gray-400 hover:text-red-600 transition-colors">
            <CloseIcon className="h-6 w-6" />
          </button>
        </div>
      ) : (
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={handleBrowseClick}
          className={`relative flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-300 min-h-[140px] max-h-[140px] ${
            isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
          }`}
        >
          <UploadIcon className="h-8 w-8 text-gray-400 mb-2" />
          <p className="text-center text-gray-600 text-sm">
            <span className="font-semibold text-indigo-600">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {acceptedTypes.join(', ').toUpperCase().replace(/\./g, '')} files only
          </p>
          <input
            ref={inputRef}
            type="file"
            id={id}
            name={id}
            accept={acceptedTypes.join(',')}
            onChange={(e) => handleFileChange(e.target.files)}
            className="hidden"
          />
        </div>
      )}
    </div>
  );
};
