// Dedicated public membership submission route.
// Kept outside /api so a path-specific security rule cannot block the
// membership form while the underlying management validation remains centralized.
export { onRequestPost } from "./api/management.js";
