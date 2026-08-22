import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { FormListPage } from '@/pages/FormListPage';
import { NewFormPage } from '@/pages/NewFormPage';
import { FormDetailPage } from '@/pages/FormDetailPage';
import { PublicFormPage } from '@/pages/PublicFormPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<FormListPage />} />
        <Route path="/new" element={<NewFormPage />} />
        <Route path="/forms/:id" element={<FormDetailPage />} />
        <Route path="/f/:id" element={<PublicFormPage />} />
      </Routes>
    </BrowserRouter>
  );
}
