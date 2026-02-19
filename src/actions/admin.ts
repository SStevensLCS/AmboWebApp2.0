"use server";

import { adminClient } from "@/lib/supabase/admin";
import { ApplicationData } from "@/types/application";

export async function getApplications() {
    const supabase = adminClient;

    const { data, error } = await supabase
        .from("applications")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching applications:", error);
        throw new Error("Failed to fetch applications");
    }

    return data as ApplicationData[];
}

export async function updateApplicationStatus(id: string, status: string) {
    const supabase = adminClient;

    const { error } = await supabase
        .from("applications")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);

    if (error) {
        console.error("Error updating application status:", error);
        throw new Error("Failed to update status");
    }

    return { success: true };
}
