import mongoose, { Document, Schema } from 'mongoose';

export interface IRoom extends Document {
    roomNumber: string;
    type: string;
    capacity: number;
    pricePerNight: number;
    amenities: string[];
    photos: string[];
    description: string;
    status: 'available' | 'occupied' | 'maintenance';
    createdAt: Date;
    updatedAt: Date;
}

const roomSchema = new Schema<IRoom>(
    {
        roomNumber: {
            type: String,
            required: [true, 'Room number is required'],
            unique: true,
            trim: true,
        },
        type: {
            type: String,
            required: [true, 'Room type is required'],
            enum: ['single', 'double', 'suite', 'deluxe', 'presidential'],
            default: 'single',
        },
        capacity: {
            type: Number,
            required: [true, 'Room capacity is required'],
            min: [1, 'Capacity must be at least 1'],
            max: [10, 'Capacity cannot exceed 10'],
        },
        pricePerNight: {
            type: Number,
            required: [true, 'Price per night is required'],
            min: [0, 'Price cannot be negative'],
        },
        amenities: {
            type: [String],
            default: [],
        },
        photos: {
            type: [String],
            default: [],
        },
        description: {
            type: String,
            required: [true, 'Room description is required'],
            maxlength: [1000, 'Description cannot exceed 1000 characters'],
        },
        status: {
            type: String,
            enum: ['available', 'occupied', 'maintenance'],
            default: 'available',
        },
    },
    {
        timestamps: true,
    }
);

// Index for efficient searches
roomSchema.index({ type: 1, status: 1 });
roomSchema.index({ pricePerNight: 1 });

const Room = mongoose.model<IRoom>('Room', roomSchema);

export default Room;
