import { useState } from 'react';

export function useProvisioningCode() {
  const [code, setCode] = useState<string[]>(['', '', '', '', '', '']);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleInput = (char: string) => {
    if (activeIndex < 6) {
      const newCode = [...code];
      newCode[activeIndex] = char;
      setCode(newCode);
      setActiveIndex(activeIndex + 1);
    }
  };

  const handleDelete = () => {
    if (activeIndex > 0) {
      const newCode = [...code];
      newCode[activeIndex - 1] = '';
      setCode(newCode);
      setActiveIndex(activeIndex - 1);
    }
  };

  const reset = () => {
    setCode(['', '', '', '', '', '']);
    setActiveIndex(0);
  };

  const getFullCode = () => code.join('');

  const isComplete = () => code.every((digit) => digit !== '');

  return {
    code,
    activeIndex,
    handleInput,
    handleDelete,
    reset,
    getFullCode,
    isComplete,
  };
}
