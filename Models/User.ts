import { Schema, model, connect } from "mongoose";

interface UserProps {
    name: string;
    middlename: string;
    email: string;
    login: string;
    password: string;
    assignments: string;
    charge: string;
    avatar: string;
}

const userSchema = new Schema<UserProps>({
    name: { type: String, required: true },
    middlename: { type: String, required: true },
    email: { type: String, required: true },
    login: { type: String, required: true },
    password: { type: String, required: true },
    assignments: { type: String, required: true },
    charge: { type: String, required: true },
    avatar: String,
})

const User = model<UserProps>('User', userSchema);

module.exports = User