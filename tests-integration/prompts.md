PROMPT
analyze project and create test-plan for API tests, 
using  @ai-planning-standards.md 
and best-practices


PROMPT
analyze FE and BE structure of project and create comprehesive test-plan for UI integration tests,  
using  @.cursor/rules/ai-coding-standards.md and best practice 
if code base is not enough as context, then explore real html pages DOM for logic and locators. 
If some information is missed or not clear - ask user, no any assumptions



QUESTIONS to user [with user's answers]

Q1. Which test framework should be used for UI integration tests?
    Options: Playwright / Cypress / Vitest (browser mode)
    Answer: Playwright

Q2. Should the plan cover only currently-implemented features, or also planned/upcoming ones?
    Options: implemented_only / all_planned
    Answer: implemented_only (cover only what is already built in the codebase)

Q3. How should the backend be handled during UI tests?
    Options: real_be_real_db (real Express + real PostgreSQL test DB) / mock_api (MSW) / stub_server
    Answer: real_be_real_db — run Playwright against the live Vite dev server proxying to the real Express API with a dedicated test PostgreSQL database

Q4. How should authentication be handled in tests (fast-login)?
    Options: seeded_users (reuse prisma/seed.ts users via localStorage token injection) / ui_login (fill form every time) / api_login (POST /api/auth/login and inject token)
    Answer: seeded_users — authenticate using the two seeded accounts (admin@hotel.com / guest@hotel.com, password123) injecting the JWT into localStorage directly (fast-login pattern)

Q5. Which user roles should be covered?
    Options: guest_only / admin_only / guest_admin_anon (all three)
    Answer: guest_admin_anon — cover Anonymous, Guest, and Admin scenarios

Q6. Locator strategy — most FE pages have no data-testid attributes yet. What should we do?
    Options: add_testids_first (require adding attributes, mark missing ones as TO ADD in the plan) / use_fallback_locators (getByRole / getByLabel where testid missing)
    Answer: add_testids_first — every locator must be data-testid (priority 1 per ai-coding-standards.md §4.1 Rule 4); missing ones are listed as TO ADD with the exact JSX file path where the attribute must be added

Q7. How should the test plan be organized?
    Options: by_feature (one spec file per feature area) / by_role (one spec file per user role) / by_page (one spec file per route)
    Answer: by_feature — one spec file per feature area (landing, auth-login, auth-register, navbar, protected-routes, guest-dashboard, browse-rooms, room-details-booking, my-bookings, my-profile, admin-dashboard, token-lifecycle)

Q8. Which browsers should be targeted?
    Options: chromium_only / chromium_firefox / all_browsers
    Answer: chromium_only

Q9. Where should the test plan file be written?
    Options: tests_ui_test_plan (tests-UI/test-plan.md) / tests_integration / new_file
    Answer: tests_ui_test_plan — overwrite tests-UI/test-plan.md (later moved to tests-integration/ui-test.plan.md)





















