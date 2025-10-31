# Requirements Document

## Introduction

This feature adds secure, passwordless authentication to the TOM Analytics Dashboard using Supabase Magic Link authentication. Only users with @amazon.com email addresses will be able to access the dashboard, and their data will sync across all devices.

## Glossary

- **Dashboard**: The TOM Analytics Dashboard web application
- **Magic Link**: A one-time login link sent to the user's email address
- **Supabase**: Backend-as-a-Service platform providing authentication and database
- **Session**: An authenticated user's login state that persists across browser sessions
- **Amazon Email**: Email address ending with @amazon.com domain

## Requirements

### Requirement 1: Email Domain Restriction

**User Story:** As a dashboard administrator, I want only Amazon employees to access the dashboard, so that company data remains secure.

#### Acceptance Criteria

1. WHEN a user attempts to sign in with a non-Amazon email, THE Dashboard SHALL display an error message "Only Amazon employees can access this dashboard"
2. WHEN a user enters an email address, THE Dashboard SHALL validate that it ends with "@amazon.com" before sending the magic link
3. WHEN a user enters an @amazon.com email, THE Dashboard SHALL send a magic link to that email address
4. WHEN validation fails, THE Dashboard SHALL not send any email or create any user account

### Requirement 2: Passwordless Authentication

**User Story:** As a dashboard user, I want to log in without remembering a password, so that access is quick and convenient.

#### Acceptance Criteria

1. WHEN a user enters their @amazon.com email, THE Dashboard SHALL send a magic link to that email address
2. WHEN a user clicks the magic link in their email, THE Dashboard SHALL authenticate the user and redirect them to the dashboard
3. WHEN a user is authenticated, THE Dashboard SHALL maintain their session for at least 7 days
4. WHEN a user closes and reopens the browser, THE Dashboard SHALL keep them logged in if their session is still valid
5. WHEN a user's session expires, THE Dashboard SHALL redirect them to the login page

### Requirement 3: Data Synchronization

**User Story:** As a dashboard user, I want my data to sync across all my devices, so that I can access the same information from anywhere.

#### Acceptance Criteria

1. WHEN a user logs in from a new device, THE Dashboard SHALL load their existing data from Supabase
2. WHEN a user uploads data on one device, THE Dashboard SHALL make that data available on all their other devices
3. WHEN a user creates or modifies table configurations, THE Dashboard SHALL sync those changes across all devices
4. WHEN a user is offline, THE Dashboard SHALL cache data locally and sync when connection is restored

### Requirement 4: Seamless Migration

**User Story:** As an existing dashboard user, I want my current data to be preserved when authentication is added, so that I don't lose any work.

#### Acceptance Criteria

1. WHEN a user logs in for the first time, THE Dashboard SHALL migrate their localStorage data to Supabase
2. WHEN migration occurs, THE Dashboard SHALL preserve all table data, configurations, and settings
3. WHEN migration is complete, THE Dashboard SHALL display a success message
4. WHEN migration fails, THE Dashboard SHALL keep the data in localStorage and allow r