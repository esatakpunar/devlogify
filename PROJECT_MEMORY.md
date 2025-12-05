# PROJECT_MEMORY.md

> **Project Name:** Devlogify

> **Last Updated:** 2025-01-27

> **Current Phase:** Active Development

> **Active Context:** MVP kurulumu tamamlandı, özellik geliştirme ve iyileştirmeler devam ediyor

---

## [1. PROJECT VISION & GOALS]

- **Core Concept:** Geliştiriciler ve ekipler için proje takibi, zaman takibi, geliştirme logları, Kanban panoları, analitik ve AI destekli özellikler sunan kapsamlı bir geliştirme yönetim platformu.

- **Target Audience:**

  - Bireysel geliştiriciler
  - Küçük ve orta ölçekli geliştirme ekipleri
  - Proje yöneticileri
  - Freelance geliştiriciler

- **Success Criteria:**
  - Kullanıcılar projelerini etkili bir şekilde takip edebilmeli
  - Zaman takibi ve analitik özellikleri kullanıcılara değer katmalı
  - AI özellikleri gerçekten üretkenliği artırmalı
  - PWA desteği ile offline çalışabilmeli
  - Çoklu dil desteği ile global kullanıcı tabanına ulaşılabilmeli

## [2. TECH STACK & CONSTRAINTS]

- **Language/Framework:**

  - Next.js 15.5.7 (App Router) - Security update for CVE-2025-66478
  - React 19.2.1 - Security update for CVE-2025-55182
  - TypeScript 5

- **Backend/DB:**

  - Supabase (PostgreSQL, Authentication, Real-time)
  - Supabase SSR (@supabase/ssr)

- **State Management:**

  - Zustand 5.0.8 (client-side state)
  - Server Components (Next.js App Router)

- **Key Packages:**

  - **UI:** Radix UI components, Tailwind CSS 4, Framer Motion
  - **AI:** @google/generative-ai (Gemini Pro)
  - **Drag & Drop:** @dnd-kit (Kanban boards)
  - **Charts:** Recharts
  - **Date Handling:** date-fns, date-fns-tz
  - **Markdown:** react-markdown, marked, prismjs
  - **Notifications:** Sonner
  - **PWA:** next-pwa
  - **Analytics:** @vercel/analytics, @vercel/speed-insights
  - **i18n:** Custom implementation with dictionaries

