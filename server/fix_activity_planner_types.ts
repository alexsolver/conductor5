// ✅ 1QA.MD COMPLIANCE: Activity Planner Type Fixes
// Script to fix all TypeScript errors identified

const fs = require('fs');
const path = require('path');

// Fix ActivityPlannerController - replace all userId with id
const controllerPath = path.join(__dirname, 'modules/activity-planner/application/controllers/ActivityPlannerController.ts');
let controllerContent = fs.readFileSync(controllerPath, 'utf8');

// Replace all occurrences of req.user?.userId! with req.user?.id!
controllerContent = controllerContent.replace(/req\.user\?\.userId!/g, 'req.user?.id!');

// Fix any remaining userId references in assignments
controllerContent = controllerContent.replace(/const userId = req\.user\?\.userId!/g, 'const userId = req.user?.id!');

fs.writeFileSync(controllerPath, controllerContent);

console.log('✅ Activity Planner Controller types fixed');

// Fix routes.ts - use proper typing
const routesPath = path.join(__dirname, 'modules/activity-planner/routes.ts');
let routesContent = fs.readFileSync(routesPath, 'utf8');

// Fix import statement to use proper AuthenticatedRequest from middleware
routesContent = routesContent.replace(
  "import { jwtAuth } from '../../middleware/jwtAuth';",
  "import { jwtAuth, AuthenticatedRequest } from '../../middleware/jwtAuth';"
);

// Cast all request parameters to AuthenticatedRequest
routesContent = routesContent.replace(
  /\((req, res)\)/g,
  '((req: AuthenticatedRequest, res)'
);

fs.writeFileSync(routesPath, routesContent);

console.log('✅ Activity Planner Routes types fixed');

// Fix contracts routes similarly  
const contractsRoutesPath = path.join(__dirname, 'modules/contracts/routes.ts');
let contractsRoutesContent = fs.readFileSync(contractsRoutesPath, 'utf8');

contractsRoutesContent = contractsRoutesContent.replace(
  "import { jwtAuth } from '../../middleware/jwtAuth';",
  "import { jwtAuth, AuthenticatedRequest } from '../../middleware/jwtAuth';"
);

contractsRoutesContent = contractsRoutesContent.replace(
  /\((req, res)\)/g,
  '((req: AuthenticatedRequest, res)'
);

fs.writeFileSync(contractsRoutesPath, contractsRoutesContent);

console.log('✅ Contracts Routes types fixed');

console.log('🎯 All TypeScript fixes applied successfully');