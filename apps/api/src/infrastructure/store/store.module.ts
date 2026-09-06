import { Global, Module } from '@nestjs/common';
import { StoreContext } from './store-context.service';

@Global()
@Module({
  providers: [StoreContext],
  exports: [StoreContext],
})
export class StoreModule {}
