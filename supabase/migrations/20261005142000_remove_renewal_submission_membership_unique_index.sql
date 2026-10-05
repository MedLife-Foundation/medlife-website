-- A membership number identifies the volunteer, not each renewal submission.
-- The same member can submit multiple renewals over time using the same number.
-- Uniqueness remains enforced on public.volunteer_profiles.
drop index if exists public.public_membership_renewal_submissions_membership_number_unique;