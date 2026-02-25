import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const SliderImageSchema = new Schema(
  {
    url: { type: String, required: true },
    order: { type: Number, required: true, default: 0 },
  },
  { timestamps: true },
);

export type SliderImageDoc = InferSchemaType<typeof SliderImageSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const SliderImage: Model<SliderImageDoc> =
  (mongoose.models.SliderImage as Model<SliderImageDoc>) ||
  mongoose.model<SliderImageDoc>("SliderImage", SliderImageSchema);

