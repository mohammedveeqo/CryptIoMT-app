import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get all organizations (admin only)
export const getAllOrganizations = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Check if user is admin using the unified users table
    const adminUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!adminUser || !['super_admin', 'admin'].includes(adminUser.role)) {
      throw new Error("Admin access required");
    }

    const organizations = await ctx.db.query("organizations").collect();
    
    // Get member count for each organization from the users table
    const orgsWithCounts = await Promise.all(
      organizations.map(async (org) => {
        const memberCount = await ctx.db
          .query("users")
          .withIndex("by_organization", (q) => q.eq("organizationId", org._id))
          .collect()
          .then(members => members.length);
        
        return { ...org, memberCount };
      })
    );

    return orgsWithCounts;
  },
});

// Create new organization
export const createOrganization = mutation({
  args: {
    name: v.string(),
    type: v.union(v.literal("hospital"), v.literal("clinic"), v.literal("company"), v.literal("other")),
    email: v.string(),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    subscriptionTier: v.union(v.literal("basic"), v.literal("pro"), v.literal("enterprise")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Check if user is admin
    const adminUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!adminUser || !['super_admin', 'admin'].includes(adminUser.role)) {
      throw new Error("Admin access required");
    }

    const organizationId = await ctx.db.insert("organizations", {
      name: args.name,
      type: args.type,
      contactEmail: args.email,
      contactPhone: args.phone,
      address: args.address,
      subscriptionTier: args.subscriptionTier,
      status: "active",
      isActive: true,
      createdBy: identity.subject,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastUpdated: Date.now(),
      settings: {
        allowUserRegistration: true,
        requireApproval: false,
      },
    });

    return organizationId;
  },
});

// Get user organizations
export const getUserOrganizations = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get user from unified users table
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      return [];
    }

    // If user has an organizationId, return that organization
    if (user.organizationId) {
      const organization = await ctx.db.get(user.organizationId);
      return organization ? [organization] : [];
    }

    return [];
  },
});

// Join organization
export const joinOrganization = mutation({
  args: {
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get user from unified users table
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Check if organization exists
    const organization = await ctx.db.get(args.organizationId);
    if (!organization) {
      throw new Error("Organization not found");
    }

    // Update user's organizationId and role
    await ctx.db.patch(user._id, {
      organizationId: args.organizationId,
      role: "orgMember",
      orgRole: "member",
      joinedAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Invite user to organization
export const inviteUserToOrganization = mutation({
  args: {
    organizationId: v.id("organizations"),
    email: v.string(),
    role: v.union(v.literal("member"), v.literal("admin")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get current user
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!currentUser) {
      throw new Error("User not found");
    }

    // Check if user has permission to invite (must be org owner/admin or platform admin)
    const isOrgOwnerOrAdmin = currentUser.organizationId === args.organizationId && 
                             ['orgOwner', 'admin'].includes(currentUser.role);
    const isPlatformAdmin = ['super_admin', 'admin'].includes(currentUser.role);
    
    if (!isOrgOwnerOrAdmin && !isPlatformAdmin) {
      throw new Error("You don't have permission to invite users");
    }

    // Check if user is already a member
    const existingMember = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existingMember && existingMember.organizationId === args.organizationId) {
      throw new Error("User is already a member of this organization");
    }

    // For now, we'll create a pending user record
    // In a full implementation, you might want a separate invitations table
    const invitationId = await ctx.db.insert("users", {
      clerkId: "", // Will be filled when user signs up
      email: args.email,
      role: args.role === "admin" ? "orgMember" : "orgMember",
      orgRole: args.role,
      organizationId: args.organizationId,
      status: "pending",
      isActive: false,
      invitedBy: currentUser.clerkId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastUpdated: Date.now(),
    });

    return invitationId;
  },
});

// Get organization members
export const getOrganizationMembers = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get current user
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!currentUser) {
      throw new Error("User not found");
    }

    // Check if user has access to this organization
    const isAdmin = ['super_admin', 'admin'].includes(currentUser.role);
    const isOrgMember = currentUser.organizationId === args.organizationId;
    
    if (!isAdmin && !isOrgMember) {
      throw new Error("Access denied");
    }

    // Get all members of the organization
    const members = await ctx.db
      .query("users")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect();

    return members.map(member => ({
      _id: member._id,
      email: member.email,
      firstName: member.firstName,
      lastName: member.lastName,
      name: member.name,
      role: member.role,
      orgRole: member.orgRole,
      status: member.status,
      joinedAt: member.joinedAt,
      lastLogin: member.lastLogin,
    }));
  },
});