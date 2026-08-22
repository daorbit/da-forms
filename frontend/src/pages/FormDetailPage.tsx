import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getForm, listSubmissions, updateForm } from '@/lib/api';
import type { Form, Submission } from '@/types';

export function FormDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [form, setForm] = useState<Form | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  useEffect(() => {
    if (!id) return;
    getForm(id).then(setForm);
    listSubmissions(id).then(setSubmissions);
  }, [id]);

  if (!form || !id) return <p>Loading...</p>;

  const shareUrl = `${window.location.origin}/f/${id}`;
  const embedCode = `<iframe src="${shareUrl}" width="100%" height="600" frameborder="0"></iframe>`;

  async function publish() {
    const updated = await updateForm(id!, { status: 'published' });
    setForm(updated);
  }

  return (
    <main>
      <h1>{form.title}</h1>
      <p>Status: {form.status}</p>
      {form.status === 'draft' && <button onClick={publish}>Publish</button>}

      <h3>Share link</h3>
      <input readOnly value={shareUrl} onFocus={(e) => e.target.select()} />

      <h3>Embed code</h3>
      <textarea readOnly value={embedCode} rows={3} onFocus={(e) => e.target.select()} />

      <h3>Submissions ({submissions.length})</h3>
      <ul>
        {submissions.map((s) => (
          <li key={s._id}>{JSON.stringify(s.data)}</li>
        ))}
      </ul>
    </main>
  );
}
