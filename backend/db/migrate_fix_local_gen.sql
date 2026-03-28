-- =========================================================================
-- Fix: clear math and geography questions that were saved with wrong
-- correct_index values (double-shuffle bug in mathGenerator / geographyGenerator).
--
-- These questions are generated locally (no API cost) and will be
-- re-seeded automatically on next quiz request.
-- =========================================================================

SET search_path TO braincoin;

DELETE FROM questions
WHERE subject_id IN (
  SELECT id FROM subjects WHERE slug IN ('math', 'geography')
);
