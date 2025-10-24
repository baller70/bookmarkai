import { Resend } from 'resend';
import { appLogger } from '@/lib/logger';

const RESEND_API_KEY = process.env.RESEND_API_KEY || 'fake_resend_key_for_build';
appLogger.debug('RESEND_API_KEY status', { 
  status: process.env.RESEND_API_KEY ? 'Present' : 'Missing' 
});

export const resend = new Resend(RESEND_API_KEY);

export type EmailPayload = {
  to: string;
  subject: string;
  react: JSX.Element;
};

export const sendEmail = async ({ to, subject, react }: EmailPayload) => {
  try {
    appLogger.info('Attempting to send email', { to });
    const data = await resend.emails.send({
      from: 'Best SAAS Kit <onboarding@resend.dev>',
      to,
      subject,
      react,
    });
    appLogger.info('Email sent successfully', { to, data });
    return { success: true, data };
  } catch (error) {
    appLogger.error('Error sending email', error, { to });
    return { success: false, error };
  }
}; 