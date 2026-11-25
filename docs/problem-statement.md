# OM SPACE: Problem Statement and Proposed Solution

## Project context

OM SPACE is a real-estate discovery and management application for Vijayawada. It brings customers, agencies, and administrators into one application, with role-specific workflows over a shared property catalogue.

## Problem statement

People looking for property may have to gather information from separate websites and agencies. Comparing properties across location, price, type, and facilities can take effort, and it may be difficult to identify and contact the agency responsible for a listing. Agencies can end up managing listings and enquiries manually, while platform administrators need a central view of users and activity.

These are the project problem assumptions described in the supplied project-understanding reference. They have not been validated by interview findings in this repository; see [interview-notes.md](./interview-notes.md).

## Proposed solution

OM SPACE provides a shared property catalogue and three role-specific areas:

- **Customers** browse and filter properties, view details, save or compare listings, and send enquiries.
- **Agencies** create and update their listings and review and reply to enquiries associated with their properties.
- **Administrators** review platform activity and manage users and listings.

The application uses server-side role and ownership checks for protected actions. Maps and the property assistant are optional integrations and depend on external API configuration.

## Expected value

- Reduce the effort of finding and comparing listings in one locality-focused catalogue.
- Make the responsible agency and enquiry path easier to find.
- Give agencies one place in the application to manage their listings and enquiry threads.
- Give administrators a central interface for user and listing oversight.

These are intended benefits, not measured outcomes. No user-research results or outcome measurements are included yet.

## Scope and evidence

The application demonstrates property discovery, saved listings, comparisons, enquiry workflows, agency listing management, and admin screens. Feature availability depends on the configured database and optional services. Refer to [architecture.md](./architecture.md) for the current technical design and [limitations.md](./limitations.md) for gaps and constraints.

## Reference

The project understanding document supplied for this capstone is preserved at `docs/OM_SPACE_Project_Understanding.docx`.
