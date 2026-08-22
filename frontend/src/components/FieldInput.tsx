import type { FormField } from '@/types';

interface Props {
  field: FormField;
  value: string;
  onChange: (value: string) => void;
}

export function FieldInput({ field, value, onChange }: Props) {
  if (field.type === 'textarea') {
    return (
      <textarea
        required={field.required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  if (field.type === 'select') {
    return (
      <select required={field.required} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Select...</option>
        {field.options?.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  }

  if (field.type === 'checkbox') {
    return (
      <input
        type="checkbox"
        checked={value === 'true'}
        onChange={(e) => onChange(String(e.target.checked))}
      />
    );
  }

  const htmlType = field.type === 'phone' ? 'tel' : field.type;
  return (
    <input
      type={htmlType}
      required={field.required}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
