import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  Container,
  Text,
  Center,
  Loader,
  Stack,
  Button,
  ThemeIcon,
} from '@mantine/core';
import { IconCheck, IconClockPause } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { getPublicForm, submitForm, recordView, ApiError } from '@/lib/api';
import type { Form } from '@/types';
import { FormRenderer } from '@/components/FormRenderer';
import { FormPage } from '@/components/FormPage';

export function PublicFormPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get("preview") === "1";
  const [form, setForm] = useState<Form | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    getPublicForm(id)
      .then(setForm)
      .catch((e: Error) => setError(e.message));
  }, [id]);


  useEffect(() => {
    if (window.self === window.top) return;
    document.body.classList.add("da-forms-bare-embed");

    const transparent = form?.theme?.scope === "card";
    document.body.classList.toggle("da-forms-transparent-page", transparent);
    const root = document.getElementById("root");
    if (!root) return;
    const post = () =>
      window.parent.postMessage(
        { type: "da-forms:height", formId: id, height: root.scrollHeight },
        "*",
      );
    const observer = new ResizeObserver(post);
    observer.observe(root);
    post();
    return () => {
      observer.disconnect();
      document.body.classList.remove(
        "da-forms-bare-embed",
        "da-forms-transparent-page",
      );
    };
  }, [id, form, submitted, error]);

  // Not tracked in preview: an editor opening the share-link preview is not
  // a respondent, and shouldn't inflate the view count analytics reads from.
  useEffect(() => {
    if (!id || isPreview) return;
    // Guards against React StrictMode's double-invoke in dev, and a tab
    // reload re-running this effect — the server also dedupes by visitor
    // fingerprint, this just skips the redundant request client-side.
    const key = `da-forms-viewed-${id}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    recordView(id).catch(() => {});
  }, [id, isPreview]);

  async function handleSubmit(values: Record<string, string>) {
    if (!id) return;
    setSubmitting(true);
    try {
      await submitForm(id, values);
    } catch (e) {
      setSubmitting(false);
      if (
        e instanceof ApiError &&
        (e.code === "rate_limited" ||
          e.code === "duplicate_value" ||
          e.code === "spam_detected")
      ) {
        notifications.show({ message: e.message, color: "red" });
        return;
      }
      // The form was unpublished after this page loaded — refetch so the
      // "not accepting responses" screen takes over instead of a dead end.
      getPublicForm(id).then(setForm);
      return;
    }
    setSubmitting(false);
    if (form?.redirectUrl) {
      window.location.href = form.redirectUrl;
      return;
    }
    setSubmitted(true);
  }

  if (error)
    return (
      <Center h="100vh">
        <Text c="dimmed">Form not found.</Text>
      </Center>
    );

  if (!form)
    return (
      <Center h="100vh">
        <Loader />
      </Center>
    );

  if (form.status !== "published" && !isPreview)
    return (
      <Center
        // h="100vh"
        className="da-forms-light-surface"
        data-mantine-color-scheme="light"
        style={{ background: "#fff" }}
      >
        <Container
          size="xs"
          px="md"
          style={{ width: "100%", textAlign: "center" }}
        >
          <Center>
            <ThemeIcon size={64} radius="xl" color="gray" variant="light">
              <IconClockPause size={30} stroke={1.8} />
            </ThemeIcon>
          </Center>
          <Text
            ta="center"
            size="28px"
            fw={800}
            mt="xl"
            style={{ lineHeight: 1.15, letterSpacing: "-0.02em" }}
          >
            This form isn't accepting responses yet
          </Text>
          <Text size="sm" c="dimmed" mt="md">
            The owner hasn't published it. Check back later or contact whoever
            shared this link.
          </Text>
        </Container>
      </Center>
    );

  if (submitted)
    return (
      // Respondents see the form's own colours, never a host app's theme — the
      // share link and the embed are public pages, not part of anyone's dashboard.
      <Center
        // h="100vh"
        className="da-forms-light-surface"
        data-mantine-color-scheme="light"
        style={{ background: "#fff" }}
      >
        <Container
          size="xs"
          px="md"
          style={{ width: "100%", textAlign: "center" }}
        >
          <Center>
            <ThemeIcon size={64} radius="xl" color="emerald" variant="light">
              <IconCheck size={30} stroke={3} />
            </ThemeIcon>
          </Center>
          <Text
            ta="center"
            size="34px"
            fw={800}
            mt="xl"
            style={{ lineHeight: 1.15, letterSpacing: "-0.02em" }}
          >
            {form.thankYouMessage || "Thanks — that reached us."}
          </Text>
          <Stack align="center" gap={2} mt="md">
            <Text size="sm" c="dimmed">
              Your response has been recorded.
            </Text>
            <Text size="sm" c="dimmed">
              You can safely close this page now.
            </Text>
          </Stack>
          <Button
            color="emerald"
            radius="md"
            mt="xl"
            onClick={() => setSubmitted(false)}
          >
            Submit another response
          </Button>
        </Container>
      </Center>
    );

  return (
    <FormPage theme={form.theme}>
      <FormRenderer
        formId={id}
        title={form.title}
        description={form.description}
        fields={form.fields}
        hideHeader={form.hideHeader}
        headerAlign={form.headerAlign}
        labelPlacement={form.labelPlacement}
        submitLabel={form.submitLabel}
        submitButtonSize={form.submitButtonSize}
        submitButtonWidth={form.submitButtonWidth}
        submitButtonAlign={form.submitButtonAlign}
        theme={form.theme}
        steps={form.steps}
        stepIndicator={form.stepIndicator}
        showStepHeadings={form.showStepHeadings}
        submitting={submitting}
        onSubmit={handleSubmit}
      />
    </FormPage>
  );
}
