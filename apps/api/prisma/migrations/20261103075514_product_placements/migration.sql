-- CreateEnum
CREATE TYPE "ProductPlacement" AS ENUM ('HOME_HERO', 'ART_STORY_WALL', 'TEN_PRODUCTS_SHOWCASE', 'ZA_EDIT_BOOK', 'DOLL_DRESS_UP');

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "placements" "ProductPlacement"[] DEFAULT ARRAY[]::"ProductPlacement"[];
