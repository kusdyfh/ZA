import { DomainError } from '../../../../shared/errors/domain-error';

export class CmsPageNotFoundError extends DomainError {
  readonly code = 'CMS_PAGE_NOT_FOUND';
  constructor(slug: string) {
    super(`CMS page "${slug}" was not found.`);
  }
}
