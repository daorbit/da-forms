import {
  TextInput,
  Textarea,
  Select,
  Checkbox,
  Radio,
  Stack,
  Group,
  Rating,
  NumberInput,
  FileInput,
  Slider,
  Divider,
  Text,
  Title,
  Box,
  Chip,
} from '@mantine/core';
import {
  IconMail,
  IconPhone,
  IconWorld,
  IconCurrencyDollar,
  IconCalendar,
  IconClock,
  IconPhotoUp,
  IconVideo,
} from '@tabler/icons-react';
import type { FormField, FieldSize } from '@/types';

interface Props {
  field: FormField;
  value: string;
  onChange: (value: string) => void;
  /**
   * Renders the control without accepting input, for the builder canvas.
   *
   * The canvas and the live form are the same component on purpose: two
   * renderers for one field type drift, and the drift is invisible until
   * someone compares the editor with what respondents actually get.
   */
  readOnly?: boolean;
  /** Suppresses the label, for a canvas that draws its own above the control. */
  hideLabel?: boolean;
}

const sizeWidth: Record<FieldSize, string> = {
  small: '35%',
  medium: '60%',
  large: '100%',
};

export function FieldControl({ field, value, onChange, readOnly, hideLabel }: Props) {
  const showLabel = !hideLabel && !field.hideLabel;

  const label = showLabel ? (
    <>
      {field.label}
      {field.required && (
        <Text span c="red">
          {' '}
          *
        </Text>
      )}
    </>
  ) : undefined;

  const base = {
    label,
    description: showLabel ? field.instructions : undefined,
    required: field.required,
    placeholder: field.placeholder,
    title: field.hoverText,
    readOnly,
    style: { maxWidth: sizeWidth[field.size ?? 'large'] },
  };

  const text = (extra?: Record<string, unknown>) => (
    <TextInput
      {...base}
      {...extra}
      maxLength={field.maxLength}
      value={value}
      onChange={(e) => !readOnly && onChange(e.target.value)}
    />
  );

  const number = (extra?: Record<string, unknown>) => (
    <NumberInput
      {...base}
      {...extra}
      min={field.min}
      max={field.max}
      value={value}
      onChange={(v) => !readOnly && onChange(String(v))}
    />
  );

  switch (field.type) {
    case 'name': {
      const [first = '', last = ''] = value.split(' ');
      return (
        <div style={base.style}>
          {label && (
            <Text size="sm" fw={500} mb={4}>
              {label}
            </Text>
          )}
          <Group grow gap="sm">
            <div>
              <TextInput
                placeholder={field.placeholder || 'First'}
                value={first}
                readOnly={readOnly}
                title={field.hoverText}
                onChange={(e) => !readOnly && onChange(`${e.target.value} ${last}`.trim())}
                required={field.required}
              />
              <Text size="xs" c="dimmed" mt={4}>
                First
              </Text>
            </div>
            <div>
              <TextInput
                placeholder="Last"
                value={last}
                readOnly={readOnly}
                onChange={(e) => !readOnly && onChange(`${first} ${e.target.value}`.trim())}
              />
              <Text size="xs" c="dimmed" mt={4}>
                Last
              </Text>
            </div>
          </Group>
        </div>
      );
    }

    case 'address': {
      const [street = '', city = '', postal = ''] = value.split('\n');
      const join = (s: string, c: string, p: string) => [s, c, p].join('\n');
      return (
        <div style={base.style}>
          {label && (
            <Text size="sm" fw={500} mb={4}>
              {label}
            </Text>
          )}
          <Stack gap="sm">
            <div>
              <TextInput
                placeholder={field.placeholder || 'Street address'}
                value={street}
                readOnly={readOnly}
                onChange={(e) => !readOnly && onChange(join(e.target.value, city, postal))}
                required={field.required}
              />
              <Text size="xs" c="dimmed" mt={4}>
                Street address
              </Text>
            </div>
            <Group grow gap="sm">
              <div>
                <TextInput
                  placeholder="City"
                  value={city}
                  readOnly={readOnly}
                  onChange={(e) => !readOnly && onChange(join(street, e.target.value, postal))}
                />
                <Text size="xs" c="dimmed" mt={4}>
                  City
                </Text>
              </div>
              <div>
                <TextInput
                  placeholder="Postal code"
                  value={postal}
                  readOnly={readOnly}
                  onChange={(e) => !readOnly && onChange(join(street, city, e.target.value))}
                />
                <Text size="xs" c="dimmed" mt={4}>
                  Postal code
                </Text>
              </div>
            </Group>
          </Stack>
        </div>
      );
    }

    case 'email':
      return text({ type: readOnly ? 'text' : 'email', leftSection: <IconMail size={16} /> });
    case 'phone':
      return text({ type: readOnly ? 'text' : 'tel', leftSection: <IconPhone size={16} /> });
    case 'website':
      return text({
        type: readOnly ? 'text' : 'url',
        leftSection: <IconWorld size={16} />,
        placeholder: field.placeholder || 'https://',
      });
    case 'textarea':
      return (
        <Textarea
          {...base}
          maxLength={field.maxLength}
          value={value}
          onChange={(e) => !readOnly && onChange(e.target.value)}
          autosize
          minRows={3}
        />
      );
    case 'regex':
      return text({ pattern: field.pattern, placeholder: field.placeholder || field.pattern });
    case 'number':
      return number({ placeholder: field.placeholder || '123' });
    case 'decimal':
      return number({ decimalScale: 2, placeholder: field.placeholder || '0.00' });
    case 'currency':
      return number({ decimalScale: 2, leftSection: <IconCurrencyDollar size={16} /> });
    case 'select':
      return (
        <Select
          {...base}
          placeholder={field.placeholder || 'Select...'}
          data={field.options ?? []}
          value={value || null}
          onChange={(v) => !readOnly && onChange(v ?? '')}
        />
      );
    case 'radio':
      return (
        <Radio.Group {...base} value={value} onChange={readOnly ? () => {} : onChange}>
          <Stack gap="xs" mt="xs">
            {(field.options ?? []).map((opt) => (
              <Radio key={opt} value={opt} label={opt} readOnly={readOnly} />
            ))}
          </Stack>
        </Radio.Group>
      );
    case 'checkbox': {
      const selected = value ? value.split(', ') : [];
      return (
        <Checkbox.Group
          {...base}
          value={selected}
          onChange={(v) => !readOnly && onChange(v.join(', '))}
        >
          <Stack gap="xs" mt="xs">
            {(field.options ?? []).map((opt) => (
              <Checkbox key={opt} value={opt} label={opt} readOnly={readOnly} />
            ))}
          </Stack>
        </Checkbox.Group>
      );
    }
    case 'multipleChoice': {
      const selected = value ? value.split(', ') : [];
      return (
        <div style={base.style}>
          {label && (
            <Text size="sm" fw={500} mb={4}>
              {label}
            </Text>
          )}
          <Chip.Group
            multiple
            value={selected}
            onChange={(v) => !readOnly && onChange(v.join(', '))}
          >
            <Group gap="xs">
              {(field.options ?? []).map((opt) => (
                <Chip key={opt} value={opt} readOnly={readOnly}>
                  {opt}
                </Chip>
              ))}
            </Group>
          </Chip.Group>
        </div>
      );
    }
    case 'date':
      return text({
        type: readOnly ? 'text' : 'date',
        leftSection: readOnly ? <IconCalendar size={16} /> : undefined,
        placeholder: readOnly ? 'dd/mm/yyyy' : undefined,
      });
    case 'time':
      return text({
        type: readOnly ? 'text' : 'time',
        leftSection: readOnly ? <IconClock size={16} /> : undefined,
        placeholder: readOnly ? 'hh:mm' : undefined,
      });
    case 'datetime':
      return text({
        type: readOnly ? 'text' : 'datetime-local',
        leftSection: readOnly ? <IconCalendar size={16} /> : undefined,
        placeholder: readOnly ? 'dd/mm/yyyy hh:mm' : undefined,
      });
    case 'monthYear':
      return text({
        type: readOnly ? 'text' : 'month',
        leftSection: readOnly ? <IconCalendar size={16} /> : undefined,
        placeholder: readOnly ? 'mm/yyyy' : undefined,
      });
    case 'file':
    case 'imageUpload':
    case 'mediaUpload': {
      const leftSection =
        field.type === 'imageUpload' ? (
          <IconPhotoUp size={16} />
        ) : field.type === 'mediaUpload' ? (
          <IconVideo size={16} />
        ) : undefined;
      const placeholder =
        field.placeholder ||
        (field.type === 'imageUpload'
          ? 'Choose image'
          : field.type === 'mediaUpload'
            ? 'Choose audio or video'
            : 'Choose file');
      return (
        <FileInput
          label={base.label}
          description={base.description}
          required={base.required}
          title={base.title}
          style={base.style}
          readOnly={readOnly}
          leftSection={leftSection}
          placeholder={placeholder}
          accept={
            field.type === 'imageUpload'
              ? 'image/*'
              : field.type === 'mediaUpload'
                ? 'audio/*,video/*'
                : undefined
          }
          onChange={(file) => !readOnly && onChange(file?.name ?? '')}
        />
      );
    }
    case 'rating':
      return (
        <div>
          {label && (
            <Text size="sm" fw={500} mb={4}>
              {label}
            </Text>
          )}
          <Rating
            count={field.maxRating ?? 5}
            value={Number(value) || 0}
            readOnly={readOnly}
            onChange={(v) => !readOnly && onChange(String(v))}
          />
        </div>
      );
    case 'slider':
      return (
        <div style={base.style}>
          {label && (
            <Text size="sm" fw={500} mb={4}>
              {label}
            </Text>
          )}
          <Slider
            min={field.min ?? 0}
            max={field.max ?? 100}
            step={field.step ?? 1}
            value={Number(value) || field.min || 0}
            onChange={(v) => !readOnly && onChange(String(v))}
          />
        </div>
      );
    case 'terms':
      return (
        <Stack gap="xs">
          <Box
            p="xs"
            style={{
              border: '1px solid var(--mantine-color-gray-3)',
              borderRadius: 'var(--mantine-radius-sm)',
              maxHeight: 140,
              overflow: 'auto',
            }}
          >
            <Text size="xs" c="dimmed">
              {field.content || 'Terms and conditions text'}
            </Text>
          </Box>
          <Checkbox
            label={field.label || 'I accept the terms and conditions'}
            required={field.required}
            checked={value === 'true'}
            readOnly={readOnly}
            onChange={(e) => !readOnly && onChange(String(e.target.checked))}
          />
        </Stack>
      );
    case 'decisionBox':
      return (
        <Checkbox
          label={field.content || field.label}
          required={field.required}
          checked={value === 'true'}
          readOnly={readOnly}
          onChange={(e) => !readOnly && onChange(String(e.target.checked))}
        />
      );
    case 'yesNo':
      return (
        <Radio.Group {...base} value={value} onChange={readOnly ? () => {} : onChange}>
          <Group gap="lg" mt="xs">
            <Radio value="yes" label="Yes" readOnly={readOnly} />
            <Radio value="no" label="No" readOnly={readOnly} />
          </Group>
        </Radio.Group>
      );
    case 'uniqueId':
    case 'randomId':
      return <TextInput {...base} readOnly value={value || (field.type === 'uniqueId' ? '1' : 'ZF1')} />;
    case 'heading':
      return <Title order={4}>{field.content || field.label}</Title>;
    case 'description':
      return (
        <Text size="sm" c="dimmed">
          {field.content || field.label}
        </Text>
      );
    case 'divider':
      return <Divider my="xs" />;
    case 'spacer':
      return <Box h={32} />;
    default:
      return text();
  }
}
