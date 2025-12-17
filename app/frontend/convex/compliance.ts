import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// HIPAA Security Rule Controls (Simplified Subset for MVP)
export const HIPAA_CONTROLS = [
    {
        id: "164.308(a)(1)(i)",
        name: "Security Management Process",
        description: "Implement policies and procedures to prevent, detect, contain, and correct security violations.",
        category: "Administrative Safeguards"
    },
    {
        id: "164.308(a)(1)(ii)(A)",
        name: "Risk Analysis",
        description: "Conduct an accurate and thorough assessment of the potential risks and vulnerabilities to the confidentiality, integrity, and availability of electronic protected health information held by the covered entity.",
        category: "Administrative Safeguards"
    },
    {
        id: "164.308(a)(1)(ii)(B)",
        name: "Risk Management",
        description: "Implement security measures sufficient to reduce risks and vulnerabilities to a reasonable and appropriate level.",
        category: "Administrative Safeguards"
    },
    {
        id: "164.308(a)(5)(ii)(B)",
        name: "Protection from Malicious Software",
        description: "Procedures for guarding against, detecting, and reporting malicious software.",
        category: "Administrative Safeguards"
    },
    {
        id: "164.312(a)(1)",
        name: "Access Control",
        description: "Implement technical policies and procedures for electronic information systems that maintain electronic protected health information to allow access only to those persons or software programs that have been granted access rights.",
        category: "Technical Safeguards"
    },
    {
        id: "164.312(a)(2)(iv)",
        name: "Encryption and Decryption",
        description: "Implement a mechanism to encrypt and decrypt electronic protected health information.",
        category: "Technical Safeguards"
    },
    {
        id: "164.312(b)",
        name: "Audit Controls",
        description: "Implement hardware, software, and/or procedural mechanisms that record and examine activity in information systems that contain or use electronic protected health information.",
        category: "Technical Safeguards"
    }
];

export const getComplianceStatus = query({
    args: { organizationId: v.id("organizations"), frameworkId: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const frameworkId = args.frameworkId || "hipaa";
        
        const assessments = await ctx.db
            .query("complianceAssessments")
            .withIndex("by_org_framework", q => 
                q.eq("organizationId", args.organizationId)
                 .eq("frameworkId", frameworkId)
            )
            .collect();

        // Merge assessments with static controls
        const controls = HIPAA_CONTROLS.map(control => {
            const assessment = assessments.find(a => a.controlId === control.id);
            return {
                ...control,
                status: assessment?.status || "not_started",
                evidence: assessment?.evidence || "",
                lastUpdated: assessment?.lastUpdated,
                updatedBy: assessment?.updatedBy,
                _id: assessment?._id
            };
        });

        // Calculate score
        const total = controls.length;
        const completed = controls.filter(c => c.status === "compliant").length;
        const score = total > 0 ? Math.round((completed / total) * 100) : 0;

        return {
            controls,
            score,
            frameworkId
        };
    }
});

export const updateComplianceStatus = mutation({
    args: {
        organizationId: v.id("organizations"),
        frameworkId: v.string(),
        controlId: v.string(),
        status: v.string(),
        evidence: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("complianceAssessments")
            .withIndex("by_org_control", q => 
                q.eq("organizationId", args.organizationId)
                 .eq("controlId", args.controlId)
            )
            .first();

        const timestamp = Date.now();
        
        if (existing) {
            await ctx.db.patch(existing._id, {
                status: args.status,
                evidence: args.evidence,
                lastUpdated: timestamp
            });
        } else {
            await ctx.db.insert("complianceAssessments", {
                organizationId: args.organizationId,
                frameworkId: args.frameworkId,
                controlId: args.controlId,
                status: args.status,
                evidence: args.evidence,
                lastUpdated: timestamp
            });
        }
    }
});
