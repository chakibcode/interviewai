import React from 'react';
import { Textarea } from '@/components/ui/textarea';

interface Step3Props {
  story: string;
  setStory: (story: string) => void;
}

const Step3: React.FC<Step3Props> = ({ story, setStory }) => {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Tell us your story</h2>
      <Textarea 
        placeholder="Summarize your professional story..." 
        value={story} 
        onChange={(e) => setStory(e.target.value)} 
      />
    </div>
  );
};

export default Step3;