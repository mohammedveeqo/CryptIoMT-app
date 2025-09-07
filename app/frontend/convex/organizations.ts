import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get all organizations (admin only)
export const getAllOrganizations = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    // Check if user is admin using the unified users table
    const adminUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!adminUser || !['super_admin', 'admin'].includes(adminUser.role)) {
      return null;
    }

    try {
      const organizations = await ctx.db.query("organizations").collect();
    
      // Get member count for each organization
      const orgsWithCounts = await Promise.all(
        organizations.map(async (org) => {
          const memberCount = await ctx.db
            .query("organizationMembers")
            .withIndex("by_organization", (q) => q.eq("organizationId", org._id))
            .collect()
            .then(members => members.length);
          
          return { ...org, memberCount };
        })
      );

      return orgsWithCounts;
    } catch (error) {
      console.error("Error fetching organizations:", error);
      return null;
    }
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

    // Get user's organization memberships
    const memberships = await ctx.db
      .query("organizationMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Fetch organization details for each membership
    const organizations = await Promise.all(
      memberships.map(async (membership) => {
        const org = await ctx.db.get(membership.organizationId);
        return org ? { ...org, memberRole: membership.memberRole, joinedAt: membership.joinedAt } : null;
      })
    );

    return organizations.filter(org => org !== null);
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

    // Check if user is already a member
    const existingMembership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_user_org", (q) => 
        q.eq("userId", user._id).eq("organizationId", args.organizationId)
      )
      .first();

    if (existingMembership) {
      throw new Error("User is already a member of this organization");
    }

    // Create organization membership
    await ctx.db.insert("organizationMembers", {
      userId: user._id,
      organizationId: args.organizationId,
      memberRole: "member",
      memberStatus: "active",
      joinedAt: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Update user's last activity
    await ctx.db.patch(user._id, {
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

    // Check if user has permission to invite
    const userMembership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_user_org", (q) => 
        q.eq("userId", currentUser._id).eq("organizationId", args.organizationId)
      )
      .first();

    const isOrgOwnerOrAdmin = userMembership && ['owner', 'admin'].includes(userMembership.memberRole);
    const isPlatformAdmin = ['super_admin', 'admin'].includes(currentUser.role);
    
    if (!isOrgOwnerOrAdmin && !isPlatformAdmin) {
      throw new Error("You don't have permission to invite users");
    }

    // Check if user already exists and is a member
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existingUser) {
      const existingMembership = await ctx.db
        .query("organizationMembers")
        .withIndex("by_user_org", (q) => 
          q.eq("userId", existingUser._id).eq("organizationId", args.organizationId)
        )
        .first();

      if (existingMembership) {
        throw new Error("User is already a member of this organization");
      }

      // Add existing user to organization
      const membershipId = await ctx.db.insert("organizationMembers", {
        userId: existingUser._id,
        organizationId: args.organizationId,
        memberRole: args.role,
        memberStatus: "active",
        joinedAt: Date.now(),
        invitedBy: currentUser._id,
        invitedAt: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      return membershipId;
    }

    // For new users, create a pending user record
    const pendingUserId = await ctx.db.insert("users", {
      clerkId: "", // Will be filled when user signs up
      email: args.email,
      role: "customer",
      status: "pending",
      isActive: false,
      invitedBy: currentUser.clerkId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastUpdated: Date.now(),
    });

    // Create pending membership
    const membershipId = await ctx.db.insert("organizationMembers", {
      userId: pendingUserId,
      organizationId: args.organizationId,
      memberRole: args.role,
      memberStatus: "pending",
      joinedAt: Date.now(),
      invitedBy: currentUser._id,
      invitedAt: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return membershipId;
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
    const userMembership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_user_org", (q) => 
        q.eq("userId", currentUser._id).eq("organizationId", args.organizationId)
      )
      .first();
    
    if (!isAdmin && !userMembership) {
      throw new Error("Access denied");
    }

    // Get all memberships for the organization
    const memberships = await ctx.db
      .query("organizationMembers")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect();

    // Fetch user details for each membership
    const members = await Promise.all(
      memberships.map(async (membership) => {
        const user = await ctx.db.get(membership.userId);
        if (!user) return null;

        return {
          _id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          name: user.name,
          memberRole: membership.memberRole,
          memberStatus: membership.memberStatus,
          status: user.status,
          joinedAt: membership.joinedAt,
          lastLogin: user.lastLogin,
          membershipId: membership._id,
        };
      })
    );

    return members.filter(member => member !== null);
  },
});

// Create organization by regular user (for onboarding)
export const createUserOrganization = mutation({
  args: {
    name: v.string(),
    type: v.union(v.literal("hospital"), v.literal("clinic"), v.literal("research"), v.literal("vendor"), v.literal("other")),
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

    // Get user from database
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Create the organization
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

    // Make the user the owner of the organization
    await ctx.db.insert("organizationMembers", {
      userId: user._id,
      organizationId,
      memberRole: "owner",
      memberStatus: "active",
      joinedAt: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return organizationId;
  },
});

// Create invitation
export const createInvitation = mutation({
  args: {
    organizationId: v.id("organizations"),
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("member")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Generate unique invitation code
    const code = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    // Create invitation (expires in 7 days)
    const invitationId = await ctx.db.insert("invitations", {
      organizationId: args.organizationId,
      email: args.email,
      role: args.role,
      code,
      status: "pending",
      createdById: user._id,
      createdAt: Date.now(),
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
    });

    return { invitationId, code };
  },
});

// Join organization via invitation code
export const joinOrganizationByCode = mutation({
  args: {
    invitationCode: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Find invitation by code
    const invitation = await ctx.db
      .query("invitations")
      .withIndex("by_code", (q) => q.eq("code", args.invitationCode))
      .first();

    if (!invitation) {
      throw new Error("Invalid invitation code");
    }

    if (invitation.status !== "pending") {
      throw new Error("Invitation has already been used or expired");
    }

    if (invitation.expiresAt < Date.now()) {
      throw new Error("Invitation has expired");
    }

    // Check if user is already a member
    const existingMembership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_user_org", (q) => 
        q.eq("userId", user._id).eq("organizationId", invitation.organizationId)
      )
      .first();

    if (existingMembership) {
      throw new Error("User is already a member of this organization");
    }

    // Create membership
    await ctx.db.insert("organizationMembers", {
      userId: user._id,
      organizationId: invitation.organizationId,
      memberRole: invitation.role,
      memberStatus: "active",
      joinedAt: Date.now(),
      invitedBy: invitation.createdById,
      invitedAt: invitation.createdAt,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Mark invitation as accepted
    await ctx.db.patch(invitation._id, {
      status: "accepted",
      usedAt: Date.now(),
      usedById: user._id,
    });

    return { success: true };
  },
});

// Update organization
export const updateOrganization = mutation({
  args: {
    organizationId: v.id("organizations"),
    name: v.string(),
    type: v.union(v.literal("hospital"), v.literal("clinic"), v.literal("research"), v.literal("vendor"), v.literal("other")),
    contactEmail: v.string(),
    contactPhone: v.optional(v.string()),
    address: v.optional(v.string()),
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

    // Check if user has permission to update this organization
    const isAdmin = ['super_admin', 'admin'].includes(currentUser.role);
    const userMembership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_user_org", (q) => 
        q.eq("userId", currentUser._id).eq("organizationId", args.organizationId)
      )
      .first();
    
    if (!isAdmin && (!userMembership || !['owner', 'admin'].includes(userMembership.memberRole))) {
      throw new Error("Access denied");
    }

    // Update the organization
    await ctx.db.patch(args.organizationId, {
      name: args.name,
      type: args.type,
      contactEmail: args.contactEmail,
      contactPhone: args.contactPhone,
      address: args.address,
      updatedAt: Date.now(),
      lastUpdated: Date.now(),
    });

    return { success: true };
  },
});

// Remove member from organization
export const removeMember = mutation({
  args: {
    membershipId: v.id("organizationMembers"),
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

    // Get the membership to remove
    const membership = await ctx.db.get(args.membershipId);
    if (!membership) {
      throw new Error("Membership not found");
    }

    // Check if user has permission to remove members
    const isAdmin = ['super_admin', 'admin'].includes(currentUser.role);
    const userMembership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_user_org", (q) => 
        q.eq("userId", currentUser._id).eq("organizationId", membership.organizationId)
      )
      .first();
    
    if (!isAdmin && (!userMembership || !['owner', 'admin'].includes(userMembership.memberRole))) {
      throw new Error("Access denied");
    }

    // Cannot remove organization owner
    if (membership.memberRole === 'owner') {
      throw new Error("Cannot remove organization owner");
    }

    // Remove the membership
    await ctx.db.delete(args.membershipId);

    return { success: true };
  },
});