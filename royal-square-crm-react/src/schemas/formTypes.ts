export type FieldType =
  | 'text'
  | 'email'
  | 'tel'
  | 'number'
  | 'date'
  | 'select'
  | 'textarea'
  | 'currency'
  | 'masked_rsa_id';

export interface FieldOption {
  label: string;
  value: string;
}

export interface FormFieldSchema {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  options?: FieldOption[];
  defaultValue?: any;
  sanitize?: boolean;
  currency?: string;
}

export interface FormSectionSchema {
  id: string;
  title: string;
  columns?: number;
  fields: FormFieldSchema[];
}

export interface FormSecurityConfig {
  csrfProtected?: boolean;
  enableHoneypot?: boolean;
  preventDoubleSubmit?: boolean;
  fieldMasking?: string[];
}

export interface DynamicFormSchema {
  formId: string;
  title: string;
  description?: string;
  submitEndpoint: string;
  method?: 'POST' | 'PUT' | 'PATCH';
  security?: FormSecurityConfig;
  sections: FormSectionSchema[];
}
