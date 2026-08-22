import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { FormListPage } from '@/pages/FormListPage';
import { FormBuilderPage } from '@/pages/FormBuilderPage';
import { EntriesPage } from '@/pages/EntriesPage';
import { PublicFormPage } from '@/pages/PublicFormPage';
import { DEFAULT_WORKSPACE } from '@/lib/api';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Standalone use lands on the built-in workspace. */}
        <Route path="/" element={<Navigate to={`/${DEFAULT_WORKSPACE}/forms`} replace />} />

        <Route path="/:workspaceId/forms" element={<FormListPage />} />
        <Route path="/:workspaceId/forms/new" element={<FormBuilderPage />} />
        <Route path="/:workspaceId/forms/:id/edit" element={<FormBuilderPage />} />
        <Route path="/:workspaceId/forms/:id/entries" element={<EntriesPage />} />

        {/* The public share link: form id only, no workspace. */}
        <Route path="/f/:id" element={<PublicFormPage />} />
      </Routes>
    </BrowserRouter>
  );
}
