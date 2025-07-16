
# Prompt Técnico – Plataforma Conductor (PARTE 1/4)

## 📌 CONTEXTO DO PROJETO
Desenvolver o Conductor, uma plataforma SaaS de gestão de serviços baseada no zendesk, com arquitetura multitenancy enterprise, construída do zero em React + Node.js. O sistema deve ser robusto, seguro, escalável e funcional desde o primeiro commit. A arquitetura será modular, com possibilidade de adicionar módulos individualmente ao longo do tempo.

## 🎨 DESIGN SYSTEM & VISUAL IDENTITY

### Layout Visual: Gradient Focus
• **Estilo Principal**: Layout moderno com gradientes dinâmicos como elemento focal
• **Paleta de Cores**: 
  - Gradiente primário: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
  - Gradiente secundário: `linear-gradient(135deg, #f093fb 0%, #f5576c 100%)`
  - Gradiente de sucesso: `linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)`
  - Cores neutras: Gray-50 a Gray-900 (Tailwind)

### Componentes com Gradient Focus
• **Headers/Heroes**: Backgrounds com gradientes suaves
• **Cards importantes**: Bordas com gradient ou background gradient sutil
• **Botões primários**: Gradientes com hover effects
• **Sidebar/Navigation**: Gradientes discretos para hierarquia visual
• **Dashboards**: Cards com gradientes sutis para destacar métricas importantes
• **Call-to-Actions**: Gradientes vibrantes para conversão

### Implementação Tailwind CSS
```css
/* Gradientes customizados para Tailwind */
.gradient-primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.gradient-secondary { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
.gradient-success { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
.gradient-card { background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%); }
.gradient-border { border-image: linear-gradient(135deg, #667eea, #764ba2) 1; }
```

## 🧱 STACK TECNOLÓGICO DEFINITIVO

### Backend
• Node.js (Express.js)
• TypeScript (tipagem estática)
• PostgreSQL (banco principal)
• Redis (cache, sessões e filas)
• Prisma ORM (ORM principal)
• JWT + Passport.js (autenticação)
• Bull Queue (processamento de jobs)
• Winston (logging estruturado)
• Prometheus + Grafana (métricas)
• Sentry (error tracking)

### Frontend
• React 18 (com TypeScript)
• React Router v6 (roteamento SPA)
• React Query/TanStack Query (gerenciamento de estado servidor)
• Zustand (gerenciamento de estado local)
• **Tailwind CSS (estilização com gradientes customizados)**
• **Headless UI + Custom Gradient Components**
• React Hook Form (formulários)
• Zod (validação de schemas)
• **Framer Motion (animações sutis para gradientes)**

### UI/UX Requirements
• **Responsive Design**: Mobile-first com breakpoints consistentes
• **Accessibility**: WCAG 2.1 compliance + screen reader support
• **Performance**: Lazy loading de componentes com gradientes pesados
• **Dark Mode**: Gradientes adaptáveis para tema escuro
• **Micro-interactions**: Hover effects suaves em elementos gradient

### Infraestrutura & DevOps
• Nginx (proxy reverso)
• PM2 (gerenciamento de processos)
• Docker (containerização)
• GitHub Actions (CI/CD)
• New Relic/DataDog (APM)
• Automated backup strategy

### Qualidade & Testes
• Jest (unit tests)
• Testing Library (component tests)
• Supertest (integration tests)
• Cypress (e2e tests)
• Storybook (component documentation)
• ESLint + Prettier (code quality)
• Swagger/OpenAPI (API documentation)

**CONTINUE COM PARTE 2 PARA ARQUITETURA E ESTRUTURA**
