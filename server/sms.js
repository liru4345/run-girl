// Sends text messages through a carrier's email-to-SMS gateway (e.g. 5551234567@txt.att.net).
// Set SMS_DRY_RUN=true to log messages instead of sending them (useful for local demos and testing).
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const CARRIER_GATEWAYS = {
  att: 'txt.att.net',
  verizon: 'vtext.com',
  tmobile: 'tmomail.net',
  sprint: 'messaging.sprintpcs.com',
};

function smsAddress(phoneNumber, carrier = 'att') {
  const digits = (phoneNumber || '').replace(/[^0-9]/g, '');
  const gateway = CARRIER_GATEWAYS[carrier.toLowerCase()] || CARRIER_GATEWAYS.att;
  return `${digits}@${gateway}`;
}

async function sendSms(phoneNumber, text) {
  if (!(phoneNumber || '').replace(/[^0-9]/g, '')) {
    console.warn(`⚠️ Skipping SMS, no phone number on file: ${text}`);
    return;
  }
  const to = smsAddress(phoneNumber);

  if (process.env.SMS_DRY_RUN === 'true') {
    console.log(`📵 [dry run] SMS to ${to}: ${text}`);
    return;
  }

  try {
    await transporter.sendMail({ from: process.env.EMAIL_USER, to, subject: '', text });
    console.log(`📤 Sent SMS to ${to}`);
  } catch (err) {
    // A failed text shouldn't fail the request that triggered it.
    console.error(`❌ Failed to send SMS to ${to}:`, err.message);
  }
}

module.exports = { sendSms, smsAddress };
