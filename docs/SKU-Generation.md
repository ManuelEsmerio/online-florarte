# SKU Generation (Products & Variants)

## Product code format

`CCC-ID`

- `CCC`: first 3 letters from category text (`prefix` if available, otherwise category `name`)
  - uppercase
  - accents/special chars removed
- `ID`: database product ID padded to 4 digits

Examples:

- `ROS-0001`
- `GIR-0025`
- `TUL-0348`

Implemented in `generateProductCode(category, productId)` at `src/lib/sku.ts`.

---

## Variant code format

`PRODUCTCODE-SUFFIX`

Suffix priority (first valid rule wins):

1. Quantity detected (first number in variant name/specifications)
   - e.g. `ROS-0001-12`
2. Color detected (first known color term in variant name/specifications)
   - first 3 letters normalized
   - e.g. `ROS-0001-ROJ`
3. Sequential fallback
   - `0001`, `0002`, ...
   - e.g. `ROS-0001-0001`

If quantity/color candidate is already used, fallback moves to sequential to preserve uniqueness.

Implemented in `generateVariantCode(productCode, variantData)` at `src/lib/sku.ts`.

---

## Determinism & uniqueness strategy

- Product code is deterministic from `(category, productId)`.
- Variant code is deterministic from `(productCode, variant name/specs, already-used codes for product)`.
- Duplicate variant candidates are automatically resolved with sequential fallback.

---

## Create/Update service behavior

File: `src/services/productService.ts`

- `createProduct`
  - creates product row, then computes final product code with DB ID
  - generates and persists variant codes for all active variants
- `updateProduct`
  - recomputes product code using current category + existing product ID
  - regenerates/persists variant codes with collision-safe logic

This ensures product and variant SKUs are always saved and consistent with business rules.

---

## Edge cases handled

- Missing/invalid category text in helper: falls back to `GEN` prefix.
- No quantity and no color in variant: sequential suffix is used.
- Duplicate variants (same quantity/color): unique sequential fallback.
