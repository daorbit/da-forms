import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { FormListPage } from '@/pages/FormListPage';
import { FormBuilderPage } from '@/pages/FormBuilderPage';
import { EntriesPage } from '@/pages/EntriesPage';
import { PublicFormPage } from '@/pages/PublicFormPage';
import { SmallScreenGate } from '@/components/builder/SmallScreenGate';
import { DEFAULT_WORKSPACE } from '@/lib/api';
import { isDemoWorkspace } from '@/lib/demoWorkspace';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';

 
function NewFormRoute() {
  const workspaceId = useWorkspaceId();
  if (isDemoWorkspace(workspaceId)) return <Navigate to={`/${workspaceId}/forms`} replace />;
  return (
    <SmallScreenGate>
      <FormBuilderPage />
    </SmallScreenGate>
  );
}

function EntriesRoute() {
  const workspaceId = useWorkspaceId();
  if (isDemoWorkspace(workspaceId)) return <Navigate to={`/${workspaceId}/forms`} replace />;
  return <EntriesPage />;
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Standalone use lands on the built-in workspace. */}
        <Route path="/" element={<Navigate to={`/${DEFAULT_WORKSPACE}/forms`} replace />} />

        <Route path="/:workspaceId/forms" element={<FormListPage />} />
        <Route path="/:workspaceId/forms/new" element={<NewFormRoute />} />
        <Route
          path="/:workspaceId/forms/:id/edit"
          element={
            <SmallScreenGate>
              <FormBuilderPage />
            </SmallScreenGate>
          }
        />
        <Route path="/:workspaceId/forms/:id/entries" element={<EntriesRoute />} />
        <Route path="/form/:id/view" element={<PublicFormPage />} />
        <Route path="/from/:id/view" element={<PublicFormPage />} />
      </Routes>
    </BrowserRouter>
  );
}
