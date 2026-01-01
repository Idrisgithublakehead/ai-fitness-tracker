"use strict";

/*
  Demo Auth (localStorage-based)
  - Stores a "logged in" flag + email locally
  - NOT secure auth (no backend)
*/

const AUTH_KEY = "aft_auth_v1";

/* Helpers */
function getAuth() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setAuth(auth) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
}

function clearAuth() {
  localStorage.removeItem(AUTH_KEY);
}

function isLoggedIn() {
  const auth = getAuth();
  return Boolean(auth && auth.email);
}

function getReturnTo() {
  const url = new URL(window.location.href);
  return url.searchParams.get("returnTo") || "index.html";
}

/* If we're on login page, handle login submit */
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  // If already logged in, go back
  if (isLoggedIn()) {
    window.location.href = getReturnTo();
  }

  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    // We do NOT store password in demo mode
    if (!email) return;

    setAuth({ email, loggedInAt: new Date().toISOString() });
    window.location.href = getReturnTo();
  });
}

/* If user on other pages, toggle login/logout links if present */
const loginLink = document.getElementById("loginLink");
const logoutLink = document.getElementById("logoutLink");

if (loginLink && logoutLink) {
  if (isLoggedIn()) {
    loginLink.style.display = "none";
    logoutLink.style.display = "inline-block";

    logoutLink.addEventListener("click", (e) => {
      e.preventDefault();
      clearAuth();
      window.location.href = "index.html";
    });
  } else {
    // If not logged in, clicking login should return you back to current page
    const current = window.location.pathname.split("/").pop() || "index.html";
    loginLink.href = `login.html?returnTo=${encodeURIComponent(current)}`;
  }
}
