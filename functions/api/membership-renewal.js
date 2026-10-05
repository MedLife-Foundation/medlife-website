// Dedicated public route for membership renewal submissions.
// Reuse the validated membership handler while keeping the write endpoint
// separate from the general public management API route.
export { onRequestPost } from "./management.js";
