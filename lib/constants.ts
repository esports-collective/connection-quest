// Quests (this app) is the participant-facing view at
// quests.esportscollective.com.au. Staff and admin functions live in the
// separate staff app. Non-participants who land here are sent there.
export const STAFF_APP_URL =
  process.env.NEXT_PUBLIC_STAFF_APP_URL ?? "https://app.esportscollective.com.au";
