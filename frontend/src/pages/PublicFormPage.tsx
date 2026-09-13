import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  Container,
  Text,
  Center,
  Stack,
  Button,
  ThemeIcon,
} from '@mantine/core';
import { IconCheck, IconClockPause } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import {
  getPublicForm,
  submitForm,
  recordView,
  ApiError,
  isPaymentRequired,
  getPaymentStatus,
  getSubmissionForEdit,
  updateSubmissionByToken,
  getPartialForResume,
  emailResumeLink,
} from '@/lib/api';
import { waitForPayment } from '@/lib/razorpay';
import { openGatewayCheckout, providerRedirectsAway } from '@/lib/payment';
import { rememberPayuPayment, takePayuPayment } from '@/lib/payu';
import type { Form } from '@/types';
import { FormRenderer } from '@/components/FormRenderer';
import { PoweredBy } from '@/components/public/PoweredBy';
import { FormPage } from '@/components/FormPage';
import { FormLoader } from '@/components/FormLoader';

function prefillFrom(form: Form | null, values: Record<string, string>) {
  if (!form) return {};
  const findValue = (types: string[]) => {
    const flatten = (fields: Form['fields']): Form['fields'] =>
      fields.flatMap((f) =>
        f.type === 'grid' ? flatten((f.columns ?? []).flat()) : [f]
      );
    const field = flatten(form.fields).find((f) => types.includes(f.type));
    return field ? values[field.id] : undefined;
  };
  return {
    name: findValue(['name']),
    email: findValue(['email']),
    contact: findValue(['phone']),
  };
}

