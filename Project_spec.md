Project Specification: Fire Station Equipment Testing Tracker
1. Executive Summary
The goal is to develop a lightweight, responsive web application for a fire station to manage and log equipment inspections. The app will track recurring tests (Weekly, Monthly, Quarterly) and provide a clear dashboard for "at-a-glance" compliance monitoring.
2. Functional Requirements
Equipment Management
Inventory List: Maintain a list of equipment including Name, ID, and Location (e.g., Appliance 1, Locker 3).
Testing Logic: Each item requires specific tests at set frequencies: Weekly, Monthly, or Quarterly.
Test Types: Differentiate between Visual and Functional tests.
Procedure Links: Each test must include a link to external documentation (PDFs or web pages) detailing how to perform the specific inspection.
Testing & Logging
Completion Recording: Users must be able to mark a test as "Pass" or "Fail" with a timestamp and user ID.
Status Dashboard: A high-level view showing:
Tests completed for the current period.
Tests still outstanding for the week/month/quarter.
Visual indicators (e.g., Red/Green) for immediate status awareness.
User Roles
Standard User: Can view the dashboard, access documentation, and record completed tests.
Crew Commander (Admin): All standard permissions plus the ability to add/edit equipment, modify testing frequencies, and manage the underlying data.
3. Data Architecture
Portable Storage: Data must be stored in a format easily editable outside the app (e.g., CSV or Excel).
Office 365 Compatibility: While direct API integration isn't required for Phase 1, the data structure should be designed so that a flat-file (like a spreadsheet) can be uploaded or swapped out manually.
Relational Logic: The system should handle relationships between Equipment_ID, Test_Type, and Completion_Log.
4. Technical Constraints & UI
Mobile-First Design: The app will be used on the station floor; it must be fully responsive and touch-friendly for mobile devices and tablets.
Tech Stack: Open to the agent’s preference (e.g., Streamlit for rapid data tools, or a Python/Flask/React setup).
Localisation: All measurements must use the Metric system, and spelling/grammar must adhere to British English.
5. Success Criteria
A user can log in and see exactly what equipment needs testing before the end of the current week.
A Crew Commander can add a new piece of equipment via the UI without touching the code.
The data persists in a spreadsheet format that can be opened in Excel or OneDrive.
