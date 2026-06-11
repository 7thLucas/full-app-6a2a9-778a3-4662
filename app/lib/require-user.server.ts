import { redirect } from "react-router";
import { getUserFromRequest } from "~/modules/authentication/authentication.server";
import type { PublicUser } from "~/modules/authentication/authentication.types";

/**
 * Server-side route guard. Use inside a route loader to require an
 * authenticated user; redirects to the sign-in screen otherwise.
 */
export function requireUser(request: Request): PublicUser {
  const user = getUserFromRequest(request);
  if (!user) {
    throw redirect("/auth/login");
  }
  return user;
}
