# A11y ICT Accessibility Requirements Wizard (2025 Version)

Accessibility requirements generator for ICT procurement based on EN 301 549:2025 standard. Generates custom Word/HTML documents containing relevant accessibility clauses through a 3-step wizard interface.

## Branch Architecture

**Current Branch**: `2025` - EN 301 549:2025 standard with major architectural upgrades
**Legacy**: `main` (2021 standard), `2018` (archived)
**Development**: Work on `2025-dev`, merge to `2025` for production

> ⚠️ **Critical**: This branch has fundamentally different architecture from `main` branch - do NOT apply main branch patterns.

## Core Architecture (2025)

### Data Flow
MongoDB Questions (with clause relationships) → Dynamic wizard rendering → Clause tree hierarchy → Document generation

### 3-Step Wizard
1. **Dynamic Questions**: Database-driven questions with enhanced UX (modals, bulk actions, undo)
2. **Clause Tree**: Manual fine-tuning via hierarchical checkbox tree  
3. **Document Generation**: Word/HTML output with improved templates

## Key Models & Controllers

### Questions System (`models/questionSchema.js`)
**NEW in 2025** - Replaces static mappings with dynamic database relationships:
```javascript
{
  name: "Web content",
  frName: "Contenu web", 
  clauses: [ObjectId("...")], // Direct clause references
  isUber: false,      // Major category questions
  isUnique: false,    // Single-select exclusive
  onlyIf: false,      // Conditional display
  order: 10           // Display sequence
}
```

### Question Management (`controllers/questionController.js`) 
- CRUD operations for questions
- JSON export: `/edit/questionsdownload`
- JSON import: `/edit/questionsrestore` (uses `multer` for file upload)
- Mongo format conversion for data migration

### Clause & Info Models
- `clauseSchema.js`: Hierarchical EN 301 549 requirements (unchanged structure)
- `infoSchema.js`: Informative sections (unchanged structure)

## Critical Architectural Changes from Main Branch

### ❌ REMOVED (Do Not Use)
- `public/mappings.js` - Static question-to-clause mapping
- `models/presetSchema.js` - Static presets
- `controllers/presetController.js` - Preset management
- Multiple evaluation templates (simplified to core formats)

### ✅ NEW (2025 Only) 
- **Dynamic question-clause relationships** stored in database
- **File upload system** with `multer` middleware
- **Enhanced wizard UI** with modal help, bulk actions, undo
- **JSON backup/restore** for all data models
- **Word processing** with `mammoth` library

## Development Patterns

### Adding Questions
**Do NOT edit static files** - use CMS:
1. Visit `/edit/questions` 
2. Create question with clause relationships
3. Set question type flags (`isUber`, `isUnique`, etc.)
4. Test in wizard Step 1

### Question-Clause Mapping
Configure via CMS interface - select clauses from dropdown when editing questions. For bulk operations, use JSON export/import system.

### Enhanced Wizard UI (`views/includes/wizard_form.pug`)
- **Modal help**: Each question has info dialog with detailed description
- **Bulk actions**: Select all/deselect all per wizard step
- **Undo system**: Step-by-step undo functionality
- **Question grouping**: Visual separation of uber/unique/standard questions

### Document Templates
- `views/download_*.pug` - Simplified template structure
- `views/download_docx.css` - Word document styling
- `views/download_html.css` - HTML output styling

## Dependencies (2025 Additions)

```json
{
  "mammoth": "^1.10.0",  // Word document processing
  "multer": "^2.0.2"     // File upload handling
}
```

## Key Routes & Endpoints

### Public Routes (`routes/generatorRoutes.js`)
- `/` - Main wizard (renders questions from database)
- `/fr/` - French wizard
- `/:template` (POST) - Document generation

### Admin Routes (`routes/editRoutes.js`) 
- `/edit/questions` - Question management CMS
- `/edit/questionsdownload` - Export questions as JSON
- `/edit/questionsrestore` - Import questions from JSON upload
- `/edit/clausesdownload`, `/edit/infosdownload` - Export other models
- `/edit/clausesrestore`, `/edit/infosrestore` - Import other models

