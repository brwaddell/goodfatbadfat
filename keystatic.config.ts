import { config, fields, collection } from '@keystatic/core';

// Support both dev (local filesystem) and production (GitHub mode).
// When KEYSTATIC_STORAGE_KIND=local is explicitly set, use local storage.
// Otherwise, in production or when GitHub credentials are present, use GitHub storage.
const isLocalMode =
  process.env.KEYSTATIC_STORAGE_KIND === 'local' ||
  (process.env.NODE_ENV === 'development' && !process.env.KEYSTATIC_GITHUB_CLIENT_ID);

const repo =
  process.env.KEYSTATIC_GITHUB_REPO ||
  'brwaddell/GoodFat';

export default config({
  storage: isLocalMode
    ? { kind: 'local' }
    : {
        kind: 'github',
        repo: repo as `${string}/${string}`,
        branchPrefix: 'content/',
      },
  ui: {
    brand: {
      name: 'GoodFat',
    },
  },
  collections: {
    blog: collection({
      label: 'Blog posts',
      slugField: 'title',
      path: 'site/src/content/blog/*',
      format: { contentField: 'content' },
      entryLayout: 'content',
      schema: {
        title: fields.slug({
          name: { label: 'Title', validation: { isRequired: true } },
        }),
        description: fields.text({
          label: 'Description',
          description: 'Short summary shown on the blog index and SEO meta.',
          multiline: true,
          validation: { isRequired: true },
        }),
        pubDate: fields.date({
          label: 'Publish date',
          validation: { isRequired: true },
        }),
        draft: fields.checkbox({
          label: 'Draft',
          defaultValue: false,
          description: 'Hide this post from the public blog index.',
        }),
        content: fields.markdoc({
          label: 'Content',
          extension: 'md',
        }),
      },
    }),
  },
});
