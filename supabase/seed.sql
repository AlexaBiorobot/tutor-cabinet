insert into profiles (id, full_name, email, role) values
  ('00000000-0000-0000-0000-000000000001', 'Maya Chen', 'maya@example.com', 'admin'),
  ('00000000-0000-0000-0000-000000000101', 'Elena Rivera', 'elena@example.com', 'tutor'),
  ('00000000-0000-0000-0000-000000000102', 'Sam Patel', 'sam@example.com', 'tutor'),
  ('00000000-0000-0000-0000-000000000103', 'Jordan Lee', 'jordan@example.com', 'tutor');

insert into modules (id, title, summary, body, estimated_minutes, created_by) values
  (
    '10000000-0000-0000-0000-000000000001',
    'Tutoring Foundations',
    'Core expectations, session structure, and student support principles.',
    'Use this module for the first version of self-paced tutor onboarding.',
    35,
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    'Safety and Escalation',
    'How to document concerns and escalate support needs.',
    'Use this module to teach escalation workflows.',
    25,
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    '10000000-0000-0000-0000-000000000003',
    'Assessment Readiness',
    'Using formative checks to personalize learning plans.',
    'Use this module for assessment-focused tutor training.',
    30,
    '00000000-0000-0000-0000-000000000001'
  );

insert into quizzes (id, module_id, title, passing_score) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Foundations Check', 80),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'Escalation Check', 80);

insert into webinars (id, title, description, trainer, starts_at, duration_minutes, capacity, meeting_link, created_by) values
  (
    '30000000-0000-0000-0000-000000000001',
    'Live Practice Lab',
    'Trainer-led roleplay for first-session coaching scenarios.',
    'Ari Morgan',
    '2026-05-18 16:00:00+00',
    90,
    24,
    'https://meet.example.com/practice-lab',
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    '30000000-0000-0000-0000-000000000002',
    'Assessment Calibration',
    'Review learner artifacts and align scoring expectations.',
    'Nadia Brooks',
    '2026-05-22 18:00:00+00',
    60,
    16,
    'https://meet.example.com/calibration',
    '00000000-0000-0000-0000-000000000001'
  );

insert into training_paths (id, title, description, created_by) values
  (
    '40000000-0000-0000-0000-000000000001',
    'New Tutor Readiness',
    'Required onboarding path for tutors before first learner assignment.',
    '00000000-0000-0000-0000-000000000001'
  );

insert into training_path_steps (training_path_id, step_type, module_id, webinar_id, is_required, position) values
  ('40000000-0000-0000-0000-000000000001', 'module', '10000000-0000-0000-0000-000000000001', null, true, 1),
  ('40000000-0000-0000-0000-000000000001', 'module', '10000000-0000-0000-0000-000000000002', null, true, 2),
  ('40000000-0000-0000-0000-000000000001', 'webinar', null, '30000000-0000-0000-0000-000000000001', true, 3),
  ('40000000-0000-0000-0000-000000000001', 'module', '10000000-0000-0000-0000-000000000003', null, false, 4);

insert into path_assignments (tutor_id, training_path_id, assigned_by) values
  ('00000000-0000-0000-0000-000000000101', '40000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000102', '40000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000103', '40000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001');