## Database Operations

### Development Setup
```bash
mongod
mongorestore dump/  # Includes questions.bson
npm run devstart
```

### Data Migration
- **Export**: Use CMS download endpoints
- **Import**: Upload JSON files via CMS restore endpoints  
- **Bulk changes**: Modify exported JSON, then re-import

## Azure Deployment (2025)

### CI/CD Pipelines
- **Production**: `Prod-2025-azure-pipelines.yml` (triggers on `2025` branch push)
- **Development**: `Dev-2025-azure-pipelines.yml` (triggers on `2025-dev` branch push)
- **Build Process**: Docker build with environment variable substitution in `tmp_Dockerfile`
- **Registry Push**: Automatic push to Azure Container Registry on successful build

### Container Registries & Images
- **Production**: `proditcaccessibilityregistry.azurecr.io/2021-ayreqgit:Latest`
- **Sandbox**: `itcaccessibilityregistry.azurecr.io/sand-ayreqgit:Latest`
- **Image Build**: Uses `tmp_Dockerfile` with runtime environment substitution

### Container Architecture
- **Base**: Node.js 22 with production environment
- **Process Manager**: PM2 for application management
- **Web Server**: nginx reverse proxy configuration
- **Database**: External MongoDB (not containerized)
- **Ports**: 443 (HTTPS), 2222 (SSH access)

### Environment Variables
- `DB_URI` - MongoDB connection string (required)
- `POPULATE_DB=true` - Auto-populate database on container start
- `BASIC_AUTH_USERNAME/PASSWORD` - CMS credentials (default: admin/admin)
- `WAIT_FOR_MONGO` - Database readiness check configuration
- `WAIT_HOSTS` - Service dependency waiting configuration

### Deployment Process
1. **Code Push**: Commit to `2025` or `2025-dev` branch
2. **Pipeline Trigger**: Azure DevOps automatically starts build
3. **Environment Substitution**: Variables injected into `tmp_Dockerfile`
4. **Container Build**: Docker image created with nginx + PM2 + Node.js app
5. **Registry Push**: Image pushed to appropriate Azure Container Registry
6. **Database Setup**: MongoDB populated if `POPULATE_DB=true`

### Container Startup Sequence (`scripts/start.sh`)
1. Wait for MongoDB availability
2. Conditionally populate database from dump files
3. Start nginx reverse proxy
4. Launch Node.js app via PM2 process manager
5. Enable SSH access for debugging

## Essential Files for Development

### New in 2025
- `models/questionSchema.js` - Dynamic question model
- `controllers/questionController.js` - Question CRUD + JSON ops
- `views/question_form.pug` - Question editing interface
- `public/wet-boew-fixes.js` - UI enhancement fixes

### Key Existing Files  
- `app.js` - Express setup, MongoDB connection, auth
- `controllers/clauseTree.js` - Hierarchical clause structure
- `controllers/generatorController.js` - Document generation logic
- `views/wizard.pug` - Main wizard interface

## Development Workflow (2025)

1. **Question Changes**: Use CMS at `/edit/questions` - no static file editing
2. **Testing**: Verify question-clause relationships in wizard Step 1
3. **Data Backup**: Export JSON before major changes
4. **Branch Strategy**: Work on `2025-dev`, merge to `2025` for deployment
5. **Documentation**: Reference EN 301 549:2025 for new requirements

## Migration from Main Branch

**Do NOT apply these main branch patterns**:
- ❌ Editing `mappings.js` (file deleted)
- ❌ Using preset models/controllers (replaced with questions)
- ❌ Static question configuration

**Instead use these 2025 patterns**:
- ✅ CMS-based question management
- ✅ Database-driven clause relationships  
- ✅ JSON import/export for bulk operations
- ✅ Enhanced wizard UI components

This represents a complete architectural evolution from static configuration to dynamic, database-driven question management with enhanced UX and file processing capabilities.