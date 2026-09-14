import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { FormListPage } from '@/pages/FormListPage';
import { FormBuilderPage } from '@/pages/FormBuilderPage';
import { CreateFormPage } from '@/pages/CreateFormPage';
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

/**
 * The create flow. Behind the same demo guard as the builder: it ends in a
 * write, so a read-only workspace should never reach it.
 */
function CreateFormRoute() {
  const workspaceId = useWorkspaceId();
  if (isDemoWorkspace(workspaceId)) return <Navigate to={`/${workspaceId}/forms`} replace />;
  return (
    <SmallScreenGate>
      <CreateFormPage />
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
        <Route path="/:workspaceId/forms/create" element={<CreateFormRoute />} />
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
