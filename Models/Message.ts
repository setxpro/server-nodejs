import { Schema, model } from "mongoose";

interface MessageProps {
  message: string;
}

const MessageSchema = new Schema<MessageProps>({
  message: { type: String, required: true },
});

const Message = model<MessageProps>("Message", MessageSchema);

module.exports = Message;
