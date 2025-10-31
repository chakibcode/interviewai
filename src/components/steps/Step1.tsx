import React from 'react';
import UploadCv from '@/components/UploadCv';
import Step2 from '@/components/steps/Step2';

interface Step1Props {
  onExtracted: (text: string | null) => void;
  onUploadChange: (isLoading: boolean) => void;
  onUploaded: (url: string) => void;
  previewUrl: string | null;
  fullName: string;
  setFullName: (name: string) => void;
  parsedData?: any;
  userId?: string | null;
  extractedText?: string | null;
  isLoading: boolean;
}

const Step1: React.FC<Step1Props> = ({ onExtracted, onUploadChange, onUploaded, previewUrl, fullName, setFullName, parsedData, userId, extractedText, isLoading }) => {
  // Check if parsedData has meaningful content (not just empty schema)
  const hasMeaningfulData = parsedData && (
    parsedData.full_name || 
    parsedData.email || 
    parsedData.phone || 
    (parsedData.skills && parsedData.skills.length > 0) ||
    (parsedData.experience && parsedData.experience.length > 0) ||
    (parsedData.education && parsedData.education.length > 0)
  );
  const nextReady = !!(extractedText && extractedText.length > 0 && hasMeaningfulData) && !isLoading;
  return (
    <div>
      <h2 className="text-2xl text-green-200 font-bold mb-8">Upload Your CV</h2>
      <UploadCv 
        onExtracted={onExtracted} 
        onUploadChange={onUploadChange} 
        onUploaded={onUploaded} 
        previewUrl={previewUrl}
        nextReady={nextReady}
        parseLoading={isLoading}
      />
      {extractedText && extractedText.length > 0 && hasMeaningfulData && (
        <div className="mt-8">
          <Step2
            fullName={fullName}
            setFullName={setFullName}
            parsedData={parsedData}
            userId={userId}
          />
        </div>
      )}
    </div>
  );
};

export default Step1;