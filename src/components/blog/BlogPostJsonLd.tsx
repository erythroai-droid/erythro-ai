import {
  buildBlogBreadcrumbSchema,
  buildBlogIndexSchema,
  buildBlogPostingSchema,
} from '@/lib/blogSchema'
import type { BlogPost } from '@/lib/blogPosts'

export function BlogIndexJsonLd({ posts, locale }: { posts: BlogPost[]; locale: string }) {
  const schema = buildBlogIndexSchema(posts, locale)
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function BlogPostJsonLd({ post, locale }: { post: BlogPost; locale: string }) {
  const article = buildBlogPostingSchema(post, locale)
  const crumbs = buildBlogBreadcrumbSchema(post, locale)
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(article) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }}
      />
    </>
  )
}
