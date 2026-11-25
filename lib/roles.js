export const normalizeRole = (role) => {
  if (role === "buyer") return "customer";
  if (role === "agent") return "agency";
  return role || "customer";
};

export const isRole = (role, ...allowedRoles) =>
  allowedRoles.includes(normalizeRole(role));

export const isPropertyManager = (session) =>
  ["agency", "admin"].includes(normalizeRole(session?.user?.role));

export const roleHome = (role) => {
  switch (normalizeRole(role)) {
    case "admin":
      return "/admin";
    case "agency":
      return "/agency-dashboard";
    case "customer":
      return "/listings";
    default:
      return "/login";
  }
};
