import { GetPublicCmsPageUseCase } from './get-public-cms-page.use-case';
import type { CmsPageRepository } from '../../domain/repositories/cms-page.repository';
import type { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { CMS_PAGE_STATUS, CmsPage } from '../../domain/entities/cms-page.entity';
import { CmsPageNotFoundError } from '../../domain/errors/cms.errors';

describe('GetPublicCmsPageUseCase', () => {
  let pages: jest.Mocked<CmsPageRepository>;
  let storeContext: StoreContext;
  let useCase: GetPublicCmsPageUseCase;

  beforeEach(() => {
    pages = {
      findBySlug: jest.fn(),
      findPublishedBySlug: jest.fn(),
      list: jest.fn(),
      upsert: jest.fn(),
      save: jest.fn(),
    };
    storeContext = { getCurrentStoreId: jest.fn().mockResolvedValue('store-1') } as unknown as StoreContext;
    useCase = new GetPublicCmsPageUseCase(pages, storeContext);
  });

  it('returns a published page', async () => {
    const page = CmsPage.reconstitute({
      id: 'page-1',
      storeId: 'store-1',
      slug: 'about',
      title: 'About',
      content: 'Body',
      faqItems: null,
      status: CMS_PAGE_STATUS.PUBLISHED,
      metaTitle: null,
      metaDescription: null,
      ogImageUrl: null,
      publishedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    pages.findPublishedBySlug.mockResolvedValue(page);

    const result = await useCase.execute('about');

    expect(pages.findPublishedBySlug).toHaveBeenCalledWith('store-1', 'about');
    expect(result).toBe(page);
  });

  it('throws CmsPageNotFoundError for a draft or unknown page — never leaks a DRAFT page publicly', async () => {
    pages.findPublishedBySlug.mockResolvedValue(null);

    await expect(useCase.execute('about')).rejects.toThrow(CmsPageNotFoundError);
  });
});
