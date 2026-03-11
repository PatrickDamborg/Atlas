/** Types matching the backend Pydantic consent schemas. */

export interface ConsentContent {
  policy_version: string;
  privacy_policy_version: string;
  terms_version: string;
  privacy_policy_title: string;
  privacy_policy_content: string;
  terms_title: string;
  terms_content: string;
  cookie_policy_title: string;
  cookie_policy_content: string;
  consent_prompt: string;
  last_updated: string;
}

export interface ConsentAcceptRequest {
  consent_accepted: boolean;
  policy_version: string;
}

export interface ConsentAcceptResponse {
  consent_id: string;
  seat_id: string;
  policy_version: string;
  consented_at: string;
  message: string;
}

export interface ConsentStatus {
  seat_id: string;
  has_valid_consent: boolean;
  current_policy_version: string;
  consented_version: string | null;
  consented_at: string | null;
  requires_reconsent: boolean;
}
