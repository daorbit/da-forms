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

const sizeWidth: Record<FieldSize, string> = {
  small: '35%',
  medium: '60%',
  large: '100%',
};

/** Read-only rendering of a field as it will appear to respondents. */
export function FieldPreview({ field }: { field: FormField }) {
  const common = { readOnly: true, placeholder: field.placeholder };
  const width = sizeWidth[field.size ?? 'large'];

  const wrap = (node: React.ReactNode) => <Box style={{ maxWidth: width }}>{node}</Box>;

  switch (field.type) {
    case 'name':
      return wrap(
        <Group grow>
          <TextInput {...common} placeholder="First" />
          <TextInput {...common} placeholder="Last" />
        </Group>
      );
    case 'address':
      return wrap(
        <Stack gap="xs">
          <TextInput {...common} placeholder="Street address" />
          <Group grow>
            <TextInput {...common} placeholder="City" />
            <TextInput {...common} placeholder="Postal code" />
          </Group>
        </Stack>
      );
    case 'email':
      return wrap(<TextInput {...common} leftSection={<IconMail size={16} />} />);
    case 'phone':
      return wrap(<TextInput {...common} leftSection={<IconPhone size={16} />} />);
    case 'website':
      return wrap(<TextInput {...common} leftSection={<IconWorld size={16} />} placeholder="https://" />);
    case 'textarea':
      return wrap(<Textarea {...common} autosize minRows={3} />);
    case 'regex':
      return wrap(<TextInput {...common} placeholder={field.placeholder ?? field.pattern ?? 'Pattern'} />);
    case 'number':
      return wrap(<NumberInput {...common} placeholder="123" />);
    case 'decimal':
      return wrap(<NumberInput {...common} decimalScale={2} placeholder="0.00" />);
    case 'currency':
      return wrap(<NumberInput {...common} leftSection={<IconCurrencyDollar size={16} />} decimalScale={2} />);
    case 'select':
      return wrap(<Select readOnly placeholder={field.placeholder ?? 'Select...'} data={field.options ?? []} />);
    case 'radio':
      return (
        <Radio.Group>
          <Stack gap="xs">
            {(field.options ?? []).map((opt) => (
              <Radio key={opt} value={opt} label={opt} readOnly />
            ))}
          </Stack>
        </Radio.Group>
      );
    case 'checkbox':
      return (
        <Stack gap="xs">
          {(field.options ?? []).map((opt) => (
            <Checkbox key={opt} label={opt} readOnly />
          ))}
        </Stack>
      );
    case 'multipleChoice':
      return (
        <Group gap="xs">
          {(field.options ?? []).map((opt) => (
            <Chip key={opt} readOnly>
              {opt}
            </Chip>
          ))}
        </Group>
      );
    case 'date':
      return wrap(<TextInput {...common} leftSection={<IconCalendar size={16} />} placeholder="dd/mm/yyyy" />);
    case 'time':
      return wrap(<TextInput {...common} leftSection={<IconClock size={16} />} placeholder="hh:mm" />);
    case 'datetime':
      return wrap(
        <TextInput {...common} leftSection={<IconCalendar size={16} />} placeholder="dd/mm/yyyy hh:mm" />
      );
    case 'monthYear':
      return wrap(<TextInput {...common} leftSection={<IconCalendar size={16} />} placeholder="mm/yyyy" />);
    case 'file':
      return wrap(<FileInput {...common} placeholder="Choose file" />);
    case 'imageUpload':
      return wrap(
        <FileInput {...common} leftSection={<IconPhotoUp size={16} />} placeholder="Choose image" />
      );
    case 'mediaUpload':
      return wrap(
        <FileInput {...common} leftSection={<IconVideo size={16} />} placeholder="Choose audio or video" />
      );
    case 'rating':
      return <Rating count={field.maxRating ?? 5} readOnly />;
    case 'slider':
      return wrap(
        <Slider min={field.min ?? 0} max={field.max ?? 100} step={field.step ?? 1} defaultValue={field.min ?? 0} />
      );
    case 'terms':
      return (
        <Stack gap="xs">
          <Box
            p="xs"
            style={{
              border: '1px solid var(--mantine-color-gray-3)',
              borderRadius: 'var(--mantine-radius-sm)',
              maxHeight: 90,
              overflow: 'auto',
            }}
          >
            <Text size="xs" c="dimmed">
              {field.content || 'Terms and conditions text'}
            </Text>
          </Box>
          <Checkbox label="I accept the terms and conditions" readOnly />
        </Stack>
      );
    case 'decisionBox':
      return <Checkbox label={field.content || 'I agree'} readOnly />;
    case 'yesNo':
      return (
        <Radio.Group>
          <Group gap="lg">
            <Radio value="yes" label="Yes" readOnly />
            <Radio value="no" label="No" readOnly />
          </Group>
        </Radio.Group>
      );
    case 'uniqueId':
    case 'randomId':
      return wrap(<TextInput readOnly value={field.type === 'uniqueId' ? '1' : 'ZF1'} />);
    case 'heading':
      return (
        <Title order={4}>{field.content || 'Heading'}</Title>
      );
    case 'description':
      return (
        <Text size="sm" c="dimmed">
          {field.content || 'Description text'}
        </Text>
      );
    case 'divider':
      return <Divider my="xs" />;
    case 'spacer':
      return <Box h={32} />;
    default:
      return wrap(<TextInput {...common} />);
  }
}
