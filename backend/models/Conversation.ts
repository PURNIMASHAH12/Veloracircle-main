import mongoose, { Document, Schema } from "mongoose";

export interface IConversation extends Document {
  participants: mongoose.Types.ObjectId[];
  type: "direct";
  unreadCounts: Map<string, number>;
  pinnedBy: mongoose.Types.ObjectId[];
  deletedFor: mongoose.Types.ObjectId[];
}
const conversationSchema = new Schema<IConversation>(
  {
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],

    type: {
      type: String,
      enum: ["direct"],
      default: "direct",
    },

    unreadCounts: {
      type: Map,
      of: Number,
      default: {},
    },
    pinnedBy: [
  {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
],
deletedFor: [
  {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
],
  },
  {
    timestamps: true,
  }
);

const Conversation = mongoose.model<IConversation>(
  "Conversation",
  conversationSchema
);

export default Conversation;