import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const TaskSchema = new Schema(
  {
    id: { type: String, required: true },
    text: { type: String, required: true },
    done: { type: Boolean, required: true, default: false },
  },
  { _id: false },
);

const MilestoneSchema = new Schema(
  {
    id: { type: String, required: true },
    label: { type: String, required: true }, // e.g. "ตุลาคม"
    title: { type: String, required: false }, // e.g. "พฤศจิกายน - ธันวาคม"
    tasks: { type: [TaskSchema], required: true, default: [] },
  },
  { _id: false },
);

const UserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, index: true },
    username: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },

    profile: {
      displayName: { type: String, default: "" },
      gradeLevel: { type: String, default: "" },
      dreamFaculty: { type: String, default: "" },
      avatarUrl: { type: String, default: "" },
    },

    milestones: { type: [MilestoneSchema], default: [] },
    dreamUniversityImageUrl: { type: String, default: "" },
  },
  { timestamps: true },
);

export type UserDoc = InferSchemaType<typeof UserSchema> & { _id: mongoose.Types.ObjectId };

export const User: Model<UserDoc> =
  (mongoose.models.User as Model<UserDoc>) || mongoose.model<UserDoc>("User", UserSchema);

