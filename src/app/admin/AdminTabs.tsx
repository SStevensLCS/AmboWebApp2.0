"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Users } from "lucide-react";
import { SubmissionsControl } from "./SubmissionsControl";
import { UserControl } from "./UserControl";

export default function AdminTabs() {
  return (
    <Tabs defaultValue="submissions" className="space-y-4">
      <TabsList>
        <TabsTrigger value="submissions" className="gap-2">
          <FileText className="h-4 w-4" />
          Submissions
        </TabsTrigger>
        <TabsTrigger value="users" className="gap-2">
          <Users className="h-4 w-4" />
          Users
        </TabsTrigger>
      </TabsList>
      <TabsContent value="submissions" className="space-y-4">
        <SubmissionsControl />
      </TabsContent>
      <TabsContent value="users" className="space-y-4">
        <UserControl />
      </TabsContent>
    </Tabs>
  );
}
