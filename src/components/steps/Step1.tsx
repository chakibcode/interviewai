import React from 'react';
import UploadCv from '@/components/UploadCv';

interface Step1Props {
  onExtracted: (text: string | null) => void;
  onUploadChange: (isLoading: boolean) => void;
  onUploaded: (url: string) => void;
  previewUrl: string | null;
}

const Step1: React.FC<Step1Props> = ({ onExtracted, onUploadChange, onUploaded, previewUrl }) => {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Upload Your CV</h2>
      <UploadCv 
        onExtracted={onExtracted} 
        onUploadChange={onUploadChange} 
        onUploaded={onUploaded} 
        previewUrl={previewUrl} 
      />
    </div>
  );
};

export default Step1;