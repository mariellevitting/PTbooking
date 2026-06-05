export type UserRole = "dancer" | "parent" | "trainer";

export interface Profile {
  id: string;
  name: string;
  role: UserRole;
  phone: string | null;
  created_at: string;
}

export interface Child {
  id: string;
  parent_id: string;
  name: string;
  birthdate: string | null;
  created_at: string;
}

export interface Trainer {
  id: string;
  bio: string | null;
  dance_styles: string[];
  created_at: string;
}
