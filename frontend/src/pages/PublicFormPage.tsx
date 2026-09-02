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
import { openCheckout, waitForPayment } from '@/lib/razorpay';
import type { Form } from '@/types';
import { FormRenderer } from '@/components/FormRenderer';
import { FormPage } from '@/components/FormPage';
import { FormLoader } from '@/components/FormLoader';

/**
 * Carry what the respondent already typed into the Razorpay window, so they
 * are not asked for their name and email a second time. Best-effort: a form
 * with none of these fields simply prefills nothing.
 */
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
  // Present when the respondent followed the edit link in their confirmation
  // email. The token is the whole credential — there is no session here.
  const editToken = searchParams.get("edit");
  // Present when they followed the "finish later" link they emailed themselves.
  const resumeToken = searchParams.get("resume");
  const [form, setForm] = useState<Form | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  /** The answers being edited, once the token has been exchanged for them. */
  const [editData, setEditData] = useState<Record<string, string> | null>(null);
  /** Why the edit link did not work, in words meant for the respondent. */
  const [editError, setEditError] = useState<string | null>(null);
  /** The draft row a resume link points at, so continuing writes back to it. */
  const [resumeKey, setResumeKey] = useState<string | null>(null);
  // The order id of the last attempt, so a retry after a cancelled checkout
  // can tell the server which pending row it supersedes.
  const lastOrderId = useRef<string | null>(null);
 
  const embedded = window.self !== window.top;

  useEffect(() => {
    if (!id) return;
    getPublicForm(id)
      .then(setForm)
      .catch((e: Error) => setError(e.message));
  }, [id]);

  // The saved draft, fetched before the form renders for the same reason an
  // edit link's answers are: `initialValues` runs once on mount, so answers
  // arriving later would never be shown.
  useEffect(() => {
    if (!id || !resumeToken) return;
    getPartialForResume(id, resumeToken)
      .then((res) => {
        setEditData(res.data);
        // The draft's own key, so continuing writes back to the same row rather
        // than starting a second one beside it.
        if (res.partialKey) setResumeKey(res.partialKey);
      })
      .catch(() =>
        setEditError(
          "This link has expired, or the saved answers are no longer available."
        )
      );
  }, [id, resumeToken]);

  // Exchanged for the stored answers before the form renders, so it opens on
  // what was sent rather than flashing an empty form first.
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

  /** Returns false when nothing was stored, so the renderer keeps the draft. */
  async function handleSubmit(
    values: Record<string, string>,
    partialKey?: string | null
  ): Promise<boolean> {
    if (!id) return false;

    // Editing replaces a response that already exists. It never creates one, so
    // it skips quota, payment and the draft machinery entirely.
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

    // An author checking their own form is not a respondent: nothing is
    // stored, and above all nothing is charged. Without this, previewing a
    // paid form opens a real checkout and bills the person who built it.
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
        // Names the attempt this one replaces, so a cancelled checkout does
        // not leave a pending row behind on every retry.
        ...(lastOrderId.current ? { _retryOrderId: lastOrderId.current } : {}),
        // Names this visit's autosaved row, so the server promotes it instead
        // of storing the finished answers beside the abandoned half. A resumed
        // draft's own key wins: this visit's autosave started a new row, but
        // the one worth promoting is the draft they came back to.
        ...(resumeKey || partialKey
          ? { _partialKey: resumeKey ?? partialKey! }
          : {}),
      });

      // A paid form stores the response but withholds it until Razorpay
      // confirms. Nothing is a submission yet, so nothing below runs until
      // the payment actually lands.
      if (isPaymentRequired(result)) {
        lastOrderId.current = result.orderId;
        const outcome = await openCheckout(result, prefillFrom(form, values));
        if (!outcome.ok) {
          setSubmitting(false);
          notifications.show({
            message: outcome.reason ?? "Payment was not completed.",
            color: "red",
          });
          // Their answers stay put — cancelling a payment should not cost
          // someone the form they just filled in.
          return false;
        }

        // Checkout succeeding is the bank's word, not the server's. The
        // webhook is what completes the submission, so wait for it before
        // telling the respondent they are done.
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
          // Paid but unconfirmed: the draft goes, because submitting again
          // would charge them a second time.
          return true;
        }
      }
    } catch (e) {
      setSubmitting(false);
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
      // The form was unpublished after this page loaded — refetch so the
      // "not accepting responses" screen takes over instead of a dead end.
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

  // Same standalone/embedded split as the status screens below: a spinner
  // pinned to the middle of its own tab, but only as tall as it needs to be
  // inside someone's page.
  if (error)
    return (
      <Center mih="100dvh" py={0}>
        <Text c="dimmed">Form not found.</Text>
      </Center>
    );

  // The form's own theme is not known until it arrives, so the loader uses its
  // own accent here and picks up the form's once there is one.
  //
  // An edit link waits for its answers too: `initialValues` runs once when the
  // renderer mounts, so a form that appeared before they arrived would stay
  // empty no matter what came back.
  if (!form || ((editToken || resumeToken) && !editData && !editError))
    return (
      <FormPage>
        {/* Centred in the viewport rather than sitting where the form's first
            field would be: there is no card yet to anchor it to the top, and
            a spinner parked under the page's top padding reads as misplaced.
            Fills the frame whether standalone or embedded, so the spinner is
            always vertically centred. */}
        <Center mih="100dvh">
          <FormLoader />
        </Center>
      </FormPage>
    );

  // A dead edit link is shown in place of the form: someone who followed one
  // has already submitted, and dropping them into a blank form would invite a
  // duplicate response instead of the change they came to make.
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

  // The server decides this, not the page: `availability` is computed from the
  // schedule and the response count, and the same function refuses the submit.
  // An edit link is exempt — a form that has closed for new responses has not
  // withdrawn the answers someone already sent.
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
            {/* The owner's own wording when they wrote one; the server has
                already resolved which message applies. */}
            {form.availability?.message ??
              "The owner hasn't published it. Check back later or contact whoever shared this link."}
          </Text>
        </Container>
      </Center>
    );

  if (submitted)
    return (
      // Respondents see the form's own colours, never a host app's theme — the
      // share link and the embed are public pages, not part of anyone's dashboard.
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
            <ThemeIcon size={64} radius="xl" color="green" variant="filled">
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
          {/* Not offered after an edit: this person already has a response on
              file, and the button would invite them to file a second one. */}
          {!editToken && (
            <Button
              color="emerald"
              radius="md"
              mt="xl"
              onClick={() => setSubmitted(false)}
            >
              Submit another response
            </Button>
          )}
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
        collectPartials={form.collectPartials}
        // Never in preview: an author checking their own form is not the
        // traffic this guards against, and nothing they send is stored anyway.
        requireCaptcha={form.requireCaptcha && !isPreview}
        // Drafts have to be being kept for there to be anything to return to,
        // and there is no point offering it to someone already finishing one.
        allowResume={Boolean(form.collectPartials) && !isPreview && !editToken}
        onSaveForLater={(email, partialKey) => emailResumeLink(id!, partialKey, email)}
        initialData={editData ?? undefined}
        onSubmit={handleSubmit}
      />
    </FormPage>
  );
}
