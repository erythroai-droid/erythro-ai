## 1. Общие требования и Стек бэкенда

- **Стек:** Payload CMS (Self-hosted в Next.js App Router), PostgreSQL, Drizzle ORM (адаптер подключения), GitHub (Контроль версий), Vercel (Хостинг и Serverless), n8n (Agentic-автоматизация).
    
- **Назначение:** Файл является архитектурным законом для ИИ по развертыванию серверной логики, проектированию реляционных схем и организации мультиязычного контента (Field-level localization).
    
- **Синхронизация с UI:** Структура коллекций и глобальных блоков в Payload CMS должна зеркально отражать компоненты из Figma и файлы [[components-rules.md]]  / [[frontend-architecture.md]] 
    

## 2. Конфигурация Payload CMS и PostgreSQL (`payload.config.ts`)

ИИ обязан настроить подключение к базе данных PostgreSQL исключительно через официальный адаптер Drizzle. Использование MongoDB запрещено.

TypeScript

```
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { buildConfig } from 'payload/config'
import path from 'path'
import { Users } from './collections/Users'
import { Pages } from './collections/Pages'
import { Services } from './collections/Services'
import { Partners } from './collections/Partners'

export default buildConfig({
  admin: {
    user: Users.slug,
  },
  // Жесткая привязка к PostgreSQL через Drizzle
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
  }),
  editor: lexicalEditor({}),
  collections: [Users, Pages, Services, Partners],
  // Мультиязычная матрица локалей: EN, RU, HE
  localization: {
    locales: [
      { label: 'English', code: 'en' },
      { label: 'Русский', code: 'ru' },
      { label: 'עברית', code: 'he', rtl: true }, // Поддержка RTL
    ],
    defaultLocale: 'en',
    fallback: true,
  },
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts'), // Автогенерация типов фронтенда
  },
})
```

## 3. Зеркальная архитектура коллекций и полей (Field-level Localization)

Все текстовые поля интерфейса должны иметь параметр `localized: true` для автоматического создания мультиязычных таблиц в PostgreSQL. Поля быстрого поиска обязаны содержать `index: true` для оптимизации запросов со стороны n8n и Next.js.

### А. Коллекция: `Services` (Услуги)

Зеркальное отражение карточек услуг из Figma.

- `title` (Text): `required: true`, `localized: true`.
    
- `slug` (Text): `required: true`, `index: true`, `unique: true`.
    
- `description` (Textarea): `localized: true`.
    
- `price` (Number): `required: true` (Общее поле для всех языков).
    

### Б. Коллекция: `Partners` (Лента технологических партнеров)

Мапинг монохромной ленты брендов.

- `name` (Text): `required: true`.
    
- `logo` (Upload / Media): `required: true` (Связка с `next/image` на фронтенде).
    

### В. Глобальные Блоки (Layout Blocks в коллекции `Pages`)

Разделение интерфейса главной страницы на гибкие, переиспользуемые ИИ блоки:

1. **`HeroBlock`**:
    
    - `title` (Text, `localized: true`).
        
    - `ctaText` (Text, `localized: true`, по умолчанию: "LET'S TALK...").
        
2. **`WordStackBlock`**:
    
    - `words` (Array / Массив строк, `localized: true`): Подтягивает массив фраз для GSAP-анимации на десктопе.
        

## 4. Спецификация для n8n (Agentic API & Управление сайтом)

Для автономного контент-менеджмента через AI-агентов (в Telegram/Slack) без использования админ-панели Payload CMS, ИИ должен заложить следующие шлюзы:

- **Авторизация:** Запрещено использовать сессии браузера для внешних запросов. n8n обращается к API по ключу: `Authorization: PayloadAPIKey <token>`.
    
- **Инструмент `CreateContent` / `UpdateContent`**: Агент n8n отправляет POST/PATCH-запросы в формате JSON напрямую в эндпоинты Payload CMS (например, `/api/services`). При отправке данных на иврит (`he`), n8n передает локализованный объект, а база данных PostgreSQL сохраняет его в соответствующую реляционную ячейку.
    

## 5. Интеграция с Vercel (On-Demand Revalidation)

Так как Next.js на Vercel использует инкрементальную статическую регенерацию (ISR) для мгновенной отдачи страниц , бэкенд обязан инициировать сброс кэша при обновлении данных через n8n.

### Код Route Handler (`app/api/revalidate/route.ts`) для Cursor:

TypeScript

```
import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret')
  const path = request.nextUrl.searchParams.get('path') || '/'

  // Защита эндпоинта хука revalidate
  if (secret !== process.env.REVALIDATION_TOKEN) {
    return NextResponse.json({ message: 'Invalid token' }, { status: 401 })
  }

  try {
    revalidatePath(path) // Мгновенный сброс кэша Vercel для указанного роута
    return NextResponse.json({ revalidated: true, now: Date.now() })
  } catch (err) {
    return NextResponse.json({ message: 'Error revalidating' }, { status: 500 })
  }
}
```

n8n вызывает этот хук сразу после успешной записи данных в базу.

## 6. Безопасность и Деплой (CI/CD Pipeline через GitHub)

- **Изоляция Среды:** Категорически запрещено коммитить секреты в репозиторий GitHub.
    
- **Переменные Окружения в Vercel Production:**
    
    - `DATABASE_URL`: Строка подключения к PostgreSQL (например, на Supabase/Neon).
        
    - `PAYLOAD_SECRET`: Уникальная соль для шифрования сессий Payload CMS.
        
    - `REVALIDATION_TOKEN`: Секретный ключ для связки n8n ➔ Next.js.
        
- **Авто-деплой:** Каждый пуш в ветку `main` на GitHub триггерит сборку продакшен-версии на Vercel.