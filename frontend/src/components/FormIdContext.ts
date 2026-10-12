import { createContext, useContext } from 'react';

export const FormIdContext = createContext<string | undefined>(undefined);

export function useFormId(): string | undefined {
  return useContext(FormIdContext);
}
