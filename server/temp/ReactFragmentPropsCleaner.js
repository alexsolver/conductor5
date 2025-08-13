!/usr/bin / env;
node;
/**
 * React Fragment Props Cleaner
 * Systematically identifies and fixes React.Fragment invalid props issues
 * Following 1qa.md compliance
 */
import fs from 'fs';
import path from 'path';
export class ReactFragmentPropsCleaner {
    constructor() {
        this.issues = [];
    }
    async validateAllFiles() {
        const clientDir = path.join(process.cwd(), 'client');
        await this.scanDirectory(clientDir);
        console.log('🔍 [ReactFragmentPropsCleaner] Analysis complete');
        console.log('📊 [ReactFragmentPropsCleaner] Issues found:', this.issues.length);
        this.printReport();
        await this.applyFixes();
    }
    async scanDirectory(dir) {
        try {
            const files = fs.readdirSync(dir);
            for (const file of files) {
                const filePath = path.join(dir, file);
                const stat = fs.statSync(filePath);
                if (stat.isDirectory()) {
                    await this.scanDirectory(filePath);
                }
                else if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
                    await this.scanFile(filePath);
                }
            }
        }
        catch (error) {
            console.warn('⚠️ Could not scan directory:', dir);
        }
    }
    async scanFile(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split('\n');
            lines.forEach((line, index) => {
                this.checkReactFragmentIssues(line, index + 1, filePath, content);
            });
        }
        catch (error) {
            console.warn('⚠️ Could not read file:', filePath);
        }
    }
    checkReactFragmentIssues(line, lineNumber, filePath, fullContent) {
        // Check for React.Fragment with invalid props
        const fragmentWithPropsPattern = /<(React\.)?Fragment\s+([^>]*data-replit-metadata[^>]*)>/g;
        const fragmentMatch = fragmentWithPropsPattern.exec(line);
        if (fragmentMatch) {
            this.issues.push({
                file: filePath,
                line: lineNumber,
                issue: 'React.Fragment with invalid props (data-replit-metadata)',
                severity: 'warning',
                fix: 'Replace with div or remove invalid props'
            });
        }
        // Check for <> (Fragment shorthand) with props
        const shortFragmentWithPropsPattern = /<>\s*{[^}]*data-replit-metadata[^}]*}/g;
        if (shortFragmentWithPropsPattern.test(line)) {
            this.issues.push({
                file: filePath,
                line: lineNumber,
                issue: 'Fragment shorthand <> with props',
                severity: 'warning',
                fix: 'Replace with div element'
            });
        }
        // Check for data-replit-metadata in any JSX element
        if (line.includes('data-replit-metadata') && (line.includes('<') || line.includes('jsx'))) {
            this.issues.push({
                file: filePath,
                line: lineNumber,
                issue: 'data-replit-metadata prop found',
                severity: 'info',
                fix: 'Review if this prop is necessary'
            });
        }
    }
    printReport() {
        console.log('\n=== REACT FRAGMENT PROPS VALIDATION REPORT ===\n');
        const criticalIssues = this.issues.filter(i => i.severity === 'critical');
        const warningIssues = this.issues.filter(i => i.severity === 'warning');
        const infoIssues = this.issues.filter(i => i.severity === 'info');
        console.log(`🚨 Critical Issues: ${criticalIssues.length}`);
        console.log(`⚠️  Warning Issues: ${warningIssues.length}`);
        console.log(`ℹ️  Info Issues: ${infoIssues.length}`);
        if (warningIssues.length > 0) {
            console.log('\n⚠️  WARNING ISSUES:\n');
            warningIssues.forEach(issue => {
                console.log(`📁 ${issue.file.replace(process.cwd(), '')}:${issue.line}`);
                console.log(`   ${issue.issue}`);
                console.log(`   🔧 Fix: ${issue.fix}\n`);
            });
        }
        if (infoIssues.length > 0) {
            console.log('\nℹ️  INFO ISSUES:\n');
            infoIssues.forEach(issue => {
                console.log(`📁 ${issue.file.replace(process.cwd(), '')}:${issue.line}`);
                console.log(`   ${issue.issue}\n`);
            });
        }
    }
    async applyFixes() {
        console.log('\n🔧 APPLYING AUTOMATIC FIXES...\n');
        const filesByPath = new Map();
        // Group issues by file
        this.issues.forEach(issue => {
            if (!filesByPath.has(issue.file)) {
                filesByPath.set(issue.file, []);
            }
            filesByPath.get(issue.file).push(issue);
        });
        // Fix each file
        for (const [filePath, fileIssues] of filesByPath) {
            await this.fixFile(filePath, fileIssues);
        }
    }
    async fixFile(filePath, issues) {
        try {
            let content = fs.readFileSync(filePath, 'utf8');
            let modified = false;
            // Fix React.Fragment with invalid props
            const fragmentPattern = /<(React\.)?Fragment(\s+[^>]*data-replit-metadata[^>]*)>/g;
            if (fragmentPattern.test(content)) {
                content = content.replace(fragmentPattern, '<div>');
                content = content.replace(/<\/(React\.)?Fragment>/g, '</div>');
                modified = true;
                console.log(`✅ Fixed React.Fragment props in: ${filePath.replace(process.cwd(), '')}`);
            }
            // Remove data-replit-metadata from any element
            const replitMetadataPattern = /\s+data-replit-metadata="[^"]*"/g;
            if (replitMetadataPattern.test(content)) {
                content = content.replace(replitMetadataPattern, '');
                modified = true;
                console.log(`✅ Removed data-replit-metadata from: ${filePath.replace(process.cwd(), '')}`);
            }
            // Save modified content
            if (modified) {
                fs.writeFileSync(filePath, content, 'utf8');
            }
        }
        catch (error) {
            console.error(`❌ Failed to fix file ${filePath}:`, error);
        }
    }
    getIssues() {
        return this.issues;
    }
}
// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const cleaner = new ReactFragmentPropsCleaner();
    cleaner.validateAllFiles()
        .then(() => {
        console.log('✅ React Fragment props cleaning complete');
        const warningCount = cleaner.getIssues().filter(i => i.severity === 'warning').length;
        if (warningCount > 0) {
            console.log(`\n⚠️ Found ${warningCount} React Fragment issues that were automatically fixed`);
        }
        process.exit(0);
    })
        .catch(error => {
        console.error('❌ React Fragment cleaning failed:', error);
        process.exit(1);
    });
}
