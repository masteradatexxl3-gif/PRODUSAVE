/*
# Add coupon columns to sales

Adds coupon_id (FK to discount_coupons) and discount_amount to sales table.
*/

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales' AND column_name='coupon_id') THEN
    ALTER TABLE public.sales ADD COLUMN coupon_id UUID REFERENCES public.discount_coupons(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales' AND column_name='discount_amount') THEN
    ALTER TABLE public.sales ADD COLUMN discount_amount NUMERIC(12,2) DEFAULT 0;
  END IF;
END $$;
