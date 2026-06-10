import type { Timestamp } from "firebase-admin/firestore";

/* ── Admins collection (/admins/{uid}) ────────────────────────────────
   Created manually in the Firebase console or via a seed script.
   Never created through the app UI.
─────────────────────────────────────────────────────────────────────── */
export interface AdminRecord {
  uid:         string;
  email:       string;
  displayName: string;
  role:        "super-admin" | "ops";
  createdAt?:   Timestamp;
}

/* ── Participants (/users/{uid}) ───────────────────────────────────── */
export type SocialPlatform = "instagram" | "facebook" | "x";

export interface SocialLink {
  platform:    SocialPlatform;
  handle:      string;
  linkedAt:    Timestamp;
}

export interface ParticipantRecord {
  uid:         string;
  displayName: string;
  name:         string;
  email:       string;
  phone:       string | null;
  role:        "participant";
  status:      "active" | "flagged" | "suspended";
  socials:     Partial<Record<SocialPlatform, SocialLink>>;
  createdAt:   Timestamp;
  updatedAt:   Timestamp;
}


/* ── Vendors (/vendors/{id}) ─────────────────────────────────────── */
export interface VendorSocials {
  instagram?: string; // @handle or full URL
  facebook?:  string;
  x?:         string;
}

export interface VendorRecord {
  id:             string;
  uid:            string;            // Firebase Auth uid of the vendor account
  name:           string;
  businessType:   string;
  cuisine:        string;
  address:        string;
  operatingHours: string;            // free text e.g. "Mon–Sat · 09:00–22:00 · Sun · 12:00–22:00"
  dineIn:         "yes" | "no";
  contactName:    string;
  contactRole:    string;
  phone:          string;
  email:          string;
  socials:        VendorSocials;
  status:         "pending" | "active" | "suspended";
  cycleCount:     number;
  fcmTokens?:      string[];          // FCM device tokens for push notifications
  cycles:         [];
  createdAt:      Timestamp;
  updatedAt:      Timestamp;
}


/* ── Tasks (/tasks/{id}) ─────────────────────────────────────────── */
export type TaskPlatform = "instagram" | "facebook" | "x" | "tiktok";
export type TaskType =
  | "follow" | "share" | "like" | "comment" | "like_and_comment" 
  | "join_group" | "repost" | "tag_friends" | "story_share";

export interface TaskRecord {
  id:            string;
  platform:      TaskPlatform;
  taskType:      TaskType;
  targetUrl:     string;
  description:   string;
  activeInCycle: boolean;
  cycleCount:    number;
  cycleIds:      string[];
  createdBy:     string;
  createdAt:     Timestamp;
  updatedAt:     Timestamp;
}


/* ── Cycles (/cycles/{id}) ───────────────────────────────────────── */

export type CycleStatus = "draft" | "started" | "completed";

export interface CycleRecord {
  id:                string;
  cycleNumber:       number;
  status:            CycleStatus;
  windowOpen:        Timestamp | null;
  windowClose:       Timestamp;
  cooldownHours:     number;
  taskIds:           string[];
  minTasksToQualify: number;
  estimatedPool:     number;
  vendorOptIns:      VendorOptIn[];
  totalPool:         number;
  drawLogId:         string | null;
  participantIds:    string[];
  createdBy:         string;
  startedBy:         string | null;
  completedBy:       string | null;
  createdAt:         Timestamp;
  updatedAt:         Timestamp;
}


export interface VendorOptIn {
  vendorId:      string;
  vendorName:    string;
  freeVouchers:  number;
  discountTiers: DiscountTier[];
}


export interface DiscountTier {
  percentage:      number;
  quantity:        number;
  dineInAvailable: "yes" | "no";
  dineInUntil:     string;
}

/* ── Draw logs (/drawLogs/{id}) ──────────────────────────────────── */
export interface DrawLogRecord {
  id:              string;
  cycleId:         string;
  cycleNumber:     number;
  executedAt:      Timestamp;
  triggeredBy:     string;
  triggeredByName: string;
  eligiblePool:    number;
  voucherCodes:    string[];         // all vouchers distributed (free + discount)
  freeCodes:       string[];
  discountCodes:   string[];
  status:          "completed" | "error";
  errorMessage?:   string;
}

/* ── Vouchers (/vouchers/{code}) ─────────────────────────────────── */
export interface VoucherRecord {
  code:          string;
  cycleId:       string;
  participantId: string;
  type:          "free" | "discount" | null;
  discountPct:   number | null;
  status:        "issued" | "eligible" | "redeemed" | "expired" | "no_prize" | "won";
  vendorId:      string | null;
  vendorName?:      string | null;
  issuedAt:      Timestamp;
  expiresAt:     Timestamp;
  redeemedAt:    Timestamp | null;
}

/* ── Redemptions (/redemptions/{id}) ─────────────────────────────── */
export interface RedemptionRecord {
  id:           string;
  voucherCode:  string;
  cycleId:      string;
  vendorId:     string;
  participantId: string;
  type:         "free" | "discount";
  discountPct:  number | null;
  redeemedAt:   Timestamp;
  redeemedBy:   string;            // vendor uid who marked it
}


