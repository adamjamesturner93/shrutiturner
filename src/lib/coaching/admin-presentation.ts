import type { AdminCoachingApplicationDto } from "@/lib/api/types";

export function getOperationalNextStep(application: AdminCoachingApplicationDto) {
  if (application.coachingProfile?.status === "completed") {
    return application.coachingProfile.everfitConnectionStatus === "closed"
      ? "This coaching account and its Everfit access are closed. Reopen the coaching status only if support resumes."
      : "The coaching account is closed. Remove access in Everfit, then open the coaching record to mark Everfit access closed.";
  }
  if (application.status === "submitted" || application.status === "under_review") {
    return "Review the enquiry, arrange the consultation and record its date here.";
  }
  if (application.status === "follow_up_needed") {
    return "Send follow-up questions before approving or declining.";
  }
  if (application.status === "consultation_scheduled") {
    return "The consultation is scheduled. After the call, mark it complete and record private notes.";
  }
  if (application.status === "consultation_completed") {
    return "Choose the recommended support level, add the client-facing recommendation and send the offer.";
  }
  if (application.status === "waitlisted") {
    return "Applicant is waiting for coaching capacity. Approve from the waiting list when a place opens, or reject if it is no longer a fit.";
  }
  if (application.status === "approved" || application.status === "offer_sent") {
    return application.userId
      ? "The recommendation is sent. The client can accept the agreements and complete payment."
      : "The recommendation is sent. The client now needs to create or sign in to their account with this email before accepting agreements and paying.";
  }
  if (application.status === "converted" || application.isLinkedUserCoachingClient) {
    return "Client is active. Track manual Everfit setup, onboarding and check-ins from the coaching profile.";
  }
  if (application.status === "declined") {
    return "Enquiry is declined. Keep internal notes clear for future context.";
  }
  if (application.status === "withdrawn") {
    return "Enquirer left the waiting list. Reopen only if Shruti wants to restore the original enquiry context.";
  }
  return "Review the current status and choose the next admin action.";
}
