import { UpsertCmsPageUseCase } from './upsert-cms-page.use-case';
import type { CmsPageRepository } from '../../domain/repositories/cms-page.repository';
import type { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { CMS_PAGE_STATUS, CmsPage } from '../../domain/entities/cms-page.entity';

describe('UpsertCmsPageUseCase', () => {
  let pages: jest.Mocked<CmsPageRepository>;
  let storeContext: StoreContext;
  let useCase: UpsertCmsPageUseCase;

  beforeEach(() => {
    pages = {
      findBySlug: jest.fn(),
      findPublishedBySlug: jest.fn(),
      list: jest.fn(),
      upsert: jest.fn(),
      save: jest.fn(),
    };
    storeContext = { getCurrentStoreId: jest.fn().mockResolvedValue('store-1') } as unknown as StoreContext;
    useCase = new UpsertCmsPageUseCase(pages, storeContext);
  });

  it('resolves the current store and delegates to the repository', async () => {
    const created = CmsPage.reconstitute({
      id: 'page-1',
      storeId: 'store-1',
      slug: 'about',
      title: 'About',
      content: 'Body',
      faqItems: null,
      status: CMS_PAGE_STATUS.DRAFT,
      metaTitle: null,
      metaDescription: null,
      ogImageUrl: null,
      publishedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    pages.upsert.mockResolvedValue(created);

    const result = await useCase.execute({ slug: 'about', title: 'About', content: 'Body' });

    expect(pages.upsert).toHaveBeenCalledWith({ storeId: 'store-1', slug: 'about', title: 'About', content: 'Body' });
    expect(result).toBe(created);
  });
});
