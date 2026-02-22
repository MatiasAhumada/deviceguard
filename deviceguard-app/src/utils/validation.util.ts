export const validateProvisioningCode = (code: string): boolean => {
  const codeRegex = /^[A-Z0-9]{6}$/;
  return codeRegex.test(code);
};

export const formatProvisioningCode = (code: string): string => {
  return code.toUpperCase().trim();
};
