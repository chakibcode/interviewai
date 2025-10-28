import React from 'react';
import { Input } from '@/components/ui/input';

interface Step2Props {
  fullName: string;
  setFullName: (name: string) => void;
}

const Step2: React.FC<Step2Props> = ({ fullName, setFullName }) => {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">What is your name?</h2>
      <Input 
        placeholder="Full Name" 
        value={fullName} 
        onChange={(e) => setFullName(e.target.value)} 
      />
    </div>
  );
};

export default Step2;