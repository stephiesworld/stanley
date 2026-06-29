import { User } from "./store/types";
import { sendTelegram, clampTelegram } from "./telegram";
import { sendSms, clampSms } from "./twilio";

// One outbound entry point. Conversation/cron/OAuth code calls notify(user, text)
// and never has to know which channel the user is on.
export async function notify(user: User, text: string): Promise<void> {
  if (user.channel === "sms") {
    await sendSms(user.chat_id, clampSms(text));
  } else {
    await sendTelegram(user.chat_id, clampTelegram(text));
  }
}
