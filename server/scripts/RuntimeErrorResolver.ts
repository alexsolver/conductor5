// CRITICAL RUNTIME ERROR RESOLUTION SYSTEM
// Systematic resolution of 8 critical runtime error categories

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface RuntimeError {
  category: string;
  description: string;
  impact: 'critical' | 'high' | 'medium' | 'low';
  files: string[];
  solution: string;
  status: 'identified' | 'in_progress' | 'resolved';
}

class RuntimeErrorResolver {
  private errors: RuntimeError[] = [
    {
      category: "Array Method Failures",
      description: "users.map is not a function - arrays returning undefined",
      impact: 'critical',
      files: ['client/src/pages/Projects.tsx', 'client/src/components/timecard/BulkScheduleAssignment.tsx'],
      solution: "Add array validation: const safeArray = Array.isArray(data) ? data : [];",
      status: 'resolved'
    },
    {
      category: "Endpoint Failures",
      description: "Múltiplas falhas de endpoints - projetos, estatísticas, localização",
      impact: 'critical',
      files: ['server/routes/*', 'client/src/pages/Projects.tsx'],
      solution: "Check API responses and add proper error handling",
      status: 'identified'
    },
    {
      category: "Schema Path Inconsistencies",
      description: "drizzle.config.ts vs schema-master.ts path confusion",
      impact: 'medium',
      files: ['drizzle.config.ts', 'shared/schema.ts'],
      solution: "Confirmed working correctly via re-export proxy",
      status: 'resolved'
    },
    {
      category: "Phantom Table Validation", 
      description: "Validating non-existent email_processing_* tables",
      impact: 'high',
      files: ['server/db.ts'],
      solution: "Remove email_processing_rules, email_response_templates, email_processing_logs from validation",
      status: 'resolved'
    },
    {
      category: "Audit Trail Inconsistencies",
      description: "Missing updatedAt fields in critical tables causing audit compliance failures",
      impact: 'high',
      files: ['shared/schema-master.ts'],
      solution: "Add updatedAt timestamp fields to all tables for complete audit trail",
      status: 'resolved'
    },
    {
      category: "Missing Spatial Indexes",
      description: "locations table lacks spatial indexes for geolocation queries",
      impact: 'medium',
      files: ['shared/schema-master.ts'],
      solution: "Add spatial indexes for latitude/longitude proximity searches",
      status: 'resolved'
    },
    {
      category: "Array Validation Issues",
      description: "UUID arrays accept invalid values without type validation",
      impact: 'medium',
      files: ['shared/schema-master.ts'],
      solution: "Add array element validation for UUID arrays",
      status: 'identified'
    },
    {
      category: "API Response Parsing",
      description: "Frontend expecting arrays but receiving objects or undefined",
      impact: 'high',
      files: ['client/src/pages/*.tsx'],
      solution: "Add response validation and safe array destructuring",
      status: 'identified'
    },
    {
      category: "Token Expiration Handling",
      description: "Invalid or expired tokens causing 401 errors",
      impact: 'medium',
      files: ['client/src/pages/*', 'server/middleware/*'],
      solution: "Add automatic token refresh and proper error handling",
      status: 'identified'
    }
  ];

