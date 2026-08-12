import type { Role } from "@/types";

/** Landing page per role setelah login. */
export function homeForRole(role: Role): string {
  switch (role) {
    case "officer":
      return "/officer/dashboard";
    case "travel_agent":
      return "/travel-agent/dashboard";
    case "admin":
      return "/admin/dashboard";
    case "user":
    default:
      return "/user/dashboard";
  }
}
