# Final catalog grouping: `صور المنتجات/` (awaiting approval)

Status: **report only.** Nothing has been uploaded or created, and no original file has been modified.
It follows `catalog-grouping-proposal.md` and applies the owner's decisions from task #15:

- P1 and P2 stay separate products.
- The P3 navy illustration (`5411485912396404865.jpg`) is not used as a product photo.
- `IMG_4072.PNG` and the extra colors seen in `IMG_5643` stay pending.
- P4 and P5 are not created until the live database has been compared with the existing Classic V-Neck Scrub Top and Relaxed Fit Scrub Pants.
- The four sideways JPGs get corrected copies; the originals are never touched.

## 1. Database comparison: NOT VERIFIED

The live database could not be queried. A later owner approval of two inspection commands (env/docker check and schema grep) was still blocked by the tool's permission mode, and the approval did not cover the query itself. In this session, the shell, the `apps/api/.env` read and the read-only Prisma query were all denied, so the comparison below is based on `apps/api/prisma/seed.ts` only. The real catalog may differ, for example if products or colors were added through the admin.

| Existing (seed)          | SKU               | Category                     | Colors               | Overlap with the photos                                                                                                                                                                                                                                                              |
| ------------------------ | ----------------- | ---------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Classic V-Neck Scrub Top | ZA-TOP-VNECK-001  | Scrubs > Tops > Short Sleeve | Navy Blue, Ceil Blue | Possible with **P4 Navy** (short-sleeve V-neck). P4 has a sleeve pen pocket, cuffed sleeves and a back tie, and it is shot as a full set, so it is most likely a different model. P5 (no ties, kangaroo pockets, stepped hem) also does not match the description "tailored V-neck". |
| Relaxed Fit Scrub Pants  | ZA-PANT-RELAX-001 | Scrubs > Bottoms             | Black                | No photo shows black pants. P4 and P5 pants are sold as part of their sets. No overlap.                                                                                                                                                                                              |
| Premium Lab Coat         | —                 | Lab Coats                    | —                    | No lab coat photos. No overlap.                                                                                                                                                                                                                                                      |

Seed colors to reuse rather than duplicate: **Navy Blue** (#1B2A4A) for P4 Navy, and **Black** if the IMG_5643 black top is ever confirmed.

To finish the verification, the owner can approve this read-only command (it runs inside a `READ ONLY` transaction and prints products, variants and colors only):

```
cd apps/api && node --env-file=.env -e "const{PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.\$transaction(async t=>{await t.\$executeRawUnsafe('SET TRANSACTION READ ONLY');return{colors:await t.color.findMany({select:{name:true,hexCode:true}}),products:await t.product.findMany({select:{name:true,sku:true,status:true,category:{select:{name:true}},variants:{select:{sku:true,color:{select:{name:true}},size:{select:{label:true}}}},_count:{select:{media:true}}}})}}).then(r=>console.log(JSON.stringify(r,null,1))).finally(()=>p.\$disconnect())"
```

## 2. Final grouping

### P1. Side-Tie V-Neck Scrub Set (straight wide sleeves)

| Color         | Images                                                                                                                          |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Butter Yellow | 5411485912396404853.jpg, …854.jpg, …855.jpg, …856.jpg, …857.jpg, …858.jpg (shared with P2)                                      |
| Lavender      | IMG_2078 (HEIC, use the JPG preview). ⚠ Props cover the right chest, so the absence of the P2 embroidery is not 100% confirmed. |

### P2. Sunflower Embroidered Side-Tie Scrub Set (elastic cuffs)

| Color    | Images                                                       |
| -------- | ------------------------------------------------------------ |
| Lavender | 5411485912396404860.jpg, …861.jpg, …858.jpg (shared with P1) |

### P3. Contrast-Stitch Cargo Scrub Set

| Color      | Images                                                                   |
| ---------- | ------------------------------------------------------------------------ |
| Berry Pink | 5411485912396404874.jpg, …875.jpg, …878.jpg                              |
| ~~Navy~~   | Dropped. …865.jpg is an illustration and is excluded from product media. |

### P4. Back-Tie Scrub Set (sleeve pocket, cuffed sleeves): BLOCKED until the DB check

| Color                       | Images                                                                                           |
| --------------------------- | ------------------------------------------------------------------------------------------------ |
| Fuchsia / Hot Pink          | DSC01808, 01809, 01810, 01811, 01812, 01813, 01814, 01815, 01816, 01817, 01818, 01819, 01820     |
| Light Pink                  | DSC01792                                                                                         |
| Fuchsia + Light Pink (pair) | DSC01802, 01803, 01804, 01805, 01806, 01807 (product-level, `colorId` null)                      |
| Charcoal Grey               | DSC01821                                                                                         |
| Navy (reuse "Navy Blue")    | DSC01904, 01905, 01906, 01907, 01908, 01909, 01910, 01911, 01912, 01914, 5411485912396404872.jpg |
| Teal                        | 5413645671060934765.jpg ⚠ back view only                                                         |

### P5. Kangaroo-Pocket Layered-Hem Scrub Set: BLOCKED until the DB check

| Color                     | Images                                   |
| ------------------------- | ---------------------------------------- |
| Raspberry / Rose Pink     | IMG_4088*, IMG_2875, IMG_4089*, IMG_4107 |
| Sage / Mint               | Group shots only: IMG_4071, IMG_4101*    |
| Dusty Pink                | Group shots only: IMG_4071, IMG_4101*    |
| All three (product-level) | IMG_4071, IMG_4101*                      |

\* Needs the orientation-corrected copy (section 4).

### Pending (no assignment)

- **IMG_4072.PNG**: appears retouched or AI-enhanced; colors may not match the real fabric.
- **IMG_5643**: lifestyle only. Its extra colors (P2 Navy?, P5 Black?, coral and salmon tie tops) are not turned into variants.

### Excluded

- **5411485912396404865.jpg**: P3 Navy illustration.

## 3. Totals

- Products: 5 (P1, P2, P3 ready to create after approval; P4, P5 waiting for the DB check)
- Color variants: 12 (P1: 2, P2: 1, P3: 1, P4: 5, P5: 3)
- Images: 54 in total. 51 assigned (…858 is shared by P1 and P2), 2 pending (IMG_4072, IMG_5643), 1 excluded (…865)

## 4. Orientation fix: NOT DONE

Check run on 2026-10-29 (approved `sips -g` command):

| File         | pixelWidth × pixelHeight | EXIF orientation |
| ------------ | ------------------------ | ---------------- |
| IMG_4088.jpg | 1600 × 1200              | none             |
| IMG_4089.jpg | 1600 × 1200              | none             |
| IMG_4101.jpg | 1600 × 1200              | none             |
| IMG_5643.jpg | 1600 × 1200              | none             |

- **The earlier assumption was wrong.** These files have no EXIF orientation flag, so a 90° rotation plus flag removal is not a safe fix.
- When opened in the image viewer, all four display **upright and portrait** (garments, hangers and text are the right way up). That conflicts with the 1600 × 1200 that sips reports. The orientation may be stored in a tag that `sips -g orientation` does not read (for example, XMP), or the viewer may normalize the image.
- **No corrected copies were made.** The approved command only created the empty folder `.heic-preview-oriented/`. The originals are untouched.
- Next step (needs approval): `sips -g all .heic-preview/IMG_4088.jpg` and `mdls -name kMDItemOrientation -name kMDItemPixelWidth -name kMDItemPixelHeight .heic-preview/IMG_4088.jpg`. These would find where the rotation is stored before anything is written. Re-exporting from the HEIC originals would also avoid the problem.
