import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listForms } from '@/lib/api';
import type { Form } from '@/types';

export function FormListPage() {
  const [forms, setForms] = useState<Form[]>([]);

  useEffect(() => {
    listForms().then(setForms);
  }, []);

  return (
    <main>
      <h1>Forms</h1>
      <Link to="/new">+ New form</Link>
      <ul>
        {forms.map((form) => (
          <li key={form._id}>
            <Link to={`/forms/${form._id}`}>{form.title}</Link> ({form.status})
          </li>
        ))}
      </ul>
    </main>
  );
}