export function PublicFormPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get("preview") === "1";
  const editToken = searchParams.get("edit");
  const resumeToken = searchParams.get("resume");
  const [form, setForm] = useState<Form | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editData, setEditData] = useState<Record<string, string> | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [resumeKey, setResumeKey] = useState<string | null>(null);
  const lastOrderId = useRef<string | null>(null);
 
  const embedded = window.self !== window.top;

  useEffect(() => {
    if (!id) return;
    getPublicForm(id)
      .then(setForm)
      .catch((e: Error) => setError(e.message));
  }, [id]);


  useEffect(() => {
    if (!id || !resumeToken) return;
    getPartialForResume(id, resumeToken)
      .then((res) => {
        setEditData(res.data);
        if (res.partialKey) setResumeKey(res.partialKey);
      })
      .catch(() =>
        setEditError(
          "This link has expired, or the saved answers are no longer available."
        )
      );
  }, [id, resumeToken]);

  useEffect(() => {
    if (!id || !editToken) return;
    getSubmissionForEdit(id, editToken)
      .then((res) => setEditData(res.data))
      .catch((e: Error) =>
        setEditError(
          e instanceof ApiError && e.code === "link_expired"
            ? "This edit link has expired. Your response was still received."
            : "This edit link is no longer valid. Your response was still received."
        )
      );
  }, [id, editToken]);


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


  useEffect(() => {
    if (!id || isPreview) return;
    const key = `da-forms-viewed-${id}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    recordView(id).catch(() => {});
  }, [id, isPreview]);

  useEffect(() => {
    if (!id) return;
    const hinted = searchParams.get("payuStatus");
    if (!hinted) return;

    const pending = takePayuPayment(id);
    const orderId = pending?.orderId ?? searchParams.get("payuOrder");
    if (!orderId) return;

    if (hinted === "failed") {
      notifications.show({
        message: "The payment did not go through. Nothing was charged — you can try again.",
        color: "red",
      });
      return;
    }
    if (hinted === "error") {
      notifications.show({
        message: "This form cannot take payments right now. Please try again later.",
        color: "red",
      });
      return;
    }

    setSubmitting(true);
    waitForPayment(() => getPaymentStatus(id, orderId))
      .then((confirmed) => {
        setSubmitting(false);
        if (confirmed) {
          setSubmitted(true);
          return;
        }
        notifications.show({
          message:
            "Your payment went through, but confirming it is taking longer than usual. " +
            "You'll get an email once it clears — no need to pay again.",
          color: "yellow",
          autoClose: false,
        });
      })
      .catch(() => setSubmitting(false));
  }, [id, searchParams]);

  async function handleSubmit(
    values: Record<string, string>,
    partialKey?: string | null,
    payerPhone?: string
  ): Promise<boolean> {
    if (!id) return false;


    if (editToken && editData) {
      setSubmitting(true);
      try {
        await updateSubmissionByToken(id, editToken, values);
        setSubmitting(false);
        setSubmitted(true);
        return true;
      } catch (e) {
        setSubmitting(false);
        notifications.show({
          message:
            e instanceof ApiError
              ? e.message
              : "Could not save your changes. Please try again.",
          color: "red",
        });
        return false;
      }
    }

    if (isPreview) {
      notifications.show({
        message: 'Preview — nothing was submitted and no payment was taken.',
        color: 'blue',
      });
      setSubmitted(true);
      return true;
    }

    setSubmitting(true);
    try {
      const result = await submitForm(id, {
        ...values,
        ...(lastOrderId.current ? { _retryOrderId: lastOrderId.current } : {}),
        ...(resumeKey || partialKey
          ? { _partialKey: resumeKey ?? partialKey! }
          : {}),
        ...(payerPhone ? { _payerPhone: payerPhone } : {}),
      });


      if (isPaymentRequired(result)) {
        lastOrderId.current = result.orderId;
        if (result.provider === "payu" || providerRedirectsAway(result.provider)) {
          rememberPayuPayment({ formId: id, orderId: result.orderId, startedAt: Date.now() });
        }
        const outcome = await openGatewayCheckout(result, prefillFrom(form, values));
        if (!outcome.ok) {
          setSubmitting(false);
          notifications.show({
            message: outcome.reason ?? "Payment was not completed.",
            color: "red",
          });
          return false;
        }
        const confirmed = await waitForPayment(() =>
          getPaymentStatus(id, result.orderId),
        );
        if (!confirmed) {
          setSubmitting(false);
          notifications.show({
            message:
              "Your payment went through, but confirming it is taking longer than usual. " +
              "You'll get an email once it clears — no need to pay again.",
            color: "yellow",
            autoClose: false,
          });
          return true;
        }
      }
    } catch (e) {
      setSubmitting(false);
      if (e instanceof ApiError && e.code === "phone_required") {
        getPublicForm(id).then(setForm);
        notifications.show({ message: e.message, color: "orange" });
        return false;
      }
      if (
        e instanceof ApiError &&
        (e.code === "rate_limited" ||
          e.code === "duplicate_value" ||
          e.code === "spam_detected" ||
          e.code === "invalid_amount" ||
          e.code === "payment_unavailable")
      ) {
        notifications.show({ message: e.message, color: "red" });
        return false;
      }

      getPublicForm(id).then(setForm);
      return false;
    }
    setSubmitting(false);
    if (form?.redirectUrl) {
      window.location.href = form.redirectUrl;
      return true;
    }
    setSubmitted(true);
    return true;
  }

  if (error)
    return (
      <Center mih="100dvh" py={0}>
        <Text c="dimmed">Form not found.</Text>
      </Center>
    );

  if (!form || ((editToken || resumeToken) && !editData && !editError))
    return (
      <FormPage>
        <Center mih="100dvh">
          <FormLoader />
        </Center>
      </FormPage>
    );

  if (editError)
    return (
      <Center
        mih="100dvh"
        py={64}
        className="da-forms-light-surface"
        data-mantine-color-scheme="light"
        style={{ background: "#fff" }}
      >
        <Container size="xs" px="md" style={{ width: "100%", textAlign: "center" }}>
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
            This link has expired
          </Text>
          <Text size="sm" c="dimmed" mt="md">
            {editError}
          </Text>
        </Container>
      </Center>
    );

  const closed = form.availability && !form.availability.open;
  if (closed && !isPreview && !editToken)
    return (
      <Center
        mih="100dvh"
        py={64}
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
            {form.availability?.reason === "notYetOpen"
              ? "This form isn't open yet"
              : form.availability?.reason === "full"
                ? "This form is full"
                : form.availability?.reason === "closed"
                  ? "This form has closed"
                  : "This form isn't accepting responses yet"}
          </Text>
          <Text size="sm" c="dimmed" mt="md">
            {form.availability?.message ??
              "The owner hasn't published it. Check back later or contact whoever shared this link."}
          </Text>
        </Container>
      </Center>
    );

  if (submitted) {

    const accent = form?.theme?.accentColor;
    return (

      <Center
        mih="100dvh"
        py={64}
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
            <ThemeIcon
              size={64}
              radius="xl"
              color={accent ? undefined : "green"}
              variant="filled"
              style={accent ? { backgroundColor: accent } : undefined}
            >
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
            {editToken
              ? "Your changes are saved."
              : form.thankYouMessage || "Thanks — that reached us."}
          </Text>
          <Stack align="center" gap={2} mt="md">
            <Text size="sm" c="dimmed">
              {editToken
                ? "Your response has been updated."
                : "Your response has been recorded."}
            </Text>
            <Text size="sm" c="dimmed">
              You can safely close this page now.
            </Text>
          </Stack>

          {!editToken && (
            <Button
              color={accent ? undefined : "emerald"}
              style={accent ? { backgroundColor: accent } : undefined}
              radius="md"
              mt="xl"
              onClick={() => setSubmitted(false)}
            >
              Submit another response
            </Button>
          )}
          <PoweredBy branding={form.branding} />
        </Container>
      </Center>
    );
  }

  return (
    <FormPage
      theme={form.theme}
      footer={<PoweredBy branding={form.branding} theme={form.theme} />}
    >
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
        collectPartials={form.collectPartials}
        requireCaptcha={form.requireCaptcha && !isPreview}
        allowResume={Boolean(form.collectPartials) && !isPreview && !editToken}
        onSaveForLater={(email, partialKey) => emailResumeLink(id!, partialKey, email)}
        initialData={editData ?? undefined}
        needsPayerPhone={form.needsPayerPhone}
        onSubmit={handleSubmit}
      />
    </FormPage>
  );
}
