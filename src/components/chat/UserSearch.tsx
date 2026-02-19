"use client";

import { useEffect, useState } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { User } from "./types";

interface UserSearchProps {
    onSelect: (user: User) => void;
    selectedUsers: string[];
}

export function UserSearch({ onSelect, selectedUsers }: UserSearchProps) {
    const [open, setOpen] = useState(false);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            try {
                const res = await fetch("/api/chat/users");
                if (res.ok) {
                    const data = await res.json();
                    setUsers(data.users || []);
                }
            } catch (error) {
                console.error("Failed to fetch users", error);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    const filteredUsers = users.filter((user) => {
        const fullName = `${user.first_name || ""} ${user.last_name || ""}`.toLowerCase();
        const email = (user.email || "").toLowerCase();
        const searchLower = search.toLowerCase();
        return fullName.includes(searchLower) || email.includes(searchLower);
    });

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                >
                    Select user...
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[300px] p-0" align="start">
                <div className="p-2 border-b">
                    <Input
                        placeholder="Search users..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-8"
                    />
                </div>
                <div className="max-h-[200px] overflow-y-auto p-1">
                    {loading ? (
                        <div className="flex items-center justify-center p-4">
                            <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="p-2 text-sm text-center text-muted-foreground">
                            No users found.
                        </div>
                    ) : (
                        filteredUsers.map((user) => {
                            const isSelected = selectedUsers.includes(user.id);
                            return (
                                <DropdownMenuItem
                                    key={user.id}
                                    onSelect={() => {
                                        onSelect(user);
                                        // Keep open for multiple selection if needed? 
                                    }}
                                    className="flex items-center justify-between cursor-pointer"
                                >
                                    <div className="flex flex-col">
                                        <span className="font-medium">
                                            {user.first_name} {user.last_name}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {user.role} - {user.email}
                                        </span>
                                    </div>
                                    {isSelected && <Check className="ml-2 h-4 w-4" />}
                                </DropdownMenuItem>
                            );
                        })
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
