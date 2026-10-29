import {
  DataModelFromSchemaDefinition,
  GenericMutationCtx,
  GenericQueryCtx,
  MutationBuilder,
  QueryBuilder,
  internalMutationGeneric,
  mutationGeneric,
  queryGeneric,
} from "convex/server";
import schema from "../schema";

// Typed builders that work before `npx convex dev` has generated convex/_generated.
// After codegen you may swap these for the re-exports from "../_generated/server".
export type DataModel = DataModelFromSchemaDefinition<typeof schema>;
export const query = queryGeneric as QueryBuilder<DataModel, "public">;
export const mutation = mutationGeneric as MutationBuilder<DataModel, "public">;
export const internalMutation = internalMutationGeneric as MutationBuilder<DataModel, "internal">;
type Ctx = GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel>;

/** The Clerk subject. Always derived from the verified JWT, never from an argument. */
export async function requireUser(ctx: Ctx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not signed in");
  return identity;
}

export async function requireAdmin(ctx: Ctx) {
  const identity = await requireUser(ctx);
  if ((identity as { role?: unknown }).role !== "admin") throw new Error("Admin only");
  return identity;
}
