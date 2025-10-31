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
}

const Step1: React.FC<Step1Props> = ({ onExtracted, onUploadChange, onUploaded, previewUrl, fullName, setFullName, parsedData, userId }) => {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-8">Upload Your CV</h2>
      <UploadCv 
        onExtracted={onExtracted} 
        onUploadChange={onUploadChange} 
        onUploaded={onUploaded} 
        previewUrl={previewUrl} 
      />
      <div className="mt-8">
        <Step2
          fullName={fullName}
          setFullName={setFullName}
          parsedData={parsedData}
          userId={userId}
        />
      </div>
    </div>
  );
};

export default Step1;