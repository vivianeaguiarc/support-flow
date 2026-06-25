-- DropForeignKey
-- authorId becomes polymorphic: it references a User (staff comment) or a
-- Customer (public comment authored by the requester). The strict User foreign
-- key is removed so customer-authored public comments can be persisted.
ALTER TABLE "ticket_comments" DROP CONSTRAINT "ticket_comments_authorId_fkey";
