import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Put } from '@nestjs/common';
import { ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';
import { CreateCollectionUseCase } from '../application/use-cases/create-collection.use-case';
import { UpdateCollectionUseCase } from '../application/use-cases/update-collection.use-case';
import { SetCollectionActiveUseCase } from '../application/use-cases/set-collection-active.use-case';
import { DeleteCollectionUseCase } from '../application/use-cases/delete-collection.use-case';
import { SetCollectionProductsUseCase } from '../application/use-cases/set-collection-products.use-case';
import { ListCollectionProductsUseCase } from '../application/use-cases/list-collection-products.use-case';
import { CreateCollectionDto } from '../application/dto/create-collection.dto';
import { UpdateCollectionDto } from '../application/dto/update-collection.dto';
import { SetCollectionProductsDto } from '../application/dto/set-collection-products.dto';
import { CollectionResponseDto } from '../application/dto/collection-response.dto';
import { ProductResponseDto } from '../application/dto/product-response.dto';
import { Public } from '../../../shared/decorators/public.decorator';
import { RequirePermission } from '../../../shared/decorators/require-permission.decorator';
import { PERMISSION_KEYS } from '../../identity/domain/constants/permissions.constants';

class SetCollectionActiveDto {
  @IsBoolean()
  isActive!: boolean;
}

/**
 * Curated product collections — docs/product/05-COLLECTIONS.md. No
 * "list all collections" endpoint exists — no such use-case was built
 * (disclosed gap, see PROJECT_STATUS.md); a collection's product listing
 * (used for its storefront page) is public, everything else guarded.
 */
@ApiTags('Catalog — Collections')
@ApiBearerAuth('access-token')
@Controller('catalog/collections')
export class CollectionsController {
  constructor(
    private readonly createCollection: CreateCollectionUseCase,
    private readonly updateCollection: UpdateCollectionUseCase,
    private readonly setCollectionActive: SetCollectionActiveUseCase,
    private readonly deleteCollection: DeleteCollectionUseCase,
    private readonly setCollectionProducts: SetCollectionProductsUseCase,
    private readonly listCollectionProducts: ListCollectionProductsUseCase,
  ) {}

  @Post()
  @RequirePermission(PERMISSION_KEYS.PRODUCTS_MANAGE)
  @ApiCreatedResponse({ type: CollectionResponseDto })
  async create(@Body() dto: CreateCollectionDto): Promise<CollectionResponseDto> {
    const collection = await this.createCollection.execute({
      ...dto,
      startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
      endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
    });
    return CollectionResponseDto.fromDomain(collection);
  }

  @Patch(':id')
  @RequirePermission(PERMISSION_KEYS.PRODUCTS_MANAGE)
  @ApiOkResponse({ type: CollectionResponseDto })
  async update(@Param('id') id: string, @Body() dto: UpdateCollectionDto): Promise<CollectionResponseDto> {
    const collection = await this.updateCollection.execute({
      collectionId: id,
      ...dto,
      startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
      endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
    });
    return CollectionResponseDto.fromDomain(collection);
  }

  @Patch(':id/active')
  @RequirePermission(PERMISSION_KEYS.PRODUCTS_MANAGE)
  @ApiOkResponse({ type: CollectionResponseDto })
  async setActive(
    @Param('id') id: string,
    @Body() dto: SetCollectionActiveDto,
  ): Promise<CollectionResponseDto> {
    const collection = await this.setCollectionActive.execute({
      collectionId: id,
      isActive: dto.isActive,
    });
    return CollectionResponseDto.fromDomain(collection);
  }

  @Put(':id/products')
  @RequirePermission(PERMISSION_KEYS.PRODUCTS_MANAGE)
  @ApiOkResponse({ description: 'Collection membership + order replaced.' })
  async setProducts(
    @Param('id') id: string,
    @Body() dto: SetCollectionProductsDto,
  ): Promise<{ replaced: true }> {
    await this.setCollectionProducts.execute({ collectionId: id, productIds: dto.productIds });
    return { replaced: true };
  }

  @Get(':id/products')
  @Public()
  @ApiOkResponse({ type: ProductResponseDto, isArray: true })
  async listProducts(@Param('id') id: string): Promise<ProductResponseDto[]> {
    const products = await this.listCollectionProducts.execute({ collectionId: id });
    return products.map((product) => ProductResponseDto.fromDomain(product));
  }

  @Delete(':id')
  @RequirePermission(PERMISSION_KEYS.PRODUCTS_MANAGE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async remove(@Param('id') id: string): Promise<void> {
    await this.deleteCollection.execute({ collectionId: id });
  }
}
