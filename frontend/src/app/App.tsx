import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { FormListPage } from '@/pages/FormListPage';
import { FormBuilderPage } from '@/pages/FormBuilderPage';
import { EntriesPage } from '@/pages/EntriesPage';
import { PublicFormPage } from '@/pages/PublicFormPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<FormListPage />} />
        <Route path="/new" element={<FormBuilderPage />} />
        <Route path="/forms/:id/edit" element={<FormBuilderPage />} />
        <Route path="/forms/:id/entries" element={<EntriesPage />} />
        <Route path="/f/:id" element={<PublicFormPage />} />
      </Routes>
    </BrowserRouter>
  );
}
