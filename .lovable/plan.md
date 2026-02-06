

# MELIAF Study Stocktake - Implementation Plan

## Overview
A minimalistic, modern internal web application for CGIAR researchers to submit and visualize study data. Built with React and designed for seamless future AWS integration (Cognito + API Gateway + DynamoDB).

---

## Phase 1: Foundation & Branding

### 1.1 Apply CGIAR Theme
- Configure Tailwind with CGIAR brand colors (Green #00684A, Gold #D4A843, etc.)
- Set up Inter font family throughout the app
- Create base UI component styles matching the brand guidelines
- Clean, institutional, professional aesthetic

### 1.2 App Layout & Navigation
- Top navigation bar with CGIAR branding and "MELIAF Study Stocktake" title
- Clean navigation: Dashboard, Submit Study, My Submissions
- Responsive design for desktop-first with mobile support
- User profile menu (placeholder for future auth integration)

---

## Phase 2: Authentication (Bypassable for Testing)

### 2.1 Sign In / Sign Up Pages
- Email-based sign-in form with password field
- Sign-up form with email domain validation message (informational)
- Password reset flow (UI only)
- **Dev Mode Toggle**: Easy bypass mechanism to skip auth during development

### 2.2 Auth Context (Placeholder)
- React Context with mock auth state
- Protected route wrapper
- Placeholder methods ready for AWS Amplify/Cognito integration
- Clear separation of auth logic for easy replacement

---

## Phase 3: Study Submission Form (Main Feature)

### 3.1 Form Structure
Organized into logical sections with clear visual separation:

**Section A - Basic Information (Mandatory)**
- Study ID (text input)
- Study Title (text input)
- Lead Center / Entity (text input)
- Contact Name & Email (text inputs with email validation)
- Other Centers/Programs/Accelerators Involved (multi-select or tags)

**Section B - Study Classification (Mandatory)**
- Study Type - 10 options (Ex-ante impact assessment, Foresight & Futures Analysis, etc.)
- Timing - 4 options (T0: Ex-Ante, T1: During, T2: Endline, T3: Ex-post)
- Analytical Scope - 4 options (Innovation/Technology, Project/Intervention, Program/Accelerator, Portfolio/System)
- Geographic Scope - 5 options (Global, Regional, National, Sub-national, Site-specific)
- Result Level - 3 options (Output, Outcome, Impact)
- Causality Mode - 3 options (C0: Descriptive, C1: Contribution, C2: Causal)
- Method Class - 8 options (Qualitative, Quantitative, Mixed, Experimental, Modeling, etc.)
- Primary Results Framework Indicator (text)

**Section C - Research Details (Conditional)**
*Only appears when Causality = C2 OR Method = Quantitative/Experimental*
- Key Research Question(s) (text area)
- Unit of Analysis (text)
- Treatment/Intervention (text)
- Sample Size (number)
- Power Calculation Conducted? (Y/N/NA dropdown)
- Data Collection Method(s) (text/tags)
- Study-specific Indicators (text area)
- Pre-Analysis Plan Available (Y/N with link field)
- Number of Data Collection Rounds (number)

**Section D - Timeline & Status (Mandatory)**
- Start Date & Expected End Date (date pickers)
- Data Collection Status (Planned/Ongoing/Complete)
- Analysis Status (Planned/Ongoing/Complete)

**Section E - Funding & Resources**
- Funded? (Y/N/Partial)
- Funding Source (text - conditional)
- Total Cost USD (number - conditional)
- Proposal/Concept Note Available (Y/N with link)

**Section F - Outputs & Users**
- Manuscript/Report Developed (Y/N with link)
- Policy Brief/Comms Product Developed (Y/N with link)
- Related to Past MELIAF Study (Y/N with link)
- Intended Primary User (multi-select: IAES, Program, Donor, Board, Comms, etc.)
- Commissioning Source (text)

### 3.2 Form Validation
- Real-time client-side validation with helpful error messages
- Required field enforcement
- Email format validation
- Date range validation (end date after start date)
- Conditional field requirements based on selections
- Form progress indicator showing completion status

### 3.3 Form UX
- Auto-save draft to local storage
- Clear visual feedback on validation errors
- Section-by-section navigation (accordion or stepper)
- Submit confirmation with success message
- "Save as Draft" and "Submit" actions

---

## Phase 4: Submissions Management

### 4.1 My Submissions List
- Table view showing user's submissions
- Columns: Study ID, Title, Status, Last Updated, Actions
- Status badges (Active, Draft, Archived) with color coding
- View, Edit, and Archive actions
- Search and filter functionality
- Pagination

### 4.2 Submission Detail View
- Read-only view of a submitted study
- Edit button for owners
- Version history indicator (prepared for append-only pattern)
- Export to PDF option (optional future enhancement)

---

## Phase 5: Dashboard & Visualization

### 5.1 Dashboard Metrics
Section-based layout with skeleton loading states:
- **Summary Cards**: Total submissions, Active studies, Studies by status
- **Studies by Type**: Bar/donut chart showing distribution
- **Geographic Distribution**: Breakdown by scope
- **Status Overview**: Data Collection vs Analysis status comparison
- **Funding Overview**: Funded vs unfunded breakdown

### 5.2 Dashboard Filters
- Date range filter
- Filter by Study Type, Geographic Scope, Status
- Clear all filters option

---

## Phase 6: AWS Integration Preparation

### 6.1 API Service Layer
- Centralized API service with mock implementations
- Structured for easy replacement with AWS API Gateway calls
- JWT token handling placeholder
- Error handling patterns ready for Lambda responses

### 6.2 Data Models
- TypeScript interfaces matching DynamoDB schema
- Submission entity with version support
- User profile model placeholder

---

## Design Notes
- **Color scheme**: CGIAR Green primary (#00684A), with Gold accents, proper error/success states
- **Typography**: Inter font family, clean hierarchy
- **Components**: Cards with subtle shadows, green accent borders, professional form inputs
- **Aesthetic**: Clean, institutional, professional — not playful or startup-like

---

## Technical Notes for AWS Integration
- Auth context structured for Amplify SDK drop-in replacement
- API calls abstracted for easy AWS API Gateway integration
- Form data structure matches DynamoDB entity design
- Protected routes ready for Cognito JWT validation

