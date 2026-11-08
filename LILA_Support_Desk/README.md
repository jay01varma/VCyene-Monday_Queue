# LILA support desk
From the repository root, run `python3 -m http.server 8000 --directory dist` and open http://localhost:8000. No install or build. Stop with Ctrl+C.
The desk always represents Monday, October 5, 2026. Business days are Monday–Friday. Deadline dates use delivery plus 14 or 30 calendar days. The source of the initial queue is dist/tickets.csv. Browser-local edits are private to the current browser profile and origin. The demo sends no messages.
To change priorities during a walkthrough, edit priority() in dist/rules.js, save and refresh. Run the rule checks with node --test triage.test.js.
