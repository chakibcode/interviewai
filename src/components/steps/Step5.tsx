import React from 'react';
import { Input } from '@/components/ui/input';

interface Step5Props {
  budget: string;
  setBudget: (budget: string) => void;
}

const Step5: React.FC<Step5Props> = ({ budget, setBudget }) => {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">What is your budget?</h2>
      <Input 
        placeholder="Enter your budget" 
        value={budget} 
        onChange={(e) => setBudget(e.target.value)} 
      />
    </div>
  );
};

export default Step5;