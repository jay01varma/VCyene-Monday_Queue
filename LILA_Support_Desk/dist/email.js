// Customer email helpers. The desk is a static site with no mail server, so
// "sending" hands a prefilled message to the agent's own email app (mailto:).
export const isEmail = value => /^[^\s@,;<>"]+@[^\s@,;<>"]+\.[^\s@,;<>"]+$/.test(String(value).trim());

// RFC 6068: percent-encode subject and body; line breaks must be CRLF.
const enc = value => encodeURIComponent(String(value).replace(/\r?\n/g, '\r\n'));

export function mailtoHref(to, subject, body) {
  return 'mailto:' + encodeURIComponent(String(to).trim()).replace(/%40/g, '@') +
    '?subject=' + enc(subject) + '&body=' + enc(body);
}

export function draftEmail(t) {
  const first = String(t.customer).split(' ')[0];
  return {
    subject: `Re: your LILA support request (${t.ticket_id})`,
    body: `Hi ${first},\n\nThank you for your patience.\n\n\n\nBest regards,\nLILA Customer Support`,
  };
}
