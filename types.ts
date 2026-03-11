
export type FormFieldType = 'text' | 'textarea' | 'select';

export interface SelectOption {
  value: string;
  label: string;
}

export interface FormFieldSchema {
  id: string; // unique id for react keys
  name: string; // the key in the data object, should be unique within the form
  label: string;
  englishLabel?: string; // New: Translation for UI only
  type: FormFieldType;
  options?: SelectOption[];
  placeholder?: string;
  rows?: number;
  width?: 'full' | 'half';
}

export interface FieldSetSchema {
  id: string;
  legend: string;
  fields: FormFieldSchema[];
}

export type FormSchema = FieldSetSchema[];

export type VerificationStatus = 'unverified' | 'ai-filled' | 'verified';

// The main data structure for a single record.
// Keys correspond to the 'name' in FormFieldSchema.
export type KanpoData = Record<string, any> & {
  verificationStatus?: VerificationStatus;
  _ai_reasoning?: string;
};

export type ApiProvider = 'gemini' | 'groq' | 'perplexity' | 'ollama';

export interface ApiConfig {
  provider: ApiProvider;
  apiKey: string | null;
  model: string;
  ollamaUrl: string;
  ollamaModel: string;
}

export type UserRole = 'admin' | 'user';

export interface User {
  id: number;
  name: string;
  username: string;
  password?: string;
  role: UserRole;
}
