import { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { Group, Text, Button, ThemeIcon, Box, Center, Loader } from '@mantine/core';
import { IconFileText, IconShare3, IconCode } from '@tabler/icons-react';
import { getForm } from '@/lib/api';
import type { Form } from '@/types';
import { SharePublicPanel } from '@/components/share/SharePublicPanel';
import { EmbedPanel } from '@/components/share/EmbedPanel';
import classes from './SharePage.module.css';

type Category = 'share' | 'embed';

const categories: { id: Category; label: string; description: string; icon: typeof IconCode }[] = [
  {
    id: 'share',
    label: 'Share With',
    description: 'Share your form as a public link.',
    icon: IconShare3,
  },
  {
    id: 'embed',
    label: 'Embed',
    description: 'Embed your form on a website using the embed codes that suit your need.',
    icon: IconCode,
  },
];

const subNav: Record<Category, string[]> = {
  share: ['Public'],
  embed: ['Standard', 'Popup'],
};

export function SharePage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [form, setForm] = useState<Form | null>(null);

  const category = (searchParams.get('tab') as Category) ?? 'share';
  const [subItem, setSubItem] = useState(subNav[category][0]);

  useEffect(() => {
    if (!id) return;
    getForm(id).then(setForm);
  }, [id]);

  useEffect(() => {
    setSubItem(subNav[category][0]);
  }, [category]);

  if (!form || !id)
    return (
      <Center h="100vh">
        <Loader />
      </Center>
    );

  const shareUrl = `${window.location.origin}/f/${id}`;

  return (
    <Box className={classes.page}>
      <Group justify="space-between" px="md" py="sm" className={classes.topbar} wrap="nowrap">
        <Group gap="xs" wrap="nowrap">
          <ThemeIcon variant="light" color="blue" radius="sm">
            <IconFileText size={18} />
          </ThemeIcon>
          <Text fw={600}>{form.title}</Text>
        </Group>
        <Button component={Link} to={`/forms/${id}/edit`} color="teal" radius="md">
          Access Form
        </Button>
      </Group>

      <Box className={classes.body}>
        <Box className={classes.categoryPane}>
          {categories.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`${classes.categoryCard} ${category === item.id ? classes.categoryCardActive : ''}`}
              onClick={() => setSearchParams({ tab: item.id })}
            >
              <item.icon size={20} stroke={1.6} className={classes.categoryIcon} />
              <div>
                <Text size="sm" fw={600}>
                  {item.label}
                </Text>
                <Text size="xs" c="dimmed" mt={2}>
                  {item.description}
                </Text>
              </div>
            </button>
          ))}
        </Box>

        <Box className={classes.subPane}>
          <Text className={classes.subHeading}>
            {category === 'share' ? 'SHARE WITH' : 'EMBED TYPE'}
          </Text>
          {subNav[category].map((item) => (
            <button
              key={item}
              type="button"
              className={`${classes.subItem} ${subItem === item ? classes.subItemActive : ''}`}
              onClick={() => setSubItem(item)}
            >
              {item}
            </button>
          ))}
        </Box>

        <Box className={classes.contentPane}>
          {category === 'share' ? (
            <SharePublicPanel form={form} shareUrl={shareUrl} />
          ) : (
            <EmbedPanel shareUrl={shareUrl} variant={subItem === 'Popup' ? 'popup' : 'standard'} />
          )}
        </Box>
      </Box>
    </Box>
  );
}
