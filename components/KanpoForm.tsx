
import React from 'react';
import { KanpoData, FormSchema, FormFieldSchema as FieldSchema, VerificationStatus } from '../types';
import { SparklesIcon, CheckIcon, InfoIcon } from './icons';

interface KanpoFormProps {
  formData: KanpoData;
  onFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onToggleVerified?: () => void;
  schema: FormSchema;
}

interface FormFieldProps {
  field: FieldSchema;
  value: string | null | undefined;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  aiReasoning?: string;
}

const StatusBadge: React.FC<{ status?: VerificationStatus }> = ({ status }) => {
  if (status === 'verified') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
        <CheckIcon className="w-3 h-3 mr-1" /> Verified
      </span>
    );
  }
  if (status === 'ai-filled') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
        <SparklesIcon className="w-3 h-3 mr-1" /> AI Generated (Needs Review)
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
      Unverified
    </span>
  );
};

const FormField: React.FC<FormFieldProps> = ({ field, value, onChange, aiReasoning }) => {
    const { name, label, englishLabel, type, options, placeholder, rows, width } = field;
    
    // Detect flags
    const isNullField = label.includes('※NULL') || (englishLabel && englishLabel.includes('※NULL'));
    const isAiField = label.includes('*AI') || (englishLabel && englishLabel.includes('*AI'));
    
    // Clean labels for display (remove tags)
    const cleanLabel = (text: string) => text.replace(/※NULL/g, '').replace(/\*AI/g, '').trim();
    
    const displayLabel = cleanLabel(label);
    const displayEnglishLabel = englishLabel ? cleanLabel(englishLabel) : undefined;

    const commonClasses = `block w-full px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-white border ${
        isNullField 
        ? 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 placeholder-gray-300 dark:placeholder-gray-600' 
        : 'bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 placeholder-gray-400 dark:placeholder-gray-500'
    }`;
    
    const containerClasses = width === 'full' ? 'sm:col-span-2' : '';

    const isCategoryField = name === 'データ区分（公告区分）';

    return (
        <div className={containerClasses}>
            <div className="flex items-center mb-1 flex-wrap gap-2">
                <label htmlFor={name} className={`block text-sm font-bold ${isNullField ? 'text-gray-500 dark:text-gray-400' : 'text-gray-800 dark:text-gray-200'}`}>
                    {displayLabel}
                </label>
                {isNullField && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400 border border-gray-300 dark:border-gray-600">
                        INTERNAL / NULL
                    </span>
                )}
                {isAiField && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200 border border-purple-200 dark:border-purple-800">
                        <SparklesIcon className="w-3 h-3 mr-1" /> AI AUTO
                    </span>
                )}
            </div>
            
            {displayEnglishLabel && (
                <span className="block text-xs text-gray-500 dark:text-gray-400 font-normal mb-1">
                    {displayEnglishLabel}
                </span>
            )}

            {type === 'textarea' ? (
                <textarea
                    id={name}
                    name={name}
                    value={value ?? ''}
                    onChange={onChange}
                    rows={rows || 4}
                    className={commonClasses}
                    placeholder={placeholder}
                />
            ) : type === 'select' ? (
                <select 
                    id={name}
                    name={name}
                    value={value ?? ''}
                    onChange={onChange}
                    className={commonClasses}
                >
                    <option value="">Select an option</option>
                    {options?.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                </select>
            ) : (
                <input
                    type="text"
                    id={name}
                    name={name}
                    value={value ?? ''}
                    onChange={onChange}
                    className={commonClasses}
                    placeholder={placeholder}
                />
            )}
            {/* Display AI Reasoning ONLY for the Data Category field if available */}
            {isCategoryField && aiReasoning && (
                <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded text-xs text-blue-800 dark:text-blue-200 flex items-start">
                    <InfoIcon className="w-4 h-4 mr-1.5 mt-0.5 flex-shrink-0" />
                    <span>
                        <strong>AI Reasoning:</strong> {aiReasoning}
                    </span>
                </div>
            )}
        </div>
    );
};

const FieldSet: React.FC<{legend: string, children: React.ReactNode}> = ({ legend, children }) => (
    <fieldset className="border border-gray-300 dark:border-gray-600 p-4 rounded-md">
        <legend className="px-2 text-base font-semibold text-gray-800 dark:text-gray-200">{legend}</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {children}
        </div>
    </fieldset>
);

const KanpoForm: React.FC<KanpoFormProps> = ({ formData, onFormChange, onToggleVerified, schema }) => {
  if (!schema) {
    return <div>Loading form...</div>;
  }
  
  const isVerified = formData.verificationStatus === 'verified';

  return (
    <div className="space-y-4">
        <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-3 rounded-md shadow-sm border border-gray-200 dark:border-gray-700 sticky top-0 z-10">
            <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Status:</span>
                <StatusBadge status={formData.verificationStatus} />
            </div>
            {onToggleVerified && (
                <button 
                    onClick={onToggleVerified}
                    className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        isVerified 
                        ? 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300' 
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                >
                    {isVerified ? 'Mark as Unverified' : 'Mark as Verified'}
                </button>
            )}
        </div>

        <form className="space-y-6">
            {schema.map(fieldSet => (
                <FieldSet key={fieldSet.id} legend={fieldSet.legend}>
                    {fieldSet.fields.map(field => (
                        <FormField 
                            key={field.id}
                            field={field}
                            value={formData[field.name]}
                            onChange={onFormChange}
                            aiReasoning={formData._ai_reasoning}
                        />
                    ))}
                </FieldSet>
            ))}
        </form>
    </div>
  );
};

export default KanpoForm;