- **Constraints:**
  - PWA desteği (offline-first yaklaşım)
  - Mobile-first responsive tasarım
  - Server-side rendering (SSR) ve Server Components kullanımı
  - TypeScript strict mode
  - Environment variables için .env.local kullanımı (asla API key'leri koda gömme)
  - Turbopack kullanımı (development ve build)

## [3. ARCHITECTURE & PATTERNS]

- **Design Pattern:**

  - Next.js App Router architecture
  - Server/Client Component separation
  - Component-based architecture
  - Feature-based folder structure

- **Folder Structure:**

  - `/app`: Next.js App Router pages ve route handlers
    - `/app/[lang]`: Internationalized routes
    - `/app/api`: API route handlers
    - `/app/(auth)`: Authentication pages (grouped route)
  - `/components`: React components
    - `/components/ui`: Reusable UI components (Radix UI based)
    - `/components/layout`: Layout components (Sidebar, Navbar, etc.)
    - `/components/[feature]`: Feature-specific components
  - `/lib`: Utility functions and configurations
    - `/lib/supabase`: Supabase client configurations
    - `/lib/store`: Zustand stores
    - `/lib/hooks`: Custom React hooks
    - `/lib/i18n`: Internationalization utilities
    - `/lib/ai`: AI-related utilities
    - `/lib/utils`: General utility functions
  - `/dictionaries`: i18n translation files (en.json, tr.json, de.json, es.json)
  - `/types`: TypeScript type definitions
  - `/supabase/migrations`: Database migration files

- **Naming Conventions:**
  - Components: PascalCase (e.g., `DashboardLayout.tsx`)
  - Files: kebab-case for pages, PascalCase for components
  - Variables/Functions: camelCase
  - Database: snake_case (Supabase convention)
  - Constants: UPPER_SNAKE_CASE
  - Types/Interfaces: PascalCase with descriptive names

## [4. ACTIVE RULES (The "Laws")]

_(Yapay zekanın asla çiğnememesi gereken kurallar)_

1. **Asla API Key'leri koda gömme** - Her zaman `.env.local` kullan ve `NEXT_PUBLIC_` prefix'ini sadece client-side'da kullanılacak değişkenler için kullan. Server-side only değişkenler (GEMINI_API_KEY gibi) için prefix kullanma.

2. **Server/Client Component ayrımına dikkat et** - Varsayılan olarak Server Component kullan, sadece interactivity gerektiğinde 'use client' ekle.

3. **TypeScript strict mode** - Her zaman tip güvenliği sağla, `any` kullanımından kaçın.

4. **i18n desteği** - Yeni UI metinleri eklerken her zaman dictionary dosyalarına ekle (en, tr, de, es).

5. **PWA uyumluluğu** - Offline çalışabilir özellikler geliştirirken offline store'u kullan.

6. **Responsive tasarım** - Mobile-first yaklaşım, tüm yeni componentler mobile ve desktop'ta çalışmalı.

7. **Accessibility** - Radix UI componentleri kullanarak erişilebilirlik standartlarına uy.

8. **Performance** - Büyük listeler için pagination veya virtualization kullan, gereksiz re-render'lardan kaçın.

9. **Error handling** - ErrorBoundary kullan ve kullanıcı dostu hata mesajları göster.

10. **Code organization** - Feature-based organization'a uy, ilgili dosyaları birlikte tut.

## [5. PROGRESS & ROADMAP]

- [x] Phase 1: Setup & Configuration

  - [x] Next.js 15 + TypeScript setup
  - [x] Supabase integration
  - [x] Tailwind CSS + Radix UI setup
  - [x] PWA configuration
  - [x] i18n implementation
  - [x] Authentication system

- [x] Phase 2: Core Features

  - [x] Project management
  - [x] Task management (Kanban boards)
  - [x] Time tracking
  - [x] Notes/Development logs
  - [x] Timeline view
  - [x] Analytics dashboard
  - [x] Project sharing

- [x] Phase 3: AI Features

  - [x] AI task suggestions
  - [x] AI task generation
  - [x] Daily standup summary
  - [x] Smart task grouping
  - [x] AI tag suggestions

- [ ] Phase 4: UI Polish & Optimization

  - [ ] Performance optimization
  - [ ] Advanced analytics features
  - [ ] Enhanced mobile experience
  - [ ] Dark mode improvements

- [ ] Phase 5: Testing & Deployment
  - [ ] Unit tests
  - [ ] Integration tests
  - [ ] E2E tests
  - [ ] Production deployment optimization
  - [ ] Monitoring and error tracking

## [6. DECISION LOG & ANTI-PATTERNS]

_(Hatalardan ders çıkarma günlüğü)_

- **[Next.js App Router - 2024]:** Server Components ve App Router kullanarak performans ve SEO avantajları sağlandı. Pages Router yerine App Router seçildi çünkü daha modern ve React Server Components desteği sunuyor.

- **[Zustand for State Management - 2024]:** Redux yerine Zustand seçildi çünkü daha hafif, daha az boilerplate ve daha kolay kullanım sağlıyor. Client-side state için yeterli.

- **[Supabase - 2024]:** Firebase yerine Supabase seçildi çünkü PostgreSQL kullanıyor, daha esnek sorgular yazılabiliyor ve açık kaynak. Ayrıca SSR desteği daha iyi.

- **[Radix UI - 2024]:** shadcn/ui benzeri bir yaklaşım için Radix UI seçildi çünkü erişilebilirlik standartlarına uygun, unstyled ve özelleştirilebilir.

- **[Google Gemini AI - 2024]:** OpenAI yerine Gemini seçildi çünkü daha uygun fiyatlı ve yeterli kalitede sonuçlar veriyor.

- **[PWA Support - 2024]:** Offline-first yaklaşım için next-pwa kullanıldı. Development'ta devre dışı, production'da aktif.

- **[Anti-Pattern]:** Client Component'lerde gereksiz 'use client' kullanımı performansı düşürür -> Sadece interactivity gerektiğinde kullan.

- **[Anti-Pattern]:** Büyük listelerde pagination olmadan tüm veriyi render etmek performans sorunlarına yol açar -> Her zaman pagination veya virtualization kullan.

- **[Anti-Pattern]:** Dictionary dosyalarında eksik çeviriler kullanıcı deneyimini bozar -> Yeni metin eklerken tüm dillere çeviri ekle.

- **[Anti-Pattern]:** Zustand store'ları gereksiz yere büyütmek bundle size'ı artırır -> Store'ları feature bazında böl ve sadece gerektiğinde import et.

---

**OPERATIONAL DIRECTIVE:**

1. **Read First:** Before answering any prompt, check this file for context.

2. **Update Often:** If a task is completed, check the box [x]. If a tech decision changes, update Section 2. If a new pattern or anti-pattern is discovered, add it to Section 6.

3. **Stay Consistent:** Do not suggest code that violates "Active Rules" in Section 4.

4. **Architecture Awareness:** When making changes, consider the folder structure and naming conventions defined in Section 3.

5. **Feature Context:** Before implementing new features, check Section 5 to understand current progress and roadmap.