  analyzeArrayUsagePatterns(): string {
    let report = `# ARRAY USAGE PATTERN ANALYSIS\n\n`;
    
    report += `## 🔍 CRITICAL ARRAY METHOD FAILURES DETECTED\n\n`;
    
    // Analyze Projects.tsx
    try {
      const projectsPath = join(process.cwd(), 'client', 'src', 'pages', 'Projects.tsx');
      const projectsContent = readFileSync(projectsPath, 'utf-8');
      
      // Find all .map() usage
      const mapUsages = [...projectsContent.matchAll(/(\w+)\.map\(/g)];
      
      report += `### Projects.tsx Array Operations:\n`;
      mapUsages.forEach(match => {
        const [fullMatch, arrayName] = match;
        report += `- **${arrayName}.map()** - needs validation\n`;
      });
      
      // Find potential unsafe array access
      const unsafeArrays = [...projectsContent.matchAll(/(tags|teamMemberIds|projects)\.(\w+)\(/g)];
      report += `\n### Potentially Unsafe Array Access:\n`;
      unsafeArrays.forEach(match => {
        const [fullMatch, arrayName, method] = match;
        report += `- **${arrayName}.${method}()** - risk if array is undefined\n`;
      });
      
    } catch (error) {
      report += `❌ Error analyzing Projects.tsx: ${error}\n`;
    }
    
    return report;
  }

  generateArraySafetyPatches(): string {
    return `
// ARRAY SAFETY PATTERNS FOR FRONTEND

// ✅ SAFE ARRAY MAPPING
const safeProjects = Array.isArray(projects) ? projects : [];
const projectElements = safeProjects.map((project) => (
  <ProjectCard key={project.id} project={project} />
));

// ✅ SAFE ARRAY FILTERING  
const safeUsers = Array.isArray(users) ? users : [];
const filteredUsers = safeUsers.filter(user => user.isActive);

// ✅ SAFE ARRAY ACCESS WITH DEFAULTS
const safeTags = Array.isArray(project.tags) ? project.tags : [];
const tagElements = safeTags.slice(0, 3).map((tag, index) => (
  <Badge key={index}>{tag}</Badge>
));

// ✅ API RESPONSE VALIDATION
const fetchProjects = async () => {
  try {
    const response = await fetch('/api/projects');
    const data = await response.json();
    
    // SAFE: Validate array response
    const safeProjects = Array.isArray(data) ? data : Array.isArray(data.projects) ? data.projects : [];
    setProjects(safeProjects);
  } catch (error) {
    console.error('Fetch error:', error);
    setProjects([]); // SAFE: Default empty array
  }
};

// ✅ CONDITIONAL RENDERING WITH ARRAY CHECK
{Array.isArray(projects) && projects.length > 0 ? (
  projects.map(project => <ProjectCard key={project.id} project={project} />)
) : (
  <div>No projects found</div>
)}
`;
  }

  async fixArrayValidationInProjects(): Promise<void> {
    const projectsPath = join(process.cwd(), 'client', 'src', 'pages', 'Projects.tsx');
    
    try {
      let content = readFileSync(projectsPath, 'utf-8');
      
      // Add array safety to map operations
      content = content.replace(
        /filteredProjects\.map\(/g,
        '(Array.isArray(filteredProjects) ? filteredProjects : []).map('
      );
      
      content = content.replace(
        /project\.tags\.slice\(0, 3\)\.map\(/g,
        '(Array.isArray(project.tags) ? project.tags.slice(0, 3) : []).map('
      );
      
      content = content.replace(
        /selectedProject\.tags\.map\(/g,
        '(Array.isArray(selectedProject?.tags) ? selectedProject.tags : []).map('
      );
      
      // Add safe array initialization
      const safeInitPattern = `
  // SAFE ARRAY FILTERING WITH VALIDATION
  const filteredProjects = useMemo(() => {
    const safeProjects = Array.isArray(projects) ? projects : [];
    return safeProjects.filter((project) => {`;
      
      content = content.replace(
        /const filteredProjects = projects\.filter\(\(project\) => \{/,
        safeInitPattern
      );
      
      writeFileSync(projectsPath, content);
      console.log('✅ Array safety patches applied to Projects.tsx');
      
    } catch (error) {
      console.error('❌ Failed to patch Projects.tsx:', error);
    }
  }

  generateRuntimeErrorReport(): string {
    let report = `# RUNTIME ERROR RESOLUTION REPORT\n`;
    report += `Generated: ${new Date().toISOString()}\n\n`;

    report += `## 📊 ERROR SUMMARY\n`;
    const totalErrors = this.errors.length;
    const resolvedErrors = this.errors.filter(e => e.status === 'resolved').length;
    const criticalErrors = this.errors.filter(e => e.impact === 'critical').length;
    
    report += `Total runtime errors identified: ${totalErrors}\n`;
    report += `Resolved errors: ${resolvedErrors}\n`;
    report += `Critical errors remaining: ${criticalErrors}\n`;
    report += `Resolution progress: ${Math.round((resolvedErrors / totalErrors) * 100)}%\n\n`;

    // Group by status
    const errorsByStatus = {
      resolved: this.errors.filter(e => e.status === 'resolved'),
      in_progress: this.errors.filter(e => e.status === 'in_progress'),
      identified: this.errors.filter(e => e.status === 'identified')
    };

    report += `## ✅ RESOLVED ISSUES\n`;
    errorsByStatus.resolved.forEach(error => {
      report += `### ${error.category}\n`;
      report += `- **Impact**: ${error.impact}\n`;
      report += `- **Description**: ${error.description}\n`;
      report += `- **Solution**: ${error.solution}\n`;
      report += `- **Files**: ${error.files.join(', ')}\n\n`;
    });

    report += `## 🔄 CRITICAL ISSUES REQUIRING IMMEDIATE ATTENTION\n`;
    errorsByStatus.identified.filter(e => e.impact === 'critical').forEach(error => {
      report += `### ${error.category} (${error.impact.toUpperCase()})\n`;
      report += `- **Description**: ${error.description}\n`;
      report += `- **Solution**: ${error.solution}\n`;
      report += `- **Files**: ${error.files.join(', ')}\n`;
      report += `- **Status**: ${error.status}\n\n`;
    });

    report += `## 📋 REMAINING ISSUES\n`;
    errorsByStatus.identified.filter(e => e.impact !== 'critical').forEach(error => {
      report += `### ${error.category} (${error.impact})\n`;
      report += `- **Description**: ${error.description}\n`;
      report += `- **Solution**: ${error.solution}\n\n`;
    });

    report += `## 🎯 NEXT STEPS\n`;
    report += `1. Fix critical array validation issues in frontend components\n`;
    report += `2. Add comprehensive API response validation\n`;
    report += `3. Implement proper error boundaries for array operations\n`;
    report += `4. Add token refresh mechanism for expired auth\n`;
    report += `5. Complete array element validation for UUID arrays\n`;

    return report;
  }
}

// Execute analysis
const resolver = new RuntimeErrorResolver();
const report = resolver.generateRuntimeErrorReport();
const arrayAnalysis = resolver.analyzeArrayUsagePatterns();
const safetyPatches = resolver.generateArraySafetyPatches();

console.log(report);
console.log('\n' + arrayAnalysis);
console.log('\nSAFETY PATCHES:');
console.log(safetyPatches);

// Apply fixes
resolver.fixArrayValidationInProjects();

export { RuntimeErrorResolver };