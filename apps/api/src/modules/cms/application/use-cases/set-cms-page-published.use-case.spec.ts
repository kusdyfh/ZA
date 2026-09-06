import { SetCmsPagePublishedUseCase } from './set-cms-page-published.use-case';
import type { CmsPageRepository } from '../../domain/repositories/cms-page.repository';
import type { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { CMS_PAGE_STATUS, CmsPage } from '../../domain/entities/cms-page.entity';
import { CmsPageNotFoundError } from '../../domain/errors/cms.errors';

function buildPage(status: (typeof CMS_PAGE_STATUS)[keyof typeof CMS_PAGE_STATUS]): CmsPage {
  return CmsPage.reconstitute({
    id: 'page-1',
    storeId: 'store-1',
    slug: 'about',
    title: 'About',
    content: 'Body',
    faqItems: null,
    status,
    metaTitle: null,
    metaDescription: null,
    ogImageUrl: null,
    publishedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('SetCmsPagePublishedUseCase', () => {
  let pages: jest.Mocked<CmsPageRepository>;
  let storeContext: StoreContext;
  let useCase: SetCmsPagePublishedUseCase;

  beforeEach(() => {
    pages = {
      findBySlug: jest.fn(),
      findPublishedBySlug: jest.fn(),
      list: jest.fn(),
      upsert: jest.fn(),
      save: jest.fn(),
    };
    storeContext = { getCurrentStoreId: jest.fn().mockResolvedValue('store-1') } as unknown as StoreContext;
    useCase = new SetCmsPagePublishedUseCase(pages, storeContext);
  });

  it('publishes a DRAFT page and persists it', async () => {
    const page = buildPage(CMS_PAGE_STATUS.DRAFT);
    pages.findBySlug.mockResolvedValue(page);

    const result = await useCase.execute('about', true);

    expect(result.status).toBe(CMS_PAGE_STATUS.PUBLISHED);
    expect(pages.save).toHaveBeenCalledWith(page);
  });

  it('unpublishes a PUBLISHED page', async () => {
    const page = buildPage(CMS_PAGE_STATUS.PUBLISHED);
    pages.findBySlug.mockResolvedValue(page);

    const result = await useCase.execute('about', false);

    expect(result.status).toBe(CMS_PAGE_STATUS.DRAFT);
    expect(pages.save).toHaveBeenCalledWith(page);
  });

  it('throws CmsPageNotFoundError for an unknown slug', async () => {
    pages.findBySlug.mockResolvedValue(null);

    await expect(useCase.execute('missing', true)).rejects.toThrow(CmsPageNotFoundError);
    expect(pages.save).not.toHaveBeenCalled();
  });
});
