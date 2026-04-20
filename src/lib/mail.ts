import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 465),
  secure: Number(process.env.SMTP_PORT ?? 465) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export async function sendMagicLinkEmail(opts: {
  to: string;
  link: string;
  name?: string | null;
}) {
  const { to, link, name } = opts;
  const hello = name ? `Hi ${name.split(" ")[0]},` : "Hello,";
  const textBody = `${hello}

Here is your secure sign-in link for the Signature Cleans Client Portal.

${link}

This link is valid for 15 minutes. Once you click it, you will be signed in on this device for 60 days.

If you did not request this, you can safely ignore the email.

Peace of mind, every time.
Signature Cleans`;

  const htmlBody = `<!doctype html>
<html>
<body style="margin:0;padding:0;background:#fafaf9;font-family:'Geist',-apple-system,system-ui,sans-serif;color:#1a1a1a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fafaf9;padding:40px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e8e6e1;border-radius:14px;padding:36px;">
        <tr><td>
          <div style="font-family:'Geist Mono',monospace;font-size:10px;font-weight:500;letter-spacing:0.18em;text-transform:uppercase;color:#9b9895;">Signature Cleans Portal</div>
          <h1 style="font-size:22px;font-weight:600;letter-spacing:-0.01em;margin:12px 0 18px 0;">Your secure sign-in link</h1>
          <p style="color:#6b6b6b;font-size:14px;line-height:1.55;margin:0 0 24px 0;">${hello.replace(",", "")}, click the button below to sign in to your client portal. The link stays valid for 15 minutes.</p>
          <a href="${link}" style="display:inline-block;background:#2c5f2d;color:#ffffff;text-decoration:none;font-weight:500;font-size:14px;padding:12px 22px;border-radius:10px;">Sign in to portal</a>
          <p style="color:#9b9895;font-size:12px;line-height:1.5;margin:28px 0 0 0;">Or paste this link into your browser:<br/><a href="${link}" style="color:#2c5f2d;word-break:break-all;">${link}</a></p>
          <hr style="border:none;border-top:1px solid #e8e6e1;margin:28px 0;"/>
          <p style="color:#9b9895;font-size:11px;line-height:1.5;margin:0;">If you did not request this email, you can safely ignore it. Peace of mind, every time.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await transporter.sendMail({
    from: process.env.SMTP_FROM!,
    to,
    subject: "Your Signature Cleans Portal sign-in link",
    text: textBody,
    html: htmlBody
  });
}
