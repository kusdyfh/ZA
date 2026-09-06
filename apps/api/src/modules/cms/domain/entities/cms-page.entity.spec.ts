import { CMS_PAGE_STATUS, CmsPage } from './cms-page.entity';

function buildPage(overrides: Partial<Parameters<typeof CmsPage.reconstitute>[0]> = {}): CmsPage {
  return CmsPage.reconstitute({
    id: 'page-1',
    storeId: 'store-1',
    slug: 'about',
    title: 'About ZA Store',
    content: 'Original content.',
    faqItems: null,
    status: CMS_PAGE_STATUS.DRAFT,
    metaTitle: null,
    metaDescription: null,
    ogImageUrl: null,
    publishedAt: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  });
}

describe('CmsPage', () => {
  it('starts DRAFT and not published', () => {
    const page = buildPage();
    expect(page.status).toBe(CMS_PAGE_STATUS.DRAFT);
    expect(page.isPublished).toBe(false);
    expect(page.publishedAt).toBeNull();
  });

  it('publish() sets status to PUBLISHED and stamps publishedAt', () => {
    const page = buildPage();
    page.publish();
    expect(page.status).toBe(CMS_PAGE_STATUS.PUBLISHED);
    expect(page.isPublished).toBe(true);
    expect(page.publishedAt).toBeInstanceOf(Date);
  });

  it('unpublish() reverts status to DRAFT but keeps the last publishedAt', () => {
    const page = buildPage({ status: CMS_PAGE_STATUS.PUBLISHED, publishedAt: new Date('2026-01-02T00:00:00Z') });
    page.unpublish();
    expect(page.status).toBe(CMS_PAGE_STATUS.DRAFT);
    expect(page.isPublished).toBe(false);
    expect(page.publishedAt).toEqual(new Date('2026-01-02T00:00:00Z'));
  });

  it('updateContent() replaces title/content and only touches optional fields that were passed', () => {
    const page = buildPage({ metaTitle: 'Old meta title' });
    page.updateContent({ title: 'New title', content: 'New content.' });
    expect(page.title).toBe('New title');
    expect(page.content).toBe('New content.');
    expect(page.metaTitle).toBe('Old meta title');
  });

  it('updateContent() overwrites optional fields when explicitly provided', () => {
    const page = buildPage({ metaTitle: 'Old meta title' });
    page.updateContent({ title: 'New title', content: 'New content.', metaTitle: 'New meta title', faqItems: [{ question: 'Q', answer: 'A' }] });
    expect(page.metaTitle).toBe('New meta title');
    expect(page.faqItems).toEqual([{ question: 'Q', answer: 'A' }]);
  });

  it('toProps() returns a snapshot independent of the live entity', () => {
    const page = buildPage();
    const props = page.toProps();
    page.publish();
    expect(props.status).toBe(CMS_PAGE_STATUS.DRAFT);
  });
});
