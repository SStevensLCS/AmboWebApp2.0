"use server";

import { adminClient } from "@/lib/supabase/admin";
import { ApplicationData } from "@/types/application";
import { v4 as uuidv4 } from 'uuid';

export async function getApplicationByPhone(phone: string) {
    const supabase = adminClient;

    if (!phone) return null;

    const { data, error } = await supabase
        .from("applications")
        .select("*")
        .eq("phone_number", phone)
        .single();

    if (error && error.code !== "PGRST116") { // Ignore "No rows found"
        console.error("Error fetching application:", error);
        throw new Error("Failed to fetch application");
    }

    return data as ApplicationData | null;
}

export async function saveApplicationStep(data: Partial<ApplicationData>) {
    const supabase = adminClient;

    if (!data.phone_number) {
        throw new Error("Phone number is required to save progress.");
    }

    // Ensure status is at least 'draft'
    const payload = {
        ...data,
        updated_at: new Date().toISOString()
    };

    const { error } = await supabase
        .from("applications")
        .upsert(payload, { onConflict: "phone_number" });

    if (error) {
        console.error("Error saving application:", error);
        throw new Error("Failed to save application");
    }

    return { success: true };
}

export async function submitApplication(phone: string) {
    const supabase = adminClient;

    const { error } = await supabase
        .from("applications")
        .update({ status: "submitted", updated_at: new Date().toISOString() })
        .eq("phone_number", phone);

    if (error) {
        console.error("Error submitting application:", error);
        throw new Error("Failed to submit application");
    }

    // Promote any basic user with this phone number to applicant
    await supabase
        .from("users")
        .update({ role: "applicant" })
        .eq("phone", phone)
        .eq("role", "basic");

    return { success: true };
}

export async function submitApplicationForUser(userId: string) {
    const supabase = adminClient;

    // Update user role from basic to applicant
    const { error } = await supabase
        .from("users")
        .update({ role: "applicant" })
        .eq("id", userId)
        .eq("role", "basic");

    if (error) {
        console.error("Error promoting user to applicant:", error);
        throw new Error("Failed to submit application");
    }

    return { success: true };
}

export async function getUserData(userId: string) {
    const supabase = adminClient;

    const { data, error } = await supabase
        .from("users")
        .select("first_name, last_name, phone, email")
        .eq("id", userId)
        .single();

    if (error) {
        console.error("Error fetching user data:", error);
        throw new Error("Failed to fetch user data");
    }

    return data as { first_name: string; last_name: string; phone: string; email: string };
}

export async function getApplicationByUserId(userId: string) {
    const supabase = adminClient;

    // First get the user's phone number
    const { data: user, error: userError } = await supabase
        .from("users")
        .select("phone")
        .eq("id", userId)
        .single();

    if (userError || !user?.phone) {
        return null;
    }

    // Then look up application by phone
    const { data, error } = await supabase
        .from("applications")
        .select("*")
        .eq("phone_number", user.phone)
        .single();

    if (error && error.code !== "PGRST116") {
        console.error("Error fetching application:", error);
        throw new Error("Failed to fetch application");
    }

    return data as ApplicationData | null;
}

export async function deleteApplication(phone: string) {
    const supabase = adminClient;

    if (!phone) {
        throw new Error("Phone number is required");
    }

    // Delete any uploaded transcript files first
    const { data: app } = await supabase
        .from("applications")
        .select("transcript_url")
        .eq("phone_number", phone)
        .single();

    if (app?.transcript_url) {
        const fileName = app.transcript_url.split("/").pop();
        if (fileName) {
            await supabase.storage.from("transcripts").remove([fileName]);
        }
    }

    const { error } = await supabase
        .from("applications")
        .delete()
        .eq("phone_number", phone);

    if (error) {
        console.error("Error deleting application:", error);
        throw new Error("Failed to delete application");
    }

    return { success: true };
}

export async function uploadTranscript(formData: FormData) {
    const supabase = adminClient;
    const file = formData.get("file") as File;
    const phone = formData.get("phone") as string;

    if (!file || !phone) {
        throw new Error("File and Phone Number are required");
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `${phone}_transcript_${uuidv4()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error } = await supabase.storage
        .from("transcripts")
        .upload(filePath, file);

    if (error) {
        console.error("Error uploading file:", error);
        throw new Error("Failed to upload transcript");
    }

    const { data: { publicUrl } } = supabase.storage
        .from("transcripts")
        .getPublicUrl(filePath);

    return { publicUrl };
}
