ALTER TYPE "RetreatDateStatus" ADD VALUE IF NOT EXISTS 'draft' BEFORE 'open';
ALTER TYPE "RetreatDateStatus" ADD VALUE IF NOT EXISTS 'closed' AFTER 'sold_out';
