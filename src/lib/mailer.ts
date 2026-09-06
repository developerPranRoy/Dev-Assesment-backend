import nodemailer, { Transporter } from "nodemailer";
import config from "../config";
import logger from "../shared/logger";

let transporter: Transporter | null = null;

const isConfigured = Boolean(config.email.host && config.email.user && config.email.pass);

const getTransporter = (): Transporter => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure,
      auth: {
        user: config.email.user,
        pass: config.email.pass,
      },
    });
  }
  return transporter;
};

type SendMailOptions = {
  to: string;
  subject: string;
  html: string;
};

export const sendMail = async (options: SendMailOptions): Promise<void> => {
  if (!isConfigured) {
    logger.warn({ to: options.to, subject: options.subject }, "email_skipped_not_configured");
    return;
  }

  try {
    const info = await getTransporter().sendMail({
      from: config.email.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    logger.info({ to: options.to, messageId: info.messageId }, "email_sent");
  } catch (err) {
    logger.error({ err, to: options.to, subject: options.subject }, "email_send_failed");
  }
};
