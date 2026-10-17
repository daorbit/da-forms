import { Button } from '@mantine/core';
import { MailIcon, PhoneIcon } from 'lucide-react';
import type { RespondentIdentity } from '@/lib/respondent';
import { callUrl, emailUrl, whatsappUrl } from '@/lib/contactLinks';
import { WhatsAppIcon } from '@/components/share/SocialIcons';
import classes from './ContactActions.module.css';

interface Props {
  identity: RespondentIdentity;
  formTitle: string;
  onContact: () => void;
}

export function ContactActions({ identity, formTitle, onContact }: Props) {
  const { phone, email, name } = identity;
  const whatsapp = phone ? whatsappUrl(phone, name, formTitle) : undefined;
  if (!phone && !email) return null;

  return (
    <div className={classes.actions}>
      {phone && (
        <Button
          component="a"
          href={callUrl(phone)}
          variant="default"
          size="xs"
          radius="md"
          leftSection={<PhoneIcon size={14} />}
          className={classes.action}
          onClick={onContact}
        >
          Call
        </Button>
      )}
      {whatsapp && (
        <Button
          component="a"
          href={whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          variant="default"
          size="xs"
          radius="md"
          leftSection={<WhatsAppIcon size={14} />}
          className={classes.action}
          data-channel="whatsapp"
          onClick={onContact}
        >
          WhatsApp
        </Button>
      )}
      {email && (
        <Button
          component="a"
          href={emailUrl(email, name, formTitle)}
          variant="default"
          size="xs"
          radius="md"
          leftSection={<MailIcon size={14} />}
          className={classes.action}
          onClick={onContact}
        >
          Email
        </Button>
      )}
    </div>
  );
}
