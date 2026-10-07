import { ActionIcon, Box, Stack, Text, Title, Tooltip } from '@mantine/core';
import { EyeOffIcon, SettingsIcon } from 'lucide-react';
import type { FormTheme, SubmitButtonAlign } from '@/types';
import { titleSize } from '@/lib/formSkin';
import skinClasses from '@/components/FormSkin.module.css';
import { InlineText } from './InlineText';
import canvasClasses from '../FormCanvas.module.css';

interface Props {
  title: string;
  description?: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onOpenFormSettings: () => void;
  onHideHeader: () => void;
  headerAlign?: SubmitButtonAlign;
  theme?: FormTheme;
  textColor?: string;
  isDarkCard: boolean;
}

export function CanvasHeader({
  title,
  description,
  onTitleChange,
  onDescriptionChange,
  onOpenFormSettings,
  onHideHeader,
  headerAlign,
  theme,
  textColor,
  isDarkCard,
}: Props) {
  const align = headerAlign ?? 'center';

  return (
    <Box
      className={`${canvasClasses.fieldRow} ${canvasClasses.header} ${isDarkCard ? canvasClasses.fieldRowDark : ''}`}
      onClick={onOpenFormSettings}
    >
      <Title order={3} className={skinClasses.title} size={titleSize(theme)} ta={align} c={textColor}>
        <InlineText
          multiline
          enterFinishes
          value={title}
          onChange={onTitleChange}
          placeholder="Untitled form"
          ariaLabel="Form title"
        />
      </Title>
      <Text
        size="sm"
        ta={align}
        mt={6}
        c={textColor ? undefined : 'dimmed'}
        style={textColor ? { color: textColor, opacity: 0.75 } : undefined}
      >
        <InlineText
          multiline
          value={description ?? ''}
          onChange={onDescriptionChange}
          placeholder="Add a description (optional)"
          ariaLabel="Form description"
        />
      </Text>

      <Stack gap={0} className={canvasClasses.hoverToolbar}>
        <Tooltip label="Form properties" position="left" withArrow>
          <ActionIcon
            variant="filled"
            color="dark"
            radius={0}
            size="lg"
            aria-label="Form properties"
            onClick={(e) => {
              e.stopPropagation();
              onOpenFormSettings();
            }}
          >
            <SettingsIcon size={16} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label="Hide header" position="left" withArrow>
          <ActionIcon
            variant="filled"
            color="red"
            radius={0}
            size="lg"
            aria-label="Hide header"
            onClick={(e) => {
              e.stopPropagation();
              onHideHeader();
            }}
          >
            <EyeOffIcon size={16} />
          </ActionIcon>
        </Tooltip>
      </Stack>
    </Box>
  );
}
