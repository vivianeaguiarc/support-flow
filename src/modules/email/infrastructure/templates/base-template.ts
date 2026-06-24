export function renderBaseEmailTemplate(input: {
  title: string;
  intro: string;
  details: Array<{ label: string; value: string }>;
  footer?: string;
}): string {
  const detailsHtml = input.details
    .map(
      (item) =>
        `<tr><td style="padding:8px 12px;color:#64748b;font-size:14px;">${item.label}</td><td style="padding:8px 12px;color:#0f172a;font-size:14px;font-weight:600;">${item.value}</td></tr>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="pt-BR">
  <body style="margin:0;padding:24px;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;">
      <tr>
        <td style="padding:24px 24px 8px;">
          <h1 style="margin:0;font-size:22px;color:#0f172a;">${input.title}</h1>
          <p style="margin:12px 0 0;font-size:15px;line-height:1.6;color:#334155;">${input.intro}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 24px 24px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;border-radius:8px;">
            ${detailsHtml}
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:0 24px 24px;font-size:12px;color:#94a3b8;">
          ${input.footer ?? 'SupportFlow — sistema de atendimento corporativo'}
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function renderPlainText(input: {
  title: string;
  intro: string;
  details: Array<{ label: string; value: string }>;
}): string {
  const details = input.details
    .map((item) => `${item.label}: ${item.value}`)
    .join('\n');

  return `${input.title}\n\n${input.intro}\n\n${details}`;
}

export function createSimpleTemplate(
  title: string,
  intro: string,
  context: import('../../domain/email-template-context.js').EmailTemplateContext,
  extraDetails: Array<{ label: string; value: string }> = [],
) {
  const details = [
    { label: 'Protocolo', value: context.ticketProtocol },
    { label: 'Chamado', value: context.ticketTitle },
    ...extraDetails,
  ];

  return {
    subject: title,
    html: renderBaseEmailTemplate({ title, intro, details }),
    text: renderPlainText({ title, intro, details }),
  };
}
