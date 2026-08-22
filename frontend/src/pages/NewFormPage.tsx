import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createForm } from '@/lib/api';
import type { FormField, FieldType } from '@/types';

function makeField(): FormField {
  return { id: crypto.randomUUID(), type: 'text', label: '', required: false };
}

export function NewFormPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [fields, setFields] = useState<FormField[]>([makeField()]);

  function updateField(id: string, patch: Partial<FormField>) {
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }

  function removeField(id: string) {
    setFields((prev) => prev.filter((f) => f.id !== id));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const form = await createForm({ title, fields });
    navigate(`/forms/${form._id}`);
  }

  return (
    <main>
      <h1>New form</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Title
          <input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>

        <h3>Fields</h3>
        {fields.map((field) => (
          <div key={field.id}>
            <input
              placeholder="Label"
              value={field.label}
              onChange={(e) => updateField(field.id, { label: e.target.value })}
              required
            />
            <select
              value={field.type}
              onChange={(e) => updateField(field.id, { type: e.target.value as FieldType })}
            >
              <option value="text">Text</option>
              <option value="email">Email</option>
              <option value="phone">Phone</option>
              <option value="textarea">Textarea</option>
              <option value="select">Select</option>
              <option value="checkbox">Checkbox</option>
            </select>
            <label>
              <input
                type="checkbox"
                checked={field.required}
                onChange={(e) => updateField(field.id, { required: e.target.checked })}
              />
              Required
            </label>
            <button type="button" onClick={() => removeField(field.id)}>
              Remove
            </button>
          </div>
        ))}
        <button type="button" onClick={() => setFields((prev) => [...prev, makeField()])}>
          + Add field
        </button>

        <div>
          <button type="submit">Create form</button>
        </div>
      </form>
    </main>
  );
}
