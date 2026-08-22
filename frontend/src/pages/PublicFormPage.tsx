import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getForm, submitForm } from '@/lib/api';
import type { Form } from '@/types';
import { FieldInput } from '@/components/FieldInput';

export function PublicFormPage() {
  const { id } = useParams<{ id: string }>();
  const [form, setForm] = useState<Form | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!id) return;
    getForm(id)
      .then(setForm)
      .catch((e: Error) => setError(e.message));
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    await submitForm(id, values);
    setSubmitted(true);
  }

  if (error) return <p>Form not found.</p>;
  if (!form) return <p>Loading...</p>;

  if (submitted) {
    return <p>Thanks! Your response has been recorded.</p>;
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>{form.title}</h2>
      {form.description && <p>{form.description}</p>}
      {form.fields.map((field) => (
        <div key={field.id}>
          <label>
            {field.label}
            {field.required && ' *'}
          </label>
          <FieldInput
            field={field}
            value={values[field.id] ?? ''}
            onChange={(v) => setValues((prev) => ({ ...prev, [field.id]: v }))}
          />
        </div>
      ))}
      <button type="submit">Submit</button>
    </form>
  );
}
