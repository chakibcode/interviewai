import React from 'react';
import { Textarea } from '@/components/ui/textarea';

interface Step4Props {
  services: string;
  setServices: (services: string) => void;
}

const Step4: React.FC<Step4Props> = ({ services, setServices }) => {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">What services do you offer?</h2>
      <Textarea 
        placeholder="List your services..." 
        value={services} 
        onChange={(e) => setServices(e.target.value)} 
      />
    </div>
  );
};

export default Step4;