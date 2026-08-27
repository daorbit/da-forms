import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { FormListPage } from '@/pages/FormListPage';
import { FormBuilderPage } from '@/pages/FormBuilderPage';
import { EntriesPage } from '@/pages/EntriesPage';
import { PublicFormPage } from '@/pages/PublicFormPage';
import { DEFAULT_WORKSPACE } from '@/lib/api';
import { isDemoWorkspace } from '@/lib/demoWorkspace';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';

/**
 * Creating a form is the one editor entry point the demo workspace has no
 * answer for — there is nowhere to save it, so the URL sends the visitor back
 * to the sample list rather than into an editor that cannot finish.
 */
function NewFormRoute() {
  const workspaceId = useWorkspaceId();
  if (isDemoWorkspace(workspaceId)) return <Navigate to={`/${workspaceId}/forms`} replace />;
  return <FormBuilderPage />;
}

/** Sample forms collect nothing, so their entries screen has no data to show. */
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
        <Route path="/:workspaceId/forms/:id/edit" element={<FormBuilderPage />} />
        <Route path="/:workspaceId/forms/:id/entries" element={<EntriesRoute />} />

        {/* The public share link: form id only, no workspace. */}
        <Route path="/from/:id/view" element={<PublicFormPage />} />
      </Routes>
    </BrowserRouter>
  );
}
