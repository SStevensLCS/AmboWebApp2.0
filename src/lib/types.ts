export type UserRole = "student" | "admin";
export type SubmissionStatus = "Pending" | "Approved" | "Denied";

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  role: UserRole;
}

export interface Submission {
  id: string;
  user_id: string;
  service_date: string;
  service_type: string;
  credits: number;
  hours: number;
  feedback: string | null;
  status: SubmissionStatus;
  created_at?: string;
}

export const SERVICE_TYPES = [
  "Family Tour",
  "Mock Tour",
  "Shadow Tour",
  "Cancelled Tour",
  "Campus Preview Day",
  "Student Ambassador Retreat",
  "LevelUp!",
  "ES Movie Night",
  "New Faculty Tour",
  "Back to School Night",
  "Lion Look-In",
  "Acts of Kindness",
  "High School Graduation",
  "Entrance Assessment",
  "Veteran's Day Chapel",
  "Move Up Day",
  "Open House",
  "Other",
] as const;
