
"use client"
      
import * as React from "react"
import { cn } from "@/lib/utils"

// --- Contexto y Hooks ---
interface StepperContextProps { activeStep: number; steps: { label: string, icon?: React.ReactNode }[]; }
const StepperContext = React.createContext<StepperContextProps>({ activeStep: 0, steps: [] });
const useStepperContext = () => React.useContext(StepperContext);

// --- Props ---
interface StepperProps {
  initialStep?: number;
  steps: { label: string, icon?: React.ReactNode }[];
  children: (props: {
    activeStep: number;
    isFirstStep: boolean;
    isLastStep: boolean;
    nextStep: () => void;
    prevStep: () => void;
    setStep: (step: number) => void;
  }) => React.ReactNode;
}

// --- Componente Principal Stepper ---
function Stepper({ initialStep = 0, steps, children }: StepperProps) {
  const [activeStep, setActiveStep] = React.useState(initialStep);
  
  const nextStep = () => setActiveStep(prev => (prev < steps.length - 1 ? prev + 1 : prev));
  const prevStep = () => setActiveStep(prev => (prev > 0 ? prev - 1 : prev));
  const setStep = (step: number) => {
    if (step >= 0 && step < steps.length) {
      setActiveStep(step);
    }
  };

  const isFirstStep = activeStep === 0;
  const isLastStep = activeStep === steps.length - 1;
  return (
    <StepperContext.Provider value={{ activeStep, steps }}>
      {children({ activeStep, isFirstStep, isLastStep, nextStep, prevStep, setStep })}
    </StepperContext.Provider>
  )
}

// --- Sub-componente Navigation ---
const Navigation = () => {
  const { activeStep, steps } = useStepperContext();
  const totalSteps = steps.length;
  
  return (
    <nav aria-label="Progress" className="w-full">
      <ol role="list" className="flex justify-between items-center relative w-full px-2 sm:px-0">
        {/* The connecting line */}
        <div className="absolute left-6 right-6 top-5 -ml-px mt-0.5 h-0.5 bg-border z-0" aria-hidden="true" />
        <div 
          className="absolute left-6 top-5 -ml-px mt-0.5 h-0.5 bg-primary z-0 transition-all duration-500 ease-in-out" 
          style={{ width: totalSteps > 1 ? `calc(${(activeStep / (totalSteps - 1)) * 100}% - 3rem)` : '0%' }}
          aria-hidden="true" 
        />
        
        {steps.map((step, index) => (
          <li key={step.label} className="relative z-10">
            <div className="flex items-center text-sm font-medium">
              <span
                className={cn(
                  "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full transition-all duration-500",
                  index < activeStep
                    ? "bg-primary text-primary-foreground"
                    : index === activeStep
                    ? "border-2 border-primary bg-background text-primary scale-110 shadow-lg shadow-primary/10"
                    : "border-2 border-border bg-background text-muted-foreground"
                )}
              >
                {index < activeStep ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                ) : (
                  step.icon || <span>{index + 1}</span>
                )}
              </span>
              <span className={cn(
                "ml-3 hidden md:inline-flex font-bold uppercase tracking-widest text-[10px] transition-colors duration-500",
                index <= activeStep ? "text-primary" : "text-muted-foreground"
              )}>
                {step.label}
              </span>
            </div>
          </li>
        ))}
      </ol>
    </nav>
  )
}
Navigation.displayName = "StepperNavigation"


// --- Sub-componente Step ---
interface StepProps {
  index: number;
  children: React.ReactNode;
}
const Step = ({ index, children }: StepProps) => {
  const { activeStep } = useStepperContext();
  return activeStep === index ? <>{children}</> : null;
}
Step.displayName = "StepperStep"

// --- Adjuntamos los sub-componentes al componente principal ---
Stepper.Navigation = Navigation;
Stepper.Step = Step;

export { Stepper };
