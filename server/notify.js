// One place to alert a user about a run. Every alert is saved as an in-app notification
// (shown as a pop-up and under the bell). Text messages are an optional second channel,
// turned on with SMS_ENABLED=true.
const { sendSms } = require('./sms');

const SMS_ENABLED = process.env.SMS_ENABLED === 'true';

function createNotifier(db) {
  /**
   * @param {object} opts
   * @param {{id: number, phone_number?: string}} opts.to   who receives the alert
   * @param {{id: number, first_name: string, last_name: string, profile_picture?: string}|null} opts.from
   *        the runner the alert is about, or null for alerts from RunHer itself
   * @param {string} opts.message  in-app text, shown after the sender's name
   * @param {string} opts.smsText  full text-message version
   * @param {number} [opts.runId]           a live run this is about
   * @param {number} [opts.scheduledRunId]  a planned run this is about
   * @param {number} [opts.postId]          a post this is about (likes, comments)
   * @param {'run'|'run_alert'} [opts.type]  run_alert is shown as urgent
   */
  return async function notify({ to, from, message, smsText, runId = null, scheduledRunId = null, postId = null, type = 'run' }) {
    try {
      await db.none(`
        INSERT INTO notifications (sender_id, receiver_id, sender_username, profile_icon, message, type, run_id, scheduled_run_id, post_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        from?.id ?? null,
        to.id,
        from ? `${from.first_name} ${from.last_name}` : 'RunHer',
        from?.profile_picture ?? null,
        message,
        type,
        runId,
        scheduledRunId,
        postId,
      ]);
    } catch (err) {
      console.error(`❌ Failed to save notification for user ${to.id}:`, err.message);
    }

    if (SMS_ENABLED && to.phone_number) {
      await sendSms(to.phone_number, smsText);
    }
  };
}

module.exports = { createNotifier, SMS_ENABLED };
