export type ApplicationStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

export interface ApplicationData {
    id?: string;
    phone_number: string;
    status: ApplicationStatus;
    current_step: number;

    // Personal
    first_name?: string;
    last_name?: string;
    email?: string;

    // Academic
    grade_current?: string;
    grade_entry?: string;
    gpa?: number;
    transcript_url?: string;

    // References
    referrer_academic_name?: string;
    referrer_academic_email?: string;
    referrer_bible_name?: string;
    referrer_bible_email?: string;

    // Questionnaire
    q_involvement?: string;
    q_why_ambassador?: string;
    q_faith?: string;
    q_love_linfield?: string;
    q_change_linfield?: string;
    q_family_decision?: string;
    q_strengths?: string;
    q_weaknesses?: string;
    q_time_commitment?: string;

    created_at?: string;
    updated_at?: string;
}
