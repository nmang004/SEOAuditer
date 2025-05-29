import * as React from 'react';

export interface TypewriterTextProps {
  text: string;
  speed?: number; // ms per character
  className?: string;
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({ text, speed = 40, className }) => {
  const [displayed, setDisplayed] = React.useState('');
  React.useEffect(() => {
    setDisplayed('');
    let i = 0;
    const interval = setInterval(() => {
      setDisplayed((prev) => prev + text[i]);
      i++;
      if (i >= text.length) clearInterval(interval);
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);
  return <span className={className}>{displayed}</span>;
}; 