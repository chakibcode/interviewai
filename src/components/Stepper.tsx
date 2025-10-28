import React from 'react';

interface StepperProps {
  steps: string[];
  currentStep: number;
}

const Stepper: React.FC<StepperProps> = ({ steps, currentStep }) => {
  return (
    <div className="flex items-center">
      {steps.map((step, index) => (
        <React.Fragment key={index}>
          <div className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                index + 1 < currentStep
                  ? 'bg-green-500 text-white'
                  : index + 1 === currentStep
                  ? 'border-2 border-green-500 text-green-500'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {index + 1 < currentStep ? '✓' : index + 1}
            </div>
            <div className={`ml-4 font-medium ${
              index + 1 === currentStep ? 'text-primary' : 'text-muted-foreground'
            }`}>
              {step}
            </div>
          </div>
          {index < steps.length - 1 && (
            <div
              className={`flex-auto border-t-2 mx-4 ${
                index + 1 < currentStep ? 'border-green-500' : 'border-gray-200'
              }`}
            ></div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default Stepper;