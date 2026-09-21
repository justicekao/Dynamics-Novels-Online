"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createSession, destroySession, hashPassword, randomAvatarSeed, verifyPassword } from "@/lib/auth";

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

export async function signupAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "");

  if (!email || !email.includes("@")) {
    redirect(`/signup?error=${encodeURIComponent("Enter a valid email address.")}`);
  }
  if (!USERNAME_RE.test(username)) {
    redirect(
      `/signup?error=${encodeURIComponent(
        "Username must be 3-20 characters: letters, numbers, underscores.",
      )}`,
    );
  }
  if (password.length < 8) {
    redirect(`/signup?error=${encodeURIComponent("Password must be at least 8 characters.")}`);
  }

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });
  if (existing) {
    redirect(
      `/signup?error=${encodeURIComponent("An account with that email or username already exists.")}`,
    );
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email, username, passwordHash, avatarSeed: randomAvatarSeed() },
  });

  await createSession(user.id);
  redirect("/worlds");
}

export async function loginAction(formData: FormData) {
  const identifier = String(formData.get("identifier") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  const user = await prisma.user.findFirst({
    where: { OR: [{ email: identifier }, { username: identifier }] },
  });

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    redirect(`/login?error=${encodeURIComponent("Incorrect email/username or password.")}`);
  }

  await createSession(user.id);
  redirect("/worlds");
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}
