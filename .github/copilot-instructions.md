# A11y ICT Accessibility Requirements Wizard

This is an accessibility requirements generator for ICT procurement based on EN 301 549 standard. The app generates custom Word documents containing relevant accessibility clauses.

## Branch Structure & Versions

**Main Branches**:
- `main` - Production version based on EN 301 549:2021 standard
- `2025` - Latest version with EN 301 549:2025 standard upgrades
- `2018` - Legacy version for EN 301 549:2018 standard (archived)

**Development Branches**:
- `dev` - Development branch for 2021 version (merges to `main`)
- `2025-dev` - Development branch for 2025 version (merges to `2025`)

> **Note**: Separate copilot instructions will be generated for the `2025` branch due to architectural differences in the upgrade.

## Architecture Overview

**Core Pattern**: 3-step wizard that transforms user answers → clause selection → Word document generation
- **Step 1**: User answers ICT functionality questions (hardware, web, documentation, etc.)
- **Step 2**: Manual clause fine-tuning via hierarchical tree view
- **Step 3**: Document generation in multiple formats (Word, HTML, evaluation tables)

**Data Flow**: MongoDB stores clauses/presets → `mappings.js` maps questions to clauses → `clauseTree.js` builds hierarchy → client-side JS handles selection → `html-docx-js` generates Word docs

## Key Components

### Database Models (`/models/`)
- **Clauses**: EN 301 549 requirements with hierarchical numbering (e.g., "5.1.2.1")
- **Presets**: Pre-configured clause collections for common ICT types
- **Infos**: Informative sections that auto-include with parent clauses

### Question-to-Clause Mapping (`/public/mappings.js`)
Critical file defining which clauses get selected based on wizard answers:
```javascript
{
  questions: ['web'],
  clauses: ['9']  // Selects entire section 9 for web content
}
```

### Clause Tree Logic (`/controllers/clauseTree.js`)
Builds nested hierarchy from flat clause numbers using dot notation parsing. Essential for the checkbox tree display.

### Document Generation (`/controllers/generatorController.js`)
- Uses `html-docx-js` library to convert Pug templates → Word documents
- Multiple template variants: full requirements, evaluation tables, French/English versions
- Images stored as base64 in MongoDB for inline document embedding

## Development Patterns

### Bilingual Support
Every data model has `name`/`frName`, `description`/`frDescription` fields. Routes have `/fr/` variants that render French templates.

### Authentication
CMS editing routes (`/edit/*`) protected by HTTP Basic Auth. Default credentials in `app.js` lines 38-39.

### Client-Side Logic (`/public/a11y-req.js`)
- Handles wizard question selections and automatic clause mapping
- Manages hierarchical checkbox tree with parent/child relationships
- Integrates CKEditor 5 for rich text editing (with accessibility limitations noted in README)

## Common Development Tasks

### Adding New Wizard Questions
1. Add question in `/views/includes/wizard_form.pug` using `+checkbox()` mixin
2. Define mappings in `/public/mappings.js` connecting question ID to clause numbers
3. Test clause auto-selection in Step 1 of wizard

### Modifying Document Templates
Edit `/views/download_*.pug` files and corresponding CSS in `/views/download.css`. Note: Word document styling is limited by `html-docx-js` library capabilities.

### Database Operations
- Development: `mongorestore dump/` to populate from JSON exports
- Production: Set `POPULATE_DB=true` environment variable for Docker auto-population

## Key Files for Quick Orientation
- `/app.js` - Main Express setup, MongoDB connection, auth configuration
- `/routes/generatorRoutes.js` - Main wizard and download endpoints
- `/routes/editRoutes.js` - CMS routes for content management
- `/public/mappings.js` - Critical question-to-clause mapping logic
- `/views/wizard.pug` - Main wizard interface structure

## Development Environment
- Node.js + Express + MongoDB + Pug templates
- Run locally: `npm run devstart` + `mongod` + `mongorestore dump/`
- Docker: `docker-compose up` (includes PM2 + nginx)
- Edit CMS: Visit `/edit` with admin/admin credentials

## Deployment & Azure Hosting
- **Production**: Hosted on Azure Container Registry (`proditcaccessibilityregistry.azurcr.io`)
- **Sandbox**: Uses `itcaccessibilityregistry.azurecr.io` for development builds
- **CI/CD**: Azure DevOps pipelines auto-deploy on branch pushes
  - `main` branch → Production environment (`Prod-2021-azure-pipelines.yml`)
  - Development builds use environment variable substitution in `tmp_Dockerfile`
- **Container**: Docker with nginx reverse proxy + PM2 process manager
- **Database**: External MongoDB instance (configured via `DB_URI` environment variable)

## Workflow Guidelines
- **2021 Version**: Work on `dev` branch, merge to `main` for production
- **2025 Version**: Work on `2025-dev` branch, merge to `2025` for production
- Each version has its own development cycle and deployment pipeline
- Always specify which EN 301 549 version when discussing requirements or changes

The codebase follows Mozilla Express tutorial patterns with WET-BOEW (Government of Canada) frontend framework integration.